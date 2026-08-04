import { HugeiconsIcon } from '@hugeicons/react';
import { Tag01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import { useLabels } from '@lib/hooks/use-labels';
import { Button } from '@components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@components/ui/popover';
import type { FC, ReactElement } from 'react';

type LabelPickerProps = {
  boardId: string;
  assignedLabelIds: Array<string>;
  disabled?: boolean;
  onToggle: (labelId: string, assigned: boolean) => void;
};

export function LabelPicker({ boardId, assignedLabelIds, disabled = false, onToggle }: LabelPickerProps): ReactElement<FC> {
  const labelsQuery = useLabels(boardId);
  const assigned = new Set(assignedLabelIds);

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" size="sm" disabled={disabled} />}>
        <HugeiconsIcon icon={Tag01Icon} strokeWidth={2} className="size-4" />
        Labels
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-1.5">
        {labelsQuery.isSuccess && labelsQuery.data.length === 0 && (
          <p className="text-muted-foreground p-2 text-sm">No labels on this board yet.</p>
        )}
        <div className="flex flex-col gap-0.5">
          {(labelsQuery.data ?? []).map((label): ReactElement<FC> => {
            const isAssigned = assigned.has(label.id);

            return (
              <button
                key={label.id}
                type="button"
                className="hover:bg-accent flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm"
                onClick={(): void => onToggle(label.id, isAssigned)}
              >
                <span
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: label.color ?? '#64748b' }}
                />
                <span className="flex-1 truncate">{label.name}</span>
                {isAssigned && (
                  <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="size-4" />
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
