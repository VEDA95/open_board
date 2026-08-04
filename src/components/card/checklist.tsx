import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Delete02Icon } from '@hugeicons/core-free-icons';
import { Button } from '@components/ui/button';
import { Checkbox } from '@components/ui/checkbox';
import { Input } from '@components/ui/input';
import type { FC, ReactElement } from 'react';
import type { ChecklistItem } from '@lib/server-functions/checklists';

type ChecklistProps = {
  items: Array<ChecklistItem>;
  disabled?: boolean;
  onAdd: (name: string) => void;
  onToggle: (itemId: string, isChecked: boolean) => void;
  onDelete: (itemId: string) => void;
};

export function Checklist({ items, disabled = false, onAdd, onToggle, onDelete }: ChecklistProps): ReactElement<FC> {
  const [newName, setNewName] = useState('');
  const done = items.filter((item): boolean => item.is_checked).length;

  const handleAdd = (): void => {
    const trimmed = newName.trim();

    if (trimmed === '') return;

    onAdd(trimmed);
    setNewName('');
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Checklist</h3>
        {items.length > 0 && (
          <span className="text-muted-foreground text-xs">{done}/{items.length}</span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        {items.map((item): ReactElement<FC> => (
          <div key={item.id} className="group/item flex items-center gap-2">
            <Checkbox
              checked={item.is_checked}
              disabled={disabled}
              onCheckedChange={(checked): void => onToggle(item.id, checked === true)}
            />
            <span className={item.is_checked ? 'text-muted-foreground flex-1 text-sm line-through' : 'flex-1 text-sm'}>
              {item.name}
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              className="opacity-0 group-hover/item:opacity-100"
              onClick={(): void => onDelete(item.id)}
            >
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
            </Button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={newName}
          placeholder="Add an item"
          className="h-8"
          onChange={(e): void => setNewName(e.target.value)}
          onKeyDown={(e): void => {
            if (e.key === 'Enter') handleAdd();
          }}
        />
        <Button size="sm" disabled={disabled || newName.trim() === ''} onClick={handleAdd}>
          Add
        </Button>
      </div>
    </div>
  );
}
