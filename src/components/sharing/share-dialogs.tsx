import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import { useProfiles } from '@lib/hooks/use-labels';
import {
  useBoardMembers,
  useBoardSharing,
  useWorkspaceMembers,
  useWorkspaceSharing
} from '@lib/hooks/use-sharing';
import {
  useBoardAccess,
  useBoardAccessMutations,
  useWorkspaceAccess,
  useWorkspaceAccessMutations
} from '@lib/hooks/use-resource-access';
import { profileLabel } from '@lib/utils/format-date';
import { RoleCombobox } from '@components/admin/role-combobox';
import { Avatar, AvatarFallback } from '@components/ui/avatar';
import { Button } from '@components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import { Skeleton } from '@components/ui/skeleton';
import type { FC, ReactElement } from 'react';
import type { Member, ResourceAccess } from '@lib/server-functions/sharing';
import type { ComboOption } from '@components/admin/role-combobox';

type AccessSectionProps = {
  resourceLabel: string;
  access: ResourceAccess | undefined;
  loading: boolean;
  pending: boolean;
  onAdd: (permissionId: string) => void;
  onRemove: (permissionId: string) => void;
};

function AccessSection({ resourceLabel, access, loading, pending, onAdd, onRemove }: AccessSectionProps): ReactElement<FC> {
  const options: Array<ComboOption> = (access?.available ?? []).map(
    (permission): ComboOption => ({ value: permission.id, label: permission.path })
  );

  return (
    <div className="flex flex-col gap-3 border-t pt-4">
      <div>
        <h3 className="text-sm font-medium">Access by permission</h3>
        <p className="text-muted-foreground text-xs">
          Anyone whose role grants one of these permissions can access this {resourceLabel}. People added above always have access, regardless of their permissions.
        </p>
      </div>
      <RoleCombobox
        options={options}
        value={null}
        placeholder="Add a permission…"
        disabled={pending || options.length === 0}
        onChange={onAdd}
      />
      <div className="flex flex-col gap-1">
        {loading && <Skeleton className="h-9" />}
        {!loading && (access?.attached ?? []).length === 0 && (
          <p className="text-muted-foreground text-sm">No permissions grant access.</p>
        )}
        {(access?.attached ?? []).map((permission): ReactElement<FC> => (
          <div key={permission.id} className="flex items-center gap-2 rounded-lg border p-2">
            <span className="flex-1 truncate font-mono text-xs">{permission.path}</span>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={pending}
              onClick={(): void => onRemove(permission.id)}
            >
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

type ShareDialogContentProps = {
  description: string;
  members: Array<Member> | undefined;
  loading: boolean;
  pending: boolean;
  onAdd: (userId: string) => void;
  onRemove: (userId: string) => void;
};

function ShareDialogContent({ description, members, loading, pending, onAdd, onRemove }: ShareDialogContentProps): ReactElement<FC> {
  const profilesQuery = useProfiles();
  const memberIds = new Set((members ?? []).map((member): string => member.userId));
  const candidates: Array<ComboOption> = (profilesQuery.data ?? [])
    .filter((profile): boolean => !memberIds.has(profile.user_id))
    .map((profile): ComboOption => ({ value: profile.user_id, label: profileLabel(profile) }));

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">{description}</p>
      <RoleCombobox
        options={candidates}
        value={null}
        placeholder="Add a person…"
        disabled={pending || candidates.length === 0}
        onChange={onAdd}
      />
      <div className="flex flex-col gap-1">
        {loading && <Skeleton className="h-10" />}
        {!loading && (members ?? []).length === 0 && (
          <p className="text-muted-foreground text-sm">No one else has access yet.</p>
        )}
        {(members ?? []).map((member): ReactElement<FC> => {
          const name = profileLabel({
            username: member.username,
            first_name: member.firstName,
            last_name: member.lastName
          });

          return (
            <div key={member.userId} className="flex items-center gap-2 rounded-lg border p-2">
              <Avatar className="size-7">
                <AvatarFallback className="text-xs">{name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="flex-1 truncate text-sm">{name}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={pending}
                onClick={(): void => onRemove(member.userId)}
              >
                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-4" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type WorkspaceShareDialogProps = {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function WorkspaceShareDialog({ workspaceId, open, onOpenChange }: WorkspaceShareDialogProps): ReactElement<FC> {
  const membersQuery = useWorkspaceMembers(workspaceId, open);
  const { share, unshare } = useWorkspaceSharing(workspaceId);
  const accessQuery = useWorkspaceAccess(workspaceId, open);
  const access = useWorkspaceAccessMutations(workspaceId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share workspace</DialogTitle>
          <DialogDescription>People you add can see this workspace and its public boards.</DialogDescription>
        </DialogHeader>
        <ShareDialogContent
          description="Members can access this workspace. Private boards still need to be shared individually."
          members={membersQuery.data}
          loading={membersQuery.isPending}
          pending={share.isPending || unshare.isPending}
          onAdd={(userId: string): void => share.mutate({ data: { workspaceId, userId } })}
          onRemove={(userId: string): void => unshare.mutate({ data: { workspaceId, userId } })}
        />
        <AccessSection
          resourceLabel="workspace"
          access={accessQuery.data}
          loading={accessQuery.isPending}
          pending={access.add.isPending || access.remove.isPending}
          onAdd={(permissionId: string): void => access.add.mutate({ data: { workspaceId, permissionId } })}
          onRemove={(permissionId: string): void => access.remove.mutate({ data: { workspaceId, permissionId } })}
        />
      </DialogContent>
    </Dialog>
  );
}

type BoardShareDialogProps = {
  boardId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function BoardShareDialog({ boardId, open, onOpenChange }: BoardShareDialogProps): ReactElement<FC> {
  const membersQuery = useBoardMembers(boardId, open);
  const { share, unshare } = useBoardSharing(boardId);
  const accessQuery = useBoardAccess(boardId, open);
  const access = useBoardAccessMutations(boardId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share board</DialogTitle>
          <DialogDescription>People you add can access this board.</DialogDescription>
        </DialogHeader>
        <ShareDialogContent
          description="Sharing a board also grants access to its workspace (needed to open the board)."
          members={membersQuery.data}
          loading={membersQuery.isPending}
          pending={share.isPending || unshare.isPending}
          onAdd={(userId: string): void => share.mutate({ data: { boardId, userId } })}
          onRemove={(userId: string): void => unshare.mutate({ data: { boardId, userId } })}
        />
        <AccessSection
          resourceLabel="board"
          access={accessQuery.data}
          loading={accessQuery.isPending}
          pending={access.add.isPending || access.remove.isPending}
          onAdd={(permissionId: string): void => access.add.mutate({ data: { boardId, permissionId } })}
          onRemove={(permissionId: string): void => access.remove.mutate({ data: { boardId, permissionId } })}
        />
      </DialogContent>
    </Dialog>
  );
}
