import { Link, createFileRoute } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form-start';
import { forgotPasswordFunc } from '@lib/server-functions/auth';
import { forgotPasswordValidator } from '@lib/validators/auth';
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

function ForgotPasswordPage(): ReactElement<FC> {
  const forgotPasswordMutation = useMutation({ mutationFn: forgotPasswordFunc });
  const form = useForm({
    defaultValues: {
      email: ''
    },
    validators: {
      onMount: forgotPasswordValidator,
      onChange: forgotPasswordValidator
    },
    onSubmit: ({value}): void => forgotPasswordMutation.mutate({ data: value })
  });
  const handleSubmit = (event: SyntheticEvent): void => {
    event.preventDefault();
    form.handleSubmit();
  };

  if(forgotPasswordMutation.isSuccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            If an account exists for that email, we&apos;ve sent a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldDescription className="text-center">
            Back to <Link to="/auth/login">Login</Link>
          </FieldDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forgot your password?</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a link to reset it
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <form.Field
              name="email"
              children={(field): ReactElement<FC> => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e: ChangeEvent<HTMLInputElement>): void => field.handleChange(e.target.value)}
                    type="email"
                    placeholder="m@example.com"
                  />
                </Field>
              )}
            />
            <form.Subscribe
              selector={(state): [boolean, boolean] => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]): ReactElement<FC> => (
                <Field>
                  <Button type="submit" disabled={!canSubmit || isSubmitting}>Send reset link</Button>
                  <FieldDescription className="text-center">
                    Remembered it? <Link to="/auth/login">Login</Link>
                  </FieldDescription>
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

export const Route = createFileRoute('/auth/forgot-password')({ component: ForgotPasswordPage });
