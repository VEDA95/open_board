import { createFileRoute, redirect, useRouter } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { logoutFunc } from '@lib/server-functions/auth';
import { Button } from '@components/ui/button';
import type { FC, ReactElement } from 'react';

function App(): ReactElement<FC> {
  const router = useRouter();
  const { user } = Route.useRouteContext();
  const logoutMutation = useMutation({
    mutationFn: logoutFunc,
    onSuccess: (): void => {
      router.invalidate();
      router.navigate({ to: '/auth/login' });
    }
  });

  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div>
          <h1 className="font-medium">Signed in as {user?.email}</h1>
          <p>Workspaces are coming next — this placeholder becomes the app shell.</p>
          <Button
            className="mt-2"
            disabled={logoutMutation.isPending}
            onClick={(): void => logoutMutation.mutate({})}
          >
            Log out
          </Button>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }): void => {
    if (context.user == null) {
      throw redirect({ to: '/auth/login' });
    }
  },
  component: App
});
