import { Link, Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import { canAccessAdmin } from '@lib/utils/has-permission';
import type { FC, ReactElement } from 'react';

const TABS = [
  { to: '/admin/settings', label: 'Settings' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/roles', label: 'Roles' },
  { to: '/admin/permissions', label: 'Permissions' }
] as const;

function AdminLayout(): ReactElement<FC> {
  return (
    <div className="mx-auto w-full max-w-4xl flex-1 p-4 md:p-6">
      <h1 className="mb-4 text-xl font-semibold">Administration</h1>
      <nav className="mb-6 flex gap-1 border-b">
        {TABS.map((tab): ReactElement<FC> => (
          <Link
            key={tab.to}
            to={tab.to}
            className="text-muted-foreground data-[status=active]:border-primary data-[status=active]:text-foreground -mb-px border-b-2 border-transparent px-3 py-2 text-sm font-medium"
            activeProps={{ 'data-status': 'active' }}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}

export const Route = createFileRoute('/_app/admin')({
  // Server functions re-verify per action; this only gates the section UI.
  beforeLoad: ({ context }): void => {
    if (!canAccessAdmin(context.permissions)) {
      throw redirect({ to: '/workspaces' });
    }
  },
  component: AdminLayout
});
