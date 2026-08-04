import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@lib/types/supabase';

// Browser-side Supabase client used ONLY for Realtime subscriptions — the
// "clear reason" the CLAUDE.md guidance allows for a browser client. All data
// reads/writes still go through server functions; this never touches the DB
// directly, only the Realtime websocket. It is a singleton so every board /
// workspace subscription shares one connection.
let client: SupabaseClient<Database> | null = null;

export function getRealtimeClient(url: string, anonKey: string): SupabaseClient<Database> {
  client ??= createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  return client;
}
