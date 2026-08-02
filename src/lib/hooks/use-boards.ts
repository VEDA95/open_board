import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@lib/query-keys';
import {
  createBoardFunc,
  deleteBoardFunc,
  updateBoardFunc
} from '@lib/server-functions/boards';
import type { UseMutationResult } from '@tanstack/react-query';
import type { Board } from '@lib/server-functions/boards';

type CreateBoardInput = Parameters<typeof createBoardFunc>[0];
type UpdateBoardInput = Parameters<typeof updateBoardFunc>[0];
type DeleteBoardInput = Parameters<typeof deleteBoardFunc>[0];

export function useCreateBoard(workspaceId: string): UseMutationResult<Board, Error, CreateBoardInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBoardFunc,
    onSuccess: (): void => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace(workspaceId) });
    }
  });
}

export function useUpdateBoard(workspaceId: string): UseMutationResult<Board, Error, UpdateBoardInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBoardFunc,
    onSuccess: (board: Board): void => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace(workspaceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.board(board.id) });
    }
  });
}

export function useDeleteBoard(workspaceId: string): UseMutationResult<void, Error, DeleteBoardInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBoardFunc,
    onSuccess: (): void => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace(workspaceId) });
    }
  });
}
