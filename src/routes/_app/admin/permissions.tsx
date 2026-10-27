import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { HugeiconsIcon } from '@hugeicons/react';
import { Delete02Icon } from '@hugeicons/core-free-icons';
import { rolesQueryOptions, useRoleMutations, useRolesAndPermissions } from '@lib/hooks/use-admin';
import { ConfirmDialog } from '@components/layout/confirm-dialog';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import { Input } from '@components/ui/input';
import { Skeleton } from '@components/ui/skeleton';
import type { ChangeEvent, FC, ReactElement } from 'react';
import type { Permission } from '@lib/server-functions/admin-roles';

function PermissionRow({ permission }: { permission: Permission }): ReactElement<FC> {
  const { deletePermission } = useRoleMutations();
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="flex items-center gap-2 rounded-lg border p-2">
      <span className="flex-1 font-mono text-sm">{permission.path}</span>
      <Button variant="ghost" size="icon-sm" onClick={(): void => setDeleteOpen(true)}>
        <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4" />
      </Button>
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete permission?"
        description={`"${permission.path}" will be removed from every role and resource that references it.`}
        pending={deletePermission.isPending}
        onConfirm={(): void => {
          deletePermission.mutate(
            { data: { permissionId: permission.id } },
            { onSuccess: (): void => setDeleteOpen(false) }
          );
        }}
      />
    </div>
  );
}

function AdminPermissionsPage(): ReactElement<FC> {
  const rolesQuery = useRolesAndPermissions();
  const { createPermission } = useRoleMutations();
  const [path, setPath] = useState('');

  const handleCreate = (): void => {
    const trimmed = path.trim();

    if (trimmed === '') return;

    createPermission.mutate({ data: { path: trimmed } }, { onSuccess: (): void => setPath('') });
  };

  if (rolesQuery.isPending) return <Skeleton className="h-64" />;
  if (!rolesQuery.isSuccess) return <p className="text-muted-foreground text-sm">Could not load permissions.</p>;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Add permission</CardTitle>
          <CardDescription>Use a path like <code>board:create</code> or <code>report:export</code>.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input
              value={path}
              placeholder="scope:action"
              className="max-w-xs font-mono"
              onChange={(e: ChangeEvent<HTMLInputElement>): void => setPath(e.target.value)}
              onKeyDown={(e): void => {
                if (e.key === 'Enter') handleCreate();
              }}
            />
            <Button disabled={path.trim() === '' || createPermission.isPending} onClick={handleCreate}>
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
          <CardDescription>Assign these to roles on the Roles tab, or attach them to private resources.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1.5">
            {rolesQuery.data.permissions.map((permission): ReactElement<FC> => (
              <PermissionRow key={permission.id} permission={permission} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute('/_app/admin/permissions')({
  head: () => ({
    meta: [{title: 'Open Board - Manage Permissions'}]
  }),
  loader: async ({ context }): Promise<void> => {
    await context.queryClient.query({...rolesQueryOptions(), staleTime: 'static'});
  },
  component: AdminPermissionsPage
});
