import { useForm } from '@tanstack/react-form-start';
import { toast } from 'sonner';
import { useCreateBoard, useUpdateBoard } from '@lib/hooks/use-boards';
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
import { Switch } from '@components/ui/switch';
import { z } from 'zod';
import type { ChangeEvent, FC, ReactElement, SyntheticEvent } from 'react';
import type { WorkspaceBoard } from '@lib/server-functions/workspaces';

const boardFormValidator = z.object({
  name: z.string().min(1).max(100),
  isPublic: z.boolean()
});

type BoardFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  board?: WorkspaceBoard;
};

export function BoardFormDialog({ open, onOpenChange, workspaceId, board }: BoardFormDialogProps): ReactElement<FC> {
  const isEdit = board != null;
  const createMutation = useCreateBoard(workspaceId);
  const updateMutation = useUpdateBoard(workspaceId);
  const form = useForm({
    defaultValues: {
      name: board?.name ?? '',
      isPublic: board?.is_public ?? true
    },
    validators: {
      onMount: boardFormValidator,
      onChange: boardFormValidator
    },
    onSubmit: ({ value }): void => {
      const onSuccess = (): void => {
        toast.success(isEdit ? 'Board updated' : 'Board created');
        onOpenChange(false);
        form.reset();
      };
      const onError = (error: Error): void => {
        toast.error(error.message);
      };

      if (isEdit) {
        updateMutation.mutate(
          { data: { boardId: board.id, ...value } },
          { onSuccess, onError }
        );
        return;
      }

      createMutation.mutate({ data: { workspaceId, ...value } }, { onSuccess, onError });
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
          <DialogTitle>{isEdit ? 'Edit board' : 'New board'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the board details.' : 'A board holds lists and cards.'}
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
            <form.Field name="isPublic" children={(field): ReactElement<FC> => (
              <Field orientation="horizontal">
                <div className="flex flex-col">
                  <FieldLabel htmlFor={field.name}>Public</FieldLabel>
                  <FieldDescription>
                    Public boards are visible to everyone with access to the workspace.
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
                    {isEdit ? 'Save changes' : 'Create board'}
                  </Button>
                </Field>
              )} />
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
