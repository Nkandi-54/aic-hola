import { createClient } from "@supabase/supabase-js";

const url =
  process.env.REACT_APP_SUPABASE_URL ||
  "https://not-configured.invalid";

const anonKey =
  process.env.REACT_APP_SUPABASE_ANON_KEY ||
  "not-configured";

export const isSupabaseConfigured = Boolean(
  process.env.REACT_APP_SUPABASE_URL &&
    process.env.REACT_APP_SUPABASE_ANON_KEY
);

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