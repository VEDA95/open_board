import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@lib/query-keys';
import {
  getBoardMembersFunc,
  getWorkspaceMembersFunc,
  shareBoardFunc,
  shareWorkspaceFunc,
  unshareBoardFunc,
  unshareWorkspaceFunc
} from '@lib/server-functions/sharing';
import type { UseQueryResult } from '@tanstack/react-query';
import type { Member } from '@lib/server-functions/sharing';

const onError = (error: Error): void => {
  toast.error(error.message);
};

export const workspaceMembersQueryOptions = (workspaceId: string) =>
  queryOptions({
    queryKey: queryKeys.workspaceMembers(workspaceId),
    queryFn: () => getWorkspaceMembersFunc({ data: { workspaceId } })
  });

export function useWorkspaceMembers(workspaceId: string, enabled: boolean): UseQueryResult<Array<Member>> {
  return useQuery({ ...workspaceMembersQueryOptions(workspaceId), enabled });
}

export function useWorkspaceSharing(workspaceId: string) {
  const queryClient = useQueryClient();
  const invalidate = (): void => {
    queryClient.invalidateQueries({ queryKey: queryKeys.workspaceMembers(workspaceId) });
  };

  return {
    share: useMutation({
      mutationFn: shareWorkspaceFunc,
      onSuccess: (): void => {
        invalidate();
        toast.success('Access granted');
      },
      onError
    }),
    unshare: useMutation({ mutationFn: unshareWorkspaceFunc, onSuccess: invalidate, onError })
  };
}

export const boardMembersQueryOptions = (boardId: string) =>
  queryOptions({
    queryKey: queryKeys.boardMembers(boardId),
    queryFn: () => getBoardMembersFunc({ data: { boardId } })
  });

export function useBoardMembers(boardId: string, enabled: boolean): UseQueryResult<Array<Member>> {
  return useQuery({ ...boardMembersQueryOptions(boardId), enabled });
}

export function useBoardSharing(boardId: string) {
  const queryClient = useQueryClient();
  const invalidate = (): void => {
    queryClient.invalidateQueries({ queryKey: queryKeys.boardMembers(boardId) });
  };

  return {
    share: useMutation({
      mutationFn: shareBoardFunc,
      onSuccess: (): void => {
        invalidate();
        toast.success('Access granted');
      },
      onError
    }),
    unshare: useMutation({ mutationFn: unshareBoardFunc, onSuccess: invalidate, onError })
  };
}
