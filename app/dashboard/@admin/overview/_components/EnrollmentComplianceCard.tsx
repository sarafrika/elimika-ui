'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPercentage } from '@/lib/metrics';
import { Baby, Ban, Shield } from 'lucide-react';

export type EnrollmentComplianceMetrics = {
  age_gate_enrollments_30d?: number;
  age_gate_denials_30d?: number;
  age_restriction_exceptions_30d?: number;
  missing_dob_percentage?: number;
  courses_with_exceptions?: Array<{
    course_name?: string;
    exception_count?: number;
    course_uuid?: string;
  }>;
};

interface EnrollmentComplianceCardProps {
  metrics?: EnrollmentComplianceMetrics;
}

export function EnrollmentComplianceCard({ metrics }: EnrollmentComplianceCardProps) {
  const hasData =
    metrics &&
    (metrics.age_gate_enrollments_30d ||
      metrics.age_gate_denials_30d ||
      metrics.age_restriction_exceptions_30d ||
      metrics.missing_dob_percentage ||
      metrics.courses_with_exceptions?.length);

  const topCourses = metrics?.courses_with_exceptions?.slice(0, 3) ?? [];

  return (
    <Card>
      <CardHeader className='space-y-1'>
        <CardTitle className='text-base font-semibold'>Enrollment compliance</CardTitle>
        <CardDescription>Age gate performance and identity completeness.</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {hasData ? (
          <>
            <div className='grid grid-cols-2 gap-3 text-sm'>
              <div className='border-border/60 rounded-xl border p-3'>
                <p className='text-muted-foreground text-xs uppercase'>Age-gated enrollments</p>
                <p className='text-2xl font-semibold'>{metrics?.age_gate_enrollments_30d ?? '—'}</p>
              </div>
              <div className='border-border/60 rounded-xl border p-3'>
                <p className='text-muted-foreground text-xs uppercase'>Age gate denials</p>
                <p className='text-2xl font-semibold'>
                  {metrics?.age_gate_denials_30d ?? metrics?.age_restriction_exceptions_30d ?? '—'}
                </p>
              </div>
              <div className='border-border/60 rounded-xl border p-3'>
                <p className='text-muted-foreground text-xs uppercase'>Missing DOB</p>
                <p className='text-2xl font-semibold'>
                  {metrics?.missing_dob_percentage !== undefined
                    ? formatPercentage(metrics.missing_dob_percentage, { fractionDigits: 1 })
                    : '—'}
                </p>
              </div>
              <div className='border-border/60 rounded-xl border p-3'>
                <p className='text-muted-foreground text-xs uppercase'>Exceptions</p>
                <p className='text-2xl font-semibold'>
                  {metrics?.age_restriction_exceptions_30d ?? metrics?.age_gate_denials_30d ?? '—'}
                </p>
              </div>
            </div>

            {topCourses.length > 0 && (
              <div className='space-y-2'>
                <p className='text-muted-foreground text-xs font-semibold uppercase'>
                  Top exception sources
                </p>
                <div className='space-y-2'>
                  {topCourses.map(course => (
                    <div
                      key={course.course_uuid ?? course.course_name}
                      className='border-border/60 flex items-center justify-between rounded-xl border border-dashed px-3 py-2 text-sm'
                    >
                      <div>
                        <p className='font-medium'>{course.course_name ?? 'Untitled course'}</p>
                        <p className='text-muted-foreground text-xs'>
                          {course.exception_count ?? 0} exceptions
                        </p>
                      </div>
                      <Badge variant='outline'>Course</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className='border-border/60 space-y-3 rounded-2xl border border-dashed p-4 text-sm'>
            <p className='font-medium'>No enrollment compliance telemetry yet.</p>
            <p className='text-muted-foreground text-xs'>
              Once the platform emits age-gate analytics, they will surface here automatically.
            </p>
            <div className='text-muted-foreground flex flex-wrap gap-2 text-xs'>
              <Badge variant='outline'>
                <Shield className='mr-1 h-3 w-3' />
                Age gate
              </Badge>
              <Badge variant='outline'>
                <Baby className='mr-1 h-3 w-3' />
                DOB coverage
              </Badge>
              <Badge variant='outline'>
                <Ban className='mr-1 h-3 w-3' />
                Exceptions
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
