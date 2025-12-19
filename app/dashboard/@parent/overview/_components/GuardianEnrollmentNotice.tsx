'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { GuardianComplianceNotice } from '@/services/guardian';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

interface GuardianEnrollmentNoticeProps {
  notice?: GuardianComplianceNotice | null;
}

export function GuardianEnrollmentNotice({ notice }: GuardianEnrollmentNoticeProps) {
  if (!notice) {
    return null;
  }

  const ageRangeLabel =
    notice.allowed_age_range ??
    (notice.min_age && notice.max_age
      ? `${notice.min_age}-${notice.max_age} yrs`
      : notice.min_age
        ? `Above ${notice.min_age} yrs`
        : notice.max_age
          ? `Up to ${notice.max_age} yrs`
          : null);

  return (
    <Alert variant='default' className='border-warning/60 bg-warning/10 text-warning-foreground'>
      <ShieldAlert className='size-4' />
      <div>
        <AlertTitle className='font-semibold'>
          Age restriction blocked {notice.course_name ?? 'a course'} enrollment
        </AlertTitle>
        <AlertDescription className='mt-3 space-y-2 text-sm'>
          <p>{notice.message ?? 'The course requires guardian confirmation before proceeding.'}</p>
          {ageRangeLabel ? (
            <p className='text-xs italic'>
              Allowed age range:{' '}
              <span className='text-foreground font-medium'>{ageRangeLabel}</span>
            </p>
          ) : null}
          <div className='flex flex-wrap gap-2 pt-2'>
            <Button asChild size='sm' variant='outline'>
              <Link href='/dashboard/profile'>Confirm date of birth</Link>
            </Button>
            <Button
              asChild
              size='sm'
              variant='secondary'
              className='bg-primary/10 text-primary hover:bg-primary/20'
            >
              <Link
                href={`/dashboard/browse-courses?age=${notice.student_age ?? ''}`}
                prefetch={false}
              >
                Find age-appropriate courses
              </Link>
            </Button>
          </div>
        </AlertDescription>
      </div>
    </Alert>
  );
}
