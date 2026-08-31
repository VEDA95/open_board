import { useState } from 'react';
import { Outlet, createFileRoute, useRouter } from '@tanstack/react-router';
import { toast } from 'sonner';
import { HugeiconsIcon } from '@hugeicons/react';
import { Archive02Icon, MoreHorizontalIcon, Tag01Icon } from '@hugeicons/core-free-icons';
import { boardQueryOptions, useBoard } from '@lib/hooks/use-board';
import { useDeleteBoard } from '@lib/hooks/use-boards';
import { useBoardRealtime } from '@lib/hooks/use-board-realtime';
import { hasAnyPermission } from '@lib/utils/has-permission';
import { BoardCanvas } from '@components/board/board-canvas';
import { BoardFormDialog } from '@components/board/board-form-dialog';
import { ArchivedCardsSheet } from '@components/board/archived-cards-sheet';
import { LabelManagerDialog } from '@components/board/label-manager-dialog';
import { BoardShareDialog } from '@components/sharing/share-dialogs';
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

function BoardLayout(): ReactElement<FC> {
  const { workspaceId, boardId } = Route.useParams();
  const { user, permissions } = Route.useRouteContext();
  const router = useRouter();
  const boardQuery = useBoard(boardId);
  const deleteMutation = useDeleteBoard(workspaceId);
  useBoardRealtime(boardId);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const board = boardQuery.data?.board ?? null;
  const canManageBoard = board != null && (board.user_id === user?.id || hasAnyPermission(permissions, 'board:manage'));
  // Sharing only matters when the board isn't already reachable by everyone:
  // either the board itself is private, or its workspace is private.
  const canShareBoard = canManageBoard && (!board.is_public || !(boardQuery.data?.workspaceIsPublic ?? false));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {boardQuery.isPending && (
        <div className="flex flex-1 gap-4 p-4 md:p-6">
          <Skeleton className="h-64 w-80" />
          <Skeleton className="h-64 w-80" />
          <Skeleton className="h-64 w-80" />
        </div>
      )}
      {!boardQuery.isPending && board == null && (
        <div className="text-muted-foreground flex-1 p-4 text-sm md:p-6">
          This board could not be loaded.
        </div>
      )}
      {boardQuery.isSuccess && board != null && (
        <>
          <div className="flex items-center justify-between gap-4 border-b px-4 py-3 md:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="truncate text-lg font-semibold">{board.name}</h1>
              <Badge variant={board.is_public ? 'secondary' : 'outline'}>
                {board.is_public ? 'Public' : 'Private'}
              </Badge>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" size="sm" onClick={(): void => setLabelsOpen(true)}>
                <HugeiconsIcon icon={Tag01Icon} strokeWidth={2} className="size-4" />
                Labels
              </Button>
              <Button variant="outline" size="sm" onClick={(): void => setArchivedOpen(true)}>
                <HugeiconsIcon icon={Archive02Icon} strokeWidth={2} className="size-4" />
                Archived
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
                  <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canShareBoard && (
                    <DropdownMenuItem onClick={(): void => setShareOpen(true)}>
                      Share board
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={(): void => setEditOpen(true)}>
                    Edit board
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={(): void => setDeleteOpen(true)}
                  >
                    Delete board
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <BoardCanvas
            workspaceId={workspaceId}
            boardId={boardId}
            lists={boardQuery.data.lists}
            cards={boardQuery.data.cards}
          />
          <BoardFormDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            workspaceId={workspaceId}
            board={board}
          />
          <ArchivedCardsSheet boardId={boardId} open={archivedOpen} onOpenChange={setArchivedOpen} />
          <LabelManagerDialog boardId={boardId} open={labelsOpen} onOpenChange={setLabelsOpen} />
          <BoardShareDialog boardId={boardId} open={shareOpen} onOpenChange={setShareOpen} />
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
        </>
      )}
      {/* Card detail modal renders here as a child route. The Outlet is always
          mounted — never gated behind the board query's loading/error state —
          so navigating to (or deep-linking) a card can't render the modal into
          a parent branch that lacks an Outlet. */}
      <Outlet />
    </div>
  );
}

export const Route = createFileRoute('/_app/workspaces/$workspaceId/boards/$boardId')({
  loader: async ({ context, params }): Promise<void> => {
    await context.queryClient.ensureQueryData(boardQueryOptions(params.boardId));
  },
  component: BoardLayout
});
