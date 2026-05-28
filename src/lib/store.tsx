"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Goal, Subtask } from "./types";
import { getInitialSeedData } from "./seed";
import { supabase, isSupabaseConfigured } from "./supabase";

interface StoreContextProps {
  goals: Goal[];
  loading: boolean;
  user: any | null; // Supabase user or 'guest' or null
  isOfflineMode: boolean;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
  addGoal: (title: string, tags: string[], subtaskTitles: string[]) => Promise<void>;
  updateGoal: (goalId: string, title: string, tags: string[], subtaskTitles: string[]) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  toggleSubtask: (subtaskId: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const StoreContext = createContext<StoreContextProps | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(true);

  // Initialize Auth & Detect Supabase Configuration
  useEffect(() => {
    const initAuth = async () => {
      const dbConfigured = isSupabaseConfigured();
      setIsOfflineMode(!dbConfigured);

      if (dbConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setUser(session.user);
          } else {
            // Check local storage if previously logged in as guest
            const localUser = localStorage.getItem("aether_user");
            if (localUser === "guest") {
              setUser("guest");
            }
          }

          // Listen for auth state changes
          const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
              setUser(session.user);
              localStorage.setItem("aether_user", "authenticated");
            } else {
              const localUser = localStorage.getItem("aether_user");
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
        const localUser = localStorage.getItem("aether_user");
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
  }, [user, isOfflineMode]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!isOfflineMode && user && user !== "guest" && supabase) {
        // --- SUPABASE DATA FETCH ---
        const { data: goalsData, error: goalsError } = await supabase
          .from("goals")
          .select("*")
          .order("created_at", { ascending: false });

        if (goalsError) throw goalsError;

        if (goalsData && goalsData.length > 0) {
          // Fetch subtasks
          const { data: subtasksData, error: subtasksError } = await supabase
            .from("subtasks")
            .select("*");

          if (subtasksError) throw subtasksError;

          // Assemble goals
          const assembledGoals: Goal[] = goalsData.map((g: any) => {
            const goalSubtasks = (subtasksData || []).filter((s: any) => s.goal_id === g.id);
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
        const localGoals = localStorage.getItem("aether_goals");
        const localSubtasks = localStorage.getItem("aether_subtasks");

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
          
          localStorage.setItem("aether_goals", JSON.stringify(seedGoals));
          localStorage.setItem("aether_subtasks", JSON.stringify(seedSubtasks));

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
  };

  // Seeding helper for Supabase
  const seedDataToSupabase = async (userId: string) => {
    if (!supabase) return;
    try {
      const { goals: seedGoals, subtasks: seedSubtasks } = getInitialSeedData();

      // Insert goals with user_id
      const goalsToInsert = seedGoals.map(g => ({
        id: g.id,
        user_id: userId,
        title: g.title,
        tags: g.tags,
        created_at: g.created_at
      }));

      const { error: goalsError } = await supabase.from("goals").insert(goalsToInsert);
      if (goalsError) throw goalsError;

      // Insert subtasks
      const { error: subtasksError } = await supabase.from("subtasks").insert(seedSubtasks);
      if (subtasksError) throw subtasksError;

      // Re-fetch
      await fetchData();
    } catch (e) {
      console.error("Failed to seed Supabase data:", e);
    }
  };

  // Calculates percentage and constructs progress statuses
  const calculateGoalMetrics = (goal: Goal): Goal => {
    const subtasks = goal.subtasks || [];
    const total = subtasks.length;
    const completed = subtasks.filter((s) => s.is_complete).length;
    const progressPercent = total === 0 ? 0 : Math.round((completed / total) * 100);

    return {
      ...goal,
      progressPercent,
      subtasks,
    };
  };

  const loginAsGuest = () => {
    setUser("guest");
    localStorage.setItem("aether_user", "guest");
  };

  const logout = async () => {
    if (!isOfflineMode && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem("aether_user");
  };

  // --- ACTIONS ---

  const addGoal = async (title: string, tags: string[], subtaskTitles: string[]) => {
    const newGoalId = `goal-${Date.now()}`;
    const newGoal: Goal = {
      id: newGoalId,
      user_id: user && user !== "guest" ? user.id : null,
      title,
      tags,
      created_at: new Date().toISOString(),
      deltaPercent: 0,
      statusMessage: subtaskTitles.length > 0 ? "Goal initialized. Start ticking off subtasks." : "Goal initialized.",
    };

    const newSubtasks: Subtask[] = subtaskTitles.map((t, idx) => ({
      id: `subtask-${Date.now()}-${idx}`,
      goal_id: newGoalId,
      title: t,
      is_complete: false,
    }));

    if (!isOfflineMode && user && user !== "guest" && supabase) {
      // Remote write
      const { error: gError } = await supabase.from("goals").insert({
        id: newGoal.id,
        user_id: newGoal.user_id,
        title: newGoal.title,
        tags: newGoal.tags,
        created_at: newGoal.created_at,
      });

      if (gError) throw gError;

      if (newSubtasks.length > 0) {
        const { error: sError } = await supabase.from("subtasks").insert(newSubtasks);
        if (sError) throw sError;
      }
    } else {
      // Local write
      const localGoals = localStorage.getItem("aether_goals");
      const localSubtasks = localStorage.getItem("aether_subtasks");

      const parsedGoals = localGoals ? (JSON.parse(localGoals) as Goal[]) : [];
      const parsedSubtasks = localSubtasks ? (JSON.parse(localSubtasks) as Subtask[]) : [];

      parsedGoals.unshift(newGoal);
      parsedSubtasks.push(...newSubtasks);

      localStorage.setItem("aether_goals", JSON.stringify(parsedGoals));
      localStorage.setItem("aether_subtasks", JSON.stringify(parsedSubtasks));
    }

    await fetchData();
  };

  const updateGoal = async (goalId: string, title: string, tags: string[], subtaskTitles: string[]) => {
    if (!isOfflineMode && user && user !== "guest" && supabase) {
      // Remote update
      const { error: gError } = await supabase
        .from("goals")
        .update({ title, tags })
        .eq("id", goalId);

      if (gError) throw gError;

      // Sync subtasks: Fetch old, delete removed, add new
      const { data: oldSubtasks, error: fetchErr } = await supabase
        .from("subtasks")
        .select("*")
        .eq("goal_id", goalId);

      if (fetchErr) throw fetchErr;

      const oldSubtasksList = oldSubtasks || [];

      // Identify subtasks to keep or delete
      const subtasksToDelete = oldSubtasksList.filter(
        (oldS) => !subtaskTitles.includes(oldS.title)
      );

      const subtaskTitlesToInsert = subtaskTitles.filter(
        (t) => !oldSubtasksList.some((oldS) => oldS.title === t)
      );

      if (subtasksToDelete.length > 0) {
        const { error: delErr } = await supabase
          .from("subtasks")
          .delete()
          .in("id", subtasksToDelete.map((s) => s.id));
        if (delErr) throw delErr;
      }

      if (subtaskTitlesToInsert.length > 0) {
        const inserts: Subtask[] = subtaskTitlesToInsert.map((t, idx) => ({
          id: `subtask-${Date.now()}-${idx}`,
          goal_id: goalId,
          title: t,
          is_complete: false,
        }));

        const { error: insErr } = await supabase.from("subtasks").insert(inserts);
        if (insErr) throw insErr;
      }
    } else {
      // Local update
      const localGoals = localStorage.getItem("aether_goals");
      const localSubtasks = localStorage.getItem("aether_subtasks");

      if (localGoals && localSubtasks) {
        let parsedGoals = JSON.parse(localGoals) as Goal[];
        let parsedSubtasks = JSON.parse(localSubtasks) as Subtask[];

        // Update goal metadata
        parsedGoals = parsedGoals.map((g) => {
          if (g.id === goalId) {
            return { ...g, title, tags };
          }
          return g;
        });

        // Filter out deleted subtasks, keep completed ones if name matches
        const existingSubtasksForGoal = parsedSubtasks.filter((s) => s.goal_id === goalId);
        
        // Remove subtasks for this goal
        parsedSubtasks = parsedSubtasks.filter((s) => s.goal_id !== goalId);

        // Recreate subtasks list
        const updatedSubtasks: Subtask[] = subtaskTitles.map((t, idx) => {
          const match = existingSubtasksForGoal.find((oldS) => oldS.title === t);
          return {
            id: match ? match.id : `subtask-${Date.now()}-${idx}`,
            goal_id: goalId,
            title: t,
            is_complete: match ? match.is_complete : false,
          };
        });

        parsedSubtasks.push(...updatedSubtasks);

        localStorage.setItem("aether_goals", JSON.stringify(parsedGoals));
        localStorage.setItem("aether_subtasks", JSON.stringify(parsedSubtasks));
      }
    }

    await fetchData();
  };

  const deleteGoal = async (goalId: string) => {
    if (!isOfflineMode && user && user !== "guest" && supabase) {
      // Cascade delete is usually configured in foreign keys, but let's delete subtasks explicitly first to be safe
      const { error: sError } = await supabase.from("subtasks").delete().eq("goal_id", goalId);
      if (sError) throw sError;

      const { error: gError } = await supabase.from("goals").delete().eq("id", goalId);
      if (gError) throw gError;
    } else {
      // Local delete
      const localGoals = localStorage.getItem("aether_goals");
      const localSubtasks = localStorage.getItem("aether_subtasks");

      if (localGoals && localSubtasks) {
        let parsedGoals = JSON.parse(localGoals) as Goal[];
        let parsedSubtasks = JSON.parse(localSubtasks) as Subtask[];

        parsedGoals = parsedGoals.filter((g) => g.id !== goalId);
        parsedSubtasks = parsedSubtasks.filter((s) => s.goal_id !== goalId);

        localStorage.setItem("aether_goals", JSON.stringify(parsedGoals));
        localStorage.setItem("aether_subtasks", JSON.stringify(parsedSubtasks));
      }
    }

    await fetchData();
  };

  const toggleSubtask = async (subtaskId: string) => {
    // Optimistic UI updates
    let targetGoalId = "";
    
    setGoals((prevGoals) =>
      prevGoals.map((g) => {
        const subtasks = g.subtasks || [];
        if (subtasks.some((s) => s.id === subtaskId)) {
          targetGoalId = g.id;
          const updatedSubtasks = subtasks.map((s) => {
            if (s.id === subtaskId) {
              return { ...s, is_complete: !s.is_complete };
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
      if (!isOfflineMode && user && user !== "guest" && supabase) {
        // Fetch current status to toggle
        const { data: subtaskData, error: sErr } = await supabase
          .from("subtasks")
          .select("is_complete")
          .eq("id", subtaskId)
          .single();

        if (sErr) throw sErr;

        const { error: upErr } = await supabase
          .from("subtasks")
          .update({ is_complete: !subtaskData.is_complete })
          .eq("id", subtaskId);

        if (upErr) throw upErr;
      } else {
        // Local storage update
        const localSubtasks = localStorage.getItem("aether_subtasks");
        if (localSubtasks) {
          const parsedSubtasks = JSON.parse(localSubtasks) as Subtask[];
          const updated = parsedSubtasks.map((s) => {
            if (s.id === subtaskId) {
              return { ...s, is_complete: !s.is_complete };
            }
            return s;
          });
          localStorage.setItem("aether_subtasks", JSON.stringify(updated));
        }
      }
    } catch (e) {
      console.error("Failed to toggle subtask on backend, reverting state", e);
      await fetchData(); // Revert
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
        loginAsGuest,
        logout,
        addGoal,
        updateGoal,
        deleteGoal,
        toggleSubtask,
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
