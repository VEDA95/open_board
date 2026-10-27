import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import {useSuspenseQuery} from '@tanstack/react-query';
import { HugeiconsIcon } from '@hugeicons/react';
import { Add01Icon } from '@hugeicons/core-free-icons';
import { useWorkspaces, workspacesQueryOptions } from '@lib/hooks/use-workspaces';
import { WorkspaceCard } from '@components/workspace/workspace-card';
import { WorkspaceFormDialog } from '@components/workspace/workspace-form-dialog';
import { Button } from '@components/ui/button';
import { Skeleton } from '@components/ui/skeleton';
import type { FC, ReactElement } from 'react';

function WorkspacesPage(): ReactElement<FC> {
  const workspacesQuery = useWorkspaces();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Workspaces</h1>
        <Button onClick={(): void => setCreateOpen(true)}>
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
          New workspace
        </Button>
      </div>
      {workspacesQuery.isPending && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      )}
      {workspacesQuery.isSuccess && workspacesQuery.data.length === 0 && (
        <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center text-sm">
          <p>No workspaces yet.</p>
          <p>Create your first workspace to start organizing boards.</p>
        </div>
      )}
      {workspacesQuery.isSuccess && workspacesQuery.data.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspacesQuery.data.map((workspace): ReactElement<FC> => (
            <WorkspaceCard key={workspace.id} workspace={workspace} />
          ))}
        </div>
      )}
      <WorkspaceFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

export const Route = createFileRoute('/_app/workspaces/')({
  head: () => ({
    meta: [{title: 'Open Board - Workspaces'}]
  }),
  loader: async ({ context }): Promise<void> => {
    await context.queryClient.query({...workspacesQueryOptions(), staleTime: 'static'});
  },
  component: WorkspacesPage
});
