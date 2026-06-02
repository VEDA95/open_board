import { createFileRoute } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form-start';
import { resetPasswordValidator } from '@lib/validators/auth';
import { resetPasswordFunc } from '@lib/server-functions/auth';
import { Button } from '@components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@components/ui/card';
import {
  Field,
  FieldGroup,
  FieldLabel,
} from '@components/ui/field';
import { Input } from '@components/ui/input';
import type { ChangeEvent, FC, ReactElement, SyntheticEvent } from 'react';

function ResetPasswordPage(): ReactElement<FC> {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset your Password</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <form.Field name='password' children={(field): ReactElement<FC> => (
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
            <form.Field name='confirmPassword' children={(field): ReactElement<FC> => (
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
  component: ResetPasswordPage
});
