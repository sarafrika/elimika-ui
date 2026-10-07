'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getProgramAssessmentsOptions,
  getProgramRequirementsOptions,
  getTrainingProgramByUuidOptions,
  searchProgramCoursesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  ProgramCourse,
  ProgramRequirement,
  TrainingProgram,
} from '@/services/client/types.gen';
import ProgramEditor from './_components/ProgramEditor';
import { readProgramRequirementText } from './program-requirements';
import ProgramLoading from './loading';
import {
  assertProgramResponse,
  defaultProgramValues,
  type ProgramFormValues,
  programRequirementTypeSchema,
} from './program-schema';

export default function CreateProgramPage() {
  const searchParams = useSearchParams();
  // Keep the mounted editor when it adds its newly created ID to the URL.
  const [programId] = useState(() => searchParams.get('id'));
  return programId ? (
    <ExistingProgram key={programId} programId={programId} />
  ) : (
    <ProgramEditor key='new' initialValues={defaultProgramValues()} />
  );
}

function ExistingProgram({ programId }: { programId: string }) {
  const queryClient = useQueryClient();
  const [loaded, setLoaded] = useState<{ program: TrainingProgram; values: ProgramFormValues }>();
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError('');
      try {
        // All pages belong to this program; catalogue lookups remain paginated separately.
        const loadRequirements = async () => {
          const rows: ProgramRequirement[] = [];
          for (let page = 0; ; page += 1) {
            const response = await queryClient.fetchQuery({
              ...getProgramRequirementsOptions({
                path: { programUuid: programId },
                query: { pageable: { page, size: 100 } },
              }),
              staleTime: STALE_TIMES.entity,
            });
            assertProgramResponse(response, 'Unable to load program requirements');
            rows.push(...(response.data?.content ?? []));
            const metadata = response.data?.metadata;
            if (cancelled || !(metadata?.hasNext ?? page + 1 < (metadata?.totalPages ?? 1))) break;
          }
          return rows;
        };
        const loadCourses = async () => {
          const rows: ProgramCourse[] = [];
          for (let page = 0; ; page += 1) {
            const response = await queryClient.fetchQuery({
              ...searchProgramCoursesOptions({
                query: { searchParams: { programUuid: programId }, pageable: { page, size: 100 } },
              }),
              staleTime: STALE_TIMES.entity,
            });
            assertProgramResponse(response, 'Unable to load program curriculum');
            rows.push(
              ...(response.data?.content ?? []).filter(row => row.program_uuid === programId)
            );
            const metadata = response.data?.metadata;
            if (cancelled || !(metadata?.hasNext ?? page + 1 < (metadata?.totalPages ?? 1))) break;
          }
          return rows;
        };
        const [response, requirements, courses, assessments] = await Promise.all([
          queryClient.fetchQuery({
            ...getTrainingProgramByUuidOptions({ path: { uuid: programId } }),
            staleTime: STALE_TIMES.entity,
          }),
          loadRequirements(),
          loadCourses(),
          queryClient.fetchQuery({
            ...getProgramAssessmentsOptions({ path: { uuid: programId } }),
            staleTime: STALE_TIMES.entity,
          }),
        ]);
        assertProgramResponse(response, 'Unable to load program');
        assertProgramResponse(assessments, 'Unable to load program assessments');
        if (!response.data) throw new Error('Program not found');
        const program = response.data;
        if (!cancelled)
          setLoaded({
            program,
            values: {
              ...defaultProgramValues(program),
              draft: {
                ...defaultProgramValues().draft,
                assessments: (assessments.data ?? []).map(row => ({
                  uuid: row.uuid,
                  name: row.title,
                  weight: String(row.weight_percentage),
                  criteria: row.description ?? '',
                  assessmentType: row.assessment_type,
                  rubricUuid: row.rubric_uuid ?? undefined,
                  isRequired: row.is_required ?? true,
                  active: row.active ?? true,
                })),
              },
              requirements: requirements.map(row => ({
                uuid: row.uuid,
                requirementText: row.requirement_text,
                requirementType: programRequirementTypeSchema.parse(row.requirement_type),
                resource: {
                  ...readProgramRequirementText(row.requirement_text),
                  is_mandatory: row.is_mandatory ?? !row.is_optional,
                },
                isMandatory: row.is_mandatory ?? !row.is_optional,
              })),
              courses: courses
                .sort((a, b) => (a.sequence_order ?? 0) - (b.sequence_order ?? 0))
                .map(row => ({
                  associationUuid: row.uuid,
                  courseUuid: row.course_uuid,
                  isRequired: row.is_required ?? true,
                  prerequisiteCourseUuid: row.prerequisite_course_uuid ?? '',
                })),
            },
          });
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Unable to load program');
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [programId, queryClient, attempt]);

  if (error)
    return (
      <EmptyState
        title='Unable to load program'
        description={error}
        action={<Button onClick={() => setAttempt(value => value + 1)}>Try again</Button>}
      />
    );
  if (!loaded) return <ProgramLoading />;
  return <ProgramEditor program={loaded.program} initialValues={loaded.values} />;
}
