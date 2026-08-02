import { Link, useParams, useRouter } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { HugeiconsIcon } from '@hugeicons/react';
import { Folder01Icon, KanbanIcon, Logout01Icon, UnfoldMoreIcon } from '@hugeicons/core-free-icons';
import { logoutFunc } from '@lib/server-functions/auth';
import { useWorkspaces } from '@lib/hooks/use-workspaces';
import { Avatar, AvatarFallback } from '@components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@components/ui/sidebar';
import type { FC, ReactElement } from 'react';
import type { User } from '@supabase/supabase-js';

type AppSidebarProps = {
  user: User;
};

function NavUser({ user }: AppSidebarProps): ReactElement<FC> {
  const router = useRouter();
  const logoutMutation = useMutation({
    mutationFn: logoutFunc,
    onSuccess: (): void => {
      router.invalidate();
      router.navigate({ to: '/auth/login' });
    }
  });
  const initial = (user.email ?? '?').charAt(0).toUpperCase();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger render={<SidebarMenuButton size="lg" />}>
            <Avatar className="size-8">
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
            <span className="truncate text-sm">{user.email}</span>
            <HugeiconsIcon icon={UnfoldMoreIcon} strokeWidth={2} className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="max-w-56 truncate">{user.email}</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={logoutMutation.isPending}
              onSelect={(): void => logoutMutation.mutate({})}
            >
              <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} className="size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function AppSidebar({ user }: AppSidebarProps): ReactElement<FC> {
  const workspacesQuery = useWorkspaces();
  const params = useParams({ strict: false });

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link to="/workspaces" />}>
              <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
                <HugeiconsIcon icon={KanbanIcon} strokeWidth={2} className="size-4" />
              </span>
              <span className="text-base font-semibold">OpenBoard</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={params.workspaceId == null}
                  render={<Link to="/workspaces" />}
                >
                  <HugeiconsIcon icon={Folder01Icon} strokeWidth={2} className="size-4" />
                  Workspaces
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Your workspaces</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {(workspacesQuery.data ?? []).map((workspace): ReactElement<FC> => (
                <SidebarMenuItem key={workspace.id}>
                  <SidebarMenuButton
                    isActive={params.workspaceId === workspace.id}
                    render={(
                      <Link
                        to="/workspaces/$workspaceId"
                        params={{ workspaceId: workspace.id }}
                      />
                    )}
                  >
                    <span className="truncate">{workspace.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
