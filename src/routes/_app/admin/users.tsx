import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import { adminSettingsQueryOptions, useAdminSettings, useAdminUsers, useUserMutations, usersQueryOptions } from '@lib/hooks/use-admin';
import { profileLabel } from '@lib/utils/format-date';
import { RoleCombobox } from '@components/admin/role-combobox';
import { ConfirmDialog } from '@components/layout/confirm-dialog';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Input } from '@components/ui/input';
import { Skeleton } from '@components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui/table';
import type { ChangeEvent, FC, ReactElement } from 'react';
import type { AdminUser } from '@lib/server-functions/admin-users';
import type { ComboOption } from '@components/admin/role-combobox';

function InviteCard(): ReactElement<FC> {
  const { inviteUser } = useUserMutations();
  const [email, setEmail] = useState('');

  const handleInvite = (): void => {
    const trimmed = email.trim();

    if (trimmed === '') return;

    inviteUser.mutate({ data: { email: trimmed } }, { onSuccess: (): void => setEmail('') });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite a user</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Input
            type="email"
            value={email}
            placeholder="person@example.com"
            className="max-w-xs"
            onChange={(e: ChangeEvent<HTMLInputElement>): void => setEmail(e.target.value)}
          />
          <Button disabled={email.trim() === '' || inviteUser.isPending} onClick={handleInvite}>
            Send invite
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function UserRow({ user, roleOptions }: { user: AdminUser; roleOptions: Array<ComboOption> }): ReactElement<FC> {
  const { assignRole, removeRole, deleteUser } = useUserMutations();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const assignedIds = new Set(user.roles.map((role): string => role.id));
  const assignable = roleOptions.filter((option): boolean => !assignedIds.has(option.value));
  const name = profileLabel({ username: user.username, first_name: user.firstName, last_name: user.lastName });

  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col">
          <span className="text-sm font-medium">{name}</span>
          <span className="text-muted-foreground text-xs">{user.email}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap items-center gap-1">
          {user.roles.map((role): ReactElement<FC> => (
            <Badge key={role.id} variant="secondary" className="gap-1">
              {role.name}
              <button
                type="button"
                onClick={(): void => removeRole.mutate({ data: { userId: user.id, roleId: role.id } })}
              >
                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3" />
              </button>
            </Badge>
          ))}
          {user.roles.length === 0 && <span className="text-muted-foreground text-xs">No roles</span>}
        </div>
      </TableCell>
      <TableCell>
        <RoleCombobox
          options={assignable}
          value={null}
          placeholder="Add role…"
          disabled={assignable.length === 0 || assignRole.isPending}
          className="w-40"
          onChange={(roleId: string): void => assignRole.mutate({ data: { userId: user.id, roleId } })}
        />
      </TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="sm" onClick={(): void => setDeleteOpen(true)}>
          Delete
        </Button>
        <ConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title="Delete user?"
          description={`${user.email} and their profile will be permanently deleted.`}
          pending={deleteUser.isPending}
          onConfirm={(): void => {
            deleteUser.mutate(
              { data: { userId: user.id } },
              { onSuccess: (): void => setDeleteOpen(false) }
            );
          }}
        />
      </TableCell>
    </TableRow>
  );
}

function AdminUsersPage(): ReactElement<FC> {
  const usersQuery = useAdminUsers();
  const settingsQuery = useAdminSettings();
  const roleOptions: Array<ComboOption> = (settingsQuery.data?.roles ?? []).map(
    (role): ComboOption => ({ value: role.id, label: role.name })
  );

  return (
    <div className="flex flex-col gap-6">
      <InviteCard />
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          {usersQuery.isPending && <Skeleton className="h-40" />}
          {usersQuery.isSuccess && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Assign</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersQuery.data.map((user): ReactElement<FC> => (
                    <UserRow key={user.id} user={user} roleOptions={roleOptions} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute('/_app/admin/users')({
  loader: async ({ context }): Promise<void> => {
    await Promise.all([
      context.queryClient.ensureQueryData(usersQueryOptions()),
      context.queryClient.ensureQueryData(adminSettingsQueryOptions())
    ]);
  },
  component: AdminUsersPage
});
