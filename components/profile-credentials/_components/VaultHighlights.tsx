'use client';

import type { LucideIcon } from 'lucide-react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Eye,
  RotateCcw,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { CredentialsStatusFilter } from '../data';

type VaultHighlightsProps = {
  badges: string;
  blockchain: string;
  shares: string;
  statusFilter: CredentialsStatusFilter;
  onStatusFilterChange: (value: CredentialsStatusFilter) => void;
};

const filterLabels: Record<CredentialsStatusFilter, string> = {
  all: 'All',
  verified: 'Verified',
  pending: 'Pending',
  rejected: 'Rejected',
};

const filterIcons: Record<CredentialsStatusFilter, LucideIcon> = {
  all: RotateCcw,
  verified: CheckCircle2,
  pending: Clock3,
  rejected: ShieldAlert,
};

export function VaultHighlights({
  badges,
  blockchain,
  shares,
  statusFilter,
  onStatusFilterChange,
}: VaultHighlightsProps) {
  const ActiveFilterIcon = filterIcons[statusFilter];

  return (
    <div className='flex flex-wrap gap-3'>
      <Card className='min-w-[180px] flex-1 rounded-[16px] border-white/60 bg-card/95 px-5 py-4 shadow-sm'>
        <div className='flex items-center gap-2 text-lg font-semibold'>
          <span className='text-primary'>⊞</span>
          {badges}
        </div>
      </Card>

      <Card className='min-w-[240px] flex-[1.2] rounded-[16px] border-white/60 bg-card/95 px-5 py-4 shadow-sm'>
        <div className='flex items-center justify-between gap-3'>
          <div className='flex items-center gap-2 text-base font-medium'>
            <Eye className='text-success size-4' />
            {blockchain}
          </div>
          <ChevronRight className='text-muted-foreground size-4' />
        </div>
      </Card>

      <Card className='min-w-[220px] flex-1 rounded-[16px] border-white/60 bg-card/95 px-5 py-4 shadow-sm'>
        <div className='flex items-center gap-2 text-lg font-semibold'>
          <span className='text-primary'>⊟</span>
          {shares}
        </div>
      </Card>

      <Card className='min-w-[220px] flex-1 rounded-[16px] border-white/60 bg-card/95 px-4 py-3 shadow-sm'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div className='flex items-center gap-2'>
            <div className='bg-primary/10 text-primary grid size-9 place-items-center rounded-full'>
              <ActiveFilterIcon className='size-4' />
            </div>
            <div>
              <div className='text-sm font-medium'>Filter</div>
              <div className='text-muted-foreground text-xs'>{filterLabels[statusFilter]}</div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='outline'
                size='sm'
                className={
                  statusFilter === 'all'
                    ? 'rounded-xl border-white/70 bg-background/80'
                    : 'rounded-xl border-primary/40 bg-primary/5 text-foreground'
                }
              >
                <SlidersHorizontal className='size-4' />
                {filterLabels[statusFilter]}
                <ChevronDown className='size-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-56'>
              <DropdownMenuRadioGroup
                value={statusFilter}
                onValueChange={value => onStatusFilterChange(value as CredentialsStatusFilter)}
              >
                <DropdownMenuRadioItem value='all'>All</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value='verified'>Verified</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value='pending'>Pending review</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value='rejected'>Rejected</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>
    </div>
  );
}
