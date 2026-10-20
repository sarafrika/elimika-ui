'use client';

import {
  BookOpen,
  ChevronDown,
  ClipboardList,
  Eye,
  ListChecks,
  RotateCw,
  Target,
  type LucideIcon,
} from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { AssignmentPreviewSheet } from '../../../_components/AssignmentPreviewSheet';
import { QuizPreviewSheet } from '../../../_components/QuizPreviewSheet';
import type { LessonAssessment } from '../program-course-evaluations';
import { useCourseEvaluationOverview } from './use-course-evaluation-overview';

const ASSESSMENT_TYPES = {
  assignment: { label: 'Assignment', icon: ClipboardList },
  quiz: { label: 'Quiz', icon: ListChecks },
} as const;

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

function StatTile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className='bg-muted/40 rounded-xl border px-4 py-3'>
      <p className='text-muted-foreground text-[11px] font-medium tracking-wide uppercase'>
        {label}
      </p>
      <p className='mt-1 text-xl font-semibold tabular-nums'>{value}</p>
    </div>
  );
}

function Meta({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span className='text-muted-foreground inline-flex items-center gap-1 text-xs'>
      <Icon aria-hidden='true' className='size-3.5 shrink-0' />
      {children}
    </span>
  );
}

function AssessmentRow({ item, onPreview }: { item: LessonAssessment; onPreview: () => void }) {
  const { label, icon: Icon } = ASSESSMENT_TYPES[item.type];
  return (
    <li>
      <Button
        type='button'
        variant='ghost'
        onClick={onPreview}
        aria-haspopup='dialog'
        aria-label={`View ${label.toLowerCase()} details: ${item.title}`}
        className='bg-card h-auto w-full flex-wrap justify-start gap-x-4 gap-y-2 rounded-lg border px-3 py-2.5 text-left whitespace-normal'
      >
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-md',
            item.type === 'quiz' ? 'bg-primary/10 text-primary' : 'bg-muted text-foreground'
          )}
        >
          <Icon aria-hidden='true' className='size-4' />
        </span>
        <span className='min-w-0 flex-1'>
          <span className='block text-sm font-medium break-words'>{item.title}</span>
          <span className='text-muted-foreground block text-xs'>{label}</span>
        </span>
        <span className='flex w-full flex-wrap items-center gap-x-4 gap-y-1 sm:w-auto'>
          {typeof item.questionCount === 'number' && (
            <Meta icon={ListChecks}>{plural(item.questionCount, 'question')}</Meta>
          )}
          <Meta icon={RotateCw}>
            {typeof item.maxAttempts === 'number'
              ? plural(item.maxAttempts, 'allowed attempt')
              : 'Attempt limit not specified'}
          </Meta>
          <Meta icon={Target}>
            {typeof item.totalMarks === 'number'
              ? `${item.totalMarks} obtainable marks`
              : 'Marks not specified'}
            {typeof item.passPercentage === 'number' ? ` · pass ${item.passPercentage}%` : ''}
          </Meta>
        </span>
        <span className='text-primary inline-flex shrink-0 items-center gap-1 text-xs font-medium'>
          <Eye aria-hidden='true' className='size-3.5' />
          View details
        </span>
      </Button>
    </li>
  );
}

