import RichTextRenderer from '@/components/editors/richTextRenders';
import { Badge } from '@/components/ui/badge';
import { Course } from '@/services/client';
import { BadgeCheckIcon, Trash2 } from 'lucide-react';

interface CourseCardProps {
  course: Course;
  isSelected: boolean;
  onSelect: (course: Course) => void;
  onDelete: (course: Course) => void;
}

export default function CourseCard({ course, isSelected, onSelect, onDelete }: CourseCardProps) {
  return (
    <div
      className={`hover:bg-muted/50 cursor-pointer border-b p-4 transition-colors ${isSelected ? 'bg-muted' : ''}`}
      onClick={() => onSelect(course)}
    >
      <div className='flex items-start justify-between'>
        <div className='min-w-0 flex-1'>
          <div className='mb-1 flex items-center gap-2'>
            <h3 className='truncate text-sm font-medium'>
              {course.name || 'Course name not provided'}
            </h3>
          </div>
          <div className='text-muted-foreground mb-1 line-clamp-3 w-[95%] truncate text-xs lg:line-clamp-0 lg:w-full'>
            <RichTextRenderer htmlString={course.description || 'No description provided'} />
          </div>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Badge variant={course?.status === 'published' ? 'success' : 'secondary'}>
                {course?.status === 'published' ? (
                  <>
                    <BadgeCheckIcon />
                    Published
                  </>
                ) : (
                  'Draft'
                )}
              </Badge>
              <span className='text-muted-foreground text-xs'>
                {course.created_date ? new Date(course.created_date).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <button
              onClick={e => {
                e.stopPropagation();
                onDelete(course);
              }}
              className='text-muted-foreground hover:text-destructive'
              // disabled={true}
            >
              <Trash2 className='h-4 w-4' />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
