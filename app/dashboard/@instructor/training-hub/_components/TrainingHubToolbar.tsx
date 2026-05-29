'use client';

import { Button } from '@/components/ui/button';

import { trainingHubTypeFilters, } from './training-hub-data';


type TrainingHubToolbarProps = {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  selectedType: (typeof trainingHubTypeFilters)[number]['value'];
  onTypeChange: (value: (typeof trainingHubTypeFilters)[number]['value']) => void;
};

export function TrainingHubToolbar({
  searchTerm,
  onSearchTermChange,
  selectedType,
  onTypeChange,
}: TrainingHubToolbarProps) {
  return (
    <section aria-label='Training hub filters' className='space-y-3'>
      {/* <div className='flex flex-col gap-3 min-[900px]:flex-row min-[900px]:items-center min-[900px]:gap-2'>
        <Label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-[10px] border border-border/60 bg-background px-3 text-muted-foreground focus-within:ring-2 focus-within:ring-ring">
          <Search className="size-4 shrink-0" />
          <span className="sr-only">Search courses or classes</span>

          <Input
            type="search"
            aria-label="Search courses or classes"
            placeholder="Search courses or classes..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="w-full min-w-0 border-none bg-transparent p-0 text-[0.9rem] text-foreground shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0 sm:text-[0.95rem]"
          />
        </Label>

        <div className='flex items-center gap-2'>
          <Button
            type='button'
            variant='outline'
            aria-label='Change view'
            className='h-11 rounded-[10px] border-border/60 bg-background px-4 text-muted-foreground'
          >
            All views
          </Button>
        </div>
      </div> */}

      <div className='space-y-3 my-3'>
        <div className='flex flex-wrap gap-2'>
          {trainingHubTypeFilters.map(filter => {
            const isActive = filter.value === selectedType;

            return (
              <Button
                key={filter.value}
                type='button'
                variant={isActive ? 'default' : 'outline'}
                onClick={() => onTypeChange(filter.value)}
                className='h-9 rounded-full px-4 text-xs'
              >
                {filter.label}
              </Button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
