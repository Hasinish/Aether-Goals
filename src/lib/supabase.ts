import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const isSupabaseConfigured = (): boolean => {
  return (
    typeof window !== "undefined" &&
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error("Missing Supabase environment variable: NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!key) {
    throw new Error("Missing Supabase environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(url, key);
  }
  
  return supabaseInstance;
};
