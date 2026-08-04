import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { UserIcon } from '@hugeicons/core-free-icons';
import { useProfiles } from '@lib/hooks/use-labels';
import { profileLabel } from '@lib/utils/format-date';
import { Button } from '@components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@components/ui/popover';
import type { FC, ReactElement } from 'react';

type AssigneePickerProps = {
  assignee: string | null;
  assigneeName: string;
  disabled?: boolean;
  onChange: (assignee: string | null) => void;
};

export function AssigneePicker({ assignee, assigneeName, disabled = false, onChange }: AssigneePickerProps): ReactElement<FC> {
  const [open, setOpen] = useState(false);
  const profilesQuery = useProfiles();

  const select = (next: string | null): void => {
    setOpen(false);
    onChange(next);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="outline" size="sm" disabled={disabled} />}>
        <HugeiconsIcon icon={UserIcon} strokeWidth={2} className="size-4" />
        {assignee != null ? assigneeName : 'Assign'}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-0">
        <Command>
          <CommandInput placeholder="Search people…" />
          <CommandList>
            <CommandEmpty>No people found.</CommandEmpty>
            <CommandGroup>
              <CommandItem value="unassigned" onSelect={(): void => select(null)}>
                Unassigned
              </CommandItem>
              {(profilesQuery.data ?? []).map((profile): ReactElement<FC> => (
                <CommandItem
                  key={profile.user_id}
                  value={`${profileLabel(profile)} ${profile.username ?? ''}`}
                  onSelect={(): void => select(profile.user_id)}
                >
                  {profileLabel(profile)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
