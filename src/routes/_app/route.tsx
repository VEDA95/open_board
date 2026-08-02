import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import { ModeToggle } from '@components/theme-toggle';
import { AppSidebar } from '@components/layout/app-sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@components/ui/sidebar';
import { Separator } from '@components/ui/separator';
import { Toaster } from '@components/ui/sonner';
import type { FC, ReactElement } from 'react';

function AppLayout(): ReactElement<FC> {
  const { user } = Route.useRouteContext();

  if (user == null) return <Outlet />;

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <header className="bg-background sticky top-0 z-10 flex h-14 items-center justify-between gap-2 border-b px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-4 data-vertical:self-center" />
          </div>
          <ModeToggle />
        </header>
        <main className="flex w-full flex-1 flex-col">
          <Outlet />
        </main>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}

export const Route = createFileRoute('/_app')({
  beforeLoad: ({ context }): void => {
    if (context.user == null) {
      throw redirect({ to: '/auth/login' });
    }
  },
  component: AppLayout
});
