import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Calendar03Icon } from '@hugeicons/core-free-icons';
import { formatDate } from '@lib/utils/format-date';
import { Button } from '@components/ui/button';
import { Calendar } from '@components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@components/ui/popover';
import type { FC, ReactElement } from 'react';

type DueDatePickerProps = {
  dueDate: string | null;
  disabled?: boolean;
  onChange: (dueDate: string | null) => void;
};

export function DueDatePicker({ dueDate, disabled = false, onChange }: DueDatePickerProps): ReactElement<FC> {
  const [open, setOpen] = useState(false);
  const selected = dueDate != null ? new Date(dueDate) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="outline" size="sm" disabled={disabled} />}>
        <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-4" />
        {dueDate != null ? formatDate(dueDate) : 'Due date'}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date: Date | undefined): void => {
            onChange(date != null ? date.toISOString() : null);
            setOpen(false);
          }}
        />
        {dueDate != null && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={(): void => {
                onChange(null);
                setOpen(false);
              }}
            >
              Clear due date
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
