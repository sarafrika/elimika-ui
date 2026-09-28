'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getInstructorSkillsOptions,
  getInstructorEducationOptions,
  getInstructorExperienceOptions,
  getInstructorDocumentsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { stripHtml } from '@/src/features/dashboard/courses/shared/_components/courses-data';

/** Only the open wallet category fetches data, and only for the selected applicant. */
export function SkillsWalletReview({ instructorUuid }: { instructorUuid: string }) {
  const [tab, setTab] = useState('skills');
  const path = { instructorUuid };
  const ready = Boolean(instructorUuid);
  const skills = useQuery({
    ...getInstructorSkillsOptions({ path, query: { pageable: { page: 0, size: 50 } } }),
    enabled: ready && tab === 'skills',
    staleTime: STALE_TIMES.entity,
  });
  const education = useQuery({
    ...getInstructorEducationOptions({ path }),
    enabled: ready && tab === 'education',
    staleTime: STALE_TIMES.entity,
  });
  const experience = useQuery({
    ...getInstructorExperienceOptions({ path, query: { pageable: { page: 0, size: 50 } } }),
    enabled: ready && tab === 'experience',
    staleTime: STALE_TIMES.entity,
  });
  const documents = useQuery({
    ...getInstructorDocumentsOptions({ path }),
    enabled: ready && tab === 'documents',
    staleTime: STALE_TIMES.entity,
  });
  const query =
    tab === 'skills'
      ? skills
      : tab === 'education'
        ? education
        : tab === 'experience'
          ? experience
          : documents;
  const failed = query.isError || Boolean(query.data?.error) || query.data?.success === false;
  const rows = failed
    ? []
    : tab === 'skills'
      ? (skills.data?.data?.content ?? []).map(item => ({
          id: item.uuid,
          title: item.skill_name,
          detail: item.proficiency_level,
        }))
      : tab === 'education'
        ? (education.data?.data ?? []).map(item => ({
            id: item.uuid,
            title: item.qualification,
            detail: [item.school_name, item.year_completed].filter(Boolean).join(' · '),
          }))
        : tab === 'experience'
          ? (experience.data?.data?.content ?? []).map(item => ({
              id: item.uuid,
              title: item.position,
              detail: [item.organisation_name, stripHtml(item.responsibilities)]
                .filter(Boolean)
                .join(' · '),
            }))
          : (documents.data?.data ?? []).map(item => ({
              id: item.uuid,
              title: item.title || item.original_filename,
              detail: [item.status, stripHtml(item.description)].filter(Boolean).join(' · '),
            }));

  return (
    <div className='space-y-3'>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className='h-auto flex-wrap justify-start'>
          <TabsTrigger value='skills'>Skills</TabsTrigger>
          <TabsTrigger value='education'>Education</TabsTrigger>
          <TabsTrigger value='experience'>Experience</TabsTrigger>
          <TabsTrigger value='documents'>Documents</TabsTrigger>
        </TabsList>
      </Tabs>
      <div aria-live='polite'>
        {failed ? (
          <EmptyState
            variant='compact'
            title='Could not load wallet records'
            action={
              <Button variant='outline' size='sm' onClick={() => void query.refetch()}>
                Retry
              </Button>
            }
          />
        ) : query.isPending ? (
          <Skeleton className='h-28 w-full' />
        ) : rows.length ? (
          <ul className='space-y-2'>
            {rows.map((row, index) => (
              <li key={row.id ?? index} className='bg-card rounded-md border p-3 text-sm'>
                <p className='font-medium'>{row.title}</p>
                <p className='text-muted-foreground mt-1'>{row.detail}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className='text-muted-foreground text-sm'>No {tab} records supplied.</p>
        )}
      </div>
    </div>
  );
}
