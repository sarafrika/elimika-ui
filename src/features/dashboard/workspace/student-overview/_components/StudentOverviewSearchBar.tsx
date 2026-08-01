'use client';

import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

type StudentOverviewSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

export function StudentOverviewSearchBar({
  value,
  onChange,
  placeholder,
}: StudentOverviewSearchBarProps) {
  return (
    <label className='relative block'>
      <Search className='text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2' />
      <Input
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        className='border-border bg-card placeholder:text-muted-foreground h-10 rounded-md pl-11 text-sm shadow-sm'
      />
    </label>
  );
}
