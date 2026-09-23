'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { extractPage } from '@/lib/api-helpers';
import { toNumber } from '@/lib/metrics';
import type {
  Course,
  CoursePendingEdit,
  CourseCreator,
  Instructor,
  InstructorDocument,
  Organisation,
  TrainingProgram,
} from '@/services/client';
import {
  getDashboardStatisticsOptions,
  getPendingOrganisationsOptions,
  getUnverifiedCourseCreatorsOptions,
  listPendingCourseEditsOptions,
  listPendingCoursesOptions,
  listPendingProgramsOptions,
  searchDocumentsOptions,
  searchInstructorsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { queueQuery } from '../lib/admin-queries';
import type { InboxType } from '../lib/admin-routes';

const PAGE_SIZE = 20;

/** One row in the inbox, whatever queue it came from. */
export interface InboxItem {
  /** Stable id used by the ?item= parameter. */
  id: string;
  type: InboxType;
  /** What is waiting: a document title, a person, an organisation, a course. */
  subject: string;
  /** Who it belongs to, as far as the list payload knows. */
  who: string;
  /** When it arrived, for the waiting time. */
  submittedAt?: Date | string | null;
  status?: string | null;
  /** Ids used to open the right record. */
  instructorUuid?: string;
  courseCreatorUuid?: string;
  organisationUuid?: string;
  courseUuid?: string;
  programUuid?: string;
  documentUuid?: string;
}

export interface QueueResult {
  items: InboxItem[];
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
}

const pageable = (page: number, sort?: string[]) => ({
  page,
  size: PAGE_SIZE,
  ...(sort ? { sort } : {}),
});

/**
 * Each queue is its own endpoint; only the selected one runs. The rest stay disabled,
 * so opening the inbox costs the statistics call plus one queue.
 */
export function useReviewQueue(type: InboxType, page = 0): QueueResult {
  const documents = useQuery({
    ...searchDocumentsOptions({
      query: {
        searchParams: { status: 'PENDING' },
        pageable: pageable(page, ['uploadDate,asc']),
      },
    }),
    ...queueQuery,
    enabled: type === 'documents',
  });

  const instructors = useQuery({
    ...searchInstructorsOptions({
      query: { searchParams: { admin_verified: false }, pageable: pageable(page) },
    }),
    ...queueQuery,
    enabled: type === 'instructors',
  });

  const creators = useQuery({
    ...getUnverifiedCourseCreatorsOptions({ query: { pageable: pageable(page) } }),
    ...queueQuery,
    enabled: type === 'creators',
  });

  const organisations = useQuery({
    ...getPendingOrganisationsOptions({ query: { pageable: pageable(page) } }),
    ...queueQuery,
    enabled: type === 'organisations',
  });

  const courses = useQuery({
    ...listPendingCoursesOptions({ query: { pageable: pageable(page) } }),
    ...queueQuery,
    enabled: type === 'courses',
  });

  const edits = useQuery({
    ...listPendingCourseEditsOptions({ query: { pageable: pageable(page) } }),
    ...queueQuery,
    enabled: type === 'edits',
  });

  const programs = useQuery({
    ...listPendingProgramsOptions({ query: { pageable: pageable(page) } }),
    ...queueQuery,
    enabled: type === 'programs',
  });

  const active = {
    documents,
    instructors,
    creators,
    organisations,
    courses,
    edits,
    programs,
  }[type];

  const items = useMemo<InboxItem[]>(() => {
    switch (type) {
      case 'documents':
        return extractPage<InstructorDocument>(documents.data).items.map(document => ({
          id: document.uuid ?? `${document.instructor_uuid}:${document.title}`,
          type,
          subject: document.title || document.original_filename || 'Document',
          who: 'Instructor',
          submittedAt: document.upload_date,
          status: document.status,
          instructorUuid: document.instructor_uuid,
          documentUuid: document.uuid,
        }));
      case 'instructors':
        return extractPage<Instructor>(instructors.data).items.map(instructor => ({
          id: instructor.uuid ?? instructor.user_uuid ?? '',
          type,
          subject: instructor.full_name || 'Instructor profile',
          who: instructor.professional_headline || 'Instructor profile',
          submittedAt: instructor.created_date,
          instructorUuid: instructor.uuid,
        }));
      case 'creators':
        return extractPage<CourseCreator>(creators.data).items.map(creator => ({
          id: creator.uuid ?? creator.user_uuid ?? '',
          type,
          subject: creator.full_name || 'Course creator profile',
          who: creator.professional_headline || 'Course creator profile',
          submittedAt: creator.created_date,
          courseCreatorUuid: creator.uuid,
        }));
      case 'organisations':
        return extractPage<Organisation>(organisations.data).items.map(organisation => ({
          id: organisation.uuid ?? organisation.slug ?? '',
          type,
          subject: organisation.name || 'Organisation',
          who: organisation.location || organisation.country || 'Organisation',
          submittedAt: organisation.verification_requested_at ?? organisation.created_date,
          organisationUuid: organisation.uuid,
        }));
      case 'courses':
        return extractPage<Course>(courses.data).items.map(course => ({
          id: course.uuid ?? course.name,
          type,
          subject: course.name,
          who: 'Course creator',
          submittedAt: course.updated_date ?? course.created_date,
          status: course.status,
          courseUuid: course.uuid,
        }));
      case 'edits':
        return extractPage<CoursePendingEdit>(edits.data).items.map(edit => ({
          id: edit.uuid ?? edit.course_uuid ?? '',
          type,
          subject: 'Changes to a live course',
          who: 'Course creator',
          submittedAt: edit.submitted_at,
          status: edit.status,
          courseUuid: edit.course_uuid,
        }));
      case 'programs':
        return extractPage<TrainingProgram>(programs.data).items.map(program => ({
          id: program.uuid ?? program.title,
          type,
          subject: program.title,
          who: 'Course creator',
          submittedAt: program.updated_date ?? program.created_date,
          status: program.status,
          programUuid: program.uuid,
        }));
      default:
        return [];
    }
  }, [
    type,
    documents.data,
    instructors.data,
    creators.data,
    organisations.data,
    courses.data,
    edits.data,
    programs.data,
  ]);

  return {
    items,
    isLoading: active.isLoading && !active.data,
    error: active.error,
    refetch: () => {
      void active.refetch();
    },
  };
}

/**
 * Counts for the type chips. The statistics endpoint covers documents, profiles,
 * organisations and courses; pending edits and programs have no count, so their chips
 * show none rather than a made-up number.
 */
export function useQueueCounts() {
  const query = useQuery({ ...getDashboardStatisticsOptions(), ...queueQuery });

  const counts = useMemo<Partial<Record<InboxType, number>>>(() => {
    const stats = (query.data as { data?: Record<string, Record<string, unknown>> } | undefined)
      ?.data;
    if (!stats) return {};

    const compliance = stats.compliance_metrics ?? {};
    const organisations = stats.organisation_metrics ?? {};
    const content = stats.content_metrics ?? {};

    return {
      documents: toNumber(compliance.pending_instructor_documents as number),
      instructors: toNumber(compliance.pending_instructor_verifications as number),
      creators: toNumber(compliance.pending_course_creator_verifications as number),
      organisations: toNumber(organisations.pending_approvals as number),
      courses: toNumber(content.pending_moderation as number),
    };
  }, [query.data]);

  const waiting = useMemo(
    () => Object.values(counts).reduce((total, value) => total + (value ?? 0), 0),
    [counts]
  );

  return { counts, waiting, query };
}
