'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { extractEntity, extractList, extractPage } from '@/lib/api-helpers';
import type {
  CourseCreator,
  DocumentTypeOption,
  Instructor,
  InstructorDocument,
  InstructorEducation,
  User,
} from '@/services/client';
import {
  getInstructorDocumentsOptions,
  getInstructorEducationOptions,
  getUserByUuidOptions,
  listDocumentTypesOptions,
  searchCourseCreatorsOptions,
  searchInstructorsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { configQuery, listQuery } from '../lib/admin-queries';

const SINGLE_PROFILE_PAGE = { page: 0, size: 1 };

/** The person behind the record: name, contact, roles and affiliations. */
export function usePersonRecord(userUuid: string) {
  const query = useQuery({
    ...getUserByUuidOptions({ path: { uuid: userUuid } }),
    ...listQuery,
    enabled: Boolean(userUuid),
  });

  const person = useMemo(() => extractEntity<User>(query.data), [query.data]);
  return { person, query };
}

/**
 * The instructor profile for a user, if they have one. There is no lookup by user uuid,
 * so this searches for it. The response is typed as a page but arrives wrapped, so it is
 * normalised defensively.
 */
export function useInstructorProfile(userUuid: string) {
  const query = useQuery({
    ...searchInstructorsOptions({
      query: { searchParams: { user_uuid: userUuid }, pageable: SINGLE_PROFILE_PAGE },
    }),
    ...listQuery,
    enabled: Boolean(userUuid),
  });

  const instructor = useMemo(
    () => extractPage<Instructor>(query.data).items[0] ?? null,
    [query.data]
  );
  return { instructor, query };
}

/** The course-creator profile for a user, if they have one. */
export function useCourseCreatorProfile(userUuid: string) {
  const query = useQuery({
    ...searchCourseCreatorsOptions({
      query: { searchParams: { user_uuid: userUuid }, pageable: SINGLE_PROFILE_PAGE },
    }),
    ...listQuery,
    enabled: Boolean(userUuid),
  });

  const courseCreator = useMemo(
    () => extractPage<CourseCreator>(query.data).items[0] ?? null,
    [query.data]
  );
  return { courseCreator, query };
}

/** Every document the instructor has uploaded, verified or not. */
export function useInstructorDocuments(instructorUuid?: string) {
  const query = useQuery({
    ...getInstructorDocumentsOptions({ path: { instructorUuid: instructorUuid ?? '' } }),
    ...listQuery,
    enabled: Boolean(instructorUuid),
  });

  const documents = useMemo(() => {
    const list = extractList<InstructorDocument>(query.data);
    if (list.length) return list;
    return extractPage<InstructorDocument>(query.data).items;
  }, [query.data]);

  return { documents, query };
}

/** Qualifications claimed on the profile, used to check a certificate against the record. */
export function useInstructorEducation(instructorUuid?: string, enabled = true) {
  const query = useQuery({
    ...getInstructorEducationOptions({ path: { instructorUuid: instructorUuid ?? '' } }),
    ...listQuery,
    enabled: Boolean(instructorUuid) && enabled,
  });

  const education = useMemo(() => {
    const list = extractList<InstructorEducation>(query.data);
    if (list.length) return list;
    return extractPage<InstructorEducation>(query.data).items;
  }, [query.data]);

  return { education, query };
}

/** The document checklist: which types exist and which of them are required. */
export function useDocumentTypes(appliesTo = 'CREDENTIAL') {
  const query = useQuery({
    ...listDocumentTypesOptions({ query: { applies_to: appliesTo } }),
    ...configQuery,
  });

  const documentTypes = useMemo(() => {
    const list = extractList<DocumentTypeOption>(query.data);
    if (list.length) return list;
    return extractPage<DocumentTypeOption>(query.data).items;
  }, [query.data]);

  const byUuid = useMemo(() => {
    const map = new Map<string, DocumentTypeOption>();
    for (const type of documentTypes) {
      if (type.uuid) map.set(type.uuid, type);
    }
    return map;
  }, [documentTypes]);

  return { documentTypes, byUuid, query };
}
