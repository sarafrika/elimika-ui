'use client';
import { useQuery } from '@tanstack/react-query';
import { Award, BookOpen, Download, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { STALE_TIMES } from '@/lib/query-client';
import { fetchStudentActivity } from '@/services/admin/user-profile-360';
import { SectionCard, SectionCardSkeleton } from '../../_components/ui/SectionCard';
import { StatusBadge } from '../../_components/ui/StatusBadge';

export function StudentActivityTab({ studentUuid, active }: { studentUuid: string; active: boolean }) {
  const { data, isLoading } = useQuery({
    queryKey: ['student-activity', studentUuid],
    queryFn: () => fetchStudentActivity(studentUuid),
    enabled: active,
    staleTime: STALE_TIMES.entity,
  });

  if (isLoading) {
    return (
      <div className='space-y-4'>
        <SectionCardSkeleton rows={3} />
        <SectionCardSkeleton rows={3} />
      </div>
    );
  }

  const courseEnrollments = data?.courseEnrollments ?? [];
  const classEnrollments = data?.classEnrollments ?? [];
  const certificates = data?.certificates ?? [];

  return (
    <div className='space-y-4'>
      <SectionCard title='Course enrollments' description='Courses this learner is enrolled in.'>
        {courseEnrollments.length ? (
          <div className='space-y-3'>
            {courseEnrollments.map(enrollment => (
              <div
                key={enrollment.enrollmentUuid ?? enrollment.courseUuid}
                className='rounded-md border border-border/60 bg-muted/20 p-3'
              >
                <div className='mb-2 flex items-center justify-between gap-3'>
                  <div className='flex min-w-0 items-center gap-2'>
                    <BookOpen className='size-4 shrink-0 text-muted-foreground' />
                    <p className='truncate text-sm font-medium text-foreground'>{enrollment.courseName}</p>
                  </div>
                  <StatusBadge status={enrollment.status} />
                </div>
                <div className='flex items-center gap-3'>
                  <Progress value={enrollment.progress} className='h-2' />
                  <span className='shrink-0 text-xs font-medium text-muted-foreground'>
                    {enrollment.progress}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className='text-sm text-muted-foreground'>No course enrollments.</p>
        )}
      </SectionCard>

      <SectionCard title='Class enrollments' description='Live classes this learner has joined.'>
        {classEnrollments.length ? (
          <div className='space-y-3'>
            {classEnrollments.map(enrollment => (
              <div
                key={enrollment.classUuid}
                className='flex items-center justify-between gap-3 rounded-md border border-border/60 bg-muted/20 p-3'
              >
                <div className='flex min-w-0 items-center gap-2'>
                  <GraduationCap className='size-4 shrink-0 text-muted-foreground' />
                  <div className='min-w-0'>
                    <p className='truncate text-sm font-medium text-foreground'>{enrollment.classTitle}</p>
                    <p className='truncate text-xs text-muted-foreground'>
                      {enrollment.scheduledInstanceCount} session
                      {enrollment.scheduledInstanceCount === 1 ? '' : 's'}
                      {enrollment.lastActivity ? ` · last active ${enrollment.lastActivity}` : ''}
                    </p>
                  </div>
                </div>
                <StatusBadge status={enrollment.status} />
              </div>
            ))}
          </div>
        ) : (
          <p className='text-sm text-muted-foreground'>No class enrollments.</p>
        )}
      </SectionCard>

      <SectionCard title='Certificates' description='Certificates this learner has earned.'>
        {certificates.length ? (
          <div className='space-y-3'>
            {certificates.map(cert => (
              <div
                key={cert.uuid ?? cert.number}
                className='flex items-center justify-between gap-3 rounded-md border border-border/60 bg-muted/20 p-3'
              >
                <div className='flex min-w-0 items-center gap-2'>
                  <Award className='size-4 shrink-0 text-muted-foreground' />
                  <div className='min-w-0'>
                    <p className='truncate text-sm font-medium text-foreground'>{cert.title}</p>
                    <p className='truncate font-mono text-xs text-muted-foreground'>
                      {cert.number || '—'}
                      {cert.grade ? ` · grade ${cert.grade}` : ''}
                      {cert.issuedDate ? ` · ${cert.issuedDate}` : ''}
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <StatusBadge status={cert.valid ? 'verified' : 'rejected'} label={cert.valid ? 'Valid' : 'Revoked'} />
                  {cert.downloadable && cert.url ? (
                    <Button size='sm' variant='outline' asChild>
                      <a href={cert.url} target='_blank' rel='noreferrer'>
                        <Download className='size-4' />
                        Open
                      </a>
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className='text-sm text-muted-foreground'>No certificates earned yet.</p>
        )}
      </SectionCard>
    </div>
  );
}
