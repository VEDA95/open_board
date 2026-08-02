import { useState } from 'react';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { toast } from 'sonner';
import { HugeiconsIcon } from '@hugeicons/react';
import { Archive02Icon, MoreHorizontalIcon } from '@hugeicons/core-free-icons';
import { boardQueryOptions, useBoard } from '@lib/hooks/use-board';
import { useDeleteBoard } from '@lib/hooks/use-boards';
import { BoardCanvas } from '@components/board/board-canvas';
import { BoardFormDialog } from '@components/board/board-form-dialog';
import { ArchivedCardsSheet } from '@components/board/archived-cards-sheet';
import { ConfirmDialog } from '@components/layout/confirm-dialog';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import { Skeleton } from '@components/ui/skeleton';
import type { FC, ReactElement } from 'react';

function BoardPage(): ReactElement<FC> {
  const { workspaceId, boardId } = Route.useParams();
  const router = useRouter();
  const boardQuery = useBoard(boardId);
  const deleteMutation = useDeleteBoard(workspaceId);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [archivedOpen, setArchivedOpen] = useState(false);

  if (boardQuery.isPending) {
    return (
      <div className="flex flex-1 gap-4 p-4 md:p-6">
        <Skeleton className="h-64 w-72" />
        <Skeleton className="h-64 w-72" />
        <Skeleton className="h-64 w-72" />
      </div>
    );
  }

  if (!boardQuery.isSuccess) {
    return (
      <div className="text-muted-foreground flex-1 p-4 text-sm md:p-6">
        This board could not be loaded.
      </div>
    );
  }

  const { board, lists, cards } = boardQuery.data;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-4 border-b px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="truncate text-lg font-semibold">{board.name}</h1>
          <Badge variant={board.is_public ? 'secondary' : 'outline'}>
            {board.is_public ? 'Public' : 'Private'}
          </Badge>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" onClick={(): void => setArchivedOpen(true)}>
            <HugeiconsIcon icon={Archive02Icon} strokeWidth={2} className="size-4" />
            Archived
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
              <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={(): void => setEditOpen(true)}>
                Edit board
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={(): void => setDeleteOpen(true)}
              >
                Delete board
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <BoardCanvas boardId={boardId} lists={lists} cards={cards} />
      <BoardFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        workspaceId={workspaceId}
        board={board}
      />
      <ArchivedCardsSheet boardId={boardId} open={archivedOpen} onOpenChange={setArchivedOpen} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete board?"
        description={`"${board.name}" and all of its lists and cards will be permanently deleted.`}
        pending={deleteMutation.isPending}
        onConfirm={(): void => {
          deleteMutation.mutate(
            { data: { boardId } },
            {
              onSuccess: (): void => {
                toast.success('Board deleted');
                router.navigate({ to: '/workspaces/$workspaceId', params: { workspaceId } });
              },
              onError: (error: Error): void => {
                toast.error(error.message);
              }
            }
          );
        }}
      />
    </div>
  );
}

export const Route = createFileRoute('/_app/workspaces/$workspaceId/boards/$boardId/')({
  loader: async ({ context, params }): Promise<void> => {
    await context.queryClient.ensureQueryData(boardQueryOptions(params.boardId));
  },
  component: BoardPage
});
