import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }): void => {
    if (context.user == null) {
      throw redirect({ to: '/auth/login' });
    }

    throw redirect({ to: '/workspaces' });
  }
});
