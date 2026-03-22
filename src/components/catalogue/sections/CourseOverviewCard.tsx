import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCourseDuration, formatPricingLabel } from '@/src/lib/catalogue/format';
import type { PublicCourseDetail } from '@/src/lib/catalogue/types';
import { Calendar } from 'lucide-react';

type SummaryRowProps = {
  label: string;
  value: string;
};

function SummaryRow({ label, value }: SummaryRowProps) {
  return (
    <div className='flex items-center justify-between gap-4 text-sm'>
      <span className='text-muted-foreground'>{label}</span>
      <span className='text-foreground text-right font-medium'>{value}</span>
    </div>
  );
}

export function CourseOverviewCard({ detail }: { detail: PublicCourseDetail }) {
  const { course, creatorName, lessons } = detail;
  const durationLabel = formatCourseDuration(course);

  return (
    <Card className='border-border bg-card sticky top-24 rounded-[28px] border shadow-xl'>
      <CardHeader className='space-y-4'>
        <div className='space-y-2'>
          <CardTitle className='text-foreground text-2xl'>Course overview</CardTitle>
          <CardDescription className='text-muted-foreground'>
            {creatorName ? `Published by ${creatorName}` : 'Publisher not provided'}
          </CardDescription>
        </div>

        <Separator className='bg-border' />

        <div className='space-y-3'>
          {durationLabel ? <SummaryRow label='Duration' value={durationLabel} /> : null}
          {lessons.length > 0 ? <SummaryRow label='Lessons' value={`${lessons.length}`} /> : null}
          <SummaryRow label='Pricing' value={formatPricingLabel(detail)} />
          {course.accepts_new_enrollments !== undefined ? (
            <SummaryRow
              label='Enrollments'
              value={course.accepts_new_enrollments ? 'Open' : 'Closed'}
            />
          ) : null}
        </div>
      </CardHeader>

      <CardContent className='space-y-3'>
        <Button
          size='lg'
          disabled={!course.is_published || course.accepts_new_enrollments === false}
          className='bg-primary hover:bg-primary/90 w-full rounded-full text-base font-semibold shadow-lg transition'
        >
          {course.accepts_new_enrollments === false
            ? 'Enrollments closed'
            : course.is_published
              ? 'Enroll now'
              : 'Not available'}
        </Button>
        {creatorName ? (
          <div className='border-border bg-muted/40 text-muted-foreground rounded-[16px] border px-4 py-3 text-xs'>
            <div className='flex items-center gap-2'>
              <Calendar className='text-primary h-4 w-4' />
              <span>Created by {creatorName}</span>
            </div>
            {course.updated_date ? (
              <div className='mt-1 text-[11px]'>
                Updated on {course.updated_date.toLocaleDateString()}
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
