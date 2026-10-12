import { createServerClient } from '@supabase/ssr';
import { getCookies, getRequestHeader, setCookie } from '@tanstack/react-start/server';
import { CLIENT_ID_HEADER } from '@lib/utils/client-id';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@lib/types/supabase';
import type { SupabaseCookie } from '@lib/types/cookie';

// Per-request factory: a module-scope client would cache auth state across
// concurrent requests and leak sessions between users.
export function getSupabaseServerClient(): SupabaseClient<Database> {
  // Relay the calling tab's id (set by clientIdMiddleware) through to PostgREST,
  // which exposes request headers to SQL as the `request.headers` setting. The
  // broadcast_change() trigger reads it from there and tags each broadcast with
  // its originator, letting that tab skip its own echo. Absent on SSR document
  // requests and direct SQL — then the broadcast has no originator and every
  // client reacts, which is the safe default.
  const clientId = getRequestHeader(CLIENT_ID_HEADER);

  return createServerClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      global: clientId != null ? { headers: { [CLIENT_ID_HEADER]: clientId } } : undefined,
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
}
