'use client';

import { type ReactNode, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { BookOpen, CheckCircle2, Eye, Lock, Pencil } from 'lucide-react';
import { AsyncSection } from '@/components/data/async-section';
import type { LessonContentPreviewItem } from '@/components/content-preview/LessonContentPreview';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { STALE_TIMES } from '@/lib/query-client';
import type { OrganisationCourseLesson, PageMetadata } from '@/services/client';
import {
  getPracticeActivitiesOptions,
  searchAssignmentsOptions,
  searchQuizzesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import {
  courseContentKind,
  type CourseCurriculumItem,
  type CourseCurriculumLesson,
} from '@/src/features/course-record/blocks/CurriculumTab';
import type { ProgramCurriculumCourse } from '@/src/features/course-record/blocks/ProgramsCurriculumTab';
import { courseCapability } from '@/src/features/course-record/types';
import { stripHtml } from '@/src/features/dashboard/courses/shared/_components/courses-data';
import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';

const LessonContentViewer = dynamic(
  () =>
    import('@/components/content-preview/LessonContentPreview').then(
      module => module.LessonContentViewerDialog
    ),
  { ssr: false }
);

type Props = {
  course: ProgramCurriculumCourse;
  lesson: OrganisationCourseLesson;
  lessonIndex: number;
  onClose: () => void;
  onReadItem?: (item: CourseCurriculumItem, lesson: CourseCurriculumLesson) => void;
};

export function ProgramLessonDetailSheet({
  course,
  lesson,
  lessonIndex,
  onClose,
  onReadItem,
}: Props) {
  const capability = courseCapability(course.access);
  const full = capability.content.level === 'full';
  const objectives = stripHtml(lesson.learning_objectives)
    .split(/\n+/)
    .map(item => item.trim())
    .filter(Boolean);
  return (
    <Sheet
      open
      onOpenChange={open => {
        if (!open) onClose();
      }}
    >
      <SheetContent className='w-full gap-0 overflow-y-auto sm:max-w-xl'>
        <SheetHeader className='border-b p-6 pr-12'>
          <div className='text-primary flex items-center gap-2 text-xs font-semibold uppercase'>
            <BookOpen className='size-4' aria-hidden />
            Lesson {lesson.lesson_number ?? lessonIndex + 1}
          </div>
          <SheetTitle className='text-2xl'>{lesson.title || 'Untitled lesson'}</SheetTitle>
          <SheetDescription>{course.name}</SheetDescription>
        </SheetHeader>
        <div className='space-y-5 p-6'>
          <DetailSection title='Description'>
            <p className='text-muted-foreground text-sm leading-6 whitespace-pre-line'>
              {stripHtml(lesson.description) || 'No description added.'}
            </p>
          </DetailSection>
          <DetailSection title='Learning objectives'>
            <DetailList items={objectives.map((title, index) => ({ key: String(index), title }))} />
          </DetailSection>
          {full && lesson.uuid ? (
            <FullLessonDetails
              course={course}
              lesson={lesson}
              lessonUuid={lesson.uuid}
              lessonIndex={lessonIndex}
              onReadItem={onReadItem}
            />
          ) : (
            <div className='bg-muted text-muted-foreground flex gap-2 rounded-lg border border-dashed p-4 text-sm'>
              <Lock className='size-4 shrink-0' aria-hidden />
              <p>
                {lesson.content_count ?? 0} content items. {capability.content.readonlyNote}{' '}
                Practice activities, assessment tasks and resources are available with full course
                access.
              </p>
            </div>
          )}
          {capability.canEdit && lesson.uuid && (
            <Button asChild>
              <Link
                href={dashboardUrl(
                  'course_creator',
                  `course-management/lesson?id=${encodeURIComponent(lesson.uuid)}&courseId=${encodeURIComponent(course.uuid)}`
                )}
              >
                <Pencil className='size-4' aria-hidden />
                Edit lesson
              </Link>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function FullLessonDetails({
  course,
  lesson,
  lessonUuid,
  lessonIndex,
  onReadItem,
}: Omit<Props, 'onClose'> & { lessonUuid: string }) {
  const [reader, setReader] = useState<LessonContentPreviewItem | null>(null);
  const [practicePage, setPracticePage] = useState(0);
  const [assignmentPage, setAssignmentPage] = useState(0);
  const [quizPage, setQuizPage] = useState(0);
  const enabled = Boolean(course.uuid && lessonUuid);
  const practice = useQuery({
    ...getPracticeActivitiesOptions({
      path: { courseUuid: course.uuid, lessonUuid },
      query: { pageable: { page: practicePage, size: 25 } },
    }),
    enabled,
    staleTime: STALE_TIMES.entity,
  });
  const assignments = useQuery({
    ...searchAssignmentsOptions({
      query: { searchParams: { lessonUuid }, pageable: { page: assignmentPage, size: 25 } },
    }),
    enabled,
    staleTime: STALE_TIMES.entity,
  });
  const quizzes = useQuery({
    ...searchQuizzesOptions({
      query: { searchParams: { lessonUuid }, pageable: { page: quizPage, size: 25 } },
    }),
    enabled,
    staleTime: STALE_TIMES.entity,
  });
  const practiceError = practice.error || practice.data?.error || practice.data?.success === false;
  const assignmentError =
    assignments.error || assignments.data?.error || assignments.data?.success === false;
  const quizError = quizzes.error || quizzes.data?.error || quizzes.data?.success === false;
  const activities = practiceError ? [] : (practice.data?.data?.content ?? []);
  const tasks = assignmentError
    ? []
    : (assignments.data?.data?.content ?? []).filter(item => item.lesson_uuid === lessonUuid);
  const tests = quizError
    ? []
    : (quizzes.data?.data?.content ?? []).filter(item => item.lesson_uuid === lessonUuid);

  return (
    <>
      <DetailSection title='Practice activities'>
        <AsyncSection
          loading={practice.isPending}
          error={practiceError}
          onRetry={() => void practice.refetch()}
          skeleton={<Skeleton className='h-20 w-full' />}
        >
          <DetailList
            items={activities.map((item, index) => ({
              key: item.uuid ?? String(index),
              title: item.title,
              detail: item.instructions,
            }))}
          />
          <DetailPagination
            page={practicePage}
            metadata={practice.data?.data?.metadata}
            onPage={setPracticePage}
            label='practice activities'
          />
        </AsyncSection>
      </DetailSection>
      <DetailSection title='Assessment tasks'>
        <div className='space-y-4'>
          <AsyncSection
            loading={assignments.isPending}
            error={assignmentError}
            onRetry={() => void assignments.refetch()}
            errorTitle='Could not load assignments'
            skeleton={<Skeleton className='h-16 w-full' />}
          >
            <h4 className='mb-2 text-xs font-medium'>Assignments</h4>
            <DetailList
              items={tasks.map((item, index) => ({
                key: item.uuid ?? String(index),
                title: item.title,
                detail: item.instructions || item.description,
              }))}
            />
            <DetailPagination
              page={assignmentPage}
              metadata={assignments.data?.data?.metadata}
              onPage={setAssignmentPage}
              label='assignments'
            />
          </AsyncSection>
          <AsyncSection
            loading={quizzes.isPending}
            error={quizError}
            onRetry={() => void quizzes.refetch()}
            errorTitle='Could not load quizzes'
            skeleton={<Skeleton className='h-16 w-full' />}
          >
            <h4 className='mb-2 text-xs font-medium'>Quizzes</h4>
            <DetailList
              items={tests.map((item, index) => ({
                key: item.uuid ?? String(index),
                title: item.title,
                detail: item.instructions || item.description,
              }))}
            />
            <DetailPagination
              page={quizPage}
              metadata={quizzes.data?.data?.metadata}
              onPage={setQuizPage}
              label='quizzes'
            />
          </AsyncSection>
        </div>
      </DetailSection>
      <DetailSection title='Resources'>
        {lesson.contents?.length ? (
          <ul className='space-y-3'>
            {lesson.contents.map((item, index) => (
              <li
                key={item.uuid ?? index}
                className='flex items-start justify-between gap-3 rounded-lg border p-3'
              >
                <div className='min-w-0 text-sm'>
                  <p className='font-medium'>{item.title}</p>
                  <p className='text-muted-foreground mt-1'>{stripHtml(item.description)}</p>
                </div>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => {
                    if (onReadItem)
                      onReadItem(
                        {
                          uuid: item.uuid,
                          title: item.title,
                          kind: courseContentKind(item.content_category ?? item.mime_type),
                          required: item.is_required,
                        },
                        {
                          number: lesson.lesson_number ?? lessonIndex + 1,
                          title: lesson.title ?? 'Untitled lesson',
                          objective: lesson.description,
                          itemCount: lesson.content_count,
                        }
                      );
                    else setReader(item);
                  }}
                >
                  <Eye className='size-4' aria-hidden />
                  Read<span className='sr-only'> {item.title}</span>
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className='text-muted-foreground text-sm'>No resources added.</p>
        )}
      </DetailSection>
      {reader && (
        <LessonContentViewer
          open
          content={reader}
          onOpenChange={open => {
            if (!open) setReader(null);
          }}
        />
      )}
    </>
  );
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className='space-y-3 border-t pt-5 first:border-0 first:pt-0'>
      <h3 className='text-sm font-semibold'>{title}</h3>
      {children}
    </section>
  );
}
function DetailList({ items }: { items: { key: string; title: string; detail?: string }[] }) {
  return items.length ? (
    <ul className='space-y-3'>
      {items.map(item => (
        <li key={item.key} className='flex items-start gap-2 text-sm leading-6'>
          <CheckCircle2 className='text-success mt-1 size-4 shrink-0' aria-hidden />
          <div>
            <p className='font-medium'>{item.title}</p>
            {item.detail && (
              <p className='text-muted-foreground whitespace-pre-line'>{stripHtml(item.detail)}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  ) : (
    <p className='text-muted-foreground text-sm'>Not specified.</p>
  );
}
function DetailPagination({
  page,
  metadata,
  onPage,
  label,
}: {
  page: number;
  metadata?: PageMetadata;
  onPage: (page: number) => void;
  label: string;
}) {
  const hasNext = metadata?.hasNext ?? page + 1 < (metadata?.totalPages ?? 1);
  return page > 0 || hasNext ? (
    <div className='mt-3 flex gap-2'>
      <Button
        size='sm'
        variant='outline'
        disabled={page === 0}
        onClick={() => onPage(page - 1)}
        aria-label={`Previous ${label}`}
      >
        Previous
      </Button>
      <Button
        size='sm'
        variant='outline'
        disabled={!hasNext}
        onClick={() => onPage(page + 1)}
        aria-label={`Next ${label}`}
      >
        Next
      </Button>
    </div>
  ) : null;
}
