"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { Deadline } from "./types";
import { getSupabaseClient, isSupabaseConfigured } from "./supabase";
import { STORAGE_KEYS } from "./constants";
import { User } from "@supabase/supabase-js";
import { getErrorMessage } from "./habitStore"; // Re-use error helper

interface DeadlineStoreContextProps {
  deadlines: Deadline[];
  loading: boolean;
  pendingDeadlineIds: Set<string>;
  syncError: string | null;
  clearSyncError: () => void;
  addDeadline: (title: string, dueDate: string) => Promise<void>;
  updateDeadline: (id: string, title: string, dueDate: string, completed: boolean) => Promise<void>;
  deleteDeadline: (id: string) => Promise<void>;
  toggleDeadlineCompletion: (id: string) => Promise<void>;
  refreshDeadlines: () => Promise<void>;
}

const DeadlineStoreContext = createContext<DeadlineStoreContextProps | undefined>(undefined);

const safeParseArray = <T,>(raw: string | null, fallback: T[] = []): T[] => {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

export const createDeadlineId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `deadline-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const DeadlineStoreProvider: React.FC<{
  children: React.ReactNode;
  user: User | "guest" | null;
}> = ({ children, user }) => {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDeadlineIds, setPendingDeadlineIds] = useState<Set<string>>(new Set());
  const [syncError, setSyncError] = useState<string | null>(null);
  const clearSyncError = () => setSyncError(null);
  const isOfflineMode = !isSupabaseConfigured();

  const addPending = useCallback(
    (id: string) => setPendingDeadlineIds((p) => new Set(p).add(id)),
    []
  );
  const removePending = useCallback(
    (id: string) =>
      setPendingDeadlineIds((p) => {
        const n = new Set(p);
        n.delete(id);
        return n;
      }),
    []
  );

  // ── Fetch from Supabase ───────────────────────────────────────────────────
  const fetchFromSupabase = useCallback(async () => {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("deadlines")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as Deadline[];
  }, []);

  // ── Fetch from localStorage ───────────────────────────────────────────────
  const fetchFromLocal = useCallback((): Deadline[] => {
    return safeParseArray<Deadline>(localStorage.getItem(STORAGE_KEYS.DEADLINES), []);
  }, []);

  // ── Persist to localStorage ───────────────────────────────────────────────
  const persistLocal = useCallback((list: Deadline[]) => {
    localStorage.setItem(STORAGE_KEYS.DEADLINES, JSON.stringify(list));
  }, []);

  // ── Main fetch ────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let list: Deadline[] = [];
      if (!isOfflineMode && user && user !== "guest") {
        list = await fetchFromSupabase();
      } else {
        list = fetchFromLocal();
      }
      setDeadlines(list);
    } catch (e) {
      const msg = getErrorMessage(e);
      setSyncError(`Failed to load deadlines: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [user, isOfflineMode, fetchFromSupabase, fetchFromLocal]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── addDeadline ───────────────────────────────────────────────────────────
  const addDeadline = useCallback(
    async (title: string, dueDate: string) => {
      const id = createDeadlineId();
      const newDeadline: Deadline = {
        id,
        user_id: user && user !== "guest" ? user.id : null,
        title,
        due_date: dueDate,
        completed: false,
        created_at: new Date().toISOString(),
      };

      // Optimistic update
      setDeadlines((prev) => [newDeadline, ...prev]);
      addPending(id);

      try {
        if (!isOfflineMode && user && user !== "guest") {
          const client = getSupabaseClient();
          const { error } = await client.from("deadlines").insert(newDeadline);
          if (error) throw error;
        } else {
          const localList = fetchFromLocal();
          localList.unshift(newDeadline);
          persistLocal(localList);
        }
      } catch (e) {
        setDeadlines((prev) => prev.filter((d) => d.id !== id));
        const msg = getErrorMessage(e);
        setSyncError(`Failed to create deadline: ${msg}`);
        throw e;
      } finally {
        removePending(id);
      }
    },
    [user, isOfflineMode, addPending, removePending, fetchFromLocal, persistLocal]
  );

  // ── updateDeadline ────────────────────────────────────────────────────────
  const updateDeadline = useCallback(
    async (id: string, title: string, dueDate: string, completed: boolean) => {
      const prev = deadlines.find((d) => d.id === id);

      // Optimistic update
      setDeadlines((prevList) =>
        prevList.map((d) => (d.id === id ? { ...d, title, due_date: dueDate, completed } : d))
      );
      addPending(id);

      try {
        if (!isOfflineMode && user && user !== "guest") {
          const client = getSupabaseClient();
          const { error } = await client
            .from("deadlines")
            .update({ title, due_date: dueDate, completed })
            .eq("id", id);
          if (error) throw error;
        } else {
          const localList = fetchFromLocal();
          const updated = localList.map((d) =>
            d.id === id ? { ...d, title, due_date: dueDate, completed } : d
          );
          persistLocal(updated);
        }
      } catch (e) {
        if (prev) setDeadlines((prevList) => prevList.map((d) => (d.id === id ? prev : d)));
        const msg = getErrorMessage(e);
        setSyncError(`Failed to update deadline: ${msg}`);
        throw e;
      } finally {
        removePending(id);
      }
    },
    [deadlines, user, isOfflineMode, addPending, removePending, fetchFromLocal, persistLocal]
  );

  // ── deleteDeadline ────────────────────────────────────────────────────────
  const deleteDeadline = useCallback(
    async (id: string) => {
      const prev = deadlines.find((d) => d.id === id);
      addPending(id);
      setDeadlines((prevList) => prevList.filter((d) => d.id !== id));

      try {
        if (!isOfflineMode && user && user !== "guest") {
          const client = getSupabaseClient();
          const { data, error } = await client.from("deadlines").delete().eq("id", id).select();
          if (error) throw error;
          if (!data || data.length === 0) {
            throw new Error("Delete blocked by Row Level Security (RLS). Please ensure you have a DELETE policy configured for the 'deadlines' table.");
          }
        } else {
          const localList = fetchFromLocal();
          const filtered = localList.filter((d) => d.id !== id);
          persistLocal(filtered);
        }
      } catch (e) {
        if (prev) setDeadlines((prevList) => [prev, ...prevList]);
        const msg = getErrorMessage(e);
        setSyncError(`Failed to delete deadline: ${msg}`);
        throw e;
      } finally {
        removePending(id);
      }
    },
    [deadlines, user, isOfflineMode, addPending, removePending, fetchFromLocal, persistLocal]
  );

  // ── toggleDeadlineCompletion ──────────────────────────────────────────────
  const toggleDeadlineCompletion = useCallback(
    async (id: string) => {
      const target = deadlines.find((d) => d.id === id);
      if (!target) return;
      await updateDeadline(id, target.title, target.due_date, !target.completed);
    },
    [deadlines, updateDeadline]
  );

  return (
    <DeadlineStoreContext.Provider
      value={{
        deadlines,
        loading,
        pendingDeadlineIds,
        syncError,
        clearSyncError,
        addDeadline,
        updateDeadline,
        deleteDeadline,
        toggleDeadlineCompletion,
        refreshDeadlines: fetchData,
      }}
    >
      {children}
    </DeadlineStoreContext.Provider>
  );
};

export const useDeadlinesStore = () => {
  const context = useContext(DeadlineStoreContext);
  if (context === undefined) {
    throw new Error("useDeadlinesStore must be used within a DeadlineStoreProvider");
  }
  return context;
};
