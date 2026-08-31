import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@lib/query-keys';
import {
  addBoardAccessFunc,
  addWorkspaceAccessFunc,
  getBoardAccessFunc,
  getWorkspaceAccessFunc,
  removeBoardAccessFunc,
  removeWorkspaceAccessFunc
} from '@lib/server-functions/sharing';
import type { UseQueryResult } from '@tanstack/react-query';
import type { ResourceAccess } from '@lib/server-functions/sharing';

const onError = (error: Error): void => {
  toast.error(error.message);
};

const workspaceAccessKey = (workspaceId: string) => ['workspace-access', workspaceId] as const;
const boardAccessKey = (boardId: string) => ['board-access', boardId] as const;

export const workspaceAccessQueryOptions = (workspaceId: string) =>
  queryOptions({
    queryKey: workspaceAccessKey(workspaceId),
    queryFn: () => getWorkspaceAccessFunc({ data: { workspaceId } })
  });

export function useWorkspaceAccess(workspaceId: string, enabled: boolean): UseQueryResult<ResourceAccess> {
  return useQuery({ ...workspaceAccessQueryOptions(workspaceId), enabled });
}

export function useWorkspaceAccessMutations(workspaceId: string) {
  const queryClient = useQueryClient();
  const invalidate = (): void => {
    queryClient.invalidateQueries({ queryKey: workspaceAccessKey(workspaceId) });
    // Access changes affect what the workspace shows to others.
    queryClient.invalidateQueries({ queryKey: queryKeys.workspace(workspaceId) });
  };

  return {
    add: useMutation({ mutationFn: addWorkspaceAccessFunc, onSuccess: invalidate, onError }),
    remove: useMutation({ mutationFn: removeWorkspaceAccessFunc, onSuccess: invalidate, onError })
  };
}

export const boardAccessQueryOptions = (boardId: string) =>
  queryOptions({
    queryKey: boardAccessKey(boardId),
    queryFn: () => getBoardAccessFunc({ data: { boardId } })
  });

export function useBoardAccess(boardId: string, enabled: boolean): UseQueryResult<ResourceAccess> {
  return useQuery({ ...boardAccessQueryOptions(boardId), enabled });
}

export function useBoardAccessMutations(boardId: string) {
  const queryClient = useQueryClient();
  const invalidate = (): void => {
    queryClient.invalidateQueries({ queryKey: boardAccessKey(boardId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
  };

  return {
    add: useMutation({ mutationFn: addBoardAccessFunc, onSuccess: invalidate, onError }),
    remove: useMutation({ mutationFn: removeBoardAccessFunc, onSuccess: invalidate, onError })
  };
}
