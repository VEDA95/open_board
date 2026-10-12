import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@lib/query-keys';
import { useBroadcastChannel } from '@lib/hooks/use-realtime';
import type { QueryKey } from '@tanstack/react-query';
import type { BroadcastPayload } from '@lib/hooks/use-realtime';

// How long to let broadcasts accumulate before invalidating. One user action
// can emit many rows in a single transaction — a position rebalance rewrites
// every card in a list, and each row is its own broadcast — and invalidating
// per row costs a board refetch each. Coalescing the burst into one flush
// collapses that to a single refetch while staying imperceptible.
const COALESCE_MS = 150;

// Live updates for a board. Every broadcast on board:{id} refreshes the board
// payload; changes that also affect an open card modal or the label list
// invalidate those queries too. No optimistic patching from payloads — this
// only invalidates, and useBroadcastChannel has already dropped the echoes of
// this tab's own mutations, so what arrives here is another client's work.
export function useBoardRealtime(boardId: string): void {
  const queryClient = useQueryClient();
  // Keys are deduped by their serialized form, so a burst touching the same
  // card twenty times still yields one invalidation for it.
  const pendingRef = useRef(new Map<string, QueryKey>());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback((): void => {
    timerRef.current = null;

    const keys = Array.from(pendingRef.current.values());
    pendingRef.current.clear();

    for (const queryKey of keys) {
      queryClient.invalidateQueries({ queryKey });
    }
  }, [queryClient]);

  const onMessage = useCallback(
    (payload: BroadcastPayload): void => {
      const enqueue = (queryKey: QueryKey): void => {
        pendingRef.current.set(JSON.stringify(queryKey), queryKey);
      };

      enqueue(queryKeys.board(boardId));

      const row = payload.record ?? payload.old_record;

      if (payload.table === 'cards') {
        const cardId = row?.id;

        if (typeof cardId === 'string') enqueue(queryKeys.card(cardId));
      } else if (
        payload.table === 'card_labels' ||
        payload.table === 'check_list_items' ||
        payload.table === 'comments'
      ) {
        const cardId = row?.card;

        if (typeof cardId === 'string') enqueue(queryKeys.card(cardId));
      }

      if (payload.table === 'labels' || payload.table === 'card_labels') {
        enqueue(queryKeys.labels(boardId));
      }

      // Trailing-edge only: the first broadcast of a burst starts the window and
      // later ones join it rather than extending it, so a long stream of changes
      // still refreshes every COALESCE_MS instead of being starved.
      if (timerRef.current == null) {
        timerRef.current = setTimeout(flush, COALESCE_MS);
      }
    },
    [boardId, flush]
  );

  useEffect((): (() => void) => {
    return (): void => {
      if (timerRef.current != null) clearTimeout(timerRef.current);
    };
  }, []);

  useBroadcastChannel(`board:${boardId}`, onMessage);
}
