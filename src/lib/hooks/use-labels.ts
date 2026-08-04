import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@lib/query-keys';
import {
  createLabelFunc,
  deleteLabelFunc,
  getLabelsFunc,
  updateLabelFunc
} from '@lib/server-functions/labels';
import { getProfilesFunc } from '@lib/server-functions/profiles';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import type { Label } from '@lib/server-functions/labels';
import type { Profile } from '@lib/server-functions/profiles';

export const labelsQueryOptions = (boardId: string) =>
  queryOptions({
    queryKey: queryKeys.labels(boardId),
    queryFn: () => getLabelsFunc({ data: { boardId } })
  });

export const profilesQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.profiles,
    queryFn: () => getProfilesFunc()
  });

export function useLabels(boardId: string): UseQueryResult<Array<Label>> {
  return useQuery(labelsQueryOptions(boardId));
}

export function useProfiles(): UseQueryResult<Array<Profile>> {
  return useQuery(profilesQueryOptions());
}

type CreateLabelInput = Parameters<typeof createLabelFunc>[0];
type UpdateLabelInput = Parameters<typeof updateLabelFunc>[0];
type DeleteLabelInput = Parameters<typeof deleteLabelFunc>[0];

export function useLabelMutations(boardId: string): {
  createLabel: UseMutationResult<Label, Error, CreateLabelInput>;
  updateLabel: UseMutationResult<Label, Error, UpdateLabelInput>;
  deleteLabel: UseMutationResult<void, Error, DeleteLabelInput>;
} {
  const queryClient = useQueryClient();
  // Deleting/updating a label changes how card faces render, so refresh the
  // board too — not just the label list.
  const invalidate = (): void => {
    queryClient.invalidateQueries({ queryKey: queryKeys.labels(boardId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
  };
  const onError = (error: Error): void => {
    toast.error(error.message);
  };

  return {
    createLabel: useMutation({ mutationFn: createLabelFunc, onSuccess: invalidate, onError }),
    updateLabel: useMutation({ mutationFn: updateLabelFunc, onSuccess: invalidate, onError }),
    deleteLabel: useMutation({ mutationFn: deleteLabelFunc, onSuccess: invalidate, onError })
  };
}
