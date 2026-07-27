import { Check } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { competencyTags } from './assessment-data';

export function CompetencyChecklist() {
  const completed = competencyTags.filter(tag => tag.checked).length;

  return (
    <section className='border-border bg-card rounded-md border p-4 shadow-xs'>
      <h3 className='text-foreground text-lg font-semibold'>Competency Checklist</h3>

      <div className='border-border bg-background mt-3 overflow-hidden rounded-md border'>
        {competencyTags.map(tag => (
          <label
            className='border-border flex min-h-9 cursor-pointer items-center gap-3 border-b px-3 text-sm last:border-b-0'
            key={tag.label}
          >
            <span
              className={cn(
                'border-border inline-flex size-4 items-center justify-center rounded-sm border',
                tag.checked && 'border-success bg-success text-success-foreground'
              )}
            >
              {tag.checked && <Check className='size-3' />}
            </span>
            <span
              className={cn(
                'font-medium',
                tag.checked ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {tag.label}
            </span>
          </label>
        ))}
      </div>

      <div className='mt-4 flex items-center gap-3'>
        <Progress className='h-2 flex-1' value={(completed / competencyTags.length) * 100} />
        <span className='text-muted-foreground text-sm'>
          {completed} of {competencyTags.length} Competencies Verified
        </span>
      </div>
    </section>
  );
}
