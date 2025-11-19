import { Badge } from '@/components/ui/badge';
import type { CourseCreator } from '@/services/client';
import { BadgeCheckIcon, Trash2 } from 'lucide-react';
import type React from 'react';

interface CourseCreatorCardProps {
  courseCreator: CourseCreator;
  isSelected: boolean;
  onSelect: (courseCreator: CourseCreator) => void;
  onDelete: (courseCreator: CourseCreator) => void;
  getStatusBadgeComponent?: (courseCreatorId: string) => React.ReactElement;
}

export default function CourseCreatorCard({
  courseCreator,
  isSelected,
  onSelect,
  onDelete,
  getStatusBadgeComponent,
}: CourseCreatorCardProps) {
  return (
    <div
      className={`hover:bg-muted/50 cursor-pointer border-b p-4 transition-colors ${isSelected ? 'bg-muted' : ''}`}
      onClick={() => onSelect(courseCreator)}
    >
      <div className='flex items-start justify-between'>
        <div className='min-w-0 flex-1'>
          <div className='mb-1 flex items-center gap-2'>
            <h3 className='truncate text-sm font-medium'>{courseCreator.full_name || 'N/A'}</h3>
          </div>
          <p className='text-muted-foreground mb-1 truncate text-xs'>
            {courseCreator.professional_headline || 'Professional'}
          </p>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Badge variant={courseCreator?.admin_verified ? 'success' : 'secondary'}>
                {courseCreator?.admin_verified ? (
                  <>
                    <BadgeCheckIcon />
                    Verified
                  </>
                ) : (
                  'Pending'
                )}
              </Badge>
              <span className='text-muted-foreground text-xs'>
                {courseCreator.created_date
                  ? new Date(courseCreator.created_date).toLocaleDateString()
                  : 'N/A'}
              </span>
            </div>
            <button
              onClick={e => {
                e.stopPropagation();
                onDelete(courseCreator);
              }}
              className='text-muted-foreground hover:text-destructive'
            >
              <Trash2 className='h-4 w-4' />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
