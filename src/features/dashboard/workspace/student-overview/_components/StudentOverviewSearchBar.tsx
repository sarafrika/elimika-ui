'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

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
        className='h-14 rounded-[18px] border-white/70 bg-white/80 pl-11 text-sm shadow-[0_18px_40px_-30px_rgba(37,99,235,0.4)] placeholder:text-slate-400'
      />
    </label>
  );
}
