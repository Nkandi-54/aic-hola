import { createClient } from "@supabase/supabase-js";

const url = process.env.REACT_APP_SUPABASE_URL;
const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured) {
  throw new Error(
    "Missing Supabase configuration. Define REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in .env."
  );
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,

    // Supabase Passkeys
    experimental: {
      passkey: true,
    },
  },
});