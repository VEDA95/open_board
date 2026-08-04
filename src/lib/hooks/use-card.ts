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
import {
  addCommentFunc,
  deleteCommentFunc,
  updateCommentFunc
} from '@lib/server-functions/comments';
import {
  deleteCardAttachmentFunc,
  deleteCommentAttachmentFunc,
  uploadCardAttachmentFunc,
  uploadCommentAttachmentFunc
} from '@lib/server-functions/attachments';
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
  addComment: (comment: string) => void;
  updateComment: (commentId: string, comment: string) => void;
  deleteComment: (commentId: string) => void;
  uploadAttachment: (file: File) => void;
  deleteAttachment: (file: string) => void;
  uploadCommentAttachment: (commentId: string, file: File) => void;
  deleteCommentAttachment: (commentId: string, file: string) => void;
  isSavingLabel: boolean;
  isSavingChecklist: boolean;
  isSavingComment: boolean;
  isUploading: boolean;
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
  const addComment = useMutation({ mutationFn: addCommentFunc, onSuccess: invalidate, onError });
  const updateComment = useMutation({ mutationFn: updateCommentFunc, onSuccess: invalidate, onError });
  const deleteComment = useMutation({ mutationFn: deleteCommentFunc, onSuccess: invalidate, onError });
  const uploadAttachment = useMutation({
    mutationFn: uploadCardAttachmentFunc,
    onSuccess: invalidate,
    onError
  });
  const deleteAttachment = useMutation({
    mutationFn: deleteCardAttachmentFunc,
    onSuccess: invalidate,
    onError
  });
  const uploadCommentAttachment = useMutation({
    mutationFn: uploadCommentAttachmentFunc,
    onSuccess: invalidate,
    onError
  });
  const deleteCommentAttachment = useMutation({
    mutationFn: deleteCommentAttachmentFunc,
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
    addComment: (comment: string): void => addComment.mutate({ data: { cardId, comment } }),
    updateComment: (commentId: string, comment: string): void =>
      updateComment.mutate({ data: { commentId, comment } }),
    deleteComment: (commentId: string): void => deleteComment.mutate({ data: { commentId } }),
    uploadAttachment: (file: File): void => {
      const formData = new FormData();
      formData.append('cardId', cardId);
      formData.append('file', file);
      uploadAttachment.mutate({ data: formData });
    },
    deleteAttachment: (file: string): void => deleteAttachment.mutate({ data: { cardId, file } }),
    uploadCommentAttachment: (commentId: string, file: File): void => {
      const formData = new FormData();
      formData.append('commentId', commentId);
      formData.append('file', file);
      uploadCommentAttachment.mutate({ data: formData });
    },
    deleteCommentAttachment: (commentId: string, file: string): void =>
      deleteCommentAttachment.mutate({ data: { cardId, commentId, file } }),
    isSavingLabel: addLabel.isPending || removeLabel.isPending,
    isSavingChecklist:
      addChecklistItem.isPending ||
      toggleChecklistItem.isPending ||
      renameChecklistItem.isPending ||
      deleteChecklistItem.isPending,
    isSavingComment: addComment.isPending || updateComment.isPending || deleteComment.isPending,
    isUploading: uploadAttachment.isPending || uploadCommentAttachment.isPending
  };
}
