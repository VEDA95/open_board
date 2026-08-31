import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@components/ui/combobox';
import type { FC, ReactElement } from 'react';

export type ComboOption = { value: string; label: string };

type RoleComboboxProps = {
  options: Array<ComboOption>;
  value: string | null;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onChange: (value: string) => void;
};

// Searchable single-select composed from the official shadcn/Base UI combobox.
// Used where the option list can grow (roles, users) — plain Select elsewhere.
export function RoleCombobox({
  options,
  value,
  placeholder = 'Select…',
  disabled = false,
  className,
  onChange,
}: RoleComboboxProps): ReactElement<FC> {
  const selected = options.find((option): boolean => option.value === value) ?? null;

  return (
    <Combobox
      items={options}
      value={selected}
      disabled={disabled}
      itemToStringLabel={(item: ComboOption): string => item.label}
      itemToStringValue={(item: ComboOption): string => item.label}
      isItemEqualToValue={(a: ComboOption, b: ComboOption): boolean => a.value === b.value}
      onValueChange={(item: ComboOption | null): void => {
        if (item != null) onChange(item.value);
      }}
    >
      <ComboboxInput placeholder={placeholder} className={className} />
      <ComboboxContent>
        <ComboboxEmpty>No results.</ComboboxEmpty>
        <ComboboxList>
          {(item: ComboOption): ReactElement<FC> => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
