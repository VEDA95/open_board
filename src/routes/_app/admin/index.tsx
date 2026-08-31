import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/admin/')({
  beforeLoad: (): void => {
    throw redirect({ to: '/admin/settings' });
  }
});
