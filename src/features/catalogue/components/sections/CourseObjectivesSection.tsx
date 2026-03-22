import { CheckCircle2, Target } from 'lucide-react';
import { CatalogueSectionCard } from '../CatalogueSectionCard';

export function CourseObjectivesSection({ objectives }: { objectives: string[] }) {
  return (
    <CatalogueSectionCard title="What you'll learn" icon={Target}>
      {objectives.length > 0 ? (
        <ul className='grid gap-3 sm:grid-cols-2'>
          {objectives.map(item => (
            <li key={item} className='text-muted-foreground flex items-start gap-3'>
              <CheckCircle2 className='text-primary h-5 w-5 shrink-0' />
              <span className='text-sm'>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className='text-muted-foreground text-sm'>No objectives provided for this course yet.</p>
      )}
    </CatalogueSectionCard>
  );
}
