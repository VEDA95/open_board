import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@lib/query-keys';
import {
  getCardFunc,
  setCardAssigneeFunc,
  updateCardDetailsFunc
} from '@lib/server-functions/cards';
import {
  createChecklistItemFunc,
  deleteChecklistItemFunc,
  renameChecklistItemFunc,
  toggleChecklistItemFunc
} from '@lib/server-functions/checklists';
import { addCardLabelFunc, removeCardLabelFunc } from '@lib/server-functions/labels';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import type { Card, CardDetail } from '@lib/server-functions/cards';

export const cardQueryOptions = (cardId: string) =>
  queryOptions({
    queryKey: queryKeys.card(cardId),
    queryFn: () => getCardFunc({ data: { cardId } })
  });

export function useCard(cardId: string): UseQueryResult<CardDetail> {
  return useQuery(cardQueryOptions(cardId));
}

type UpdateDetailsInput = Parameters<typeof updateCardDetailsFunc>[0];
type SetAssigneeInput = Parameters<typeof setCardAssigneeFunc>[0];

// Every card mutation invalidates both the card detail (['card', id]) and the
// board (so the card face reflects labels/assignee/due date). The boardId comes
// from the caller since the card query doesn't carry it.
export function useCardMutations(cardId: string, boardId: string): {
  updateDetails: UseMutationResult<Card, Error, UpdateDetailsInput>;
  setAssignee: UseMutationResult<Card, Error, SetAssigneeInput>;
  addLabel: (labelId: string) => void;
  removeLabel: (labelId: string) => void;
  addChecklistItem: (name: string) => void;
  toggleChecklistItem: (itemId: string, isChecked: boolean) => void;
  renameChecklistItem: (itemId: string, name: string) => void;
  deleteChecklistItem: (itemId: string) => void;
  isSavingLabel: boolean;
  isSavingChecklist: boolean;
} {
  const queryClient = useQueryClient();
  const invalidate = (): void => {
    queryClient.invalidateQueries({ queryKey: queryKeys.card(cardId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
  };
  const onError = (error: Error): void => {
    toast.error(error.message);
  };

  const updateDetails = useMutation({
    mutationFn: updateCardDetailsFunc,
    onSuccess: invalidate,
    onError
  });
  const setAssignee = useMutation({
    mutationFn: setCardAssigneeFunc,
    onSuccess: invalidate,
    onError
  });
  const addLabel = useMutation({
    mutationFn: addCardLabelFunc,
    onSuccess: invalidate,
    onError
  });
  const removeLabel = useMutation({
    mutationFn: removeCardLabelFunc,
    onSuccess: invalidate,
    onError
  });
  const addChecklistItem = useMutation({
    mutationFn: createChecklistItemFunc,
    onSuccess: invalidate,
    onError
  });
  const toggleChecklistItem = useMutation({
    mutationFn: toggleChecklistItemFunc,
    onSuccess: invalidate,
    onError
  });
  const renameChecklistItem = useMutation({
    mutationFn: renameChecklistItemFunc,
    onSuccess: invalidate,
    onError
  });
  const deleteChecklistItem = useMutation({
    mutationFn: deleteChecklistItemFunc,
    onSuccess: invalidate,
    onError
  });

  return {
    updateDetails,
    setAssignee,
    addLabel: (labelId: string): void => addLabel.mutate({ data: { cardId, labelId } }),
    removeLabel: (labelId: string): void => removeLabel.mutate({ data: { cardId, labelId } }),
    addChecklistItem: (name: string): void => addChecklistItem.mutate({ data: { cardId, name } }),
    toggleChecklistItem: (itemId: string, isChecked: boolean): void =>
      toggleChecklistItem.mutate({ data: { itemId, isChecked } }),
    renameChecklistItem: (itemId: string, name: string): void =>
      renameChecklistItem.mutate({ data: { itemId, name } }),
    deleteChecklistItem: (itemId: string): void => deleteChecklistItem.mutate({ data: { itemId } }),
    isSavingLabel: addLabel.isPending || removeLabel.isPending,
    isSavingChecklist:
      addChecklistItem.isPending ||
      toggleChecklistItem.isPending ||
      renameChecklistItem.isPending ||
      deleteChecklistItem.isPending
  };
}
