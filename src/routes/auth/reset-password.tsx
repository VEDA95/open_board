import { Link, createFileRoute, redirect, useRouter } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form-start';
import { resetPasswordValidator } from '@lib/validators/auth';
import { exchangeCodeFunc, resetPasswordFunc } from '@lib/server-functions/auth';
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

type ResetPasswordSearch = {
  code?: string;
  invalid?: boolean;
};

function InvalidLinkCard(): ReactElement<FC> {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset link invalid or expired</CardTitle>
        <CardDescription>
          Your password reset link is no longer valid. Request a new one and try again.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldDescription className="text-center">
          <Link to="/auth/forgot-password">Request a new link</Link>
        </FieldDescription>
      </CardContent>
    </Card>
  );
}

function ResetPasswordPage(): ReactElement<FC> {
  const router = useRouter();
  const { invalid } = Route.useSearch();
  const { user } = Route.useRouteContext();
  const resetPasswordMutation = useMutation({ mutationFn: resetPasswordFunc });
  const form = useForm({
    defaultValues: {
      password: '',
      confirmPassword: ''
    },
    validators: {
      onMount: resetPasswordValidator,
      onChange: resetPasswordValidator
    },
    onSubmit: ({ value }): void => resetPasswordMutation.mutate({ data: value })
  });
  const handleSubmit = (e: SyntheticEvent): void => {
    e.preventDefault();
    form.handleSubmit();
  };

  // Reaching this page without a recovery session means the link was bad,
  // already used, or the page was opened directly.
  if (invalid || user == null) return <InvalidLinkCard />;

  if (resetPasswordMutation.isSuccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Password updated</CardTitle>
          <CardDescription>
            Your password has been changed and you are signed in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Field>
            <Button onClick={(): void => {
              router.invalidate();
              router.navigate({ to: '/' });
            }}>
              Continue
            </Button>
          </Field>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset your Password</CardTitle>
        <CardDescription>Choose a new password for your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <form.Field name="password" children={(field): ReactElement<FC> => (
              <Field>
                <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e: ChangeEvent<HTMLInputElement>): void => field.handleChange(e.target.value)}
                  type="password"
                />
              </Field>
            )} />
            <form.Field name="confirmPassword" children={(field): ReactElement<FC> => (
              <Field>
                <FieldLabel htmlFor={field.name}>Confirm Password</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e: ChangeEvent<HTMLInputElement>): void => field.handleChange(e.target.value)}
                  type="password"
                />
              </Field>
            )} />
            <form.Subscribe
              selector={(state): [boolean, boolean] => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]): ReactElement<FC> => (
                <Field>
                  <Button type="submit" disabled={!canSubmit || isSubmitting}>Reset Password</Button>
                </Field>
              )} />
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

export const Route = createFileRoute('/auth/reset-password')({
  head: () => ({
    meta: [{title: 'Open Board - Reset Password'}]
  }),
  validateSearch: (search: Record<string, unknown>): ResetPasswordSearch => ({
    code: typeof search.code === 'string' ? search.code : undefined,
    invalid: search.invalid === true || undefined
  }),
  // The recovery email lands here with a one-time ?code. Exchange it for a
  // session, then strip it from the URL so refreshes don't re-run the
  // exchange against an already-consumed code.
  beforeLoad: async ({ search }): Promise<void> => {
    if (search.code == null) return;

    try {
      await exchangeCodeFunc({ data: { code: search.code } });
    } catch {
      throw redirect({ to: '/auth/reset-password', search: { invalid: true } });
    }

    throw redirect({ to: '/auth/reset-password' });
  },
  component: ResetPasswordPage
});
