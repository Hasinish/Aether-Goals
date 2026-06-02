"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { Goal, Subtask } from "./types";
import { getInitialSeedData } from "./seed";
import { getSupabaseClient, isSupabaseConfigured } from "./supabase";
import { User } from "@supabase/supabase-js";

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
  user: User | null;
  username: string;
  pendingGoalIds: Set<string>;
  syncError: string | null;
  clearSyncError: () => void;
  logout: () => Promise<void>;
  addGoal: (title: string, tags: string[], subtaskTitles: string[]) => Promise<void>;
  updateGoal: (goalId: string, title: string, tags: string[], subtasksInput: { id?: string; title: string; is_complete?: boolean; sort_order?: number }[]) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  toggleSubtask: (subtaskId: string) => Promise<void>;
  reorderGoals: (startIndex: number, endIndex: number) => Promise<void>;
  refreshData: () => Promise<void>;
  updateUsername: (username: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextProps | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string>("");
  
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
      if (dbConfigured && user) {
        // ── Authenticated path: 100% Supabase only. No localStorage reads. ──
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
            return calculateGoalMetrics({ ...g, subtasks: goalSubtasks });
          });

          setGoals(assembledGoals);
        } else {
          // Supabase returned 0 goals.
          // Only seed if this user has never been seeded before (using cloud user metadata).
          const isSeeded = user.user_metadata?.seeded === true;
          if (isSeeded) {
            // User deliberately deleted everything — respect it.
            setGoals([]);
          } else {
            // Brand new user — give them demo data.
            await seedDataToSupabase(user.id);
            const { data: updateData } = await client.auth.updateUser({
              data: { seeded: true }
            });
            if (updateData?.user) {
              setUser(updateData.user);
            }
          }
        }
      } else {
        setGoals([]);
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

    let subscription: { unsubscribe: () => void } | null = null;

    if (dbConfigured) {
      try {
        const client = getSupabaseClient();
        const { data: { subscription: sub } } = client.auth.onAuthStateChange((_event, session) => {
          if (session?.user) {
            setUser(session.user);
          } else {
            setUser(null);
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
            setUser(null);
          }
        } catch {
          // silent fallback
        }
      } else {
        setUser(null);
      }
    };

    initAuth();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Fetch username from DB when user changes
  useEffect(() => {
    const fetchUsername = async () => {
      if (user) {
        if (user.user_metadata?.username) {
          setUsername(user.user_metadata.username);
        }
        try {
          if (isSupabaseConfigured()) {
            const client = getSupabaseClient();
            const { data } = await client
              .from("profiles")
              .select("username")
              .eq("id", user.id)
              .maybeSingle();

            if (data?.username) {
              setUsername(data.username);
            }
          }
        } catch (e) {
          console.error("Error fetching username:", e);
        }
      } else {
        setUsername("");
      }
    };
    fetchUsername();
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateUsername = async (newUsername: string) => {
    if (!user) {
      throw new Error("User must be authenticated to update username.");
    }
    if (newUsername.trim().length < 3) {
      throw new Error("Username must be at least 3 characters.");
    }
    try {
      if (isSupabaseConfigured()) {
        const client = getSupabaseClient();
        const { error: profileError } = await client
          .from("profiles")
          .upsert({
            id: user.id,
            username: newUsername.trim(),
            updated_at: new Date().toISOString(),
          });
        if (profileError) {
          console.warn("Could not sync to profiles table, falling back to metadata:", profileError.message);
        }

        const { data: updateData, error: authError } = await client.auth.updateUser({
          data: { username: newUsername.trim() }
        });
        if (authError) throw authError;

        if (updateData?.user) {
          setUser(updateData.user);
        }
      }
      setUsername(newUsername.trim());
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      setSyncError(`Failed to update username: ${errMsg}`);
      throw e;
    }
  };

  const logout = async () => {
    try {
      const client = getSupabaseClient();
      const { error } = await client.auth.signOut();
      if (error) throw error;
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      setSyncError(`Logout failed: ${errMsg}`);
      throw e;
    }
    setUser(null);
  };

  const addGoal = async (title: string, tags: string[], subtaskTitles: string[]) => {
    const newGoalId = createId("goal");
    const minSortOrder = goals.length > 0 ? Math.min(...goals.map((g) => g.sort_order)) : 0;
    const newSortOrder = minSortOrder - 1;
    const newGoal: Goal = {
      id: newGoalId,
      user_id: user ? user.id : null,
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
      if (user) {
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
        throw new Error("User must be authenticated to create a goal.");
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
      if (user) {
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
        throw new Error("User must be authenticated to update a goal.");
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
      if (user) {
        const client = getSupabaseClient();
        const { data, error: gError } = await client.from("goals").delete().eq("id", goalId).select();
        if (gError) throw gError;
        if (!data || data.length === 0) {
          throw new Error("Delete blocked by Row Level Security (RLS). Please ensure you have a DELETE policy configured for the 'goals' table.");
        }
      } else {
        throw new Error("User must be authenticated to delete a goal.");
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
      if (user) {
        const client = getSupabaseClient();
        const { data, error: upErr } = await client
          .from("subtasks")
          .update({ is_complete: newIsComplete })
          .eq("id", subtaskId)
          .select();

        if (upErr) throw upErr;
        if (!data || data.length === 0) {
          throw new Error("Update did not affect any rows. Subtask may have been deleted.");
        }
      } else {
        throw new Error("User must be authenticated to toggle a subtask.");
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
      throw e;
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
      if (user) {
        const client = getSupabaseClient();
        const updatePromises = reordered.map((g) =>
          client
            .from("goals")
            .update({ sort_order: g.sort_order })
            .eq("id", g.id)
            .eq("user_id", user.id)
            .select()
        );
        const results = await Promise.all(updatePromises);
        for (const res of results) {
          if (res.error) throw res.error;
          if (!res.data || res.data.length === 0) {
            throw new Error("Update did not affect any rows. A goal may have been deleted.");
          }
        }
      } else {
        throw new Error("User must be authenticated to reorder goals.");
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
        username,
        pendingGoalIds,
        syncError,
        clearSyncError,
        logout,
        addGoal,
        updateGoal,
        deleteGoal,
        toggleSubtask,
        reorderGoals,
        refreshData,
        updateUsername,
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
