'use client';

import { BookOpen, TrendingUp } from 'lucide-react';
import { useState } from 'react';

import {
  DetailGrid,
  SectionCard,
  SectionCardSkeleton,
  StatCard,
  StatusBadge,
  surfaceTheme,
} from '@/components/data-display';
import { Button } from '@/components/ui/button';
import { formatDate, formatDateOnly } from '@/lib/date';
import { toNumber } from '@/lib/metrics';
import { CourseDecisionPanel } from '../components/course-decision-panel';
import { RecordHeader } from '../components/record-header';
import { SectionBoundary } from '../components/section-boundary';
import { UnderlineTabs } from '../components/underline-tabs';
import {
  useCourse,
  useCourseAssessments,
  useCourseCreator,
  useCourseEditDiff,
  useCourseLessons,
  useCourseModerationHistory,
  useCourseRequirements,
  useCourseStats,
} from '../hooks/use-courses';
import { adminRoutes } from '../lib/admin-routes';
import { enumParam } from '../state/search-state';
import { useSearchState } from '../state/use-search-state';

const TAB_IDS = ['changes', 'curriculum', 'assessments', 'requirements', 'history'] as const;
type CourseTab = (typeof TAB_IDS)[number];

const TAB_LABELS: Record<CourseTab, string> = {
  changes: 'Proposed changes',
  curriculum: 'Curriculum',
  assessments: 'Assessments',
  requirements: 'Requirements',
  history: 'Moderation history',
};

const tabParam = enumParam(TAB_IDS, 'changes');

const money = (value?: number | null) =>
  value === null || value === undefined ? '—' : `KES ${Number(value).toLocaleString('en-KE')}`;

/** Field names arrive in snake_case straight off the course payload. */
const fieldLabel = (field?: string) =>
  (field ?? '')
    .replace(/_/g, ' ')
    .replace(/^./, character => character.toUpperCase())
    .trim() || 'Field';

