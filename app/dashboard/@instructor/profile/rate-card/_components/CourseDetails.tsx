'use client';

import RichTextRenderer from '@/components/editors/richTextRenders';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import type { Course } from '@/services/client';

interface CourseDetailsProps {
  course: Course;
  className?: string;
}

export default function CourseDetails({ course, className = '' }: CourseDetailsProps) {
  // @ts-ignore
  const rates = course?.application?.rate_card || {};

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

            <div className='grid grid-cols-2 gap-4 border-t pt-4'>
              <div>
                <p className='text-muted-foreground text-sm font-medium'>Pricing:</p>
                {/* <p className='text-sm'>
                  {course?.is_free ? 'Free Course' : `${course?.minimum_training_fee}`}
                </p> */}
              </div>
            </div>

            <div className='mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2'>
              {/* Private Online */}
              <div className='rounded-xl border p-4 shadow-sm transition hover:shadow-md'>
                <h3 className='text-lg font-semibold'>Private Online</h3>
                <p className='text-muted-foreground text-sm'>Rate per hour per head</p>
                <p className='mt-2 text-xl font-bold'>
                  {rates?.currency} {rates?.private_online_rate}
                </p>
              </div>

              {/* Private In-Person */}
              <div className='rounded-xl border p-4 shadow-sm transition hover:shadow-md'>
                <h3 className='text-lg font-semibold'>Private In-person</h3>
                <p className='text-muted-foreground text-sm'>Rate per hour per head</p>
                <p className='mt-2 text-xl font-bold'>
                  {rates?.currency} {rates?.private_inperson_rate}
                </p>
              </div>

              {/* Group Online */}
              <div className='rounded-xl border p-4 shadow-sm transition hover:shadow-md'>
                <h3 className='text-lg font-semibold'>Group Online</h3>
                <p className='text-muted-foreground text-sm'>Rate per hour per head</p>
                <p className='mt-2 text-xl font-bold'>
                  {rates?.currency} {rates?.group_online_rate}
                </p>
              </div>

              {/* Group In-Person */}
              <div className='rounded-xl border p-4 shadow-sm transition hover:shadow-md'>
                <h3 className='text-lg font-semibold'>Group In-person</h3>
                <p className='text-muted-foreground text-sm'>Rate per hour per head</p>
                <p className='mt-2 text-xl font-bold'>
                  {rates?.currency} {rates?.group_inperson_rate}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
