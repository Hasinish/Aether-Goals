"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { Habit, HabitLog } from "./types";
import { getSupabaseClient } from "./supabase";
import { User } from "@supabase/supabase-js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const getErrorMessage = (e: unknown): string => {
  if (!e) return "Unknown error";
  if (e instanceof Error) return e.message;
  if (typeof e === "object" && e !== null && "message" in e) {
    const msg = (e as Record<string, unknown>).message;
    if (typeof msg === "string") {
      return msg;
    }
  }
  return String(e);
};

export const createHabitId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `habit-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

/** Returns today's date as "YYYY-MM-DD" in local time */
export const todayString = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Compute streak from an array of HabitLogs and the habit's daily_target */
const computeStreak = (logs: HabitLog[], dailyTarget: number): number => {
  const today = todayString();
  const logMap = new Map<string, number>();
  logs.forEach((l) => logMap.set(l.log_date, l.completions));

  let streak = 0;
  const d = new Date();

  // If today is already complete, start counting from today; otherwise start from yesterday
  const todayCompletions = logMap.get(today) ?? 0;
  if (todayCompletions < dailyTarget) {
    d.setDate(d.getDate() - 1); // start from yesterday
  }

  for (let i = 0; i < 365; i++) {
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const completions = logMap.get(dateStr) ?? 0;
    if (completions >= dailyTarget) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
};

/** Hydrate a raw Habit with computed UI fields (completionsToday, streak, icon) */
const hydrateHabit = (habit: Habit, logs: HabitLog[]): Habit => {
  const today = todayString();
  const todayLog = logs.find((l) => l.habit_id === habit.id && l.log_date === today);
  const completionsToday = todayLog?.completions ?? 0;
  const habitLogs = logs.filter((l) => l.habit_id === habit.id);
  const streak = computeStreak(habitLogs, habit.daily_target);

  // Extract icon from tags to maintain db schema compatibility
  const iconTag = habit.tags?.find((t) => t.startsWith("icon:"));
  const icon = iconTag ? iconTag.split(":")[1] : "activity";
  const cleanTags = habit.tags?.filter((t) => !t.startsWith("icon:")) ?? [];

  return {
    ...habit,
    icon,
    tags: cleanTags,
    logs: habitLogs,
    completionsToday,
    streak,
  };
};

// ─── Context Shape ────────────────────────────────────────────────────────────

interface HabitStoreContextProps {
  habits: Habit[];
  loading: boolean;
  pendingHabitIds: Set<string>;
  syncError: string | null;
  clearSyncError: () => void;
  addHabit: (title: string, tags: string[], dailyTarget: number, icon: string) => Promise<void>;
  updateHabit: (id: string, title: string, tags: string[], dailyTarget: number, icon: string) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  logCompletion: (habitId: string) => Promise<void>;
  reorderHabits: (startIndex: number, endIndex: number) => Promise<void>;
  refreshHabits: () => Promise<void>;
}

const HabitStoreContext = createContext<HabitStoreContextProps | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const HabitStoreProvider: React.FC<{
  children: React.ReactNode;
  user: User | "guest" | null;
}> = ({ children, user }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [allLogs, setAllLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingHabitIds, setPendingHabitIds] = useState<Set<string>>(new Set());
  const [syncError, setSyncError] = useState<string | null>(null);
  const clearSyncError = () => setSyncError(null);
  const isOfflineMode = false;
  const isReorderingRef = useRef(false);

  const addPending = useCallback(
    (id: string) => setPendingHabitIds((p) => new Set(p).add(id)),
    []
  );
  const removePending = useCallback(
    (id: string) =>
      setPendingHabitIds((p) => {
        const n = new Set(p);
        n.delete(id);
        return n;
      }),
    []
  );

  // ── Hydration helper (merge habits + logs into enriched Habit[]) ──────────
  const buildHabits = useCallback(
    (rawHabits: Omit<Habit, "logs" | "completionsToday" | "streak">[], logs: HabitLog[]): Habit[] => {
      return rawHabits
        .map((h) => hydrateHabit(h as Habit, logs))
        .sort((a, b) => a.sort_order - b.sort_order);
    },
    []
  );

  // ── Fetch from Supabase ───────────────────────────────────────────────────
  const fetchFromSupabase = useCallback(async () => {
    const client = getSupabaseClient();

    const { data: habitsData, error: habitsError } = await client
      .from("habits")
      .select("*")
      .order("sort_order", { ascending: true });

    if (habitsError) throw habitsError;

    // Fetch logs for the last 100 days
    const hundredDaysAgo = new Date();
    hundredDaysAgo.setDate(hundredDaysAgo.getDate() - 100);
    const startDateStr = `${hundredDaysAgo.getFullYear()}-${String(hundredDaysAgo.getMonth() + 1).padStart(2, "0")}-${String(hundredDaysAgo.getDate()).padStart(2, "0")}`;
    
    const { data: logsData, error: logsError } = await client
      .from("habit_logs")
      .select("*")
      .gte("log_date", startDateStr);

    if (logsError) throw logsError;

    const rawHabits = (habitsData ?? []) as Omit<Habit, "logs" | "completionsToday" | "streak">[];
    const logs = (logsData ?? []) as HabitLog[];
    return { rawHabits, logs };
  }, []);

  // ── Main fetch ────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let rawHabits: Omit<Habit, "logs" | "completionsToday" | "streak">[] = [];
      let logs: HabitLog[] = [];

      if (!isOfflineMode && user && user !== "guest") {
        ({ rawHabits, logs } = await fetchFromSupabase());
      }

      setAllLogs(logs);
      setHabits(buildHabits(rawHabits, logs));
    } catch (e) {
      const msg = getErrorMessage(e);
      setSyncError(`Failed to load habits: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [user, isOfflineMode, fetchFromSupabase, buildHabits]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── addHabit ──────────────────────────────────────────────────────────────
  const addHabit = useCallback(
    async (title: string, tags: string[], dailyTarget: number, icon: string) => {
      const id = createHabitId();
      const minSort = habits.length > 0 ? Math.min(...habits.map((h) => h.sort_order)) : 0;

      // Serialize icon into tags for database storage compatibility
      const dbTags = [...tags];
      if (icon) {
        dbTags.push(`icon:${icon}`);
      }

      const newRaw: Omit<Habit, "logs" | "completionsToday" | "streak"> = {
        id,
        user_id: user && user !== "guest" ? user.id : null,
        title,
        tags: dbTags,
        daily_target: dailyTarget,
        sort_order: minSort - 1,
        created_at: new Date().toISOString(),
      };

      // Optimistic update
      const newHydrated = hydrateHabit(newRaw as Habit, allLogs);
      setHabits((prev) => [newHydrated, ...prev]);
      addPending(id);

      try {
        if (user && user !== "guest") {
          const client = getSupabaseClient();
          const { error } = await client.from("habits").insert({
            id: newRaw.id,
            user_id: newRaw.user_id,
            title: newRaw.title,
            tags: newRaw.tags,
            daily_target: newRaw.daily_target,
            sort_order: newRaw.sort_order,
            created_at: newRaw.created_at,
          });
          if (error) throw error;
        } else {
          throw new Error("User must be authenticated to create a habit.");
        }
      } catch (e) {
        setHabits((prev) => prev.filter((h) => h.id !== id));
        const msg = getErrorMessage(e);
        setSyncError(`Failed to create habit: ${msg}`);
        throw e;
      } finally {
        removePending(id);
      }
    },
    [habits, user, allLogs, addPending, removePending]
  );

  // ── updateHabit ───────────────────────────────────────────────────────────
  const updateHabit = useCallback(
    async (id: string, title: string, tags: string[], dailyTarget: number, icon: string) => {
      const prev = habits.find((h) => h.id === id);

      // Serialize icon into tags for database storage compatibility
      const dbTags = [...tags];
      if (icon) {
        dbTags.push(`icon:${icon}`);
      }

      setHabits((hs) =>
        hs.map((h) =>
          h.id === id
            ? hydrateHabit(
                { ...h, title, tags: dbTags, daily_target: dailyTarget },
                allLogs
              )
            : h
        )
      );
      addPending(id);

      try {
        if (user && user !== "guest") {
          const client = getSupabaseClient();
          const { data, error } = await client
            .from("habits")
            .update({ title, tags: dbTags, daily_target: dailyTarget })
            .eq("id", id)
            .select();
          if (error) throw error;
          if (!data || data.length === 0) {
            throw new Error("Update did not affect any rows. Habit may have been deleted.");
          }
        } else {
          throw new Error("User must be authenticated to update a habit.");
        }
      } catch (e) {
        if (prev) setHabits((hs) => hs.map((h) => (h.id === id ? prev : h)));
        const msg = getErrorMessage(e);
        setSyncError(`Failed to update habit: ${msg}`);
        throw e;
      } finally {
        removePending(id);
      }
    },
    [habits, user, allLogs, addPending, removePending]
  );

  // ── deleteHabit ───────────────────────────────────────────────────────────
  const deleteHabit = useCallback(
    async (id: string) => {
      const prev = habits.find((h) => h.id === id);
      const prevIdx = habits.findIndex((h) => h.id === id);

      addPending(id);
      setHabits((hs) => hs.filter((h) => h.id !== id));

      try {
        if (user && user !== "guest") {
          const client = getSupabaseClient();
          const { data, error } = await client.from("habits").delete().eq("id", id).select();
          if (error) throw error;
          if (!data || data.length === 0) {
            throw new Error("Delete blocked by Row Level Security (RLS). Please ensure you have a DELETE policy configured for the 'habits' table.");
          }
        } else {
          throw new Error("User must be authenticated to delete a habit.");
        }
      } catch (e) {
        if (prev) {
          setHabits((hs) => {
            const next = [...hs];
            if (!next.some((h) => h.id === id)) next.splice(prevIdx, 0, prev);
            return next;
          });
        }
        const msg = getErrorMessage(e);
        setSyncError(`Failed to delete habit: ${msg}`);
        throw e;
      } finally {
        removePending(id);
      }
    },
    [habits, user, addPending, removePending]
  );

  // ── logCompletion ─────────────────────────────────────────────────────────
  // Tap to +1; if already at dailyTarget, reset to 0
  const logCompletion = useCallback(
    async (habitId: string) => {
      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return;

      const today = todayString();
      const currentCompletions = habit.completionsToday ?? 0;
      const newCompletions =
        currentCompletions >= habit.daily_target ? 0 : currentCompletions + 1;

      // Optimistic UI update
      setHabits((hs) =>
        hs.map((h) => {
          if (h.id !== habitId) return h;
          const updatedLogs = (h.logs ?? []).filter((l) => l.log_date !== today);
          const todayLog: HabitLog = {
            id: `${habitId}-${today}`,
            habit_id: habitId,
            user_id: h.user_id,
            log_date: today,
            completions: newCompletions,
          };
          if (newCompletions > 0) updatedLogs.push(todayLog);
          const streak = computeStreak(updatedLogs, h.daily_target);
          return { ...h, logs: updatedLogs, completionsToday: newCompletions, streak };
        })
      );

      // Update allLogs too
      setAllLogs((logs) => {
        const filtered = logs.filter(
          (l) => !(l.habit_id === habitId && l.log_date === today)
        );
        if (newCompletions > 0) {
          filtered.push({
            id: `${habitId}-${today}`,
            habit_id: habitId,
            user_id: habit.user_id,
            log_date: today,
            completions: newCompletions,
          });
        }
        return filtered;
      });

      try {
        if (user && user !== "guest") {
          const client = getSupabaseClient();
          if (newCompletions === 0) {
            // Delete the log row
            const { error } = await client
              .from("habit_logs")
              .delete()
              .eq("habit_id", habitId)
              .eq("log_date", today)
              .select();
            if (error) throw error;
          } else {
            // Upsert (insert or update)
            const { data, error } = await client.from("habit_logs").upsert(
              {
                habit_id: habitId,
                user_id: habit.user_id,
                log_date: today,
                completions: newCompletions,
              },
              { onConflict: "habit_id,log_date" }
            ).select();
            if (error) throw error;
            if (!data || data.length === 0) {
              throw new Error("Upsert did not affect any rows.");
            }
          }
        } else {
          throw new Error("User must be authenticated to log a habit completion.");
        }
      } catch (e) {
        // Revert optimistic update on error
        const msg = getErrorMessage(e);
        setSyncError(`Failed to log completion: ${msg}`);
        await fetchData();
      }
    },
    [habits, user, fetchData]
  );

  // ── reorderHabits ─────────────────────────────────────────────────────────
  const reorderHabits = useCallback(
    async (startIndex: number, endIndex: number) => {
      if (isReorderingRef.current) return;
      isReorderingRef.current = true;

      const previous = [...habits];
      const updated = [...habits];
      const [moved] = updated.splice(startIndex, 1);
      updated.splice(endIndex, 0, moved);
      const reordered = updated.map((h, i) => ({ ...h, sort_order: i }));
      setHabits(reordered);

      try {
        if (user && user !== "guest") {
          const client = getSupabaseClient();
          const updatePromises = reordered.map((h) =>
            client
              .from("habits")
              .update({ sort_order: h.sort_order })
              .eq("id", h.id)
              .eq("user_id", user.id)
              .select()
          );
          const results = await Promise.all(updatePromises);
          for (const res of results) {
            if (res.error) throw res.error;
            if (!res.data || res.data.length === 0) {
              throw new Error("Update did not affect any rows. A habit may have been deleted.");
            }
          }
        } else {
          throw new Error("User must be authenticated to reorder habits.");
        }
      } catch (e) {
        setHabits(previous);
        const msg = getErrorMessage(e);
        setSyncError(`Failed to reorder habits: ${msg}`);
      } finally {
        isReorderingRef.current = false;
      }
    },
    [habits, user]
  );

  const refreshHabits = useCallback(() => fetchData(), [fetchData]);

  return (
    <HabitStoreContext.Provider
      value={{
        habits,
        loading,
        pendingHabitIds,
        syncError,
        clearSyncError,
        addHabit,
        updateHabit,
        deleteHabit,
        logCompletion,
        reorderHabits,
        refreshHabits,
      }}
    >
      {children}
    </HabitStoreContext.Provider>
  );
};

export const useHabitsStore = (): HabitStoreContextProps => {
  const ctx = useContext(HabitStoreContext);
  if (!ctx) {
    throw new Error("useHabitsStore must be used within a HabitStoreProvider");
  }
  return ctx;
};