export function AdminCoursePage({ uuid }: { uuid: string }) {
  const [tab] = useSearchState<CourseTab>('tab', tabParam);
  const [statsRequested, setStatsRequested] = useState(false);

  const { course, query } = useCourse(uuid);
  const { creator } = useCourseCreator(course?.course_creator_uuid);
  const { diff, isMissing: noEditWaiting, query: diffQuery, error: diffError } = useCourseEditDiff(
    uuid,
    tab === 'changes'
  );
  const { lessons, query: lessonsQuery } = useCourseLessons(uuid, tab === 'curriculum');
  const { assessments, query: assessmentsQuery } = useCourseAssessments(uuid, tab === 'assessments');
  const { requirements, query: requirementsQuery } = useCourseRequirements(
    uuid,
    tab === 'requirements'
  );
  const { history, query: historyQuery } = useCourseModerationHistory(uuid, tab === 'history');
  const { stats, query: statsQuery } = useCourseStats(uuid, statsRequested);

  const tabs = TAB_IDS.map(id => ({
    id,
    label: TAB_LABELS[id],
    href: adminRoutes.course(uuid, id),
  }));

  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <SectionBoundary
          label='this course'
          loading={query.isLoading && !course}
          error={query.error}
          onRetry={query.refetch}
          skeleton={<SectionCardSkeleton rows={2} />}
          empty={!query.isLoading && !course}
          emptyTitle='Course not found'
          emptyDescription='It may have been deleted since this link was made.'
        >
          {course ? (
            <RecordHeader
              initials='C'
              imageUrl={course.thumbnail_url}
              title={course.name}
              facts={[
                creator?.full_name ? `by ${creator.full_name}` : null,
                course.total_duration_display || null,
                course.category_names?.length ? course.category_names.join(', ') : null,
                `Updated ${formatDate(course.updated_date) || '—'}`,
              ].filter(Boolean)}
              badges={[
                { status: course.status },
                course.admin_approved
                  ? { label: 'Approved', tone: 'success' as const }
                  : { label: 'Awaiting review', tone: 'warning' as const },
                ...(diff && !noEditWaiting
                  ? [{ label: 'Edit waiting', tone: 'info' as const }]
                  : []),
              ]}
            />
          ) : null}
        </SectionBoundary>

        <UnderlineTabs tabs={tabs} active={tab} />

        {course ? (
          <div className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]'>
            <div className='flex flex-col gap-4'>
              {tab === 'changes' ? (
                <SectionCard
                  title='Proposed changes'
                  description='What the waiting edit would change on the live course.'
                >
                  <SectionBoundary
                    label='the proposed changes'
                    loading={diffQuery.isLoading}
                    error={diffError}
                    empty={noEditWaiting || !diff?.field_changes?.length}
                    onRetry={diffQuery.refetch}
                    emptyTitle={noEditWaiting ? 'No edit waiting' : 'No field changes'}
                    emptyDescription={
                      noEditWaiting
                        ? 'This course has no draft edit under review.'
                        : 'The edit changes lessons only — the course fields are unchanged.'
                    }
                  >
                    <div className='flex flex-col gap-4'>
                      <div className='flex flex-wrap gap-2'>
                        <StatusBadge
                          tone='info'
                          label={`${toNumber(diff?.lessons_added)} lessons added`}
                        />
                        <StatusBadge
                          tone='warning'
                          label={`${toNumber(diff?.lessons_modified)} changed`}
                        />
                        <StatusBadge
                          tone='destructive'
                          label={`${toNumber(diff?.lessons_removed)} removed`}
                        />
                      </div>

                      <div className='border-border/60 overflow-hidden rounded-md border'>
                        <table className='w-full text-sm'>
                          <thead className='bg-muted/40 text-muted-foreground text-xs'>
                            <tr>
                              <th className='px-3 py-2 text-left font-semibold'>Field</th>
                              <th className='px-3 py-2 text-left font-semibold'>Live now</th>
                              <th className='px-3 py-2 text-left font-semibold'>Proposed</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(diff?.field_changes ?? []).map(change => (
                              <tr key={change.field} className='border-border/60 border-t'>
                                <td className='text-foreground px-3 py-2 font-medium'>
                                  {fieldLabel(change.field)}
                                </td>
                                <td className='text-muted-foreground px-3 py-2'>
                                  {change.live_value || '—'}
                                </td>
                                <td className='text-foreground px-3 py-2'>
                                  {change.draft_value || '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <p className='text-muted-foreground text-xs'>
                        Lessons are counted, not listed: the diff endpoint returns totals only, and
                        the draft’s content is not readable by an admin. Seeing the lesson text
                        needs a backend change.
                      </p>
                    </div>
                  </SectionBoundary>
                </SectionCard>
              ) : null}

              {tab === 'curriculum' ? (
                <SectionCard title='Curriculum' description='Lessons on the live course.'>
                  <SectionBoundary
                    label='the curriculum'
                    loading={lessonsQuery.isLoading}
                    error={lessonsQuery.error}
                    empty={lessons.length === 0}
                    onRetry={lessonsQuery.refetch}
                    emptyTitle='No lessons yet'
                    emptyDescription='The creator has not added lessons to this course.'
                  >
                    <ol className='flex flex-col gap-2'>
                      {lessons.map(lesson => (
                        <li
                          key={lesson.uuid}
                          className='border-border/60 flex items-start gap-3 rounded-md border px-3 py-2.5'
                        >
                          <span className='text-muted-foreground font-mono text-xs'>
                            {toNumber(lesson.lesson_number)}
                          </span>
                          <span className='min-w-0'>
                            <span className='text-foreground block text-sm font-medium'>
                              {lesson.title}
                            </span>
                            {lesson.description ? (
                              <span className='text-muted-foreground line-clamp-2 block text-xs'>
                                {lesson.description}
                              </span>
                            ) : null}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </SectionBoundary>
                </SectionCard>
              ) : null}

              {tab === 'assessments' ? (
                <SectionCard title='Assessments' description='How learners are graded.'>
                  <SectionBoundary
                    label='the assessments'
                    loading={assessmentsQuery.isLoading}
                    error={assessmentsQuery.error}
                    empty={assessments.length === 0}
                    onRetry={assessmentsQuery.refetch}
                    emptyTitle='No assessments'
                    emptyDescription='This course has no assessments attached.'
                  >
                    <ul className='flex flex-col gap-2'>
                      {assessments.map(assessment => (
                        <li
                          key={assessment.uuid}
                          className='border-border/60 flex flex-wrap items-center gap-3 rounded-md border px-3 py-2.5'
                        >
                          <span className='text-foreground min-w-0 flex-1 text-sm font-medium'>
                            {assessment.title}
                          </span>
                          {assessment.weight_percentage === null ||
                          assessment.weight_percentage === undefined ? null : (
                            <span className='text-muted-foreground font-mono text-xs'>
                              {toNumber(assessment.weight_percentage)}%
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </SectionBoundary>
                </SectionCard>
              ) : null}

              {tab === 'requirements' ? (
                <SectionCard
                  title='Enrollment requirements'
                  description='What a learner must meet before enrolling.'
                >
                  <SectionBoundary
                    label='the requirements'
                    loading={requirementsQuery.isLoading}
                    error={requirementsQuery.error}
                    empty={requirements.length === 0}
                    onRetry={requirementsQuery.refetch}
                    emptyTitle='No requirements'
                    emptyDescription='Anyone within the age range can enroll.'
                  >
                    <ul className='flex flex-col gap-2'>
                      {requirements.map(requirement => (
                        <li
                          key={requirement.uuid}
                          className='border-border/60 rounded-md border px-3 py-2.5'
                        >
                          <p className='text-foreground text-sm font-medium'>
                            {requirement.requirement_type}
                          </p>
                          <p className='text-muted-foreground text-xs'>
                            {requirement.requirement_text}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </SectionBoundary>
                </SectionCard>
              ) : null}

              {tab === 'history' ? (
                <SectionCard title='Moderation history' description='Every past decision.'>
                  <SectionBoundary
                    label='the moderation history'
                    loading={historyQuery.isLoading}
                    error={historyQuery.error}
                    empty={history.length === 0}
                    onRetry={historyQuery.refetch}
                    emptyTitle='No decisions yet'
                    emptyDescription='Nothing has been approved, rejected or revoked on this course.'
                  >
                    <ul className='flex flex-col gap-2'>
                      {history.map(entry => (
                        <li
                          key={entry.uuid}
                          className='border-border/60 rounded-md border px-3 py-2.5'
                        >
                          <div className='flex flex-wrap items-center gap-2'>
                            <StatusBadge status={entry.action} />
                            <span className='text-muted-foreground font-mono text-xs'>
                              {formatDate(entry.created_date) || '—'}
                            </span>
                            <span className='text-muted-foreground text-xs'>
                              {entry.created_by || 'Unknown admin'}
                            </span>
                          </div>
                          {entry.reason ? (
                            <p className='text-foreground mt-1.5 text-sm'>{entry.reason}</p>
                          ) : (
                            <p className='text-muted-foreground mt-1.5 text-xs'>
                              No reason was recorded.
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                    <p className='text-muted-foreground mt-3 text-xs'>
                      History carries the admin’s email, not their name — the API stores no
                      moderator name.
                    </p>
                  </SectionBoundary>
                </SectionCard>
              ) : null}
            </div>

            <div className='flex flex-col gap-4'>
              <CourseDecisionPanel
                uuid={uuid}
                courseName={course.name}
                creatorName={creator?.full_name}
                isApproved={Boolean(course.admin_approved)}
                hasPendingEdit={Boolean(diff) && !noEditWaiting}
              />

              <SectionCard title='Course facts'>
                <DetailGrid
                  columns={1}
                  items={[
                    { label: 'Price', value: money(course.price) },
                    { label: 'Minimum training fee', value: money(course.minimum_training_fee) },
                    {
                      label: 'Revenue share',
                      value: `Creator ${toNumber(course.creator_share_percentage)}% · Instructor ${toNumber(
                        course.instructor_share_percentage
                      )}%`,
                    },
                    {
                      label: 'Class limit',
                      value: course.class_limit ? toNumber(course.class_limit) : 'No limit',
                    },
                    {
                      label: 'Age range',
                      value:
                        course.age_lower_limit || course.age_upper_limit
                          ? `${course.age_lower_limit ?? '—'} to ${course.age_upper_limit ?? '—'}`
                          : 'No age limits',
                    },
                    { label: 'Duration', value: course.total_duration_display || '—' },
                    { label: 'Created', value: formatDateOnly(course.created_date) },
                    {
                      label: 'Course id',
                      value: <span className='font-mono text-xs'>{course.uuid}</span>,
                    },
                  ]}
                />
              </SectionCard>

              <SectionCard
                title='Course stats'
                description='One call, on request — never once per row on the list.'
              >
                {statsRequested ? (
                  <SectionBoundary
                    label='the course stats'
                    loading={statsQuery.isLoading}
                    error={statsQuery.error}
                    onRetry={statsQuery.refetch}
                    empty={!stats}
                    emptyTitle='No figures yet'
                    emptyDescription='This course has no enrolments or sales to report.'
                  >
                    <div className='grid gap-3 sm:grid-cols-2'>
                      <StatCard
                        label='Learners trained'
                        value={toNumber(stats?.public?.learners_trained)}
                        icon={BookOpen}
                      />
                      <StatCard
                        label='Classes running'
                        value={toNumber(stats?.public?.classes_running)}
                      />
                      <StatCard
                        label='Completion rate'
                        value={`${toNumber(stats?.public?.completion_rate)}%`}
                      />
                      <StatCard
                        label='Rating'
                        value={`${toNumber(stats?.public?.average_rating)} (${toNumber(
                          stats?.public?.total_reviews
                        )})`}
                      />
                      {stats?.owner ? (
                        <>
                          <StatCard
                            label='Enrolments'
                            value={toNumber(stats.owner.total_enrollments)}
                          />
                          <StatCard
                            label='Gross sales'
                            value={money(stats.owner.gross_sales)}
                            icon={TrendingUp}
                          />
                        </>
                      ) : null}
                    </div>
                  </SectionBoundary>
                ) : (
                  <Button
                    variant='outline'
                    className='rounded-md'
                    onClick={() => setStatsRequested(true)}
                  >
                    Load course stats
                  </Button>
                )}
              </SectionCard>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
