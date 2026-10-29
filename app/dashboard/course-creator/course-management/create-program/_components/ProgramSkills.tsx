'use client';

import { StatCard } from '@/components/data-display';
import { Button } from '@/components/ui/button';
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
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { useCoursesByIds } from '@/hooks/use-batched-lookups';
import { STALE_TIMES } from '@/lib/query-client';
import { cn } from '@/lib/utils';
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
import { BookOpen, CircleCheck, Link2, Sparkles, TriangleAlert, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import type { ProgramFormValues } from '../program-schema';

type MappingRow = Pick<
  ProgramSkillMapping,
  'course_assessment_uuid' | 'rubric_criteria_uuid' | 'share_percentage'
>;

const PILL = 'whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold';

/** Target skills and the graded rubric criteria (or whole scores) that show each one. Saves as it goes. */
export function ProgramSkills({
  programUuid,
  onPendingChange,
}: {
  programUuid: string;
  onPendingChange: (pending: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { control } = useFormContext<ProgramFormValues>();
  const courses = useWatch({ control, name: 'courses' });
  const courseIds = useMemo(() => courses.map(course => course.courseUuid), [courses]);
  const { courseMap } = useCoursesByIds(courseIds);
  const skillsQuery = useQuery({
    ...getProgramSkillsOptions({ path: { programUuid } }),
    enabled: Boolean(programUuid),
    staleTime: STALE_TIMES.entity,
  });
  const skills = useMemo(() => skillsQuery.data?.data ?? [], [skillsQuery.data]);
  const [sheetSkill, setSheetSkill] = useState<string>();
  const linking = skills.find(skill => skill.skill_uuid === sheetSkill);

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
        title='Unable to load program skills'
        action={
          <Button type='button' variant='outline' onClick={() => skillsQuery.refetch()}>
            Try again
          </Button>
        }
      />
    );

  const allMappings = skills.flatMap(skill => skill.mappings ?? []);
  const ready = skills.filter(skill => skill.ready).length;
  const unlinked = skills.filter(skill => !skill.ready);
  const links = skills.reduce(
    (sum, skill) =>
      sum + new Set((skill.mappings ?? []).map(row => row.course_assessment_uuid)).size,
    0
  );
  const coursesWithEvidence = new Set(allMappings.map(row => row.course_uuid).filter(Boolean)).size;

  return (
    <section className='flex flex-col gap-5' aria-label='Program skills'>
      <div className='grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3.5'>
        <StatCard label='Target skills' value={skills.length} icon={Sparkles} />
        <StatCard
          label='Ready to publish'
          value={`${ready} of ${skills.length}`}
          icon={CircleCheck}
          tone={ready < skills.length ? 'warning' : 'info'}
        />
        <StatCard label='Links to assessments' value={links} icon={Link2} />
        <StatCard
          label='Courses giving evidence'
          value={`${coursesWithEvidence} of ${courses.length}`}
          icon={BookOpen}
        />
      </div>

      {unlinked.length > 0 && (
        <div
          role='alert'
          className='border-warning/40 bg-warning/10 text-warning flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm'
        >
          <TriangleAlert className='mt-0.5 size-[18px] shrink-0' aria-hidden />
          <span>
            <strong>
              {unlinked.length === 1
                ? `${unlinked[0]?.skill_name ?? 'A skill'} has no links yet.`
                : `${unlinked.length} skills have no links yet: ${unlinked.map(skill => skill.skill_name).join(', ')}.`}
            </strong>{' '}
            Link {unlinked.length === 1 ? 'it' : 'each'} to an assessment or remove it. The program
            can&apos;t be published until every skill has at least one link.
          </span>
        </div>
      )}

      <div className='bg-card flex flex-col gap-3.5 rounded-2xl border p-5'>
        <div className='flex flex-wrap items-end justify-between gap-3'>
          <div className='flex flex-col gap-1'>
            <h3 className='text-lg font-semibold'>Skills by course</h3>
            <span className='text-muted-foreground text-sm'>
              Each cell is the assessment and criteria that give evidence for the skill, with their
              share.
            </span>
          </div>
          <div className='flex w-[300px] max-w-full flex-col gap-1'>
            <span className='text-muted-foreground text-xs'>
              Add a skill from the platform list
            </span>
            <SkillPicker
              onPick={skill => saveSkills([...skills.map(row => row.skill_uuid ?? ''), skill.uuid])}
              excludeUuids={skills.map(row => row.skill_uuid ?? '')}
              disabled={replaceSkills.isPending}
              placeholder='Search skills'
            />
          </div>
        </div>

        {skills.length === 0 ? (
          <p className='text-muted-foreground rounded-xl border border-dashed px-4 py-6 text-sm'>
            No target skills yet. Add one from the platform list, then link the work that shows it.
          </p>
        ) : (
          <div className='overflow-x-auto rounded-xl border'>
            <table
              className='w-full border-collapse text-[13px]'
              style={{ minWidth: 380 + courses.length * 150 }}
            >
              <thead>
                <tr className='bg-muted text-left align-bottom'>
                  <th className='px-3 py-2.5'>Skill</th>
                  {courses.map(row => {
                    const course = courseMap[row.courseUuid];
                    return (
                      <th key={row.courseUuid} className='px-3 py-2.5'>
                        {course?.course_code || course?.name || 'Course'}
                        <div className='text-muted-foreground text-[11px] font-normal'>
                          {course?.course_code ? course.name : null}
                          {row.isRequired ? '' : `${course?.course_code ? ' · ' : ''}optional`}
                        </div>
                      </th>
                    );
                  })}
                  <th className='px-3 py-2.5'>Status</th>
                  <th className='px-3 py-2.5'>
                    <span className='sr-only'>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {skills.map(skill => (
                  <tr key={skill.skill_uuid} data-testid='skill-row' className='border-t align-top'>
                    <td className='px-3 py-2.5 font-semibold'>{skill.skill_name}</td>
                    {courses.map(row => {
                      const cells = groupByAssessment(
                        (skill.mappings ?? []).filter(m => m.course_uuid === row.courseUuid)
                      );
                      return (
                        <td key={row.courseUuid} className='px-3 py-2.5'>
                          {cells.length === 0 ? (
                            <span className='text-muted-foreground/70'>—</span>
                          ) : (
                            <div className='flex flex-col gap-1.5'>
                              {cells.map(cell => (
                                <div key={cell.assessmentUuid}>
                                  <div className='font-semibold'>{cell.title}</div>
                                  <div className='text-muted-foreground font-mono text-xs'>
                                    {cell.rows
                                      .map(
                                        m =>
                                          `${m.rubric_criteria_name ?? 'Whole score'} ${Number(m.share_percentage)}`
                                      )
                                      .join(' · ')}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className='px-3 py-2.5'>
                      <span
                        className={cn(
                          PILL,
                          skill.ready ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'
                        )}
                      >
                        {skill.ready ? 'Ready' : 'Needs links'}
                      </span>
                    </td>
                    <td className='px-3 py-1.5 whitespace-nowrap'>
                      <Button
                        type='button'
                        variant='link'
                        className='text-primary px-1.5 font-semibold'
                        aria-label={`Link evidence for ${skill.skill_name}`}
                        onClick={() => setSheetSkill(skill.skill_uuid)}
                      >
                        Link evidence
                      </Button>
                      <Button
                        type='button'
                        variant='outline'
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className='text-muted-foreground text-xs'>
          Shares within one assessment total 100%. Skills come from the platform list, and levels
          from the platform&apos;s skill levels. Changes here save straight away.
        </p>
      </div>

      <LinkEvidenceSheet
        open={Boolean(linking)}
        onOpenChange={open => {
          if (!open) setSheetSkill(undefined);
        }}
        skill={linking}
        skills={skills}
        pending={replaceMappings.isPending}
        onSave={async rows => {
          if (!linking) return;
          const kept = (linking.mappings ?? [])
            .filter(
              row => !rows.some(next => next.course_assessment_uuid === row.course_assessment_uuid)
            )
            .map(toRow);
          await saveMappings(linking.skill_uuid ?? '', [...kept, ...rows]);
          setSheetSkill(undefined);
        }}
      />
    </section>
  );
}

function LinkEvidenceSheet({
  open,
  onOpenChange,
  skill,
  skills,
  pending,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skill?: ProgramTargetSkill;
  skills: ProgramTargetSkill[];
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
  const balanced = Math.round(total * 100) === 10000;
  const valid = Boolean(assessmentUuid) && balanced && (!byCriteria || chosen.length > 0);
  const name = skill?.skill_name ?? 'Skill';

  // Criteria other skills already draw on, so the creator sees overlaps before linking.
  const usedElsewhere = useMemo(() => {
    const used = new Map<string, { skill: string; otherAssessment: boolean }>();
    for (const other of skills) {
      if (other.skill_uuid === skill?.skill_uuid) continue;
      for (const row of other.mappings ?? []) {
        if (!row.rubric_criteria_uuid || used.has(row.rubric_criteria_uuid)) continue;
        used.set(row.rubric_criteria_uuid, {
          skill: other.skill_name ?? 'another skill',
          otherAssessment: row.course_assessment_uuid !== assessmentUuid,
        });
      }
    }
    return used;
  }, [skills, skill?.skill_uuid, assessmentUuid]);

  const reset = () => {
    setCourseUuid(undefined);
    setAssessmentUuid(undefined);
    setShares({});
  };
  const pickAssessment = (value: string) => {
    setAssessmentUuid(value);
    // Linking an assessment again replaces its earlier links, so start from them.
    const existing = (skill?.mappings ?? []).filter(row => row.course_assessment_uuid === value);
    setShares(
      Object.fromEntries(
        existing
          .filter(row => row.rubric_criteria_uuid)
          .map(row => [row.rubric_criteria_uuid ?? '', String(Number(row.share_percentage))])
      )
    );
  };

  return (
    <Sheet
      open={open}
      onOpenChange={next => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <SheetContent className='flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[640px]'>
        <SheetHeader className='shrink-0 border-b px-6 py-5 pr-14'>
          <SheetTitle>{name} · Link evidence</SheetTitle>
          <SheetDescription>
            Choose the work that shows this skill. Linking the same assessment again replaces its
            earlier link.
          </SheetDescription>
        </SheetHeader>
        <div className='min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5'>
          <div className='space-y-1.5'>
            <Label htmlFor='link-course'>Program course</Label>
            <Select
              value={courseUuid}
              onValueChange={value => {
                setCourseUuid(value);
                setAssessmentUuid(undefined);
                setShares({});
              }}
            >
              <SelectTrigger id='link-course' className='h-11 w-full'>
                <SelectValue placeholder='Choose a course' />
              </SelectTrigger>
              <SelectContent>
                {courseIds.map(id => {
                  const course = courseMap[id];
                  return (
                    <SelectItem key={id} value={id}>
                      {course?.name ?? 'Course'}
                      {course?.course_code ? ` · ${course.course_code}` : ''}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          {courseUuid && (
            <div className='space-y-1.5'>
              <Label htmlFor='link-assessment'>Assessment</Label>
              <Select value={assessmentUuid} onValueChange={pickAssessment}>
                <SelectTrigger id='link-assessment' className='h-11 w-full'>
                  <SelectValue
                    placeholder={assessments.isLoading ? 'Loading…' : 'Choose an assessment'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {(assessments.data?.data?.content ?? []).map(row => (
                    <SelectItem key={row.uuid} value={row.uuid ?? ''}>
                      {row.title}
                      {row.rubric_uuid ? ' · rubric' : ' · whole score'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {assessment && criteria.isLoading && <Skeleton className='h-32 w-full' />}
          {assessment && byCriteria && (
            <fieldset className='flex flex-col gap-2.5 rounded-xl border p-3.5'>
              <legend className='px-1.5 text-sm font-semibold'>Rubric criteria and share</legend>
              {criteriaRows.map(criterion => {
                const id = criterion.uuid ?? '';
                const on = id in shares;
                const used = usedElsewhere.get(id);
                return (
                  <div
                    key={id}
                    className='grid grid-cols-[minmax(0,1fr)_96px] items-center gap-2.5'
                  >
                    <label className='flex cursor-pointer items-start gap-2.5 text-sm'>
                      <Checkbox
                        className='mt-0.5'
                        checked={on}
                        onCheckedChange={checked =>
                          setShares(current => {
                            const next = { ...current };
                            if (checked === true) next[id] = '';
                            else delete next[id];
                            return next;
                          })
                        }
                        aria-label={criterion.component_name}
                      />
                      <span className='flex flex-col gap-0.5'>
                        <span>{criterion.component_name}</span>
                        <span
                          className={cn('text-xs', used ? 'text-warning' : 'text-muted-foreground')}
                        >
                          {used
                            ? `Already gives evidence for ${used.skill}${used.otherAssessment ? ' in another assessment' : ''}`
                            : 'Not linked to another skill'}
                        </span>
                      </span>
                    </label>
                    <Input
                      aria-label={`Share for ${criterion.component_name}`}
                      inputMode='decimal'
                      className='h-10 font-mono'
                      disabled={!on}
                      value={shares[id] ?? ''}
                      onChange={event =>
                        setShares(current => ({ ...current, [id]: event.target.value }))
                      }
                    />
                  </div>
                );
              })}
              <div className='flex justify-between border-t pt-2.5 text-sm'>
                <span className='font-semibold'>Shares total</span>
                <span
                  data-testid='shares-total'
                  className={cn(
                    'font-mono font-semibold',
                    balanced ? 'text-primary' : 'text-warning'
                  )}
                >
                  {Math.round(total * 100) / 100}%
                </span>
              </div>
            </fieldset>
          )}
          {assessment && !byCriteria && !criteria.isLoading && (
            <p className='text-muted-foreground text-sm'>
              This assessment links as a whole score: its percentage is the evidence.
            </p>
          )}
          <p className='text-muted-foreground text-xs'>
            When an instructor submits this assessment, each ticked criterion adds evidence for{' '}
            {name} using these shares.
          </p>
        </div>
        <SheetFooter className='shrink-0 flex-row justify-end gap-2.5 border-t px-6 py-4'>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type='button'
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
        </SheetFooter>
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

export function groupByAssessment(mappings: ProgramSkillMapping[]) {
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
