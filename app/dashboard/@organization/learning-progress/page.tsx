'use client';

import { useQuery } from '@tanstack/react-query';
import { GraduationCap, Layers2, LineChart as LineChartIcon, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { useOrganisation } from '@/context/organisation-context';
import { useCoursesByIds, useProgramsByIds } from '@/hooks/use-batched-lookups';
import type { ClassDefinition } from '@/services/client';
import { getClassDefinitionsForOrganisationOptions } from '@/services/client/@tanstack/react-query.gen';
import {
  AdminPageHeader,
  adminTheme,
  SectionCard,
  StatCard,
  StatCardSkeleton,
} from '../_components/ui';
import { ProgramCompletionRate } from './_components/program-completion-rate';

const pct = (value?: number | null): string =>
  value === undefined || value === null ? '—' : `${Math.round(Number(value))}%`;
const num = (value?: bigint | number | null): string =>
  value === undefined || value === null ? '—' : Number(value).toLocaleString();

export default function OrganisationLearningProgressPage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';

  const classesQuery = useQuery({
    ...getClassDefinitionsForOrganisationOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
  });

  const classes = useMemo(
    () =>
      (classesQuery.data?.data ?? [])
        .map(item => item.class_definition)
        .filter((c): c is ClassDefinition => Boolean(c?.uuid)),
    [classesQuery.data]
  );

  const courseIds = useMemo(
    () => classes.map(c => c.course_uuid ?? '').filter(Boolean),
    [classes]
  );
  const programIds = useMemo(
    () => classes.map(c => c.program_uuid ?? '').filter(Boolean),
    [classes]
  );
  const { courseMap } = useCoursesByIds(courseIds);
  const { programMap } = useProgramsByIds(programIds);

  const distinctPrograms = useMemo(() => Array.from(new Set(programIds)), [programIds]);

  const avgProgress = classes.length
    ? Math.round(
        classes.reduce((sum, c) => sum + Number(c.class_progress_percentage ?? 0), 0) /
          classes.length
      )
    : 0;
  const activeCount = classes.filter(c => c.is_active).length;
  const isLoading = classesQuery.isLoading;

  const offeringLabel = (c: ClassDefinition) =>
    c.course_uuid
      ? (courseMap[c.course_uuid]?.name ?? 'Course')
      : c.program_uuid
        ? (programMap[c.program_uuid]?.title ?? 'Programme')
        : '—';

  return (
    <div className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Learning Progress'
          description='Track cohort and programme progress across your organisation’s classes.'
        />

        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          ) : (
            <>
              <StatCard label='Classes' value={num(classes.length)} icon={Layers2} tone='info' />
              <StatCard
                label='Active classes'
                value={num(activeCount)}
                icon={GraduationCap}
                tone='success'
              />
              <StatCard
                label='Avg class progress'
                value={`${avgProgress}%`}
                icon={TrendingUp}
                tone='warning'
              />
              <StatCard
                label='Programmes'
                value={num(distinctPrograms.length)}
                icon={LineChartIcon}
                tone='neutral'
              />
            </>
          )}
        </div>

        <SectionCard title='Classes (cohorts)' description='Delivery progress per class'>
          {isLoading ? (
            <p className='text-sm text-muted-foreground'>Loading…</p>
          ) : classes.length === 0 ? (
            <p className='text-sm text-muted-foreground'>No classes yet.</p>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead>
                  <tr className='border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground'>
                    <th className='py-2 pr-3 font-medium'>Class</th>
                    <th className='py-2 pr-3 font-medium'>Offering</th>
                    <th className='py-2 pr-3 font-medium'>Sessions</th>
                    <th className='py-2 pr-3 font-medium'>Progress</th>
                    <th className='py-2' />
                  </tr>
                </thead>
                <tbody>
                  {classes.map(c => (
                    <tr key={c.uuid} className='border-b border-border/40'>
                      <td className='py-2.5 pr-3 font-medium text-foreground'>{c.title}</td>
                      <td className='py-2.5 pr-3 text-muted-foreground'>{offeringLabel(c)}</td>
                      <td className='py-2.5 pr-3 tabular-nums'>
                        {num(c.completed_session_count)}/{num(c.scheduled_session_count)}
                      </td>
                      <td className='py-2.5 pr-3 font-semibold tabular-nums'>
                        {pct(c.class_progress_percentage)}
                      </td>
                      <td className='py-2.5 text-right'>
                        <Link
                          href={`/dashboard/learning-progress/${c.uuid}`}
                          className='text-primary hover:underline'
                        >
                          View cohort
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        {distinctPrograms.length > 0 ? (
          <SectionCard title='Programmes' description='Completion across your training programmes'>
            <div className='grid gap-3 sm:grid-cols-2'>
              {distinctPrograms.map(programUuid => (
                <ProgramCompletionRate
                  key={programUuid}
                  programUuid={programUuid}
                  name={programMap[programUuid]?.title ?? 'Programme'}
                />
              ))}
            </div>
          </SectionCard>
        ) : null}
      </div>
    </div>
  );
}
