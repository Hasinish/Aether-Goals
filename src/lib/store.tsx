"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { Goal, Subtask } from "./types";
import { getInitialSeedData } from "./seed";
import { getSupabaseClient, isSupabaseConfigured } from "./supabase";
import { STORAGE_KEYS } from "./constants";
import { User } from "@supabase/supabase-js";

interface StoreContextProps {
  goals: Goal[];
  loading: boolean;
  user: User | "guest" | null;
  isOfflineMode: boolean;
  pendingGoalIds: Set<string>;
  syncError: string | null;
  clearSyncError: () => void;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
  addGoal: (title: string, tags: string[], subtaskTitles: string[]) => Promise<void>;
  updateGoal: (goalId: string, title: string, tags: string[], subtasksInput: { id?: string; title: string; is_complete?: boolean; sort_order?: number }[]) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  toggleSubtask: (subtaskId: string) => Promise<void>;
  reorderGoals: (startIndex: number, endIndex: number) => Promise<void>;
  refreshData: () => Promise<void>;
}

const StoreContext = createContext<StoreContextProps | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | "guest" | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(true);
  
  // Track concurrent pending goals
  const [pendingGoalIds, setPendingGoalIds] = useState<Set<string>>(new Set());
  const addPendingId = useCallback((id: string) => setPendingGoalIds(prev => new Set(prev).add(id)), []);
  const removePendingId = useCallback((id: string) => setPendingGoalIds(prev => {
    const next = new Set(prev);
    next.delete(id);
    return next;
  }), []);

  // Concurrent locks
  const inflightSubtasksRef = useRef<Set<string>>(new Set());
  const isReorderingRef = useRef<boolean>(false);

  const [syncError, setSyncError] = useState<string | null>(null);
  const clearSyncError = () => setSyncError(null);

  const calculateGoalMetrics = useCallback((goal: Goal): Goal => {
    const subtasks = goal.subtasks || [];
    const total = subtasks.length;
    const completed = subtasks.filter((s) => s.is_complete).length;
    const progressPercent = total === 0 ? 0 : Math.round((completed / total) * 100);

    return {
      ...goal,
      progressPercent,
      subtasks,
    };
  }, []);

  const seedDataToSupabase = useCallback(async (userId: string) => {
    try {
      const client = getSupabaseClient();
      const { goals: seedGoals, subtasks: seedSubtasks } = getInitialSeedData();

      const goalIdMap: Record<string, string> = {};
      seedGoals.forEach((g) => {
        goalIdMap[g.id] = crypto.randomUUID();
      });

      const goalsToInsert = seedGoals.map((g, i) => ({
        id: goalIdMap[g.id],
        user_id: userId,
        title: g.title,
        tags: g.tags,
        created_at: g.created_at,
        sort_order: i,
      }));

      const { error: goalsError } = await client.from("goals").insert(goalsToInsert);
      if (goalsError) throw goalsError;

      const subtasksToInsert = seedSubtasks.map((s) => ({
        id: crypto.randomUUID(),
        goal_id: goalIdMap[s.goal_id],
        title: s.title,
        is_complete: s.is_complete,
        sort_order: s.sort_order || 0
      }));

      const { error: subtasksError } = await client.from("subtasks").insert(subtasksToInsert);
      if (subtasksError) {
        // Rollback goal insertion
        await client.from("goals").delete().in("id", goalsToInsert.map(g => g.id));
        throw subtasksError;
      }

      const assembledGoals = seedGoals.map((g) => {
        const goalSubtasks = subtasksToInsert.filter((s) => s.goal_id === goalIdMap[g.id]);
        return calculateGoalMetrics({
          ...g,
          id: goalIdMap[g.id],
          subtasks: goalSubtasks,
        });
      });

      setGoals(assembledGoals);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      setSyncError(`Seeding failed: ${errMsg}`);
    }
  }, [calculateGoalMetrics]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const dbConfigured = isSupabaseConfigured();
      if (dbConfigured && user && user !== "guest") {
        const client = getSupabaseClient();
        const { data: goalsData, error: goalsError } = await client
          .from("goals")
          .select("*")
          .order("sort_order", { ascending: true });

        if (goalsError) throw goalsError;

        if (goalsData && goalsData.length > 0) {
          const { data: subtasksData, error: subtasksError } = await client
            .from("subtasks")
            .select("*")
            .order("sort_order", { ascending: true });

          if (subtasksError) throw subtasksError;

          const assembledGoals: Goal[] = (goalsData as Goal[]).map((g) => {
            const goalSubtasks = (subtasksData as Subtask[] || []).filter((s) => s.goal_id === g.id);
            return calculateGoalMetrics({
              ...g,
              subtasks: goalSubtasks,
            });
          });

          setGoals(assembledGoals);
        } else {
          // Migration logic
          const localGoals = localStorage.getItem(STORAGE_KEYS.GOALS);
          const localSubtasks = localStorage.getItem(STORAGE_KEYS.SUBTASKS);
          
          if (localGoals && localSubtasks && JSON.parse(localGoals).length > 0) {
            const parsedGoals = JSON.parse(localGoals) as Goal[];
            const parsedSubtasks = JSON.parse(localSubtasks) as Subtask[];
            
            const idMap: Record<string, string> = {};
            parsedGoals.forEach(g => { idMap[g.id] = crypto.randomUUID(); });
            
            const goalsToInsert = parsedGoals.map(g => ({
              id: idMap[g.id],
              user_id: user.id,
              title: g.title,
              tags: g.tags,
              created_at: g.created_at,
              sort_order: g.sort_order,
            }));

            const { error: syncGError } = await client.from("goals").insert(goalsToInsert);
            if (!syncGError) {
              if (parsedSubtasks.length > 0) {
                const subtasksToInsert = parsedSubtasks.map(s => ({
                  id: crypto.randomUUID(),
                  goal_id: idMap[s.goal_id],
                  title: s.title,
                  is_complete: s.is_complete,
                  sort_order: s.sort_order || 0
                }));
                const { error: syncSError } = await client.from("subtasks").insert(subtasksToInsert);
                if (syncSError) {
                  await client.from("goals").delete().in("id", goalsToInsert.map(g => g.id));
                  throw syncSError;
                }
              }
            } else {
              throw syncGError;
            }

            const assembledGoals = parsedGoals.map((g) => {
              const goalSubtasks = parsedSubtasks.filter((s) => s.goal_id === g.id);
              return calculateGoalMetrics({
                ...g,
                id: idMap[g.id],
                user_id: user.id,
                subtasks: goalSubtasks.map(s => ({...s, goal_id: idMap[s.goal_id]}))
              });
            }).sort((a, b) => a.sort_order - b.sort_order);
            setGoals(assembledGoals);
          } else {
            await seedDataToSupabase(user.id);
          }
        }
      } else {
        const localGoals = localStorage.getItem(STORAGE_KEYS.GOALS);
        const localSubtasks = localStorage.getItem(STORAGE_KEYS.SUBTASKS);

        if (localGoals && localSubtasks) {
          const parsedGoals = JSON.parse(localGoals) as Goal[];
          const parsedSubtasks = JSON.parse(localSubtasks) as Subtask[];

          const assembledGoals = parsedGoals.map((g) => {
            const goalSubtasks = parsedSubtasks.filter((s) => s.goal_id === g.id);
            return calculateGoalMetrics({
              ...g,
              subtasks: goalSubtasks,
            });
          }).sort((a, b) => a.sort_order - b.sort_order);

          setGoals(assembledGoals);
        } else {
          const { goals: seedGoals, subtasks: seedSubtasks } = getInitialSeedData();
          
          localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(seedGoals));
          localStorage.setItem(STORAGE_KEYS.SUBTASKS, JSON.stringify(seedSubtasks));

          const assembledGoals = seedGoals.map((g) => {
            const goalSubtasks = seedSubtasks.filter((s) => s.goal_id === g.id);
            return calculateGoalMetrics({
              ...g,
              subtasks: goalSubtasks,
            });
          }).sort((a, b) => a.sort_order - b.sort_order);

          setGoals(assembledGoals);
        }
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      setSyncError(`Failed to fetch goals: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  }, [user, calculateGoalMetrics, seedDataToSupabase]);

  useEffect(() => {
    const dbConfigured = isSupabaseConfigured();
    setIsOfflineMode(!dbConfigured);

    let subscription: { unsubscribe: () => void } | null = null;

    if (dbConfigured) {
      try {
        const client = getSupabaseClient();
        const { data: { subscription: sub } } = client.auth.onAuthStateChange((_event, session) => {
          if (session?.user) {
            setUser(session.user);
            localStorage.setItem(STORAGE_KEYS.USER, "authenticated");
          } else {
            const localUser = localStorage.getItem(STORAGE_KEYS.USER);
            if (localUser !== "guest") {
              setUser(null);
            }
          }
        });
        subscription = sub;
      } catch {
        // silent fallback
      }
    }

    const initAuth = async () => {
      if (dbConfigured) {
        try {
          const client = getSupabaseClient();
          const { data: { session } } = await client.auth.getSession();
          if (session?.user) {
            setUser(session.user);
          } else {
            const localUser = localStorage.getItem(STORAGE_KEYS.USER);
            if (localUser === "guest") {
              setUser("guest");
            }
          }
        } catch {
          setIsOfflineMode(true);
        }
      } else {
        const localUser = localStorage.getItem(STORAGE_KEYS.USER);
        if (localUser === "guest") {
          setUser("guest");
        }
      }
    };

    initAuth();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const loginAsGuest = () => {
    setUser("guest");
    localStorage.setItem(STORAGE_KEYS.USER, "guest");
  };

  const logout = async () => {
    if (!isOfflineMode) {
      try {
        const client = getSupabaseClient();
        const { error } = await client.auth.signOut();
        if (error) throw error;
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : String(e);
        setSyncError(`Logout failed: ${errMsg}`);
        return; // Don't wipe UI session if DB logout fails
      }
    }
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.USER);
  };

  const addGoal = async (title: string, tags: string[], subtaskTitles: string[]) => {
    const newGoalId = crypto.randomUUID();
    const minSortOrder = goals.length > 0 ? Math.min(...goals.map((g) => g.sort_order)) : 0;
    const newSortOrder = minSortOrder - 1;
    const newGoal: Goal = {
      id: newGoalId,
      user_id: user && user !== "guest" ? user.id : null,
      title,
      tags,
      created_at: new Date().toISOString(),
      sort_order: newSortOrder,
    };

    const newSubtasks: Subtask[] = subtaskTitles.map((t, idx) => ({
      id: crypto.randomUUID(),
      goal_id: newGoalId,
      title: t,
      is_complete: false,
      sort_order: idx
    }));

    const newGoalWithMetrics = calculateGoalMetrics({
      ...newGoal,
      subtasks: newSubtasks,
    });

    const previousGoals = [...goals];

    setGoals((prev) => [newGoalWithMetrics, ...prev]);
    addPendingId(newGoalId);

    try {
      if (!isOfflineMode && user && user !== "guest") {
        const client = getSupabaseClient();
        const { error: gError } = await client.from("goals").insert({
          id: newGoal.id,
          user_id: newGoal.user_id,
          title: newGoal.title,
          tags: newGoal.tags,
          created_at: newGoal.created_at,
          sort_order: newGoal.sort_order,
        });

        if (gError) throw gError;

        if (newSubtasks.length > 0) {
          const { error: sError } = await client.from("subtasks").insert(newSubtasks);
          if (sError) {
            await client.from("goals").delete().eq("id", newGoal.id);
            throw sError;
          }
        }
      } else {
        const localGoals = localStorage.getItem(STORAGE_KEYS.GOALS);
        const localSubtasks = localStorage.getItem(STORAGE_KEYS.SUBTASKS);

        const parsedGoals = localGoals ? (JSON.parse(localGoals) as Goal[]) : [];
        const parsedSubtasks = localSubtasks ? (JSON.parse(localSubtasks) as Subtask[]) : [];

        parsedGoals.unshift(newGoal);
        parsedSubtasks.push(...newSubtasks);

        localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(parsedGoals));
        localStorage.setItem(STORAGE_KEYS.SUBTASKS, JSON.stringify(parsedSubtasks));
      }
    } catch (e) {
      setGoals(previousGoals);
      throw e;
    } finally {
      removePendingId(newGoalId);
    }
  };

  const updateGoal = async (
    goalId: string,
    title: string,
    tags: string[],
    subtasksInput: { id?: string; title: string; is_complete?: boolean; sort_order?: number }[]
  ) => {
    const updatedSubtasks: Subtask[] = subtasksInput.map((s, idx) => ({
      id: s.id || crypto.randomUUID(),
      goal_id: goalId,
      title: s.title,
      is_complete: s.is_complete || false,
      sort_order: idx
    }));

    addPendingId(goalId);

    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          return calculateGoalMetrics({
            ...g,
            title,
            tags,
            subtasks: updatedSubtasks,
          });
        }
        return g;
      })
    );

    try {
      if (!isOfflineMode && user && user !== "guest") {
        const client = getSupabaseClient();
        const { error: gError } = await client
          .from("goals")
          .update({ title, tags })
          .eq("id", goalId);

        if (gError) throw gError;

        if (updatedSubtasks.length > 0) {
          const { error: upsertErr } = await client.from("subtasks").upsert(updatedSubtasks);
          if (upsertErr) throw upsertErr;
          
          const subtaskIds = updatedSubtasks.map((s) => s.id);
          const { error: delErr } = await client
            .from("subtasks")
            .delete()
            .eq("goal_id", goalId)
            .not("id", "in", `(${subtaskIds.join(",")})`);
          if (delErr) throw delErr;
        } else {
          const { error: delErr } = await client
            .from("subtasks")
            .delete()
            .eq("goal_id", goalId);
          if (delErr) throw delErr;
        }
      } else {
        const localGoals = localStorage.getItem(STORAGE_KEYS.GOALS);
        const localSubtasks = localStorage.getItem(STORAGE_KEYS.SUBTASKS);

        if (localGoals || localSubtasks) {
          let parsedGoals = localGoals ? (JSON.parse(localGoals) as Goal[]) : [];
          let parsedSubtasks = localSubtasks ? (JSON.parse(localSubtasks) as Subtask[]) : [];

          parsedGoals = parsedGoals.map((g) => {
            if (g.id === goalId) {
              return { ...g, title, tags };
            }
            return g;
          });

          parsedSubtasks = parsedSubtasks.filter((s) => s.goal_id !== goalId);
          parsedSubtasks.push(...updatedSubtasks);

          localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(parsedGoals));
          localStorage.setItem(STORAGE_KEYS.SUBTASKS, JSON.stringify(parsedSubtasks));
        }
      }
    } catch (e) {
      await refreshData();
      throw e; 
    } finally {
      removePendingId(goalId);
    }
  };

  const deleteGoal = async (goalId: string) => {
    addPendingId(goalId);
    setGoals((prev) => prev.filter((g) => g.id !== goalId));

    try {
      if (!isOfflineMode && user && user !== "guest") {
        const client = getSupabaseClient();
        // Relies on database ON DELETE CASCADE rule for subtasks
        const { error: gError } = await client.from("goals").delete().eq("id", goalId);
        if (gError) throw gError;
      } else {
        const localGoals = localStorage.getItem(STORAGE_KEYS.GOALS);
        const localSubtasks = localStorage.getItem(STORAGE_KEYS.SUBTASKS);

        if (localGoals || localSubtasks) {
          let parsedGoals = localGoals ? JSON.parse(localGoals) as Goal[] : [];
          let parsedSubtasks = localSubtasks ? JSON.parse(localSubtasks) as Subtask[] : [];

          parsedGoals = parsedGoals.filter((g) => g.id !== goalId);
          parsedSubtasks = parsedSubtasks.filter((s) => s.goal_id !== goalId);

          localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(parsedGoals));
          localStorage.setItem(STORAGE_KEYS.SUBTASKS, JSON.stringify(parsedSubtasks));
        }
      }
    } catch (e) {
      await refreshData();
      throw e;
    } finally {
      removePendingId(goalId);
    }
  };

  const toggleSubtask = async (subtaskId: string) => {
    if (inflightSubtasksRef.current.has(subtaskId)) return;
    inflightSubtasksRef.current.add(subtaskId);

    let targetGoalId = "";
    let newIsComplete = false;

    setGoals((prevGoals) => {
      // Find the subtask synchronously safely
      let found = false;
      for (const g of prevGoals) {
        if (g.subtasks?.some(s => s.id === subtaskId)) {
          found = true;
          targetGoalId = g.id;
          newIsComplete = !g.subtasks.find(s => s.id === subtaskId)!.is_complete;
          break;
        }
      }
      if (!found) return prevGoals;

      return prevGoals.map((g) => {
        if (g.id === targetGoalId) {
          const updatedSubtasks = (g.subtasks || []).map((s) => {
            if (s.id === subtaskId) {
              return { ...s, is_complete: newIsComplete };
            }
            return s;
          });
          return calculateGoalMetrics({ ...g, subtasks: updatedSubtasks });
        }
        return g;
      });
    });

    if (!targetGoalId) {
      inflightSubtasksRef.current.delete(subtaskId);
      return;
    }

    try {
      if (!isOfflineMode && user && user !== "guest") {
        const client = getSupabaseClient();
        const { error: upErr } = await client
          .from("subtasks")
          .update({ is_complete: newIsComplete })
          .eq("id", subtaskId);

        if (upErr) throw upErr;
      } else {
        const localSubtasks = localStorage.getItem(STORAGE_KEYS.SUBTASKS);
        if (localSubtasks) {
          const parsedSubtasks = JSON.parse(localSubtasks) as Subtask[];
          const updated = parsedSubtasks.map((s) => {
            if (s.id === subtaskId) {
              return { ...s, is_complete: newIsComplete };
            }
            return s;
          });
          localStorage.setItem(STORAGE_KEYS.SUBTASKS, JSON.stringify(updated));
        }
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      setSyncError(`Failed to save subtask status: ${errMsg}`);
      await refreshData();
    } finally {
      inflightSubtasksRef.current.delete(subtaskId);
    }
  };

  const reorderGoals = async (startIndex: number, endIndex: number) => {
    if (isReorderingRef.current) return;
    isReorderingRef.current = true;

    let reordered: Goal[] = [];

    setGoals((prev) => {
      const updated = [...prev];
      const [movedItem] = updated.splice(startIndex, 1);
      updated.splice(endIndex, 0, movedItem);
      reordered = updated.map((g, i) => ({ ...g, sort_order: i }));
      return reordered;
    });

    try {
      if (!isOfflineMode && user && user !== "guest") {
        const client = getSupabaseClient();
        const { error } = await client
          .from("goals")
          .upsert(
            reordered.map((g) => ({
              id: g.id,
              user_id: g.user_id,
              title: g.title,
              tags: g.tags,
              created_at: g.created_at,
              sort_order: g.sort_order,
            }))
          );
        if (error) throw error;
      } else {
        localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(reordered));
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      setSyncError(`Failed to save reorder: ${errMsg}`);
      await refreshData();
    } finally {
      isReorderingRef.current = false;
    }
  };

  const refreshData = async () => {
    await fetchData();
  };

  return (
    <StoreContext.Provider
      value={{
        goals,
        loading,
        user,
        isOfflineMode,
        pendingGoalIds,
        syncError,
        clearSyncError,
        loginAsGuest,
        logout,
        addGoal,
        updateGoal,
        deleteGoal,
        toggleSubtask,
        reorderGoals,
        refreshData,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useGoalsStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useGoalsStore must be used within a StoreProvider");
  }
  return context;
};
