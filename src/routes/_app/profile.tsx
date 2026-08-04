import { useRef } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useForm } from '@tanstack/react-form-start';
import { HugeiconsIcon } from '@hugeicons/react';
import { Camera01Icon } from '@hugeicons/core-free-icons';
import { myProfileQueryOptions, useMyProfile, useProfileMutations } from '@lib/hooks/use-profile';
import { changePasswordValidator, updateProfileValidator } from '@lib/validators/profile';
import { profileLabel } from '@lib/utils/format-date';
import { Avatar, AvatarFallback, AvatarImage } from '@components/ui/avatar';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@components/ui/field';
import { Input } from '@components/ui/input';
import { Skeleton } from '@components/ui/skeleton';
import type { ChangeEvent, FC, ReactElement, SyntheticEvent } from 'react';
import type { MyProfile } from '@lib/server-functions/profile';

function AvatarCard({ profile }: { profile: MyProfile }): ReactElement<FC> {
  const mutations = useProfileMutations();
  const inputRef = useRef<HTMLInputElement>(null);
  const name = profileLabel(profile.profile);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avatar</CardTitle>
        <CardDescription>PNG, JPG, GIF or WebP, up to 5MB.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <Avatar className="size-16">
          {profile.avatarUrl != null && <AvatarImage src={profile.avatarUrl} alt={name} />}
          <AvatarFallback className="text-lg">{name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          className="hidden"
          onChange={(e: ChangeEvent<HTMLInputElement>): void => {
            const file = e.target.files?.[0];

            if (file != null) mutations.uploadAvatar(file);

            e.target.value = '';
          }}
        />
        <Button
          variant="outline"
          disabled={mutations.isUploadingAvatar}
          onClick={(): void => inputRef.current?.click()}
        >
          <HugeiconsIcon icon={Camera01Icon} strokeWidth={2} className="size-4" />
          {mutations.isUploadingAvatar ? 'Uploading…' : 'Change avatar'}
        </Button>
      </CardContent>
    </Card>
  );
}

function DetailsCard({ profile }: { profile: MyProfile }): ReactElement<FC> {
  const mutations = useProfileMutations();
  const form = useForm({
    defaultValues: {
      username: profile.profile.username ?? '',
      firstName: profile.profile.first_name ?? '',
      lastName: profile.profile.last_name ?? ''
    },
    validators: {
      onMount: updateProfileValidator,
      onChange: updateProfileValidator
    },
    onSubmit: ({ value }): void => {
      mutations.updateProfile.mutate({ data: value });
    }
  });
  const handleSubmit = (e: SyntheticEvent): void => {
    e.preventDefault();
    form.handleSubmit();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile details</CardTitle>
        <CardDescription>{profile.email}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <form.Field name="username" children={(field): ReactElement<FC> => (
              <Field>
                <FieldLabel htmlFor={field.name}>Username</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e: ChangeEvent<HTMLInputElement>): void => field.handleChange(e.target.value)}
                />
              </Field>
            )} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <form.Field name="firstName" children={(field): ReactElement<FC> => (
                <Field>
                  <FieldLabel htmlFor={field.name}>First name</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e: ChangeEvent<HTMLInputElement>): void => field.handleChange(e.target.value)}
                  />
                </Field>
              )} />
              <form.Field name="lastName" children={(field): ReactElement<FC> => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Last name</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e: ChangeEvent<HTMLInputElement>): void => field.handleChange(e.target.value)}
                  />
                </Field>
              )} />
            </div>
            <form.Subscribe
              selector={(state): [boolean, boolean] => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]): ReactElement<FC> => (
                <Field>
                  <Button
                    type="submit"
                    disabled={!canSubmit || isSubmitting || mutations.updateProfile.isPending}
                  >
                    Save changes
                  </Button>
                </Field>
              )} />
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

function PasswordCard(): ReactElement<FC> {
  const mutations = useProfileMutations();
  const form = useForm({
    defaultValues: { password: '', confirmPassword: '' },
    validators: {
      onMount: changePasswordValidator,
      onChange: changePasswordValidator
    },
    onSubmit: ({ value }): void => {
      mutations.changePassword.mutate(
        { data: value },
        { onSuccess: (): void => form.reset() }
      );
    }
  });
  const handleSubmit = (e: SyntheticEvent): void => {
    e.preventDefault();
    form.handleSubmit();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change password</CardTitle>
        <CardDescription>Use at least 8 characters.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <form.Field name="password" children={(field): ReactElement<FC> => (
              <Field>
                <FieldLabel htmlFor={field.name}>New password</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
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
                  name={field.name}
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
                  <Button
                    type="submit"
                    disabled={!canSubmit || isSubmitting || mutations.changePassword.isPending}
                  >
                    Change password
                  </Button>
                </Field>
              )} />
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

function ProfilePage(): ReactElement<FC> {
  const profileQuery = useMyProfile();

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 p-4 md:p-6">
      <h1 className="mb-6 text-xl font-semibold">Your profile</h1>
      {profileQuery.isPending && <Skeleton className="h-40" />}
      {profileQuery.isSuccess && (
        <div className="flex flex-col gap-6">
          <AvatarCard profile={profileQuery.data} />
          <DetailsCard profile={profileQuery.data} />
          <PasswordCard />
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute('/_app/profile')({
  loader: async ({ context }): Promise<void> => {
    await context.queryClient.ensureQueryData(myProfileQueryOptions());
  },
  component: ProfilePage
});
