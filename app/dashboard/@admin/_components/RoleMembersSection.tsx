'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { CourseCreator, Instructor, Student, User } from '@/services/client';
import {
  getAdminUsersOptions,
  getAllCourseCreatorsOptions,
  getAllInstructorsOptions,
  getAllStudentsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { RoleMembersTable, type RoleMember } from './RoleMembersTable';

type Role = 'student' | 'instructor' | 'course_creator' | 'admin';

// Spring expects camelCase entity property names in sort, not snake_case column names.
const PAGEABLE = { page: 0, size: 100, sort: ['createdDate,desc', 'lastModifiedDate,desc'] };

/** Client section that loads role members through the proxy and renders the members table. */
export function RoleMembersSection({ role }: { role: Role }) {
  const studentsQuery = useQuery({
    ...getAllStudentsOptions({ query: { pageable: PAGEABLE } }),
    enabled: role === 'student',
  });
  const instructorsQuery = useQuery({
    ...getAllInstructorsOptions({ query: { pageable: PAGEABLE } }),
    enabled: role === 'instructor',
  });
  const creatorsQuery = useQuery({
    ...getAllCourseCreatorsOptions({ query: { pageable: PAGEABLE } }),
    enabled: role === 'course_creator',
  });
  const adminsQuery = useQuery({
    ...getAdminUsersOptions({ query: { filters: {}, pageable: PAGEABLE } }),
    enabled: role === 'admin',
  });

  const active =
    role === 'student'
      ? studentsQuery
      : role === 'instructor'
        ? instructorsQuery
        : role === 'course_creator'
          ? creatorsQuery
          : adminsQuery;

  const members = useMemo<RoleMember[]>(() => {
    const content = (active.data?.data?.content ?? []) as unknown[];
    if (role === 'student') {
      return (content as Student[]).map(s => ({
        userUuid: s.user_uuid,
        name: s.full_name || 'Student',
        subtitle: s.demographic_tag || undefined,
        joined: s.created_date ? String(s.created_date) : undefined,
      }));
    }
    if (role === 'instructor') {
      return (content as Instructor[]).map(i => ({
        userUuid: i.user_uuid,
        name: i.full_name || 'Instructor',
        subtitle: i.professional_headline || i.formatted_location || undefined,
        joined: i.created_date ? String(i.created_date) : undefined,
      }));
    }
    if (role === 'course_creator') {
      return (content as CourseCreator[]).map(c => ({
        userUuid: c.user_uuid,
        name: c.full_name || 'Course creator',
        subtitle: c.professional_headline || undefined,
        joined: c.created_date ? String(c.created_date) : undefined,
      }));
    }
    return (content as User[]).map(u => ({
      userUuid: u.uuid,
      name: u.full_name || `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || 'Administrator',
      subtitle: u.email || undefined,
      joined: u.created_date ? String(u.created_date) : undefined,
    }));
  }, [active.data?.data?.content, role]);

  const labels: Record<Role, { search: string; emptyTitle: string; emptyDescription: string }> = {
    student: {
      search: 'Search students…',
      emptyTitle: 'No students found',
      emptyDescription: 'No learner accounts are available yet.',
    },
    instructor: {
      search: 'Search instructors…',
      emptyTitle: 'No instructors found',
      emptyDescription: 'No instructor accounts are available yet.',
    },
    course_creator: {
      search: 'Search course creators…',
      emptyTitle: 'No course creators found',
      emptyDescription: 'No course creator accounts are available yet.',
    },
    admin: {
      search: 'Search administrators…',
      emptyTitle: 'No administrators found',
      emptyDescription: 'No administrator accounts are available yet.',
    },
  };

  return (
    <RoleMembersTable
      members={members}
      isLoading={active.isLoading}
      searchPlaceholder={labels[role].search}
      emptyTitle={labels[role].emptyTitle}
      emptyDescription={labels[role].emptyDescription}
    />
  );
}
