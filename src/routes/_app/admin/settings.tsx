import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useForm } from '@tanstack/react-form-start';
import { HugeiconsIcon } from '@hugeicons/react';
import { Delete02Icon } from '@hugeicons/core-free-icons';
import {
  adminSettingsQueryOptions,
  useAdminSettings,
  useAdminSettingsMutations
} from '@lib/hooks/use-admin';
import { ANNOUNCEMENT_TYPES, DEFAULT_ROLE_TYPES, generalSettingsFormValidator } from '@lib/validators/admin';
import { RoleCombobox } from '@components/admin/role-combobox';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@components/ui/field';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import { Switch } from '@components/ui/switch';
import { Skeleton } from '@components/ui/skeleton';
import { Badge } from '@components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import type { ChangeEvent, FC, ReactElement, SyntheticEvent } from 'react';
import type { AdminSettings } from '@lib/server-functions/admin-settings';
import type { ComboOption } from '@components/admin/role-combobox';

const DEFAULT_ROLE_TYPE_LABELS: Record<(typeof DEFAULT_ROLE_TYPES)[number], string> = {
  global: 'All new users',
  public_registration: 'Public sign-ups',
  private_registration: 'Invited users',
  sso_provider: 'SSO provider'
};

function GeneralSettingsCard({ settings }: { settings: AdminSettings }): ReactElement<FC> {
  const { updateGeneral } = useAdminSettingsMutations();
  const form = useForm({
    defaultValues: {
      appName: settings.general.app_name,
      appDescription: settings.general.app_description ?? '',
      showAnnouncementBanner: settings.general.show_announcement_banner,
      announcementMessage: settings.general.announcement_message ?? '',
      announcementType: settings.general.announcement_type as (typeof ANNOUNCEMENT_TYPES)[number]
    },
    validators: {
      onMount: generalSettingsFormValidator,
      onChange: generalSettingsFormValidator
    },
    onSubmit: ({ value }): void => {
      updateGeneral.mutate({
        data: {
          appName: value.appName,
          appDescription: value.appDescription === '' ? null : value.appDescription,
          showAnnouncementBanner: value.showAnnouncementBanner,
          announcementMessage: value.announcementMessage === '' ? null : value.announcementMessage,
          announcementType: value.announcementType
        }
      });
    }
  });
  const handleSubmit = (e: SyntheticEvent): void => {
    e.preventDefault();
    form.handleSubmit();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>General</CardTitle>
        <CardDescription>App name, description, and the announcement banner.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <form.Field name="appName" children={(field): ReactElement<FC> => (
              <Field>
                <FieldLabel htmlFor={field.name}>App name</FieldLabel>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onChange={(e: ChangeEvent<HTMLInputElement>): void => field.handleChange(e.target.value)}
                />
              </Field>
            )} />
            <form.Field name="appDescription" children={(field): ReactElement<FC> => (
              <Field>
                <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                <Textarea
                  id={field.name}
                  value={field.state.value}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>): void => field.handleChange(e.target.value)}
                />
              </Field>
            )} />
            <form.Field name="showAnnouncementBanner" children={(field): ReactElement<FC> => (
              <Field orientation="horizontal">
                <div className="flex flex-col">
                  <FieldLabel htmlFor={field.name}>Announcement banner</FieldLabel>
                  <FieldDescription>Show a banner to everyone at the top of the app.</FieldDescription>
                </div>
                <Switch
                  id={field.name}
                  checked={field.state.value}
                  onCheckedChange={(checked: boolean): void => field.handleChange(checked)}
                />
              </Field>
            )} />
            <form.Field name="announcementMessage" children={(field): ReactElement<FC> => (
              <Field>
                <FieldLabel htmlFor={field.name}>Announcement message</FieldLabel>
                <Textarea
                  id={field.name}
                  value={field.state.value}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>): void => field.handleChange(e.target.value)}
                />
              </Field>
            )} />
            <form.Field name="announcementType" children={(field): ReactElement<FC> => (
              <Field>
                <FieldLabel htmlFor={field.name}>Banner style</FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={(value: string | null): void => {
                    if (value != null) field.handleChange(value as (typeof ANNOUNCEMENT_TYPES)[number]);
                  }}
                >
                  <SelectTrigger id={field.name} className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ANNOUNCEMENT_TYPES.map((type): ReactElement<FC> => (
                      <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )} />
            <Field>
              <Button type="submit" disabled={updateGeneral.isPending}>Save</Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

function AuthSettingsCard({ settings }: { settings: AdminSettings }): ReactElement<FC> {
  const { updateAuth } = useAdminSettingsMutations();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registration</CardTitle>
        <CardDescription>Control whether people can sign up on their own.</CardDescription>
      </CardHeader>
      <CardContent>
        <Field orientation="horizontal">
          <div className="flex flex-col">
            <FieldLabel htmlFor="enable-registration">Allow public registration</FieldLabel>
            <FieldDescription>When off, accounts can only be created by invitation.</FieldDescription>
          </div>
          <Switch
            id="enable-registration"
            checked={settings.auth.enable_registration}
            disabled={updateAuth.isPending}
            onCheckedChange={(checked: boolean): void => {
              updateAuth.mutate({ data: { enableRegistration: checked } });
            }}
          />
        </Field>
      </CardContent>
    </Card>
  );
}

function DefaultRolesCard({ settings }: { settings: AdminSettings }): ReactElement<FC> {
  const { addDefaultRole, removeDefaultRole } = useAdminSettingsMutations();
  const [role, setRole] = useState<string | null>(null);
  const [type, setType] = useState<(typeof DEFAULT_ROLE_TYPES)[number]>('global');
  const [provider, setProvider] = useState('');
  const roleOptions: Array<ComboOption> = settings.roles.map((r): ComboOption => ({ value: r.id, label: r.name }));

  const handleAdd = (): void => {
    if (role == null) return;

    addDefaultRole.mutate(
      { data: { role, type, provider: type === 'sso_provider' ? provider : null } },
      {
        onSuccess: (): void => {
          setRole(null);
          setProvider('');
        }
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Default roles</CardTitle>
        <CardDescription>Roles automatically granted to new users, by how they joined.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          {settings.defaultRoles.length === 0 && (
            <p className="text-muted-foreground text-sm">No default roles configured.</p>
          )}
          {settings.defaultRoles.map((dr): ReactElement<FC> => (
            <div key={dr.id} className="flex items-center gap-2 rounded-lg border p-2">
              <span className="text-sm font-medium">{dr.roles?.name ?? 'Unknown role'}</span>
              <Badge variant="outline">{DEFAULT_ROLE_TYPE_LABELS[dr.type]}</Badge>
              {dr.provider != null && <Badge variant="secondary">{dr.provider}</Badge>}
              <Button
                variant="ghost"
                size="icon-sm"
                className="ml-auto"
                onClick={(): void => removeDefaultRole.mutate({ data: { id: dr.id } })}
              >
                <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-2 border-t pt-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Role</span>
            <RoleCombobox
              options={roleOptions}
              value={role}
              placeholder="Select a role"
              onChange={setRole}
              className="w-48"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Applies to</span>
            <Select
              value={type}
              onValueChange={(value: string | null): void => {
                if (value != null) setType(value as (typeof DEFAULT_ROLE_TYPES)[number]);
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEFAULT_ROLE_TYPES.map((t): ReactElement<FC> => (
                  <SelectItem key={t} value={t}>{DEFAULT_ROLE_TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {type === 'sso_provider' && (
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">Provider</span>
              <Input
                value={provider}
                placeholder="e.g. google"
                className="w-36"
                onChange={(e: ChangeEvent<HTMLInputElement>): void => setProvider(e.target.value)}
              />
            </div>
          )}
          <Button
            disabled={role == null || addDefaultRole.isPending || (type === 'sso_provider' && provider.trim() === '')}
            onClick={handleAdd}
          >
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AdminSettingsPage(): ReactElement<FC> {
  const settingsQuery = useAdminSettings();

  if (settingsQuery.isPending) return <Skeleton className="h-64" />;
  if (!settingsQuery.isSuccess) return <p className="text-muted-foreground text-sm">Could not load settings.</p>;

  return (
    <div className="flex flex-col gap-6">
      <GeneralSettingsCard settings={settingsQuery.data} />
      <AuthSettingsCard settings={settingsQuery.data} />
      <DefaultRolesCard settings={settingsQuery.data} />
    </div>
  );
}

export const Route = createFileRoute('/_app/admin/settings')({
  head: () => ({
    meta: [{title: 'Open Board - Manage Settings'}]
  }),
  loader: async ({ context }): Promise<void> => {
    await context.queryClient.query({...adminSettingsQueryOptions(), staleTime: 'static'});
  },
  component: AdminSettingsPage
});
