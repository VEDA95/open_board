import { useState } from 'react';
import { Button } from '@components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@components/ui/field';
import { Input } from '@components/ui/input';
import type { ChangeEvent, FC, ReactElement, SyntheticEvent } from 'react';

type RenameDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  initialValue: string;
  pending?: boolean;
  onSubmit: (name: string) => void;
};

export function RenameDialog({
  open,
  onOpenChange,
  title,
  initialValue,
  pending = false,
  onSubmit,
}: RenameDialogProps): ReactElement<FC> {
  const [name, setName] = useState(initialValue);
  const handleSubmit = (event: SyntheticEvent): void => {
    event.preventDefault();

    const trimmed = name.trim();

    if (trimmed !== '') onSubmit(trimmed);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="rename-input">Name</FieldLabel>
              <Input
                id="rename-input"
                value={name}
                onChange={(e: ChangeEvent<HTMLInputElement>): void => setName(e.target.value)}
              />
            </Field>
            <Field>
              <Button type="submit" disabled={pending || name.trim() === ''}>
                Save
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
