import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@lib/query-keys';
import { getRealtimeConfigFunc } from '@lib/server-functions/realtime';
import { getRealtimeClient } from '@lib/utils/supabase-browser';
import { getClientId } from '@lib/utils/client-id';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@lib/types/supabase';

// Shape of the payload broadcast_change() sends (see the realtime migrations).
export type BroadcastPayload = {
  table: string;
  schema: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  record: Record<string, unknown> | null;
  old_record: Record<string, unknown> | null;
  // Id of the tab whose request caused the change, or null when the write did
  // not come through PostgREST (direct SQL, the SQL editor).
  originator: string | null;
};

// Token TTL is 1h; refresh well before that and re-auth the socket so private
// channels keep receiving.
const TOKEN_REFRESH_MS = 45 * 60 * 1000;

export function useRealtimeClient(): SupabaseClient<Database> | null {
  const configQuery = useQuery({
    queryKey: queryKeys.realtimeConfig,
    queryFn: () => getRealtimeConfigFunc(),
    refetchInterval: TOKEN_REFRESH_MS,
    refetchOnWindowFocus: false,
    staleTime: TOKEN_REFRESH_MS
  });
  const config = configQuery.data;

  const client = useMemo((): SupabaseClient<Database> | null => {
    if (config?.token == null) return null;

    return getRealtimeClient(config.url, config.anonKey);
  }, [config?.url, config?.anonKey, config?.token]);

  useEffect((): void => {
    if (client != null && config?.token != null) {
      client.realtime.setAuth(config.token);
    }
  }, [client, config?.token]);

  return client;
}

// Subscribe to a private topic and run onMessage for each broadcast. Cleans up
// the channel on unmount / dependency change. Kept generic so board and
// workspace hooks share the wiring.
//
// Self-originated broadcasts are dropped here rather than in the per-feature
// hooks: the mutation that caused them already invalidated the affected queries
// on success, so reacting to the echo would only buy a second identical
// refetch. Other clients see no `originator` match and refresh as usual.
export function useBroadcastChannel(
  topic: string | null,
  onMessage: (payload: BroadcastPayload) => void
): void {
  const client = useRealtimeClient();

  useEffect((): (() => void) | void => {
    if (client == null || topic == null) return;

    const channel = client
      .channel(topic, { config: { private: true } })
      .on(
        'broadcast',
        { event: 'db_change' },
        (message: { payload: BroadcastPayload }): void => {
          if (message.payload.originator === getClientId()) return;

          onMessage(message.payload);
        }
      )
      .subscribe();

    return (): void => {
      void client.removeChannel(channel);
    };
    // onMessage is recreated each render; callers wrap it in useCallback so the
    // subscription is stable across renders.
  }, [client, topic, onMessage]);
}
