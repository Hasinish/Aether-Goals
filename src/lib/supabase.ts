import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = (): boolean => {
  return (
    typeof window !== "undefined" &&
    supabaseUrl.length > 0 &&
    supabaseAnonKey.length > 0 &&
    supabaseUrl !== "placeholder-url"
  );
};

// Return the client if configured, otherwise null
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
