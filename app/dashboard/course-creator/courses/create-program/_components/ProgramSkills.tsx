'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { useCoursesByIds } from '@/hooks/use-batched-lookups';
import { STALE_TIMES } from '@/lib/query-client';
import { SkillPicker } from '@/src/features/skills/components/skill-picker';
import {
  getCourseAssessmentsOptions,
  getProgramSkillsOptions,
  getProgramSkillsQueryKey,
  getRubricCriteriaOptions,
  replaceProgramSkillMappingsMutation,
  replaceProgramSkillsMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { ProgramSkillMapping, ProgramTargetSkill } from '@/services/client/types.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import type { ProgramFormValues } from '../program-schema';

type MappingRow = Pick<
  ProgramSkillMapping,
  'course_assessment_uuid' | 'rubric_criteria_uuid' | 'share_percentage'
>;

/** Target skills and the graded rubric criteria (or whole scores) that show each one. Saves as it goes. */
export function ProgramSkills({
  programUuid,
  onPendingChange,
}: {
  programUuid: string;
  onPendingChange: (pending: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const skillsQuery = useQuery({
    ...getProgramSkillsOptions({ path: { programUuid } }),
    enabled: Boolean(programUuid),
    staleTime: STALE_TIMES.entity,
  });
  const skills = useMemo(() => skillsQuery.data?.data ?? [], [skillsQuery.data]);
  const [picked, setPicked] = useState<string>();
  const selected = skills.find(skill => skill.skill_uuid === picked) ?? skills[0];
  const [sheetOpen, setSheetOpen] = useState(false);

  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: getProgramSkillsQueryKey({ path: { programUuid } }),
    });
  const replaceSkills = useMutation({
    ...replaceProgramSkillsMutation(),
    onMutate: () => onPendingChange(true),
    onSettled: () => onPendingChange(false),
    onSuccess: () => void refresh(),
    onError: cause => toast.error(cause instanceof Error ? cause.message : 'Unable to save skills'),
  });
  const replaceMappings = useMutation({
    ...replaceProgramSkillMappingsMutation(),
    onMutate: () => onPendingChange(true),
    onSettled: () => onPendingChange(false),
    onSuccess: () => void refresh(),
    onError: cause =>
      toast.error(cause instanceof Error ? cause.message : 'Unable to save the links'),
  });

  const saveSkills = (skillUuids: string[]) =>
    replaceSkills.mutate({ path: { programUuid }, body: { skill_uuids: skillUuids } });
  const saveMappings = (skillUuid: string, rows: MappingRow[]) =>
    replaceMappings.mutateAsync({ path: { programUuid, skillUuid }, body: rows });

  if (skillsQuery.isLoading) return <Skeleton className='h-48 w-full' />;
  if (skillsQuery.isError || skillsQuery.data?.success === false)
    return (
      <EmptyState
        variant='compact'
        title='Unable to load programme skills'
        action={
          <Button type='button' variant='outline' onClick={() => skillsQuery.refetch()}>
            Try again
          </Button>
        }
      />
    );

  const groups = groupByAssessment(selected?.mappings ?? []);

  return (
    <section className='space-y-4' aria-label='Programme skills'>
      <p className='text-muted-foreground text-sm'>
        Pick the skills this programme develops, then link the rubric criteria and exams that show
        them. Every grade the class instructor gives becomes evidence. The courses themselves
        don&apos;t change.
      </p>
      <div className='flex flex-wrap items-start gap-4'>
        <Card className='min-w-[280px] flex-1 gap-3 p-4'>
          <h3 className='text-base font-semibold'>Target skills</h3>
          <SkillPicker
            onPick={skill => saveSkills([...skills.map(row => row.skill_uuid ?? ''), skill.uuid])}
            excludeUuids={skills.map(row => row.skill_uuid ?? '')}
            disabled={replaceSkills.isPending}
          />
          {skills.length === 0 ? (
            <p className='text-muted-foreground text-sm'>No target skills yet.</p>
          ) : (
            <ul className='space-y-2'>
              {skills.map(skill => {
                const isSelected = skill.skill_uuid === selected?.skill_uuid;
                const links = skill.mappings?.length ?? 0;
                return (
                  <li key={skill.skill_uuid} className='flex items-center gap-2'>
                    <Button
                      type='button'
                      variant='outline'
                      aria-pressed={isSelected}
                      onClick={() => setPicked(skill.skill_uuid)}
                      className={`h-auto min-h-12 flex-1 justify-between gap-2 text-left ${isSelected ? 'border-primary bg-primary/5' : ''}`}
                    >
                      <span className='flex flex-col'>
                        <span className='font-medium'>{skill.skill_name}</span>
                        <span className='text-muted-foreground text-xs'>
                          {links ? `${links} link${links === 1 ? '' : 's'}` : 'No links yet'}
                        </span>
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${skill.ready ? 'bg-primary/10 text-primary' : 'bg-warning/15 text-warning'}`}
                      >
                        {skill.ready ? 'Ready' : 'Needs links'}
                      </span>
                    </Button>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      aria-label={`Remove ${skill.skill_name}`}
                      disabled={replaceSkills.isPending}
                      onClick={() =>
                        saveSkills(
                          skills
                            .filter(row => row.skill_uuid !== skill.skill_uuid)
                            .map(row => row.skill_uuid ?? '')
                        )
                      }
                    >
                      <X />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
          <p className='text-muted-foreground text-xs'>
            Skills come from the platform skills list, so an achieved skill means the same thing in
            every learner&apos;s wallet.
          </p>
        </Card>

        <Card className='min-w-0 flex-[2] basis-[520px] gap-4 p-5'>
          {!selected ? (
            <p className='text-muted-foreground text-sm'>
              Add a target skill to link evidence to it.
            </p>
          ) : (
            <>
              <div className='flex flex-wrap items-start justify-between gap-3'>
                <div>
                  <h3 className='text-lg font-semibold'>{selected.skill_name}</h3>
                  <span className='text-muted-foreground text-sm'>
                    {selected.mappings?.length ?? 0} linked from {groups.length} assessment
                    {groups.length === 1 ? '' : 's'}
                  </span>
                </div>
                <Button type='button' onClick={() => setSheetOpen(true)}>
                  Link evidence
                </Button>
              </div>
              {!selected.ready && (
                <p role='alert' className='bg-warning/10 text-warning rounded-md px-3 py-2 text-sm'>
                  Nothing is linked to this skill yet, so learners can&apos;t show it. Every target
                  skill needs at least one link before the programme can be published.
                </p>
              )}
              {groups.map(group => (
                <div key={group.assessmentUuid} className='overflow-hidden rounded-md border'>
                  <div className='bg-muted/50 flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm'>
                    <span className='font-medium'>{group.title}</span>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      disabled={replaceMappings.isPending}
                      onClick={() =>
                        void saveMappings(
                          selected.skill_uuid ?? '',
                          (selected.mappings ?? [])
                            .filter(row => row.course_assessment_uuid !== group.assessmentUuid)
                            .map(toRow)
                        )
                      }
                    >
                      Remove
                    </Button>
                  </div>
                  {group.rows.map(row => (
                    <div
                      key={`${row.course_assessment_uuid}:${row.rubric_criteria_uuid ?? 'whole'}`}
                      className='grid grid-cols-3 items-center gap-3 border-t px-3 py-2 text-sm'
                    >
                      <span className='font-medium'>
                        {row.rubric_criteria_name ?? 'Whole score'}
                      </span>
                      <span className='text-muted-foreground'>
                        {row.rubric_criteria_uuid ? 'Rubric criterion' : 'Whole score'}
                      </span>
                      <span className='flex items-center gap-2'>
                        <span className='bg-muted h-2 flex-1 overflow-hidden rounded-full'>
                          <span
                            className='bg-primary block h-full'
                            style={{ width: `${row.share_percentage}%` }}
                          />
                        </span>
                        <span className='font-mono'>{Number(row.share_percentage)}%</span>
                      </span>
                    </div>
                  ))}
                </div>
              ))}
              <p className='text-muted-foreground border-t pt-3 text-sm'>
                <strong>How evidence is scored.</strong> When a linked assessment is graded, its
                linked criteria are combined using these shares into one evidence score. The
                learner&apos;s level comes from their most recent evidence; earlier evidence stays
                in their history.
              </p>
            </>
          )}
        </Card>
      </div>
      {selected && (
        <LinkEvidenceSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          skill={selected}
          pending={replaceMappings.isPending}
          onSave={async rows => {
            const kept = (selected.mappings ?? [])
              .filter(
                row =>
                  !rows.some(next => next.course_assessment_uuid === row.course_assessment_uuid)
              )
              .map(toRow);
            await saveMappings(selected.skill_uuid ?? '', [...kept, ...rows]);
            setSheetOpen(false);
          }}
        />
      )}
    </section>
  );
}

function LinkEvidenceSheet({
  open,
  onOpenChange,
  skill,
  pending,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skill: ProgramTargetSkill;
  pending: boolean;
  onSave: (rows: MappingRow[]) => Promise<void>;
}) {
  const { control } = useFormContext<ProgramFormValues>();
  const courses = useWatch({ control, name: 'courses' });
  const courseIds = useMemo(() => courses.map(course => course.courseUuid), [courses]);
  const { courseMap } = useCoursesByIds(courseIds);
  const [courseUuid, setCourseUuid] = useState<string>();
  const [assessmentUuid, setAssessmentUuid] = useState<string>();
  const [shares, setShares] = useState<Record<string, string>>({});

  const assessments = useQuery({
    ...getCourseAssessmentsOptions({
      path: { courseUuid: courseUuid ?? '' },
      query: { pageable: { size: 50 } },
    }),
    enabled: Boolean(courseUuid),
    staleTime: STALE_TIMES.entity,
  });
  const assessment = assessments.data?.data?.content?.find(row => row.uuid === assessmentUuid);
  const criteria = useQuery({
    ...getRubricCriteriaOptions({
      path: { rubricUuid: assessment?.rubric_uuid ?? '' },
      query: { pageable: { size: 50 } },
    }),
    enabled: Boolean(assessment?.rubric_uuid),
    staleTime: STALE_TIMES.entity,
  });
  const criteriaRows = criteria.data?.data?.content ?? [];
  const byCriteria = Boolean(assessment?.rubric_uuid) && criteriaRows.length > 0;
  const chosen = Object.entries(shares).filter(([, value]) => value.trim() !== '');
  const total = byCriteria ? chosen.reduce((sum, [, value]) => sum + (Number(value) || 0), 0) : 100;
  const valid =
    Boolean(assessmentUuid) &&
    Math.round(total * 100) === 10000 &&
    (!byCriteria || chosen.length > 0);

  const reset = () => {
    setCourseUuid(undefined);
    setAssessmentUuid(undefined);
    setShares({});
  };

  return (
    <Sheet
      open={open}
      onOpenChange={next => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <SheetContent className='flex w-full flex-col gap-4 overflow-y-auto sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>Link evidence to {skill.skill_name}</SheetTitle>
          <SheetDescription>
            Pick a programme course&apos;s assessment, then the rubric criteria that show this
            skill.
          </SheetDescription>
        </SheetHeader>
        <div className='space-y-4 px-4'>
          <div className='space-y-2'>
            <Label htmlFor='link-course'>Programme course</Label>
            <Select
              value={courseUuid}
              onValueChange={value => {
                setCourseUuid(value);
                setAssessmentUuid(undefined);
                setShares({});
              }}
            >
              <SelectTrigger id='link-course' className='w-full'>
                <SelectValue placeholder='Choose a course' />
              </SelectTrigger>
              <SelectContent>
                {courseIds.map(id => (
                  <SelectItem key={id} value={id}>
                    {courseMap[id]?.name ?? 'Course'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {courseUuid && (
            <div className='space-y-2'>
              <Label htmlFor='link-assessment'>Assessment</Label>
              <Select
                value={assessmentUuid}
                onValueChange={value => {
                  setAssessmentUuid(value);
                  setShares({});
                }}
              >
                <SelectTrigger id='link-assessment' className='w-full'>
                  <SelectValue
                    placeholder={assessments.isLoading ? 'Loading…' : 'Choose an assessment'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {(assessments.data?.data?.content ?? []).map(row => (
                    <SelectItem key={row.uuid} value={row.uuid ?? ''}>
                      {row.title}
                      {row.rubric_uuid ? ' (rubric)' : ' (whole score)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {assessment && byCriteria && (
            <fieldset className='space-y-3 rounded-md border p-3'>
              <legend className='text-muted-foreground px-1 text-sm'>
                Rubric criteria and their share
              </legend>
              {criteriaRows.map(criterion => {
                const id = criterion.uuid ?? '';
                const on = id in shares;
                return (
                  <div key={id} className='flex items-center gap-3'>
                    <label className='flex min-h-10 flex-1 items-center gap-2 text-sm'>
                      <Checkbox
                        checked={on}
                        onCheckedChange={checked =>
                          setShares(current => {
                            const next = { ...current };
                            if (checked === true) next[id] = '';
                            else delete next[id];
                            return next;
                          })
                        }
                      />
                      {criterion.component_name}
                    </label>
                    <Input
                      aria-label={`Share for ${criterion.component_name}`}
                      inputMode='decimal'
                      className='w-20 font-mono'
                      disabled={!on}
                      value={shares[id] ?? ''}
                      onChange={event =>
                        setShares(current => ({ ...current, [id]: event.target.value }))
                      }
                    />
                  </div>
                );
              })}
              <div className='flex justify-between text-sm'>
                <span>Shares total</span>
                <span className='font-mono font-semibold'>{Math.round(total * 100) / 100}%</span>
              </div>
            </fieldset>
          )}
          {assessment && !byCriteria && !criteria.isLoading && (
            <p className='text-muted-foreground text-sm'>
              This assessment links as a whole score: its percentage is the evidence.
            </p>
          )}
          <p className='text-muted-foreground text-xs'>
            Shares must total 100% within one assessment. Linking an assessment again replaces its
            earlier links for this skill.
          </p>
          <Button
            type='button'
            className='w-full'
            disabled={!valid || pending}
            onClick={() =>
              void onSave(
                byCriteria
                  ? chosen.map(([criterionUuid, value]) => ({
                      course_assessment_uuid: assessmentUuid ?? '',
                      rubric_criteria_uuid: criterionUuid,
                      share_percentage: Number(value),
                    }))
                  : [{ course_assessment_uuid: assessmentUuid ?? '', share_percentage: 100 }]
              ).then(reset)
            }
          >
            {pending && <Spinner />}Save link
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function toRow(mapping: ProgramSkillMapping): MappingRow {
  return {
    course_assessment_uuid: mapping.course_assessment_uuid,
    rubric_criteria_uuid: mapping.rubric_criteria_uuid,
    share_percentage: mapping.share_percentage,
  };
}

function groupByAssessment(mappings: ProgramSkillMapping[]) {
  const groups = new Map<
    string,
    { assessmentUuid: string; title: string; rows: ProgramSkillMapping[] }
  >();
  for (const mapping of mappings) {
    const group = groups.get(mapping.course_assessment_uuid) ?? {
      assessmentUuid: mapping.course_assessment_uuid,
      title: mapping.course_assessment_title ?? 'Assessment',
      rows: [],
    };
    group.rows.push(mapping);
    groups.set(mapping.course_assessment_uuid, group);
  }
  return [...groups.values()];
}
