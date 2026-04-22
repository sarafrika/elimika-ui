import type {
  ProficiencyFilter,
  VerifiedSkillGroup,
} from '@/app/dashboard/_components/my-skills/verified-skills/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const primaryTabs: VerifiedSkillGroup[] = [
  'All Skills',
  'Technical Skills',
  'Soft Skills',
  'Micro-Credentials',
];
const proficiencyOptions: ProficiencyFilter[] = [
  'All Levels',
  'Advanced',
  'Intermediate',
  'Beginner',
];

type VerifiedSkillsTopBarProps = {
  activeGroup: VerifiedSkillGroup;
  proficiencyFilter: ProficiencyFilter;
  onGroupChange: (group: VerifiedSkillGroup) => void;
  onProficiencyFilterChange: (filter: ProficiencyFilter) => void;
};

export function VerifiedSkillsTopBar({
  activeGroup,
  proficiencyFilter,
  onGroupChange,
  onProficiencyFilterChange,
}: VerifiedSkillsTopBarProps) {
  return (
    <header className='border-border/60 bg-card rounded-lg border'>
      <div className='flex flex-col gap-3 px-3 py-2 sm:px-4'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <nav aria-label='Verified skill groups' className='flex min-w-0 flex-wrap gap-1'>
            {primaryTabs.map(tab => (
              <button
                key={tab}
                type='button'
                onClick={() => onGroupChange(tab)}
                aria-pressed={activeGroup === tab}
                className={
                  activeGroup === tab
                    ? 'text-foreground border-primary border-b-2 px-2 py-1.5 text-xs font-semibold sm:text-sm'
                    : 'text-muted-foreground hover:text-foreground px-2 py-1.5 text-xs font-medium sm:text-sm'
                }
              >
                {tab}
              </button>
            ))}
          </nav>

          <div className='flex items-center gap-2'>
            <span className='text-muted-foreground text-[10px]'>Order by</span>
            <Select
              value={proficiencyFilter}
              onValueChange={value => onProficiencyFilterChange(value as ProficiencyFilter)}
            >
              <SelectTrigger className='h-7 w-[150px] rounded-md text-[10px]'>
                <SelectValue placeholder='Proficiency Level' />
              </SelectTrigger>
              <SelectContent>
                {proficiencyOptions.map(option => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </header>
  );
}
