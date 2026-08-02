import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Add01Icon } from '@hugeicons/core-free-icons';
import { Button } from '@components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@components/ui/field';
import { Input } from '@components/ui/input';
import type { ChangeEvent, FC, KeyboardEvent, ReactElement, SyntheticEvent } from 'react';

type AddListProps = {
  pending?: boolean;
  onAdd: (name: string) => void;
};

export function AddList({ pending = false, onAdd }: AddListProps): ReactElement<FC> {
  const [composing, setComposing] = useState(false);
  const [name, setName] = useState('');
  const close = (): void => {
    setComposing(false);
    setName('');
  };
  const handleSubmit = (event: SyntheticEvent): void => {
    event.preventDefault();

    const trimmed = name.trim();

    if (trimmed === '') return;

    onAdd(trimmed);
    close();
  };

  if (!composing) {
    return (
      <Button
        variant="outline"
        className="w-72 shrink-0 justify-start"
        onClick={(): void => setComposing(true)}
      >
        <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
        Add list
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-muted/50 w-72 shrink-0 rounded-xl border p-2">
      <FieldGroup className="gap-2">
        <Field>
          <FieldLabel htmlFor="add-list-input" className="sr-only">List name</FieldLabel>
          <Input
            id="add-list-input"
            autoFocus
            placeholder="List name"
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>): void => setName(e.target.value)}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>): void => {
              if (e.key === 'Escape') close();
            }}
          />
        </Field>
        <Field orientation="horizontal">
          <Button type="submit" size="sm" disabled={pending || name.trim() === ''}>
            Add
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={close}>
            Cancel
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
