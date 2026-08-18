'use client';

import useStudentClassDefinitions from '@/hooks/use-student-class-definition';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getCourseAssessmentsOptions,
  getCourseRubricsOptions,
  getRubricMatrixOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  CourseAssessment,
  CourseRubricAssociation,
  RubricMatrix
} from '@/services/client/types.gen';
import { useQueries, useQuery } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import { BookOpenText, CheckCircle2, FileCheck2, Search, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useUserProfile } from '../../../../../context/profile-context';

type EnrolledCourse = {
  uuid: string;
  title: string;
};

type AssessmentRow = {
  key: string;
  assessment: CourseAssessment;
  courseUuid: string;
  courseTitle: string;
};

function formatLabel(value?: string | null) {
  if (!value) return 'Unspecified';

  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(part => part.slice(0, 1).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function formatPercentage(value?: number | null) {
  if (value == null || Number.isNaN(value)) return '—';
  return `${value}%`;
}

function getAssessmentRubricUuid(
  assessment: CourseAssessment,
  fallbackRubrics: CourseRubricAssociation[]
) {
  return (
    assessment.rubric_uuid ??
    fallbackRubrics.find(rubric => rubric.is_primary_rubric)?.rubric_uuid ??
    fallbackRubrics[0]?.rubric_uuid ??
    ''
  );
}

function StatChip({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
}) {
  return (
    <div className='border-border/70 bg-card flex min-w-0 items-center gap-3 rounded-md border p-3 shadow-sm'>
      <div className='bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-md'>
        <Icon className='h-4 w-4' />
      </div>
      <div className='min-w-0'>
        <p className='text-muted-foreground text-xs'>{label}</p>
        <p className='text-foreground truncate text-lg font-semibold'>{value}</p>
      </div>
    </div>
  );
}

function RubricMatrixTable({ matrix }: { matrix: RubricMatrix }) {
  const scoringLevels = [...matrix.scoring_levels].sort(
    (left, right) => (left.level_order ?? 0) - (right.level_order ?? 0)
  );
  const criteria = [...matrix.criteria].sort(
    (left, right) => (left.display_order ?? 0) - (right.display_order ?? 0)
  );

  return (
    <div className='min-w-0 space-y-3'>
      <div className='flex flex-wrap gap-2'>
        {scoringLevels.map(level => (
          <Badge key={level.uuid ?? `${level.rubric_uuid}-${level.level_order}`} variant='outline'>
            {level.name} · {level.points} pts
          </Badge>
        ))}
      </div>

      <div className='min-w-0 overflow-x-auto rounded-md border'>
        <Table className='min-w-max'>
          <TableHeader>
            <TableRow>
              <TableHead className='min-w-48'>Criteria</TableHead>
              {scoringLevels.map(level => (
                <TableHead key={level.uuid ?? `${level.rubric_uuid}-${level.level_order}`} className='min-w-56'>
                  <div className='space-y-1'>
                    <p className='text-sm font-medium'>{level.name}</p>
                    <p className='text-muted-foreground text-xs'>{level.points} points</p>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {criteria.map(criteriaItem => (
              <TableRow key={criteriaItem.uuid ?? `${criteriaItem.rubric_uuid}-${criteriaItem.display_order}`}>
                <TableCell className='whitespace-normal align-top'>
                  <div className='space-y-1'>
                    <p className='font-medium'>{criteriaItem.component_name}</p>
                    <p className='text-muted-foreground text-xs leading-relaxed'>
                      {criteriaItem.description || ''}
                    </p>
                  </div>
                </TableCell>
                {scoringLevels.map(level => {
                  const cellKey = `${criteriaItem.uuid ?? ''}_${level.uuid ?? ''}`;
                  const cell = matrix.matrix_cells[cellKey];

                  return (
                    <TableCell
                      key={cellKey}
                      className='max-w-56 whitespace-normal align-top text-xs leading-relaxed'
                    >
                      {cell?.description ? (
                        <div className='space-y-1'>
                          <p>{cell.description}</p>
                          {cell.points != null ? (
                            <p className='text-muted-foreground text-[11px]'></p>
                          ) : null}
                        </div>
                      ) : (
                        <span className='text-muted-foreground'>Not defined</span>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function AssessmentSheet({
  row,
  courseRubrics,
  rubricMatrix,
  rubricLoading,
  onClose,
}: {
  row: AssessmentRow | null;
  courseRubrics: CourseRubricAssociation[];
  rubricMatrix: RubricMatrix | null;
  rubricLoading: boolean;
  onClose: () => void;
}) {
  const assessment = row?.assessment ?? null;
  const rubricUuid = assessment ? getAssessmentRubricUuid(assessment, courseRubrics) : '';
  const rubric = rubricMatrix?.rubric ?? null;

  return (
    <Sheet open={Boolean(row)} onOpenChange={open => !open && onClose()}>
      <SheetContent side='right' className='w-full overflow-y-auto sm:max-w-6xl lg:max-w-7xl'>
        <SheetHeader className='pr-10'>
          <SheetTitle>{assessment?.title || 'Assessment details'}</SheetTitle>
          <SheetDescription>
            Review the grading rubric, scoring levels, and criteria used to evaluate this assessment.
          </SheetDescription>
        </SheetHeader>

        <div className='min-w-0 space-y-5 px-4 pb-4'>
          <div className='grid gap-3 sm:grid-cols-2'>
            <StatChip label='Course' value={row?.courseTitle || 'Unknown course'} icon={BookOpenText} />
            <StatChip
              label='Weight'
              value={assessment?.weight_display!}
              icon={SlidersHorizontal}
            />
            <StatChip
              label='Rubric linked'
              value={rubricUuid ? 'Yes' : 'No'}
              icon={ShieldCheck}
            />
            <StatChip
              label='Required'
              value={assessment?.is_required ? 'Yes' : 'No'}
              icon={CheckCircle2}
            />
          </div>

          <div className='min-w-0 space-y-3 rounded-md border p-4'>
            <div className='flex flex-wrap items-center gap-2'>
              <Badge variant='outline'>{formatLabel(assessment?.assessment_type)}</Badge>
              {assessment?.sync_class_attendance ? (
                <Badge className='bg-primary text-primary-foreground'>Attendance synced</Badge>
              ) : null}
              {assessment?.is_required ? (
                <Badge className='bg-warning text-warning-foreground'>Required</Badge>
              ) : (
                <Badge variant='secondary'>Optional</Badge>
              )}
            </div>

            <div>
              <p className='text-muted-foreground text-xs uppercase tracking-[0.18em]'>
                How this task is graded
              </p>
              <p className='mt-2 text-sm leading-7'>
                {assessment?.description || 'This assessment is graded with the linked rubric and scoring levels below.'}
              </p>
            </div>

            {courseRubrics.length > 0 ? (
              <div className='min-w-0 space-y-2'>
                <p className='text-muted-foreground text-xs uppercase tracking-[0.18em]'>
                  Course rubrics
                </p>
                <div className='flex flex-wrap gap-2'>
                  {courseRubrics.map(association => {
                    const isActive = association.rubric_uuid === rubricUuid;

                    return (
                      <Badge
                        key={association.uuid ?? association.rubric_uuid}
                        variant={isActive ? 'default' : 'outline'}
                        className='max-w-full'
                      >
                        {association.usage_context || 'General'} · {association.rubric_uuid}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          {rubricLoading ? (
            <div className='space-y-3'>
              <Skeleton className='h-10 rounded-md' />
              <Skeleton className='h-72 rounded-md' />
            </div>
          ) : rubricMatrix ? (
            <div className='min-w-0 space-y-4'>
              <div className='grid gap-3 sm:grid-cols-4'>
                <StatChip
                  label='Criteria'
                  value={rubricMatrix.criteria.length}
                  icon={FileCheck2}
                />
                <StatChip
                  label='Scoring levels'
                  value={rubricMatrix.scoring_levels.length}
                  icon={SlidersHorizontal}
                />
                <StatChip
                  label='Score Obtainable'
                  value={rubric?.total_weight! ?? ''}
                  icon={ShieldCheck}
                />
                <StatChip
                  label='Passing score'
                  value={
                    rubricMatrix.matrix_statistics?.min_passing_score ??
                    rubric?.min_passing_score ??
                    '—'
                  }
                  icon={CheckCircle2}
                />
              </div>

              <div className='min-w-0 space-y-3 rounded-md border p-4'>
                <div>
                  <p className='text-muted-foreground text-xs uppercase tracking-[0.18em]'>
                    Grading matrix
                  </p>
                  <p className='text-muted-foreground mt-1 text-sm'>
                    Each row is a criteria and each column is a performance level. Students are scored
                    by matching their work to the rubric cell descriptions.
                  </p>
                </div>

                <RubricMatrixTable matrix={rubricMatrix} />
              </div>
            </div>
          ) : (
            <EmptyState
              variant='card'
              icon={FileCheck2}
              title='Rubric details are not available yet'
              description='The assessment is linked to a rubric, but the rubric matrix could not be loaded right now.'
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function LessonHubAssessmentsTab() {
  const profile = useUserProfile();
  const student = profile?.student;
  const { classDefinitions, loading } = useStudentClassDefinitions(student ?? undefined);
  const [courseFilter, setCourseFilter] = useState('all');
  const [searchValue, setSearchValue] = useState('');
  const [activeAssessmentKey, setActiveAssessmentKey] = useState<string | null>(null);

  const enrolledCourses = useMemo<EnrolledCourse[]>(() => {
    const courseMap = new Map<string, EnrolledCourse>();

    for (const classDefinition of classDefinitions ?? []) {
      const course = classDefinition.course;
      const courseUuid = course?.uuid;

      if (!courseUuid || courseMap.has(courseUuid)) {
        continue;
      }

      courseMap.set(courseUuid, {
        uuid: courseUuid,
        title: course?.name || course?.title || 'Untitled course',
      });
    }

    return Array.from(courseMap.values()).sort((left, right) => left.title.localeCompare(right.title));
  }, [classDefinitions]);

  const assessmentQueries = useQueries({
    queries: enrolledCourses.map(course => ({
      ...getCourseAssessmentsOptions({
        path: { courseUuid: course.uuid },
        query: {
          pageable: {
            size: 100,
          },
        },
      }),
      enabled: Boolean(course.uuid),
      staleTime: STALE_TIMES.entity,
      refetchOnWindowFocus: false,
    })),
  });

  const assessmentRows = useMemo<AssessmentRow[]>(() => {
    return enrolledCourses.flatMap((course, index) => {
      const assessments = assessmentQueries[index]?.data?.data?.content ?? [];

      return assessments
        .filter((assessment): assessment is CourseAssessment => Boolean(assessment?.uuid))
        .map((assessment, assessmentIndex) => ({
          key: assessment.uuid || `${course.uuid}-${assessmentIndex}`,
          assessment,
          courseUuid: course.uuid,
          courseTitle: course.title,
        }));
    });
  }, [assessmentQueries, enrolledCourses]);

  const selectedAssessment = useMemo(
    () => assessmentRows.find(row => row.key === activeAssessmentKey) ?? null,
    [activeAssessmentKey, assessmentRows]
  );

  const courseRubricsQuery = useQuery({
    ...getCourseRubricsOptions({
      path: {
        courseUuid: selectedAssessment?.courseUuid ?? '',
      },
      query: {
        pageable: {
          size: 50,
        },
      },
    }),
    enabled: Boolean(
      selectedAssessment && !selectedAssessment.assessment.rubric_uuid && selectedAssessment.courseUuid
    ),
    staleTime: STALE_TIMES.reference,
    refetchOnWindowFocus: false,
  });

  const courseRubrics = courseRubricsQuery.data?.data?.content ?? [];
  const activeRubricUuid = selectedAssessment
    ? getAssessmentRubricUuid(selectedAssessment.assessment, courseRubrics)
    : '';

  const rubricMatrixQuery = useQuery({
    ...getRubricMatrixOptions({
      path: {
        rubricUuid: activeRubricUuid,
      },
    }),
    enabled: Boolean(activeRubricUuid),
    staleTime: STALE_TIMES.entity,
    refetchOnWindowFocus: false,
  });

  const rubricMatrix = rubricMatrixQuery.data?.data ?? null;

  const searchTerm = searchValue.trim().toLowerCase();

  const filteredAssessments = useMemo(() => {
    return assessmentRows
      .filter(row => courseFilter === 'all' || row.courseUuid === courseFilter)
      .filter(row => {
        if (!searchTerm) {
          return true;
        }

        const rubricContext = row.assessment.rubric_uuid ?? '';
        return [
          row.assessment.title,
          row.assessment.description,
          row.assessment.assessment_type,
          row.courseTitle,
          rubricContext,
        ]
          .filter(Boolean)
          .some(value => String(value).toLowerCase().includes(searchTerm));
      })
      .sort((left, right) => {
        const courseCompare = left.courseTitle.localeCompare(right.courseTitle);
        if (courseCompare !== 0) {
          return courseCompare;
        }

        return left.assessment.title.localeCompare(right.assessment.title);
      });
  }, [assessmentRows, courseFilter, searchTerm]);

  const stats = useMemo(() => {
    const withRubric = assessmentRows.filter(row => Boolean(row.assessment.rubric_uuid)).length;
    const required = assessmentRows.filter(row => row.assessment.is_required).length;

    return {
      total: assessmentRows.length,
      withRubric,
      required,
      courses: enrolledCourses.length,
    };
  }, [assessmentRows, enrolledCourses.length]);

  const courseOptions = enrolledCourses;
  const isLoading =
    loading ||
    assessmentQueries.some(query => query.isLoading || query.isFetching);

  const handleOpen = (row: AssessmentRow) => {
    setActiveAssessmentKey(row.key);
  };

  const clearFilters = () => {
    setCourseFilter('all');
    setSearchValue('');
  };

  if (isLoading) {
    return (
      <div className='space-y-5'>
        <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-4'>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className='h-20 rounded-md' />
          ))}
        </div>

        <div className='flex flex-col gap-3 rounded-md border p-4 md:flex-row md:items-center md:justify-between'>
          <Skeleton className='h-10 w-full rounded-md md:max-w-md' />
          <Skeleton className='h-10 w-full rounded-md md:max-w-60' />
        </div>

        <Skeleton className='h-96 rounded-md' />
      </div>
    );
  }

  return (
    <div className='space-y-5'>
      <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-4'>
        <StatChip label='Assessments' value={stats.total} icon={FileCheck2} />
        <StatChip label='Courses' value={stats.courses} icon={BookOpenText} />
        <StatChip label='With rubrics' value={stats.withRubric} icon={ShieldCheck} />
        <StatChip label='Required' value={stats.required} icon={CheckCircle2} />
      </div>

      <div className='border-border/70 bg-card rounded-md border p-4 shadow-sm'>
        <div className='flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between'>
          <div className='min-w-0 flex-1 space-y-1'>
            <p className='text-muted-foreground text-sm font-medium'>Search assessments</p>
            <div className='relative max-w-2xl'>
              <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
              <Input
                value={searchValue}
                onChange={event => setSearchValue(event.target.value)}
                placeholder='Search by assessment title, type, description, or course'
                className='h-10 pl-9'
              />
            </div>
          </div>

          <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className='h-10 w-full sm:w-56'>
                <SelectValue placeholder='Filter by course' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All courses</SelectItem>
                {courseOptions.map(course => (
                  <SelectItem key={course.uuid} value={course.uuid}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type='button'
              variant='outline'
              className='h-10'
              onClick={clearFilters}
              disabled={courseFilter === 'all' && !searchValue}
            >
              Clear filters
            </Button>
          </div>
        </div>
      </div>

      {filteredAssessments.length === 0 ? (
        <EmptyState
          variant='card'
          icon={Search}
          title='No assessments found'
          description='Try a different course or search term to surface more assessments.'
        />
      ) : (
        <div className='border-border/70 bg-card overflow-x-auto rounded-md border shadow-sm'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assessment</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Rubric</TableHead>
                <TableHead>Required</TableHead>
                <TableHead className='text-right'>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssessments.map(row => {
                const assessment = row.assessment;
                const hasRubric = Boolean(assessment.rubric_uuid);

                return (
                  <TableRow key={row.key}>
                    <TableCell className='whitespace-normal'>
                      <div className='space-y-1'>
                        <p className='font-medium'>{assessment.title}</p>
                        {assessment.description ? (
                          <p className='text-muted-foreground line-clamp-2 text-xs leading-relaxed'>
                            {assessment.description}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className='max-w-[240px] whitespace-normal'>
                      <Badge
                        variant='outline'
                        className='whitespace-normal text-left'
                      >
                        {row.courseTitle}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatPercentage(assessment.weight_percentage)}</TableCell>
                    <TableCell>
                      {hasRubric ? (
                        <Badge className='bg-primary text-primary-foreground'>Linked rubric</Badge>
                      ) : (
                        <Badge variant='outline'>Assigned on open</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {assessment.is_required ? (
                        <Badge className='bg-warning text-warning-foreground'>Required</Badge>
                      ) : (
                        <Badge variant='outline'>Optional</Badge>
                      )}
                    </TableCell>
                    <TableCell className='text-right'>
                      <Button size='sm' variant='outline' onClick={() => handleOpen(row)}>
                        Review rubric
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <AssessmentSheet
        row={selectedAssessment}
        courseRubrics={courseRubrics}
        rubricMatrix={rubricMatrix}
        rubricLoading={
          courseRubricsQuery.isLoading ||
          courseRubricsQuery.isFetching ||
          rubricMatrixQuery.isLoading ||
          rubricMatrixQuery.isFetching
        }
        onClose={() => setActiveAssessmentKey(null)}
      />
    </div>
  );
}