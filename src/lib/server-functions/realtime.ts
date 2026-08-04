import { createServerFn } from '@tanstack/react-start';
import { getSupabaseServerClient } from '@lib/utils/supabase';

export type RealtimeConfig = {
  url: string;
  anonKey: string;
  token: string | null;
};

// Hands the browser what it needs to open an authenticated Realtime connection:
// the (public) URL + anon key, plus the caller's own access token for private
// channel authorization. Auth is cookie-based, so the browser can't read the
// JWT itself; this returns it over an authenticated server call instead.
export const getRealtimeConfigFunc = createServerFn({ method: 'GET' })
  .handler(async (): Promise<RealtimeConfig> => {
    const supabase = getSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    return {
      url: process.env.SUPABASE_URL!,
      anonKey: process.env.SUPABASE_ANON_KEY!,
      token: session?.access_token ?? null
    };
  });
