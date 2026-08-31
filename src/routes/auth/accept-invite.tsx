import { Link, createFileRoute, redirect, useRouter } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form-start';
import { acceptInviteValidator } from '@lib/validators/auth';
import { acceptInviteFunc, exchangeCodeFunc } from '@lib/server-functions/auth';
import { Button } from '@components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@components/ui/card';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@components/ui/field';
import { Input } from '@components/ui/input';
import type { ChangeEvent, FC, ReactElement, SyntheticEvent } from 'react';

type AcceptInviteSearch = {
  code?: string;
  invalid?: boolean;
};

function AcceptInvitePage(): ReactElement<FC> {
  const router = useRouter();
  const { invalid } = Route.useSearch();
  const { user } = Route.useRouteContext();
  const acceptMutation = useMutation({ mutationFn: acceptInviteFunc });
  const form = useForm({
    defaultValues: { username: '', password: '', confirmPassword: '' },
    validators: {
      onMount: acceptInviteValidator,
      onChange: acceptInviteValidator
    },
    onSubmit: ({ value }): void => {
      acceptMutation.mutate(
        { data: value },
        {
          onSuccess: (): void => {
            router.invalidate();
            router.navigate({ to: '/' });
          }
        }
      );
    }
  });
  const handleSubmit = (e: SyntheticEvent): void => {
    e.preventDefault();
    form.handleSubmit();
  };

  if (invalid || user == null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invite invalid or expired</CardTitle>
          <CardDescription>Ask an administrator to send you a new invitation.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldDescription className="text-center">
            <Link to="/auth/login">Back to login</Link>
          </FieldDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Finish setting up your account</CardTitle>
        <CardDescription>Choose a username and password to get started.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <form.Field name="username" children={(field): ReactElement<FC> => (
              <Field>
                <FieldLabel htmlFor={field.name}>Username</FieldLabel>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e: ChangeEvent<HTMLInputElement>): void => field.handleChange(e.target.value)}
                />
              </Field>
            )} />
            <form.Field name="password" children={(field): ReactElement<FC> => (
              <Field>
                <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                <Input
                  id={field.name}
                  type="password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e: ChangeEvent<HTMLInputElement>): void => field.handleChange(e.target.value)}
                />
              </Field>
            )} />
            <form.Field name="confirmPassword" children={(field): ReactElement<FC> => (
              <Field>
                <FieldLabel htmlFor={field.name}>Confirm password</FieldLabel>
                <Input
                  id={field.name}
                  type="password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e: ChangeEvent<HTMLInputElement>): void => field.handleChange(e.target.value)}
                />
              </Field>
            )} />
            <form.Subscribe
              selector={(state): [boolean, boolean] => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]): ReactElement<FC> => (
                <Field>
                  <Button type="submit" disabled={!canSubmit || isSubmitting || acceptMutation.isPending}>
                    Create account
                  </Button>
                </Field>
              )} />
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

export const Route = createFileRoute('/auth/accept-invite')({
  validateSearch: (search: Record<string, unknown>): AcceptInviteSearch => ({
    code: typeof search.code === 'string' ? search.code : undefined,
    invalid: search.invalid === true || undefined
  }),
  // The invite email links here with a one-time ?code; exchange it for a
  // session, then strip it from the URL (same mechanics as reset-password).
  beforeLoad: async ({ search }): Promise<void> => {
    if (search.code == null) return;

    try {
      await exchangeCodeFunc({ data: { code: search.code } });
    } catch {
      throw redirect({ to: '/auth/accept-invite', search: { invalid: true } });
    }

    throw redirect({ to: '/auth/accept-invite' });
  },
  component: AcceptInvitePage
});
