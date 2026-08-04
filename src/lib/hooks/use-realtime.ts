import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@lib/query-keys';
import { getRealtimeConfigFunc } from '@lib/server-functions/realtime';
import { getRealtimeClient } from '@lib/utils/supabase-browser';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@lib/types/supabase';

// Shape of the payload broadcast_changes sends (see the realtime migration).
export type BroadcastPayload = {
  table: string;
  schema: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  record: Record<string, unknown> | null;
  old_record: Record<string, unknown> | null;
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
        (message: { payload: BroadcastPayload }): void => onMessage(message.payload)
      )
      .subscribe();

    return (): void => {
      void client.removeChannel(channel);
    };
    // onMessage is recreated each render; callers wrap it in useCallback so the
    // subscription is stable across renders.
  }, [client, topic, onMessage]);
}
