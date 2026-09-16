'use client';

import { Check } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { OrgPage } from '@/app/dashboard/organisation/_components/org-page';
import { PageHeader } from '@/components/dashboard';
import { cn } from '@/lib/utils';
import { PickJobStep } from '@/src/features/organisation/classes/new/pick-job-step';
import { ReviewCreateStep } from '@/src/features/organisation/classes/new/review-create-step';

const STEPS = [
  { title: 'Pick the job', detail: 'Only jobs with a hired instructor' },
  { title: 'Review and create', detail: 'Everything is carried over' },
];

export default function OrganisationCreateClassPage() {
  const searchParams = useSearchParams();
  const jobUuid = searchParams.get('job')?.trim() ?? '';
  const [createdFor, setCreatedFor] = useState<string | null>(null);
  const current = createdFor && createdFor === jobUuid ? 2 : jobUuid ? 1 : 0;

  return (
    <OrgPage className='space-y-5'>
      <PageHeader
        title='Create a class'
        description="A class starts from a job you've hired for. It takes everything from that job, so nothing is entered twice and the job's holds become the class's bookings."
      />

      <ol className='border-border/70 bg-card grid gap-3 rounded-md border px-4 py-3 shadow-sm sm:grid-cols-2 sm:px-5'>
        {STEPS.map((step, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <li key={step.title} className='flex items-center gap-2.5'>
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                  done
                    ? 'border-primary bg-primary text-primary-foreground'
                    : active
                      ? 'border-primary text-primary border-2'
                      : 'text-muted-foreground'
                )}
              >
                {done ? <Check className='h-3 w-3' /> : index + 1}
              </span>
              <div>
                <p
                  className={cn(
                    'text-sm font-semibold',
                    !done && !active && 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </p>
                <p className='text-muted-foreground text-xs'>{step.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>

      {jobUuid ? (
        <ReviewCreateStep
          key={jobUuid}
          jobUuid={jobUuid}
          onCreated={() => setCreatedFor(jobUuid)}
        />
      ) : (
        <PickJobStep
          courseUuid={searchParams.get('courseUuid')?.trim() || null}
          instructorUuid={searchParams.get('instructorUuid')?.trim() || null}
        />
      )}
    </OrgPage>
  );
}
