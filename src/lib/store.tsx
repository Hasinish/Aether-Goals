"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { Goal, Subtask } from "./types";
import { getInitialSeedData } from "./seed";
import { getSupabaseClient, isSupabaseConfigured } from "./supabase";
import { STORAGE_KEYS } from "./constants";
import { User } from "@supabase/supabase-js";
const safeParseArray = <T,>(raw: string | null, fallback: T[] = []): T[] => {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

export const createId = (prefix = "id"): string => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

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
        goalIdMap[g.id] = createId("goal");
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
        id: createId("subtask"),
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
          const localGoalsRaw = localStorage.getItem(STORAGE_KEYS.GOALS);
          const localSubtasksRaw = localStorage.getItem(STORAGE_KEYS.SUBTASKS);

          let goalsCorrupt = false;
          if (localGoalsRaw) {
            try {
              const parsed = JSON.parse(localGoalsRaw);
              if (!Array.isArray(parsed)) goalsCorrupt = true;
            } catch {
              goalsCorrupt = true;
            }
          }
          if (goalsCorrupt) {
            setSyncError("Local goals data is corrupt.");
          }

          const parsedGoals = safeParseArray<Goal>(localGoalsRaw, []);
          const parsedSubtasks = safeParseArray<Subtask>(localSubtasksRaw, []);

          if (localGoalsRaw !== null && !goalsCorrupt) {
            if (parsedGoals.length > 0) {
              const goalIdMap: Record<string, string> = {};
              parsedGoals.forEach(g => { goalIdMap[g.id] = createId("goal"); });
              
              const goalsToInsert = parsedGoals.map(g => ({
                id: goalIdMap[g.id],
                user_id: user.id,
                title: g.title,
                tags: g.tags,
                created_at: g.created_at,
                sort_order: g.sort_order,
              }));

              const { error: syncGError } = await client.from("goals").insert(goalsToInsert);
              if (syncGError) {
                setSyncError(`Migration failed (goals): ${syncGError.message}`);
                throw syncGError;
              }

              const subtaskIdMap: Record<string, string> = {};
              const validSubtasks = parsedSubtasks.filter((subtask) => goalIdMap[subtask.goal_id]);
              if (validSubtasks.length > 0) {
                const subtasksToInsert = validSubtasks.map(s => {
                  const newSubtaskId = createId("subtask");
                  subtaskIdMap[s.id] = newSubtaskId;
                  return {
                    id: newSubtaskId,
                    goal_id: goalIdMap[s.goal_id],
                    title: s.title,
                    is_complete: s.is_complete,
                    sort_order: s.sort_order || 0
                  };
                });
                const { error: syncSError } = await client.from("subtasks").insert(subtasksToInsert);
                if (syncSError) {
                  await client.from("goals").delete().in("id", goalsToInsert.map(g => g.id));
                  setSyncError(`Migration failed (subtasks): ${syncSError.message}`);
                  throw syncSError;
                }
              }

              // Wiping guest localStorage only after all remote inserts succeed
              localStorage.removeItem(STORAGE_KEYS.GOALS);
              localStorage.removeItem(STORAGE_KEYS.SUBTASKS);

              const assembledGoals = parsedGoals.map((g) => {
                const goalSubtasks = parsedSubtasks.filter((s) => s.goal_id === g.id);
                return calculateGoalMetrics({
                  ...g,
                  id: goalIdMap[g.id],
                  user_id: user.id,
                  subtasks: goalSubtasks.map(s => ({
                    ...s,
                    id: subtaskIdMap[s.id] || s.id,
                    goal_id: goalIdMap[s.goal_id]
                  }))
                });
              }).sort((a, b) => a.sort_order - b.sort_order);
              setGoals(assembledGoals);
            } else {
              setGoals([]);
            }
          } else if (localGoalsRaw === null) {
            await seedDataToSupabase(user.id);
          } else {
            setGoals([]);
          }
        }
      } else {
        const localGoalsRaw = localStorage.getItem(STORAGE_KEYS.GOALS);
        const localSubtasksRaw = localStorage.getItem(STORAGE_KEYS.SUBTASKS);

        let goalsCorrupt = false;
        if (localGoalsRaw) {
          try {
            const parsed = JSON.parse(localGoalsRaw);
            if (!Array.isArray(parsed)) goalsCorrupt = true;
          } catch {
            goalsCorrupt = true;
          }
        }
        if (goalsCorrupt) {
          setSyncError("Local goals data is corrupt.");
        }

        const parsedGoals = safeParseArray<Goal>(localGoalsRaw, []);
        const parsedSubtasks = safeParseArray<Subtask>(localSubtasksRaw, []);

        if (localGoalsRaw !== null && !goalsCorrupt) {
          const assembledGoals = parsedGoals.map((g) => {
            const goalSubtasks = parsedSubtasks.filter((s) => s.goal_id === g.id);
            return calculateGoalMetrics({
              ...g,
              subtasks: goalSubtasks,
            });
          }).sort((a, b) => a.sort_order - b.sort_order);

          setGoals(assembledGoals);
        } else if (localGoalsRaw === null) {
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
        } else {
          setGoals([]);
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
    const newGoalId = createId("goal");
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
      id: createId("subtask"),
      goal_id: newGoalId,
      title: t,
      is_complete: false,
      sort_order: idx
    }));

    const newGoalWithMetrics = calculateGoalMetrics({
      ...newGoal,
      subtasks: newSubtasks,
    });
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

        const parsedGoals = safeParseArray<Goal>(localGoals, []);
        const parsedSubtasks = safeParseArray<Subtask>(localSubtasks, []);

        parsedGoals.unshift(newGoal);
        parsedSubtasks.push(...newSubtasks);

        localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(parsedGoals));
        localStorage.setItem(STORAGE_KEYS.SUBTASKS, JSON.stringify(parsedSubtasks));
      }
    } catch (e) {
      setGoals((current) => current.filter((goal) => goal.id !== newGoal.id));
      const errMsg = e instanceof Error ? e.message : String(e);
      setSyncError(`Failed to sync new goal: ${errMsg}`);
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
      id: s.id || createId("subtask"),
      goal_id: goalId,
      title: s.title,
      is_complete: s.is_complete || false,
      sort_order: idx
    }));

    addPendingId(goalId);

    const goalToUpdate = goals.find((g) => g.id === goalId);

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
        
        const originalSubtasks = goalToUpdate?.subtasks || [];
        const updatedSubtaskIds = new Set(updatedSubtasks.map((s) => s.id));
        const deletedSubtaskIds = originalSubtasks
          .filter((s) => !updatedSubtaskIds.has(s.id))
          .map((s) => s.id);

        const sanitizedSubtasks = updatedSubtasks.map((s) => ({
          id: s.id,
          title: s.title,
          is_complete: s.is_complete,
          sort_order: s.sort_order,
        }));

        const { error } = await client.rpc("update_goal_with_subtasks", {
          p_goal_id: goalId,
          p_title: title,
          p_tags: tags,
          p_sort_order: goalToUpdate?.sort_order || 0,
          p_subtasks: sanitizedSubtasks,
          p_deleted_subtask_ids: deletedSubtaskIds,
        });

        if (error) throw error;
      } else {
        const localGoals = localStorage.getItem(STORAGE_KEYS.GOALS);
        const localSubtasks = localStorage.getItem(STORAGE_KEYS.SUBTASKS);

        const parsedGoals = safeParseArray<Goal>(localGoals, []);
        let parsedSubtasks = safeParseArray<Subtask>(localSubtasks, []);

        const updatedGoals = parsedGoals.map((g) => {
          if (g.id === goalId) {
            return { ...g, title, tags };
          }
          return g;
        });

        parsedSubtasks = parsedSubtasks.filter((s) => s.goal_id !== goalId);
        parsedSubtasks.push(...updatedSubtasks);

        localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(updatedGoals));
        localStorage.setItem(STORAGE_KEYS.SUBTASKS, JSON.stringify(parsedSubtasks));
      }
    } catch (e) {
      if (goalToUpdate) {
        setGoals((prev) =>
          prev.map((g) => (g.id === goalId ? goalToUpdate : g))
        );
      }
      const errMsg = e instanceof Error ? e.message : String(e);
      setSyncError(`Failed to update goal: ${errMsg}`);
      throw e; 
    } finally {
      removePendingId(goalId);
    }
  };

  const deleteGoal = async (goalId: string) => {
    const goalToDelete = goals.find((g) => g.id === goalId);
    const originalIndex = goals.findIndex((g) => g.id === goalId);

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

        const parsedGoals = safeParseArray<Goal>(localGoals, []);
        const parsedSubtasks = safeParseArray<Subtask>(localSubtasks, []);

        const updatedGoals = parsedGoals.filter((g) => g.id !== goalId);
        const updatedSubtasks = parsedSubtasks.filter((s) => s.goal_id !== goalId);

        localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(updatedGoals));
        localStorage.setItem(STORAGE_KEYS.SUBTASKS, JSON.stringify(updatedSubtasks));
      }
    } catch (e) {
      if (goalToDelete && originalIndex !== -1) {
        setGoals((prev) => {
          const updated = [...prev];
          if (!updated.some((g) => g.id === goalId)) {
            updated.splice(originalIndex, 0, goalToDelete);
          }
          return updated;
        });
      }
      const errMsg = e instanceof Error ? e.message : String(e);
      setSyncError(`Failed to delete goal: ${errMsg}`);
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
    let found = false;

    // Find the subtask synchronously in the current goals state without side effects inside setGoals
    for (const g of goals) {
      const sub = g.subtasks?.find(s => s.id === subtaskId);
      if (sub) {
        found = true;
        targetGoalId = g.id;
        newIsComplete = !sub.is_complete;
        break;
      }
    }

    if (!found) {
      inflightSubtasksRef.current.delete(subtaskId);
      return;
    }

    setGoals((prevGoals) => {
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
        if (localSubtasks !== null) {
          const parsedSubtasks = safeParseArray<Subtask>(localSubtasks, []);
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
      if (targetGoalId) {
        setGoals((prevGoals) => {
          return prevGoals.map((g) => {
            if (g.id === targetGoalId) {
              const updatedSubtasks = (g.subtasks || []).map((s) => {
                if (s.id === subtaskId) {
                  return { ...s, is_complete: !newIsComplete };
                }
                return s;
              });
              return calculateGoalMetrics({ ...g, subtasks: updatedSubtasks });
            }
            return g;
          });
        });
      }
      const errMsg = e instanceof Error ? e.message : String(e);
      setSyncError(`Failed to save subtask status: ${errMsg}`);
    } finally {
      inflightSubtasksRef.current.delete(subtaskId);
    }
  };

  const reorderGoals = async (startIndex: number, endIndex: number) => {
    if (isReorderingRef.current) return;
    isReorderingRef.current = true;

    const previousGoals = [...goals];

    const updated = [...goals];
    if (startIndex < 0 || startIndex >= updated.length || endIndex < 0 || endIndex >= updated.length) {
      isReorderingRef.current = false;
      return;
    }
    const [movedItem] = updated.splice(startIndex, 1);
    updated.splice(endIndex, 0, movedItem);
    const reordered = updated.map((g, i) => ({ ...g, sort_order: i }));

    setGoals(reordered);

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
      setGoals(previousGoals);
      const errMsg = e instanceof Error ? e.message : String(e);
      setSyncError(`Failed to save reorder: ${errMsg}`);
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
