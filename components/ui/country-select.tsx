'use client';

import { useMemo } from 'react';
import { getCountries } from 'react-phone-number-input';
import countryLabels from 'react-phone-number-input/locale/en.json';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const NONE = '__none__';

/**
 * Country list is taken from the phone-number metadata already bundled for
 * `PhoneInput`, so the two fields can never disagree on what a country is.
 */
function useCountryOptions() {
  return useMemo(
    () =>
      getCountries()
        .map(code => ({ code, label: (countryLabels as Record<string, string>)[code] ?? code }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    []
  );
}

export type CountrySelectProps = {
  /** Stored as the English country name, matching what the API already holds. */
  value?: string | null;
  onChange?: (value: string | undefined) => void;
  onBlur?: () => void;
  name?: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function CountrySelect({
  value,
  onChange,
  onBlur,
  name,
  id,
  placeholder = 'Select a country',
  disabled,
  className,
}: CountrySelectProps) {
  const options = useCountryOptions();
  const current = value?.trim() ? value.trim() : NONE;
  // A country can arrive from the Mapbox result rather than this list; keep it
  // selectable so an existing record never silently renders as unset.
  const unlisted =
    current !== NONE && !options.some(option => option.label === current) ? current : null;

  return (
    <Select
      value={current}
      onValueChange={next => onChange?.(next === NONE ? undefined : next)}
      disabled={disabled}
    >
      <SelectTrigger id={id} name={name} onBlur={onBlur} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>{placeholder}</SelectItem>
        {unlisted ? <SelectItem value={unlisted}>{unlisted}</SelectItem> : null}
        {options.map(option => (
          <SelectItem key={option.code} value={option.label}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
