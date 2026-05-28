"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
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
  pendingGoalId: string | null;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
  addGoal: (title: string, tags: string[], subtaskTitles: string[]) => Promise<void>;
  updateGoal: (goalId: string, title: string, tags: string[], subtasksInput: { id?: string; title: string; is_complete?: boolean }[]) => Promise<void>;
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
  const [pendingGoalId, setPendingGoalId] = useState<string | null>(null);

  // Calculates percentage and constructs progress statuses
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

  // Seeding helper for Supabase
  const seedDataToSupabase = useCallback(async (userId: string) => {
    try {
      const client = getSupabaseClient();
      const { goals: seedGoals, subtasks: seedSubtasks } = getInitialSeedData();

      // Insert goals with user_id
      const goalsToInsert = seedGoals.map(g => ({
        id: g.id,
        user_id: userId,
        title: g.title,
        tags: g.tags,
        created_at: g.created_at
      }));

      const { error: goalsError } = await client.from("goals").insert(goalsToInsert);
      if (goalsError) throw goalsError;

      // Insert subtasks
      const { error: subtasksError } = await client.from("subtasks").insert(seedSubtasks);
      if (subtasksError) throw subtasksError;

      // Optimistically assemble and set goals directly to resolve fetch dependencies
      const assembledGoals = seedGoals.map((g) => {
        const goalSubtasks = seedSubtasks.filter((s) => s.goal_id === g.id);
        return calculateGoalMetrics({
          ...g,
          subtasks: goalSubtasks,
        });
      });

      setGoals(assembledGoals);
    } catch (e) {
      console.error("Failed to seed Supabase data:", e);
    }
  }, [calculateGoalMetrics]);

  // Fetch / Sync Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const dbConfigured = isSupabaseConfigured();
      if (dbConfigured && user && user !== "guest") {
        const client = getSupabaseClient();
        // --- SUPABASE DATA FETCH ---
        const { data: goalsData, error: goalsError } = await client
          .from("goals")
          .select("*")
          .order("created_at", { ascending: false });

        if (goalsError) throw goalsError;

        if (goalsData && goalsData.length > 0) {
          // Fetch subtasks
          const { data: subtasksData, error: subtasksError } = await client
            .from("subtasks")
            .select("*");

          if (subtasksError) throw subtasksError;

          // Assemble goals
          const assembledGoals: Goal[] = (goalsData as Goal[]).map((g) => {
            const goalSubtasks = (subtasksData as Subtask[] || []).filter((s) => s.goal_id === g.id);
            return calculateGoalMetrics({
              ...g,
              subtasks: goalSubtasks,
            });
          });

          setGoals(assembledGoals);
        } else {
          // Empty remote database -> Seed data for this user
          await seedDataToSupabase(user.id);
        }
      } else {
        // --- LOCAL STORAGE DATA FETCH (GUEST OR OFFLINE MODE) ---
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
          });

          setGoals(assembledGoals);
        } else {
          // First load / empty storage -> Seed local data
          const { goals: seedGoals, subtasks: seedSubtasks } = getInitialSeedData();
          
          localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(seedGoals));
          localStorage.setItem(STORAGE_KEYS.SUBTASKS, JSON.stringify(seedSubtasks));

          const assembledGoals = seedGoals.map((g) => {
            const goalSubtasks = seedSubtasks.filter((s) => s.goal_id === g.id);
            return calculateGoalMetrics({
              ...g,
              subtasks: goalSubtasks,
            });
          });

          setGoals(assembledGoals);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [user, calculateGoalMetrics, seedDataToSupabase]);

  // Initialize Auth & Detect Supabase Configuration
  useEffect(() => {
    const initAuth = async () => {
      const dbConfigured = isSupabaseConfigured();
      setIsOfflineMode(!dbConfigured);

      if (dbConfigured) {
        try {
          const client = getSupabaseClient();
          const { data: { session } } = await client.auth.getSession();
          if (session?.user) {
            setUser(session.user);
          } else {
            // Check local storage if previously logged in as guest
            const localUser = localStorage.getItem(STORAGE_KEYS.USER);
            if (localUser === "guest") {
              setUser("guest");
            }
          }

          // Listen for auth state changes
          const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
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

          return () => subscription.unsubscribe();
        } catch (e) {
          console.error("Supabase auth error, falling back to offline mode", e);
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
  }, []);

  // Fetch / Sync Data when User or Mode changes
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
        await client.auth.signOut();
      } catch (e) {
        console.error("Sign out error:", e);
      }
    }
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.USER);
  };

  // --- ACTIONS ---

  const addGoal = async (title: string, tags: string[], subtaskTitles: string[]) => {
    const newGoalId = crypto.randomUUID();
    const newGoal: Goal = {
      id: newGoalId,
      user_id: user && user !== "guest" ? user.id : null,
      title,
      tags,
      created_at: new Date().toISOString(),
      deltaPercent: 0,
      statusMessage: subtaskTitles.length > 0 ? "Goal initialized. Start ticking off subtasks." : "Goal initialized.",
    };

    const newSubtasks: Subtask[] = subtaskTitles.map((t) => ({
      id: crypto.randomUUID(),
      goal_id: newGoalId,
      title: t,
      is_complete: false,
    }));

    const newGoalWithMetrics = calculateGoalMetrics({
      ...newGoal,
      subtasks: newSubtasks,
    });

    // Save previous state for optimistic updates
    const previousGoals = [...goals];

    // Optimistically update React State
    setGoals((prev) => [newGoalWithMetrics, ...prev]);
    setPendingGoalId(newGoalId);

    try {
      if (!isOfflineMode && user && user !== "guest") {
        const client = getSupabaseClient();
        // Remote write
        const { error: gError } = await client.from("goals").insert({
          id: newGoal.id,
          user_id: newGoal.user_id,
          title: newGoal.title,
          tags: newGoal.tags,
          created_at: newGoal.created_at,
        });

        if (gError) throw gError;

        if (newSubtasks.length > 0) {
          const { error: sError } = await client.from("subtasks").insert(newSubtasks);
          if (sError) throw sError;
        }
      } else {
        // Local write
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
      console.error("Failed to add goal, reverting state", e);
      setGoals(previousGoals);
    } finally {
      setPendingGoalId(null);
    }
  };

  const updateGoal = async (
    goalId: string,
    title: string,
    tags: string[],
    subtasksInput: { id?: string; title: string; is_complete?: boolean }[]
  ) => {
    // Generate IDs for new subtasks, preserve existing ones
    const updatedSubtasks: Subtask[] = subtasksInput.map((s) => ({
      id: s.id || crypto.randomUUID(),
      goal_id: goalId,
      title: s.title,
      is_complete: s.is_complete || false,
    }));

    const previousGoals = [...goals];
    setPendingGoalId(goalId);

    // Optimistically update React State
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
        // Remote update
        const { error: gError } = await client
          .from("goals")
          .update({ title, tags })
          .eq("id", goalId);

        if (gError) throw gError;

        // Sync subtasks using ID checking
        const { data: oldSubtasks, error: fetchErr } = await client
          .from("subtasks")
          .select("*")
          .eq("goal_id", goalId);

        if (fetchErr) throw fetchErr;

        const oldSubtasksList = (oldSubtasks as Subtask[]) || [];

        // Subtasks to delete: present in database but not in our updated list
        const subtasksToDelete = oldSubtasksList.filter(
          (oldS) => !updatedSubtasks.some((newS) => newS.id === oldS.id)
        );

        // Subtasks to insert: not present in the database
        const subtasksToInsert = updatedSubtasks.filter(
          (newS) => !oldSubtasksList.some((oldS) => oldS.id === newS.id)
        );

        // Subtasks to update: present in both, sync title & is_complete
        const subtasksToUpdate = updatedSubtasks.filter((newS) =>
          oldSubtasksList.some((oldS) => oldS.id === newS.id)
        );

        if (subtasksToDelete.length > 0) {
          const { error: delErr } = await client
            .from("subtasks")
            .delete()
            .in("id", subtasksToDelete.map((s) => s.id));
          if (delErr) throw delErr;
        }

        if (subtasksToInsert.length > 0) {
          const { error: insErr } = await client.from("subtasks").insert(subtasksToInsert);
          if (insErr) throw insErr;
        }

        for (const s of subtasksToUpdate) {
          const { error: updErr } = await client
            .from("subtasks")
            .update({ title: s.title, is_complete: s.is_complete })
            .eq("id", s.id);
          if (updErr) throw updErr;
        }
      } else {
        // Local update
        const localGoals = localStorage.getItem(STORAGE_KEYS.GOALS);
        const localSubtasks = localStorage.getItem(STORAGE_KEYS.SUBTASKS);

        if (localGoals && localSubtasks) {
          let parsedGoals = JSON.parse(localGoals) as Goal[];
          let parsedSubtasks = JSON.parse(localSubtasks) as Subtask[];

          parsedGoals = parsedGoals.map((g) => {
            if (g.id === goalId) {
              return { ...g, title, tags };
            }
            return g;
          });

          // Remove old subtasks for this goal and append updated list
          parsedSubtasks = parsedSubtasks.filter((s) => s.goal_id !== goalId);
          parsedSubtasks.push(...updatedSubtasks);

          localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(parsedGoals));
          localStorage.setItem(STORAGE_KEYS.SUBTASKS, JSON.stringify(parsedSubtasks));
        }
      }
    } catch (e) {
      console.error("Failed to update goal, reverting state", e);
      setGoals(previousGoals);
    } finally {
      setPendingGoalId(null);
    }
  };

  const deleteGoal = async (goalId: string) => {
    const previousGoals = [...goals];
    setPendingGoalId(goalId);

    // Optimistically update React State
    setGoals((prev) => prev.filter((g) => g.id !== goalId));

    try {
      if (!isOfflineMode && user && user !== "guest") {
        const client = getSupabaseClient();
        // Delete subtasks first explicitly to prevent foreign key errors (cascade config safety)
        const { error: sError } = await client.from("subtasks").delete().eq("goal_id", goalId);
        if (sError) throw sError;

        const { error: gError } = await client.from("goals").delete().eq("id", goalId);
        if (gError) throw gError;
      } else {
        // Local delete
        const localGoals = localStorage.getItem(STORAGE_KEYS.GOALS);
        const localSubtasks = localStorage.getItem(STORAGE_KEYS.SUBTASKS);

        if (localGoals && localSubtasks) {
          let parsedGoals = JSON.parse(localGoals) as Goal[];
          let parsedSubtasks = JSON.parse(localSubtasks) as Subtask[];

          parsedGoals = parsedGoals.filter((g) => g.id !== goalId);
          parsedSubtasks = parsedSubtasks.filter((s) => s.goal_id !== goalId);

          localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(parsedGoals));
          localStorage.setItem(STORAGE_KEYS.SUBTASKS, JSON.stringify(parsedSubtasks));
        }
      }
    } catch (e) {
      console.error("Failed to delete goal, reverting state", e);
      setGoals(previousGoals);
    } finally {
      setPendingGoalId(null);
    }
  };

  const toggleSubtask = async (subtaskId: string) => {
    const previousGoals = [...goals];
    let newIsComplete = false;
    let targetGoalId = "";

    // Find the current status in local React state to toggle directly
    const allSubtasks = goals.flatMap((g) => g.subtasks || []);
    const subtaskObj = allSubtasks.find((s) => s.id === subtaskId);
    if (subtaskObj) {
      newIsComplete = !subtaskObj.is_complete;
      targetGoalId = subtaskObj.goal_id;
    }

    if (targetGoalId) {
      setPendingGoalId(targetGoalId);
    }

    // Optimistic UI updates
    setGoals((prevGoals) =>
      prevGoals.map((g) => {
        const subtasks = g.subtasks || [];
        if (subtasks.some((s) => s.id === subtaskId)) {
          const updatedSubtasks = subtasks.map((s) => {
            if (s.id === subtaskId) {
              return { ...s, is_complete: newIsComplete };
            }
            return s;
          });
          return calculateGoalMetrics({ ...g, subtasks: updatedSubtasks });
        }
        return g;
      })
    );

    // Sync database / storage
    try {
      if (!isOfflineMode && user && user !== "guest") {
        const client = getSupabaseClient();
        // Zero-select query round trip optimization (FIX 7): direct update
        const { error: upErr } = await client
          .from("subtasks")
          .update({ is_complete: newIsComplete })
          .eq("id", subtaskId);

        if (upErr) throw upErr;
      } else {
        // Local storage update
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
      console.error("Failed to toggle subtask on backend, reverting state", e);
      setGoals(previousGoals);
    } finally {
      setPendingGoalId(null);
    }
  };

  const reorderGoals = async (startIndex: number, endIndex: number) => {
    const previousGoals = [...goals];

    const updated = [...goals];
    const [draggedItem] = updated.splice(startIndex, 1);
    updated.splice(endIndex, 0, draggedItem);

    // Update React local state immediately
    setGoals(updated);

    try {
      if (!isOfflineMode && user && user !== "guest") {
        const client = getSupabaseClient();
        // Swap created_at timestamps between both goals in Supabase to maintain custom sorting
        const draggedGoal = goals[startIndex];
        const targetGoal = goals[endIndex];

        if (draggedGoal && targetGoal) {
          const { error: err1 } = await client
            .from("goals")
            .update({ created_at: targetGoal.created_at })
            .eq("id", draggedGoal.id);

          const { error: err2 } = await client
            .from("goals")
            .update({ created_at: draggedGoal.created_at })
            .eq("id", targetGoal.id);

          if (err1 || err2) throw err1 || err2;
        }
      } else {
        // Offline LocalStorage updates
        localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(updated));
      }
    } catch (e) {
      console.error("Failed to reorder goals, reverting state", e);
      setGoals(previousGoals);
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
        pendingGoalId,
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
