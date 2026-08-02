import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Add01Icon } from '@hugeicons/core-free-icons';
import { Button } from '@components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@components/ui/field';
import { Input } from '@components/ui/input';
import type { ChangeEvent, FC, KeyboardEvent, ReactElement, SyntheticEvent } from 'react';

type AddCardProps = {
  listId: string;
  pending?: boolean;
  onAdd: (name: string) => void;
};

export function AddCard({ listId, pending = false, onAdd }: AddCardProps): ReactElement<FC> {
  const [composing, setComposing] = useState(false);
  const [name, setName] = useState('');
  const inputId = `add-card-${listId}`;
  const close = (): void => {
    setComposing(false);
    setName('');
  };
  const handleSubmit = (event: SyntheticEvent): void => {
    event.preventDefault();

    const trimmed = name.trim();

    if (trimmed === '') return;

    onAdd(trimmed);
    setName('');
  };

  if (!composing) {
    return (
      <Button
        variant="ghost"
        className="text-muted-foreground w-full justify-start"
        onClick={(): void => setComposing(true)}
      >
        <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
        Add card
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup className="gap-2">
        <Field>
          <FieldLabel htmlFor={inputId} className="sr-only">Card name</FieldLabel>
          <Input
            id={inputId}
            autoFocus
            placeholder="Card name"
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
