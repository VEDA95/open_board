import { Link, createFileRoute, useRouter } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import {useForm} from '@tanstack/react-form-start';
import { loginFunc } from '@lib/server-functions/auth';
import {loginValidator} from '@lib/validators/auth';
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
import type {ErrorResponse} from '@lib/types/error';

function LoginPage(): ReactElement<FC> {
  const router = useRouter();
  const loginMutation = useMutation({
    mutationFn: loginFunc,
    onSuccess: (data: void | ErrorResponse): void => {
      if(data != null) return;
      
      router.invalidate();
      router.navigate({to: '/'});
    }
  });
  const form = useForm({
    defaultValues: {
      email: '',
      password: ''
    },
    validators: {
      onMount: loginValidator, 
      onChange: loginValidator
    },
    onSubmit: ({value}): void => loginMutation.mutate({ data: value })
  });
  const handleSubmit = (event: SyntheticEvent): void => {
    event.preventDefault();
    form.handleSubmit();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login to your account</CardTitle>
        <CardDescription>
          Enter your email below to login to your account
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
            <form.Field 
              name="password"
              children={(field): ReactElement<FC> => (
                <Field>
                  <div className="flex items-center">
                    <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                    <Link
                      to="/auth/forgot-password"
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </Link>
                  </div>
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
            <form.Subscribe 
              selector={(state): [boolean, boolean] => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]): ReactElement<FC> => (
                <Field>
                  <Button type="submit" disabled={!canSubmit || isSubmitting}>Login</Button>
                  <FieldDescription className="text-center">
                    Don&apos;t have an account? <Link to="/auth/register">Sign up</Link>
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

export const Route = createFileRoute('/auth/login')({ component: LoginPage });
