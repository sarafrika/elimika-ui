'use client';

import RichTextRenderer from '@/components/editors/richTextRenders';
import { RateCardGrid } from '@/components/rate-card/rate-card-grid';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { DEFAULT_CURRENCY, type RateCard } from '@/lib/rate-card';
import type { CourseWithApplication } from './types';

interface CourseDetailsProps {
  course: CourseWithApplication;
  className?: string;
}

export default function CourseDetails({ course, className = '' }: CourseDetailsProps) {
  const rates: RateCard | undefined = course.application?.rate_card;

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader className='pb-4'>
          <div className='flex flex-col space-y-4'>
            <div className='grid grid-cols-2 items-center'>
              <div className='flex flex-row items-center gap-2'>
                <p className='text-muted-foreground text-sm font-medium'>Course ID:</p>
                <p className='font-mono text-sm'>{course.uuid?.slice(0, 8) || 'N/A'}</p>
              </div>
              <div className='flex flex-row items-center gap-2'>
                <p className='text-muted-foreground text-sm font-medium'>Status:</p>
                <Badge
                  variant={
                    course?.is_archived ? 'warning' : course?.is_published ? 'success' : 'secondary'
                  }
                >
                  {course?.is_archived ? (
                    <>Archived</>
                  ) : course?.is_published ? (
                    <>Published</>
                  ) : (
                    <>Draft</>
                  )}
                </Badge>
                <Badge variant={course?.active ? 'success' : 'secondary'}>
                  {course?.active ? <>Active</> : <>Inactive</>}
                </Badge>
              </div>
            </div>

            <div className='flex items-start justify-between'>
              <div className='space-y-2'>
                <CardTitle className='text-2xl font-bold'>
                  {course?.name || 'Course name not provided'}
                </CardTitle>

                <div className='text-muted-foreground text-sm'>
                  <RichTextRenderer
                    maxChars={300}
                    htmlString={course?.description || 'No description provided'}
                  />
                </div>

                {course?.category_names?.map((category: string, idx: number) => (
                  <span
                    key={idx}
                    className='bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-medium'
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>

            <div className='space-y-2 border-t pt-4'>
              <p className='text-muted-foreground text-sm font-medium'>
                Rates per learner ({rates?.currency || DEFAULT_CURRENCY})
              </p>
              <RateCardGrid mode='view' value={rates} />
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
