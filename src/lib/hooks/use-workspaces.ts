import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@lib/query-keys';
import {
  createWorkspaceFunc,
  deleteWorkspaceFunc,
  getWorkspaceFunc,
  getWorkspacesFunc,
  updateWorkspaceFunc
} from '@lib/server-functions/workspaces';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import type { Workspace, WorkspaceDetail } from '@lib/server-functions/workspaces';

export const workspacesQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.workspaces,
    queryFn: () => getWorkspacesFunc()
  });

export const workspaceQueryOptions = (workspaceId: string) =>
  queryOptions({
    queryKey: queryKeys.workspace(workspaceId),
    queryFn: () => getWorkspaceFunc({ data: { workspaceId } })
  });

export function useWorkspaces(): UseQueryResult<Array<Workspace>> {
  return useQuery(workspacesQueryOptions());
}

export function useWorkspace(workspaceId: string): UseQueryResult<WorkspaceDetail> {
  return useQuery(workspaceQueryOptions(workspaceId));
}

type CreateWorkspaceInput = Parameters<typeof createWorkspaceFunc>[0];
type UpdateWorkspaceInput = Parameters<typeof updateWorkspaceFunc>[0];
type DeleteWorkspaceInput = Parameters<typeof deleteWorkspaceFunc>[0];

export function useCreateWorkspace(): UseMutationResult<Workspace, Error, CreateWorkspaceInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWorkspaceFunc,
    onSuccess: (): void => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
    }
  });
}

export function useUpdateWorkspace(): UseMutationResult<Workspace, Error, UpdateWorkspaceInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateWorkspaceFunc,
    onSuccess: (workspace: Workspace): void => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace(workspace.id) });
    }
  });
}

export function useDeleteWorkspace(): UseMutationResult<void, Error, DeleteWorkspaceInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteWorkspaceFunc,
    onSuccess: (): void => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
    }
  });
}
