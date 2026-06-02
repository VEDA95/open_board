import { Link, createFileRoute } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form-start';
import { registerFunc } from '@lib/server-functions/auth';
import { registerValidator } from '@lib/validators/auth';
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

function RegisterPage(): ReactElement<FC> {
  const registerMutation = useMutation({ mutationFn: registerFunc });
  const form = useForm({
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
    },
    validators: {
      onMount: registerValidator,
      onChange: registerValidator
    },
    onSubmit: ({ value }): void => registerMutation.mutate({ data: value })
  });
  const handleSubmit = (event: SyntheticEvent): void => {
    event.preventDefault();
    form.handleSubmit();
  };

  if (registerMutation.isSuccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent you a confirmation link. Click it to finish creating your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldDescription className="text-center">
            Already confirmed? <Link to="/auth/login">Login</Link>
          </FieldDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>
          Enter your email below to create a new account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <form.Field
              name="username"
              children={(field): ReactElement<FC> => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Username</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e: ChangeEvent<HTMLInputElement>): void => field.handleChange(e.target.value)}
                    type="text"
                    placeholder="harambe42069"
                  />
                </Field>
              )}
            />
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
            <form.Field
              name="password"
              children={(field): ReactElement<FC> => (
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
              )}
            />
            <form.Field
              name="confirmPassword"
              children={(field): ReactElement<FC> => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Confirm password</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e: ChangeEvent<HTMLInputElement>): void => field.handleChange(e.target.value)}
                    type="password"
                  />
                </Field>
              )}
            />
            <form.Field
              name="firstName"
              children={(field): ReactElement<FC> => (
                <Field>
                  <FieldLabel htmlFor={field.name}>First Name</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e: ChangeEvent<HTMLInputElement>): void => field.handleChange(e.target.value)}
                    type="text"
                  />
                </Field>
              )}
            />
            <form.Field
              name="lastName"
              children={(field): ReactElement<FC> => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Last Name</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e: ChangeEvent<HTMLInputElement>): void => field.handleChange(e.target.value)}
                    type="text"
                  />
                </Field>
              )}
            />
            <form.Subscribe
              selector={(state): [boolean, boolean] => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]): ReactElement<FC> => (
                <Field>
                  <Button type="submit" disabled={!canSubmit || isSubmitting}>Sign up</Button>
                  <FieldDescription className="text-center">
                    Already have an account? <Link to="/auth/login">Login</Link>
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

export const Route = createFileRoute('/auth/register')({ component: RegisterPage });
