import { BadgeCheck, SlidersHorizontal } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SkillsFundSortValue } from '../data';

type SkillsFundToolbarProps = {
  filterCount: number;
  matchedScore: number;
  sortValue: SkillsFundSortValue;
  onSortChange: (value: SkillsFundSortValue) => void;
};

export function SkillsFundToolbar({
  filterCount,
  matchedScore,
  sortValue,
  onSortChange,
}: SkillsFundToolbarProps) {
  return (
    <div className='flex flex-col gap-3 rounded-[10px] border border-slate-200 bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between'>
      <div className='flex flex-wrap items-center gap-3 text-[0.82rem] font-medium text-slate-600 sm:text-[0.88rem]'>
        <span className='inline-flex items-center gap-2 text-slate-700'>
          <SlidersHorizontal className='size-4' />
          {filterCount}
        </span>
        <span>{matchedScore}</span>
        <span>Matched: Score</span>
        <span className='inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1'>
          <span className='h-3.5 w-5 rounded bg-green-500' />
          <BadgeCheck className='size-3.5 text-slate-400' />
        </span>
      </div>

      <div className='flex items-center gap-2 self-start sm:self-auto'>
        <span className='text-sm font-semibold text-blue-600'>Sort by</span>
        <Select value={sortValue} onValueChange={value => onSortChange(value as SkillsFundSortValue)}>
          <SelectTrigger className='h-9 w-[148px] border-slate-200 text-sm'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='best-match'>Best Match</SelectItem>
            <SelectItem value='highest-support'>Highest Support</SelectItem>
            <SelectItem value='recommended'>Recommended</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
