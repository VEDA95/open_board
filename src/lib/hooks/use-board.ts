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
import type { BoardDetail } from '@lib/server-functions/boards';
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

// Mutations invalidate the whole board payload on settle; moves additionally
// patch the cache up front so a drop never snaps back while the request runs.
export function useBoardMutations(boardId: string): {
  moveCard: (input: MoveCardInput) => void;
  moveList: (input: MoveListInput) => void;
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
  const invalidateBoard = (): void => {
    queryClient.invalidateQueries({ queryKey: boardKey });
  };
  const onMutationError = (error: Error): void => {
    toast.error(error.message);
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
          cards: current.cards.map((card): Card =>
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
    onSuccess: invalidateBoard,
    onError: onMutationError
  });
  const renameList = useMutation({
    mutationFn: updateListFunc,
    onSuccess: invalidateBoard,
    onError: onMutationError
  });
  const deleteList = useMutation({
    mutationFn: deleteListFunc,
    onSuccess: invalidateBoard,
    onError: onMutationError
  });
  const createCard = useMutation({
    mutationFn: createCardFunc,
    onSuccess: invalidateBoard,
    onError: onMutationError
  });
  const renameCard = useMutation({
    mutationFn: renameCardFunc,
    onSuccess: invalidateBoard,
    onError: onMutationError
  });
  const setCardActive = useMutation({
    mutationFn: setCardActiveFunc,
    onSuccess: (): void => {
      invalidateBoard();
      queryClient.invalidateQueries({ queryKey: [...boardKey, 'archived'] });
    },
    onError: onMutationError
  });
  const deleteCard = useMutation({
    mutationFn: deleteCardFunc,
    onSuccess: (): void => {
      invalidateBoard();
      queryClient.invalidateQueries({ queryKey: [...boardKey, 'archived'] });
    },
    onError: onMutationError
  });

  return {
    moveCard: (input: MoveCardInput): void => moveCardMutation.mutate({ data: input }),
    moveList: (input: MoveListInput): void => moveListMutation.mutate({ data: input }),
    createList,
    renameList,
    deleteList,
    createCard,
    renameCard,
    setCardActive,
    deleteCard
  };
}
