import { createServerClient } from '@supabase/ssr';
import { getCookies, setCookie } from '@tanstack/react-start/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@lib/types/supabase';
import type { SupabaseCookie } from '@lib/types/cookie';

export const supabase: SupabaseClient<Database> = createServerClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
  {
    cookies: {
      getAll(): Array<SupabaseCookie> {
        return Object.entries(getCookies()).map(
          ([name, value]: Array<string>): SupabaseCookie => ({
            name,
            value,
          })
        );
      },
      setAll(cookies: Array<SupabaseCookie>): void {
        for (const cookie of cookies) {
          setCookie(cookie.name, cookie.value);
        }
      },
    },
  }
);
