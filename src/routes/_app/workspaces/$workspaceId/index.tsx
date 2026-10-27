import { useState } from 'react';
import { Link, createFileRoute, useRouter } from '@tanstack/react-router';
import { toast } from 'sonner';
import { HugeiconsIcon } from '@hugeicons/react';
import { Add01Icon, MoreHorizontalIcon, UserGroupIcon } from '@hugeicons/core-free-icons';
import { useDeleteWorkspace, useWorkspace, workspaceQueryOptions } from '@lib/hooks/use-workspaces';
import { useWorkspaceRealtime } from '@lib/hooks/use-workspace-realtime';
import { hasAnyPermission } from '@lib/utils/has-permission';
import { WorkspaceFormDialog } from '@components/workspace/workspace-form-dialog';
import { BoardFormDialog } from '@components/board/board-form-dialog';
import { WorkspaceShareDialog } from '@components/sharing/share-dialogs';
import { ConfirmDialog } from '@components/layout/confirm-dialog';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
} from '@components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import { Skeleton } from '@components/ui/skeleton';
import type { FC, ReactElement } from 'react';
import type { WorkspaceDetail } from '@lib/server-functions/workspaces';

function WorkspacePage(): ReactElement<FC> {
  const { workspaceId } = Route.useParams();
  const router = useRouter();
  const workspaceQuery = useWorkspace(workspaceId);
  useWorkspaceRealtime(workspaceId);
  const { user, permissions } = Route.useRouteContext();
  const deleteMutation = useDeleteWorkspace();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newBoardOpen, setNewBoardOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  if (workspaceQuery.isPending) {
    return (
      <div className="mx-auto w-full max-w-5xl flex-1 p-4 md:p-6">
        <Skeleton className="mb-6 h-8 w-64" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  if (!workspaceQuery.isSuccess) {
    return (
      <div className="text-muted-foreground mx-auto w-full max-w-5xl flex-1 p-4 text-sm md:p-6">
        This workspace could not be loaded.
      </div>
    );
  }

  const { workspace, boards } = workspaceQuery.data;
  const canManage = workspace.user_id === user?.id || hasAnyPermission(permissions, 'workspace:manage');
  // A public workspace is accessible to everyone, so there's nothing to grant.
  const canShare = canManage && !workspace.is_public;

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 p-4 md:p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-xl font-semibold">{workspace.name}</h1>
            <Badge variant={workspace.is_public ? 'secondary' : 'outline'}>
              {workspace.is_public ? 'Public' : 'Private'}
            </Badge>
          </div>
          {workspace.description != null && workspace.description !== '' && (
            <p className="text-muted-foreground mt-1 text-sm">{workspace.description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {canShare && (
            <Button variant="outline" onClick={(): void => setShareOpen(true)}>
              <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-4" />
              Share
            </Button>
          )}
          <Button onClick={(): void => setNewBoardOpen(true)}>
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
            New board
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
              <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(): void => setEditOpen(true)}>
                Edit workspace
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={(): void => setDeleteOpen(true)}
              >
                Delete workspace
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {boards.length === 0 && (
        <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center text-sm">
          <p>No boards in this workspace yet.</p>
        </div>
      )}
      {boards.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board): ReactElement<FC> => (
            <Link
              key={board.id}
              to="/workspaces/$workspaceId/boards/$boardId"
              params={{ workspaceId, boardId: board.id }}
              className="focus-visible:ring-ring rounded-xl focus-visible:ring-2 focus-visible:outline-none"
            >
              <Card className="hover:bg-accent/50 h-full transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="truncate">{board.name}</CardTitle>
                    <Badge variant={board.is_public ? 'secondary' : 'outline'}>
                      {board.is_public ? 'Public' : 'Private'}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
      <WorkspaceFormDialog open={editOpen} onOpenChange={setEditOpen} workspace={workspace} />
      <WorkspaceShareDialog workspaceId={workspaceId} open={shareOpen} onOpenChange={setShareOpen} />
      <BoardFormDialog open={newBoardOpen} onOpenChange={setNewBoardOpen} workspaceId={workspaceId} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete workspace?"
        description={`"${workspace.name}" and all of its boards, lists, and cards will be permanently deleted.`}
        pending={deleteMutation.isPending}
        onConfirm={(): void => {
          deleteMutation.mutate(
            { data: { workspaceId } },
            {
              onSuccess: (): void => {
                toast.success('Workspace deleted');
                router.navigate({ to: '/workspaces' });
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

export const Route = createFileRoute('/_app/workspaces/$workspaceId/')({
  head: ({loaderData}) => ({
    meta: [{title: `Open Board - Workspaces - ${loaderData?.workspace.name}`}]
  }),
  loader: async ({ context, params }): Promise<WorkspaceDetail> => {
    return await context.queryClient.query({...workspaceQueryOptions(params.workspaceId), staleTime: 'static'});
  },
  component: WorkspacePage
});
