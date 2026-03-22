import { Users } from 'lucide-react';
import { CatalogueSectionCard } from '../CatalogueSectionCard';

export function CourseRequirementsSection({ prerequisites }: { prerequisites: string[] }) {
  return (
    <CatalogueSectionCard title='Requirements' icon={Users}>
      {prerequisites.length > 0 ? (
        <ul className='text-muted-foreground space-y-2 text-sm'>
          {prerequisites.map(item => (
            <li key={item} className='flex items-start gap-3'>
              <span className='bg-primary mt-1 size-1.5 rounded-full' />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className='text-muted-foreground text-sm'>No prerequisites specified.</p>
      )}
    </CatalogueSectionCard>
  );
}
