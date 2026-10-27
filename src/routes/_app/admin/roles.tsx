import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { HugeiconsIcon } from '@hugeicons/react';
import { Delete02Icon } from '@hugeicons/core-free-icons';
import { rolesQueryOptions, useRoleMutations, useRolesAndPermissions } from '@lib/hooks/use-admin';
import { ConfirmDialog } from '@components/layout/confirm-dialog';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardHeader } from '@components/ui/card';
import { Checkbox } from '@components/ui/checkbox';
import { Input } from '@components/ui/input';
import { Skeleton } from '@components/ui/skeleton';
import type { ChangeEvent, FC, ReactElement } from 'react';
import type { Permission, RoleWithPermissions } from '@lib/server-functions/admin-roles';

function RoleCard({ role, permissions }: { role: RoleWithPermissions; permissions: Array<Permission> }): ReactElement<FC> {
  const { updateRole, deleteRole, setRolePermission } = useRoleMutations();
  const [name, setName] = useState(role.name);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const granted = new Set(role.permissionIds);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Input
            value={name}
            className="h-8 max-w-xs"
            onChange={(e: ChangeEvent<HTMLInputElement>): void => setName(e.target.value)}
            onBlur={(): void => {
              if (name.trim() !== '' && name !== role.name) {
                updateRole.mutate({ data: { roleId: role.id, name: name.trim() } });
              }
            }}
          />
          <Button
            variant="ghost"
            size="icon-sm"
            className="ml-auto"
            onClick={(): void => setDeleteOpen(true)}
          >
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {permissions.map((permission): ReactElement<FC> => {
            const id = `${role.id}-${permission.id}`;

            return (
              <label key={permission.id} htmlFor={id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  id={id}
                  checked={granted.has(permission.id)}
                  onCheckedChange={(checked): void => {
                    setRolePermission.mutate({
                      data: { roleId: role.id, permissionId: permission.id, enabled: checked === true }
                    });
                  }}
                />
                <span className="font-mono text-xs">{permission.path}</span>
              </label>
            );
          })}
        </div>
      </CardContent>
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete role?"
        description={`"${role.name}" will be removed from all users who have it.`}
        pending={deleteRole.isPending}
        onConfirm={(): void => {
          deleteRole.mutate(
            { data: { roleId: role.id } },
            { onSuccess: (): void => setDeleteOpen(false) }
          );
        }}
      />
    </Card>
  );
}

function AdminRolesPage(): ReactElement<FC> {
  const rolesQuery = useRolesAndPermissions();
  const { createRole } = useRoleMutations();
  const [newName, setNewName] = useState('');

  const handleCreate = (): void => {
    const trimmed = newName.trim();

    if (trimmed === '') return;

    createRole.mutate({ data: { name: trimmed } }, { onSuccess: (): void => setNewName('') });
  };

  if (rolesQuery.isPending) return <Skeleton className="h-64" />;
  if (!rolesQuery.isSuccess) return <p className="text-muted-foreground text-sm">Could not load roles.</p>;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Input
              value={newName}
              placeholder="New role name"
              className="h-9 max-w-xs"
              onChange={(e: ChangeEvent<HTMLInputElement>): void => setNewName(e.target.value)}
              onKeyDown={(e): void => {
                if (e.key === 'Enter') handleCreate();
              }}
            />
            <Button disabled={newName.trim() === '' || createRole.isPending} onClick={handleCreate}>
              Create role
            </Button>
          </div>
        </CardHeader>
      </Card>
      {rolesQuery.data.roles.map((role): ReactElement<FC> => (
        <RoleCard key={role.id} role={role} permissions={rolesQuery.data.permissions} />
      ))}
    </div>
  );
}

export const Route = createFileRoute('/_app/admin/roles')({
  head: () => ({
    meta: [{title: 'Open Board - Manage Roles'}]
  }),
  loader: async ({ context }): Promise<void> => {
    await context.queryClient.query({...rolesQueryOptions(), staleTime: 'static'});
  },
  component: AdminRolesPage
});
