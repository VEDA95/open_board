import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@lib/query-keys';
import { getBoardFunc } from '@lib/server-functions/boards';
import {
  createListFunc,
  deleteListFunc,
  moveListFunc,
  updateListFunc
} from '@lib/server-functions/lists';
import {
  createCardFunc,
  deleteCardFunc,
  getArchivedCardsFunc,
  moveCardFunc,
  renameCardFunc,
  setCardActiveFunc
} from '@lib/server-functions/cards';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import type { BoardCard, BoardDetail } from '@lib/server-functions/boards';
import type { List } from '@lib/server-functions/lists';
import type { Card } from '@lib/server-functions/cards';

export const boardQueryOptions = (boardId: string) =>
  queryOptions({
    queryKey: queryKeys.board(boardId),
    queryFn: () => getBoardFunc({ data: { boardId } })
  });

export const archivedCardsQueryOptions = (boardId: string) =>
  queryOptions({
    queryKey: [...queryKeys.board(boardId), 'archived'],
    queryFn: () => getArchivedCardsFunc({ data: { boardId } })
  });

export function useBoard(boardId: string): UseQueryResult<BoardDetail> {
  return useQuery(boardQueryOptions(boardId));
}

type MoveCardInput = { cardId: string; listId: string; position: number };
type MoveListInput = { listId: string; position: number };

