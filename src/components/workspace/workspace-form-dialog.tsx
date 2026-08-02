import { useForm } from '@tanstack/react-form-start';
import { toast } from 'sonner';
import { workspaceFormValidator } from '@lib/validators/workspace';
import { useCreateWorkspace, useUpdateWorkspace } from '@lib/hooks/use-workspaces';
import { Button } from '@components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@components/ui/field';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import { Switch } from '@components/ui/switch';
import type { ChangeEvent, FC, ReactElement, SyntheticEvent } from 'react';
import type { Workspace } from '@lib/server-functions/workspaces';

type WorkspaceFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace?: Workspace;
};

export function WorkspaceFormDialog({ open, onOpenChange, workspace }: WorkspaceFormDialogProps): ReactElement<FC> {
  const isEdit = workspace != null;
  const createMutation = useCreateWorkspace();
  const updateMutation = useUpdateWorkspace();
  const form = useForm({
    defaultValues: {
      name: workspace?.name ?? '',
      description: (workspace?.description ?? undefined),
      isPublic: workspace?.is_public ?? false
    },
    validators: {
      onMount: workspaceFormValidator,
      onChange: workspaceFormValidator
    },
    onSubmit: ({ value }): void => {
      const onSuccess = (): void => {
        toast.success(isEdit ? 'Workspace updated' : 'Workspace created');
        onOpenChange(false);
        form.reset();
      };
      const onError = (error: Error): void => {
        toast.error(error.message);
      };

      if (isEdit) {
        updateMutation.mutate(
          { data: { workspaceId: workspace.id, ...value } },
          { onSuccess, onError }
        );
        return;
      }

      createMutation.mutate({ data: value }, { onSuccess, onError });
    }
  });
  const handleSubmit = (event: SyntheticEvent): void => {
    event.preventDefault();
    form.handleSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit workspace' : 'New workspace'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the workspace details.'
              : 'A workspace groups related boards together.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <form.Field name="name" children={(field): ReactElement<FC> => (
              <Field>
                <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e: ChangeEvent<HTMLInputElement>): void => field.handleChange(e.target.value)}
                />
              </Field>
            )} />
            <form.Field name="description" children={(field): ReactElement<FC> => (
              <Field>
                <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value ?? ''}
                  onBlur={field.handleBlur}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>): void =>
                    field.handleChange(e.target.value === '' ? undefined : e.target.value)}
                />
              </Field>
            )} />
            <form.Field name="isPublic" children={(field): ReactElement<FC> => (
              <Field orientation="horizontal">
                <div className="flex flex-col">
                  <FieldLabel htmlFor={field.name}>Public</FieldLabel>
                  <FieldDescription>
                    Public workspaces are visible to every signed-in user.
                  </FieldDescription>
                </div>
                <Switch
                  id={field.name}
                  name={field.name}
                  checked={field.state.value}
                  onCheckedChange={(checked: boolean): void => field.handleChange(checked)}
                />
              </Field>
            )} />
            <form.Subscribe
              selector={(state): [boolean, boolean] => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]): ReactElement<FC> => (
                <Field>
                  <Button
                    type="submit"
                    disabled={!canSubmit || isSubmitting || createMutation.isPending || updateMutation.isPending}
                  >
                    {isEdit ? 'Save changes' : 'Create workspace'}
                  </Button>
                </Field>
              )} />
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
