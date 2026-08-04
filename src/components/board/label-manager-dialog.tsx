import { useState } from 'react';
import { toast } from 'sonner';
import { HugeiconsIcon } from '@hugeicons/react';
import { Delete02Icon } from '@hugeicons/core-free-icons';
import { useLabelMutations, useLabels } from '@lib/hooks/use-labels';
import { DEFAULT_LABEL_COLOR, LABEL_COLORS } from '@lib/utils/label-colors';
import { cn } from '@lib/utils/cn';
import { Button } from '@components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import { Input } from '@components/ui/input';
import { Skeleton } from '@components/ui/skeleton';
import type { FC, ReactElement } from 'react';
import type { Label } from '@lib/server-functions/labels';

type LabelManagerDialogProps = {
  boardId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function ColorSwatches({ value, onChange }: { value: string; onChange: (color: string) => void }): ReactElement<FC> {
  return (
    <div className="flex flex-wrap gap-1">
      {LABEL_COLORS.map((color): ReactElement<FC> => (
        <button
          key={color}
          type="button"
          className={cn(
            'size-5 rounded-full ring-offset-1 transition',
            value === color && 'ring-ring ring-2'
          )}
          style={{ backgroundColor: color }}
          onClick={(): void => onChange(color)}
          aria-label={`Use color ${color}`}
        />
      ))}
    </div>
  );
}

function LabelRow({ boardId, label }: { boardId: string; label: Label }): ReactElement<FC> {
  const { updateLabel, deleteLabel } = useLabelMutations(boardId);
  const [name, setName] = useState(label.name);
  const color = label.color ?? DEFAULT_LABEL_COLOR;

  const save = (nextName: string, nextColor: string): void => {
    if (nextName.trim() === '') return;
    if (nextName === label.name && nextColor === label.color) return;

    updateLabel.mutate({ data: { labelId: label.id, name: nextName.trim(), color: nextColor } });
  };

  return (
    <div className="flex items-center gap-2">
      <ColorSwatches value={color} onChange={(next: string): void => save(name, next)} />
      <Input
        value={name}
        onChange={(e): void => setName(e.target.value)}
        onBlur={(): void => save(name, color)}
        className="h-8 flex-1"
      />
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={(): void => deleteLabel.mutate({ data: { labelId: label.id } })}
      >
        <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4" />
      </Button>
    </div>
  );
}

export function LabelManagerDialog({ boardId, open, onOpenChange }: LabelManagerDialogProps): ReactElement<FC> {
  const labelsQuery = useLabels(boardId);
  const { createLabel } = useLabelMutations(boardId);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState<string>(DEFAULT_LABEL_COLOR);

  const handleCreate = (): void => {
    const trimmed = newName.trim();

    if (trimmed === '') return;

    createLabel.mutate(
      { data: { boardId, name: trimmed, color: newColor } },
      {
        onSuccess: (): void => {
          toast.success('Label created');
          setNewName('');
          setNewColor(DEFAULT_LABEL_COLOR);
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Labels</DialogTitle>
          <DialogDescription>Create, rename, and recolor labels for this board.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          {labelsQuery.isPending && <Skeleton className="h-8" />}
          {labelsQuery.isSuccess && labelsQuery.data.map((label): ReactElement<FC> => (
            <LabelRow key={label.id} boardId={boardId} label={label} />
          ))}
          <div className="mt-2 flex flex-col gap-2 border-t pt-3">
            <ColorSwatches value={newColor} onChange={setNewColor} />
            <div className="flex items-center gap-2">
              <Input
                value={newName}
                placeholder="New label name"
                onChange={(e): void => setNewName(e.target.value)}
                onKeyDown={(e): void => {
                  if (e.key === 'Enter') handleCreate();
                }}
                className="h-8 flex-1"
              />
              <Button
                size="sm"
                disabled={newName.trim() === '' || createLabel.isPending}
                onClick={handleCreate}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