export function ProgramCourseEvaluations({
  courseUuid,
  courseTitle,
}: {
  courseUuid: string;
  courseTitle: string;
}) {
  const { lessons, loading, failed, retry } = useCourseEvaluationOverview(courseUuid);
  const [preview, setPreview] = useState<{
    assessment: LessonAssessment;
    lessonTitle: string;
  } | null>(null);
  const stats = useMemo(() => {
    const assessments = lessons.flatMap(lesson => lesson.assessments);
    return {
      assignments: assessments.filter(item => item.type === 'assignment').length,
      quizzes: assessments.filter(item => item.type === 'quiz').length,
      totalMarks: assessments.reduce((sum, item) => sum + (item.totalMarks ?? 0), 0),
      missingMarks: assessments.some(item => item.totalMarks === undefined),
    };
  }, [lessons]);

  return (
    <section aria-label={`${courseTitle} assessments`} className='space-y-4'>
      <h3 className='flex items-center gap-2 text-sm font-semibold'>
        <BookOpen aria-hidden='true' className='text-primary size-4 shrink-0' />
        Assessments in {courseTitle}
      </h3>
      {failed ? (
        <EmptyState
          variant='compact'
          title='Unable to load lesson assessments'
          description='Try again to load the assignments, quizzes, and scoring details for this course.'
          action={
            <Button type='button' variant='outline' onClick={retry}>
              Try again
            </Button>
          }
        />
      ) : loading ? (
        <div role='status' aria-label='Loading lesson assessments' className='space-y-3'>
          <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
            {['Lessons', 'Assignments', 'Quizzes', 'Total marks'].map(label => (
              <Skeleton key={label} className='h-20 rounded-xl' />
            ))}
          </div>
          <Skeleton className='h-40 rounded-xl' />
        </div>
      ) : lessons.length === 0 ? (
        <EmptyState variant='compact' title='This course has no lessons yet' />
      ) : (
        <>
          <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
            <StatTile label='Lessons' value={lessons.length} />
            <StatTile label='Assignments' value={stats.assignments} />
            <StatTile label='Quizzes' value={stats.quizzes} />
            <StatTile
              label='Total marks'
              value={`${stats.totalMarks}${stats.missingMarks ? '+' : ''}`}
            />
          </div>
          {stats.missingMarks && (
            <p className='text-muted-foreground text-xs'>
              Total marks excludes assignments with no configured score.
            </p>
          )}
          <div className='space-y-2'>
            {lessons.map(lesson => {
              const quizzes = lesson.assessments.filter(item => item.type === 'quiz').length;
              const assignments = lesson.assessments.length - quizzes;
              return (
                <Collapsible key={lesson.id} defaultOpen className='rounded-xl border px-4'>
                  <CollapsibleTrigger asChild>
                    <Button
                      type='button'
                      variant='ghost'
                      className='group h-auto w-full justify-start gap-3 px-0 py-3 text-left whitespace-normal hover:bg-transparent'
                    >
                      <span className='bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-xs'>
                        {lesson.number}
                      </span>
                      <span className='flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center'>
                        <span className='min-w-0 flex-1 text-sm font-semibold break-words'>
                          {lesson.title}
                        </span>
                        <span className='flex flex-wrap gap-1.5 sm:shrink-0 sm:justify-end'>
                          {assignments > 0 && (
                            <Badge variant='secondary' className='font-normal'>
                              {plural(assignments, 'assignment')}
                            </Badge>
                          )}
                          {quizzes > 0 && (
                            <Badge variant='secondary' className='font-normal'>
                              {plural(quizzes, 'quiz')}
                            </Badge>
                          )}
                        </span>
                      </span>
                      <ChevronDown
                        aria-hidden='true'
                        className='size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180'
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className='pb-4'>
                    {lesson.assessments.length === 0 ? (
                      <EmptyState
                        variant='compact'
                        title='No assignments or quizzes in this lesson'
                      />
                    ) : (
                      <ul className='space-y-2'>
                        {lesson.assessments.map(item => (
                          <AssessmentRow
                            key={item.id}
                            item={item}
                            onPreview={() =>
                              setPreview({
                                assessment: item,
                                lessonTitle: `${courseTitle} · Lesson ${lesson.number}: ${lesson.title}`,
                              })
                            }
                          />
                        ))}
                      </ul>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </>
      )}
      {preview?.assessment.type === 'quiz' && (
        <QuizPreviewSheet
          key={preview.assessment.uuid}
          open
          onOpenChange={open => {
            if (!open) setPreview(null);
          }}
          quizUuid={preview.assessment.uuid}
          lessonTitle={preview.lessonTitle}
        />
      )}
      {preview?.assessment.type === 'assignment' && (
        <AssignmentPreviewSheet
          key={preview.assessment.uuid}
          open
          onOpenChange={open => {
            if (!open) setPreview(null);
          }}
          assignmentUuid={preview.assessment.uuid}
          lessonTitle={preview.lessonTitle}
        />
      )}
    </section>
  );
}