// Mutations patch the cached board payload with the row the server returned
// rather than refetching it. getBoardFunc costs 6-7 upstream Supabase calls and
// re-downloads every card on the board with its labels, which is a lot of work
// to learn about one new row we were just handed.
//
// This is exact rather than optimistic: `.insert()/.update().select()` returns
// the row as the database has it (post-trigger, with server-computed positions),
// and the only triggers on cards/lists are AFTER broadcast triggers that return
// NULL and touch no sibling rows. The one thing the board payload adds is
// derived data — `labels` and `assigneeProfile` — which each patch below
// supplies or preserves explicitly.
//
// Unarchiving is the exception and still invalidates: it returns a bare Card,
// and restoring it to the board needs the labels/assignee the payload resolves.
//
// Other clients' changes arrive via realtime broadcasts, which is what that
// subscription is for — these patches only need to cover our own writes.
export function useBoardMutations(boardId: string): {
  moveCard: (input: MoveCardInput) => void;
  moveList: (input: MoveListInput) => void;
  isMovePending: boolean;
  createList: UseMutationResult<unknown, Error, Parameters<typeof createListFunc>[0]>;
  renameList: UseMutationResult<unknown, Error, Parameters<typeof updateListFunc>[0]>;
  deleteList: UseMutationResult<unknown, Error, Parameters<typeof deleteListFunc>[0]>;
  createCard: UseMutationResult<unknown, Error, Parameters<typeof createCardFunc>[0]>;
  renameCard: UseMutationResult<unknown, Error, Parameters<typeof renameCardFunc>[0]>;
  setCardActive: UseMutationResult<unknown, Error, Parameters<typeof setCardActiveFunc>[0]>;
  deleteCard: UseMutationResult<unknown, Error, Parameters<typeof deleteCardFunc>[0]>;
} {
  const queryClient = useQueryClient();
  const boardKey = queryKeys.board(boardId);
  const archivedKey = [...boardKey, 'archived'];
  // Prefix match, so this also covers the archived list at [...boardKey,
  // 'archived'] — no separate invalidation needed for archive/delete.
  const invalidateBoard = (): void => {
    queryClient.invalidateQueries({ queryKey: boardKey });
  };
  // Archiving/deleting changes the archived drawer's separate query. It is
  // `enabled: open`, so while the drawer is closed this has no observer and
  // costs nothing; invalidating beats deriving its joined `lists.name` shape.
  const invalidateArchived = (): void => {
    queryClient.invalidateQueries({ queryKey: archivedKey });
  };
  const onMutationError = (error: Error): void => {
    toast.error(error.message);
  };
  // All board patches funnel through here so the undefined-cache case (the
  // board was never loaded, or got evicted) is handled in exactly one place.
  const patchBoard = (patch: (current: BoardDetail) => BoardDetail): void => {
    queryClient.setQueryData(boardKey, (current: BoardDetail | undefined): BoardDetail | undefined =>
      current == null ? current : patch(current)
    );
  };

  const moveCardMutation = useMutation({
    mutationFn: moveCardFunc,
    // Patch the cache to match the just-dropped arrangement, but do NOT refetch
    // on success: BoardCanvas already shows the new order from its own state, so
    // the only job here is keeping the cache in sync (so its reconcile stays a
    // no-op). A success refetch would briefly return pre-commit data and flicker.
    onMutate: ({ data }): void => {
      void queryClient.cancelQueries({ queryKey: boardKey });
      queryClient.setQueryData(boardKey, (current: BoardDetail | undefined): BoardDetail | undefined => {
        if (current == null) return current;

        return {
          ...current,
          cards: current.cards.map((card): BoardCard =>
            card.id === data.cardId
              ? { ...card, list: data.listId, position: data.position }
              : card
          )
        };
      });
    },
    onError: (error: Error): void => {
      toast.error(error.message);
      invalidateBoard();
    }
  });

  const moveListMutation = useMutation({
    mutationFn: moveListFunc,
    onMutate: ({ data }): void => {
      void queryClient.cancelQueries({ queryKey: boardKey });
      queryClient.setQueryData(boardKey, (current: BoardDetail | undefined): BoardDetail | undefined => {
        if (current == null) return current;

        return {
          ...current,
          lists: current.lists
            .map((list) =>
              list.id === data.listId ? { ...list, position: data.position } : list
            )
            .sort((a, b): number => a.position - b.position)
        };
      });
    },
    onError: (error: Error): void => {
      toast.error(error.message);
      invalidateBoard();
    }
  });

  const createList = useMutation({
    mutationFn: createListFunc,
    // Server appends at max(position) + INITIAL_SPACING, so this lands last —
    // but sort rather than push, so the cache matches what a refetch returns.
    onSuccess: (list: List): void => {
      patchBoard((current): BoardDetail => ({
        ...current,
        lists: [...current.lists, list].sort((a, b): number => a.position - b.position)
      }));
    },
    onError: onMutationError
  });
  const renameList = useMutation({
    mutationFn: updateListFunc,
    onSuccess: (list: List): void => {
      patchBoard((current): BoardDetail => ({
        ...current,
        lists: current.lists.map((existing): List => existing.id === list.id ? list : existing)
      }));
    },
    onError: onMutationError
  });
  const deleteList = useMutation({
    mutationFn: deleteListFunc,
    // Returns void, so key off the variables. Cards cascade in the database;
    // drop them here too or they'd linger as orphans in the cache.
    onSuccess: (_result: void, variables): void => {
      const { listId } = variables.data;

      patchBoard((current): BoardDetail => ({
        ...current,
        lists: current.lists.filter((list): boolean => list.id !== listId),
        cards: current.cards.filter((card): boolean => card.list !== listId)
      }));
      invalidateArchived();
    },
    onError: onMutationError
  });
  const createCard = useMutation({
    mutationFn: createCardFunc,
    // createCardValidator takes only listId + name, so a new card provably has
    // no labels and no assignee — the derived fields are known, not guessed.
    onSuccess: (card: Card): void => {
      patchBoard((current): BoardDetail => ({
        ...current,
        cards: [...current.cards, { ...card, labels: [], assigneeProfile: null }]
      }));
    },
    onError: onMutationError
  });
  const renameCard = useMutation({
    mutationFn: renameCardFunc,
    // Spreading the returned Card over the cached BoardCard overwrites every
    // column while leaving the derived labels/assigneeProfile intact.
    onSuccess: (card: Card): void => {
      patchBoard((current): BoardDetail => ({
        ...current,
        cards: current.cards.map((existing): BoardCard =>
          existing.id === card.id ? { ...existing, ...card } : existing
        )
      }));
    },
    onError: onMutationError
  });
  const setCardActive = useMutation({
    mutationFn: setCardActiveFunc,
    onSuccess: (card: Card): void => {
      if (card.is_active) {
        // Unarchiving: the returned Card has no labels/assigneeProfile, and the
        // board face needs both, so this is the one case worth a refetch. The
        // prefix match covers the archived list too.
        invalidateBoard();
        return;
      }

      patchBoard((current): BoardDetail => ({
        ...current,
        cards: current.cards.filter((existing): boolean => existing.id !== card.id)
      }));
      invalidateArchived();
    },
    onError: onMutationError
  });
  const deleteCard = useMutation({
    mutationFn: deleteCardFunc,
    onSuccess: (_result: void, variables): void => {
      const { cardId } = variables.data;

      patchBoard((current): BoardDetail => ({
        ...current,
        cards: current.cards.filter((card): boolean => card.id !== cardId)
      }));
      invalidateArchived();
    },
    onError: onMutationError
  });

  return {
    moveCard: (input: MoveCardInput): void => moveCardMutation.mutate({ data: input }),
    moveList: (input: MoveListInput): void => moveListMutation.mutate({ data: input }),
    // BoardCanvas suspends its server-data reconcile while a move is in flight,
    // so an unrelated refetch landing mid-move can't reset the arrangement.
    isMovePending: moveCardMutation.isPending || moveListMutation.isPending,
    createList,
    renameList,
    deleteList,
    createCard,
    renameCard,
    setCardActive,
    deleteCard
  };
}
