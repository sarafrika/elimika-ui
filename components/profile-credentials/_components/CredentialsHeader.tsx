'use client';

import type { ChangeEvent } from 'react';
import { ChevronDown, Plus, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type CredentialsHeaderProps = {
  title: string;
  description: string;
  searchPlaceholder: string;
  addLabel: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onAddClick?: () => void;
};

export function CredentialsHeader({
  title,
  description,
  searchPlaceholder,
  addLabel,
  searchValue,
  onSearchChange,
  onAddClick,
}: CredentialsHeaderProps) {
  return (
    <header className='relative overflow-hidden rounded-[20px] border bg-[linear-gradient(135deg,color-mix(in_srgb,var(--background)_92%,var(--el-accent-azure)_8%),color-mix(in_srgb,var(--background)_88%,white_12%))] px-5 py-5 shadow-sm sm:px-6 lg:px-7'>
      <div className='pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] bg-[radial-gradient(circle_at_top_right,color-mix(in_srgb,var(--el-accent-azure)_18%,transparent),transparent_62%)] lg:block' />
      <div className='relative flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between'>
        <div className='space-y-1.5'>
          <h1 className='text-foreground text-3xl font-semibold tracking-tight'>{title}</h1>
          <p className='text-muted-foreground max-w-2xl text-base'>{description}</p>
        </div>

        <div className='flex w-full flex-col gap-3 sm:flex-row xl:w-auto xl:flex-nowrap'>
          <label className='relative block min-w-0 flex-1 sm:min-w-[320px] xl:min-w-[360px]'>
            <Search className='text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2' />
            <Input
              aria-label='Search credentials'
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(event: ChangeEvent<HTMLInputElement>) => onSearchChange?.(event.target.value)}
              className='h-11 rounded-xl border-white/60 bg-background/90 pr-12 pl-11 shadow-sm backdrop-blur'
            />
            <ChevronDown className='text-muted-foreground absolute top-1/2 right-4 size-4 -translate-y-1/2' />
          </label>

          <Button type='button' className='h-11 rounded-xl px-5 sm:px-6' onClick={onAddClick}>
            <Plus className='size-4' />
            {addLabel}
          </Button>
        </div>
      </div>
    </header>
  );
}
