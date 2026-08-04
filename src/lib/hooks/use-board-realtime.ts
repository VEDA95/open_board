import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@lib/query-keys';
import { useBroadcastChannel } from '@lib/hooks/use-realtime';
import type { BroadcastPayload } from '@lib/hooks/use-realtime';

// Live updates for a board. Every broadcast on board:{id} refreshes the board
// payload; changes that also affect an open card modal or the label list
// invalidate those queries too. Our own mutations echo back here and cause at
// most one extra (deduped) refetch — no optimistic patching from payloads.
export function useBoardRealtime(boardId: string): void {
  const queryClient = useQueryClient();

  const onMessage = useCallback(
    (payload: BroadcastPayload): void => {
      queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });

      const row = payload.record ?? payload.old_record;

      if (payload.table === 'cards') {
        const cardId = row?.id;

        if (typeof cardId === 'string') {
          queryClient.invalidateQueries({ queryKey: queryKeys.card(cardId) });
        }
      } else if (
        payload.table === 'card_labels' ||
        payload.table === 'check_list_items' ||
        payload.table === 'comments'
      ) {
        const cardId = row?.card;

        if (typeof cardId === 'string') {
          queryClient.invalidateQueries({ queryKey: queryKeys.card(cardId) });
        }
      }

      if (payload.table === 'labels' || payload.table === 'card_labels') {
        queryClient.invalidateQueries({ queryKey: queryKeys.labels(boardId) });
      }
    },
    [queryClient, boardId]
  );

  useBroadcastChannel(`board:${boardId}`, onMessage);
}
