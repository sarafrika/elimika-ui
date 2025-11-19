import { fetchClient } from '@/services/api/fetch-client';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { z } from 'zod';

const guardianShareScopeSchema = z.enum(['FULL', 'ACADEMICS', 'ATTENDANCE']).catch('FULL');
const guardianLinkStatusSchema = z.enum(['ACTIVE', 'PENDING', 'REVOKED']).catch('ACTIVE');

const guardianStudentSchema = z
  .object({
    student_uuid: z.string(),
    student_name: z.string(),
    relationship: z.string().optional(),
    status: guardianLinkStatusSchema.optional(),
    share_scope: guardianShareScopeSchema.optional(),
    avatar_url: z.string().url().optional(),
    grade_level: z.string().optional(),
    last_synced_at: z.string().optional(),
  })
  .passthrough();

const guardianStudentListWrapperSchema = z
  .object({
    data: z.array(guardianStudentSchema).optional(),
    students: z.array(guardianStudentSchema).optional(),
    items: z.array(guardianStudentSchema).optional(),
    content: z.array(guardianStudentSchema).optional(),
  })
  .passthrough();

const guardianCourseProgressSchema = z
  .object({
    enrollment_uuid: z.string().optional(),
    course_uuid: z.string().optional(),
    course_name: z.string().optional(),
    status: z.string().optional(),
    progress_percentage: z.number().optional(),
    updated_date: z.string().optional(),
  })
  .passthrough();

const guardianProgramProgressSchema = z
  .object({
    enrollment_uuid: z.string().optional(),
    program_uuid: z.string().optional(),
    program_name: z.string().optional(),
    status: z.string().optional(),
    progress_percentage: z.number().optional(),
    updated_date: z.string().optional(),
    expected_completion_date: z.string().optional(),
  })
  .passthrough();

const guardianComplianceNoticeSchema = z
  .object({
    code: z.string().optional(),
    title: z.string().optional(),
    message: z.string().optional(),
    course_name: z.string().optional(),
    class_name: z.string().optional(),
    allowed_age_range: z.string().optional(),
    min_age: z.number().optional(),
    max_age: z.number().optional(),
    student_age: z.number().optional(),
    student_dob: z.string().optional(),
    occurred_at: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .passthrough();

const guardianDashboardSchema = z
  .object({
    student_uuid: z.string(),
    student_name: z.string(),
    share_scope: guardianShareScopeSchema.default('FULL'),
    status: guardianLinkStatusSchema.optional(),
    last_synced_at: z.string().optional(),
    relationship: z.string().optional(),
    course_progress: z.array(guardianCourseProgressSchema).optional(),
    program_progress: z.array(guardianProgramProgressSchema).optional(),
    compliance_notices: z.array(guardianComplianceNoticeSchema).optional(),
  })
  .passthrough();

export type GuardianShareScope = z.infer<typeof guardianShareScopeSchema>;
export type GuardianLinkStatus = z.infer<typeof guardianLinkStatusSchema>;
export type GuardianLinkedStudent = z.infer<typeof guardianStudentSchema>;
export type GuardianCourseProgress = z.infer<typeof guardianCourseProgressSchema>;
export type GuardianProgramProgress = z.infer<typeof guardianProgramProgressSchema>;
export type GuardianComplianceNotice = z.infer<typeof guardianComplianceNoticeSchema>;
export type GuardianDashboardSnapshot = z.infer<typeof guardianDashboardSchema>;

function normalizeGuardianStudents(payload: unknown): GuardianLinkedStudent[] {
  const arrayResult = z.array(guardianStudentSchema).safeParse(payload);
  if (arrayResult.success) {
    return arrayResult.data;
  }

  const wrapperResult = guardianStudentListWrapperSchema.safeParse(payload);
  if (wrapperResult.success) {
    return (
      wrapperResult.data.data ??
      wrapperResult.data.students ??
      wrapperResult.data.items ??
      wrapperResult.data.content ??
      []
    );
  }

  return [];
}

export async function fetchGuardianStudents(): Promise<GuardianLinkedStudent[]> {
  const response = await fetchClient.GET('/api/v1/guardians/me/students' as any);

  if (response.error) {
    throw new Error(
      typeof response.error === 'string'
        ? response.error
        : 'Unable to load linked students for this guardian.'
    );
  }

  return normalizeGuardianStudents(response.data);
}

export async function fetchGuardianDashboard(
  studentUuid: string
): Promise<GuardianDashboardSnapshot> {
  const response = await fetchClient.GET('/api/v1/guardians/students/{studentUuid}/dashboard' as any, {
    params: {
      path: { studentUuid },
    },
  });

  if (response.error) {
    const message =
      response.error && typeof response.error === 'string'
        ? response.error
        : 'Unable to load guardian dashboard.';
    const status = response.response && 'status' in response.response ? response.response.status : 500;

    const error = new Error(message);
    (error as Error & { status?: number }).status = status;
    throw error;
  }

  return guardianDashboardSchema.parse(response.data);
}

export const guardianStudentsQueryKey = ['guardian', 'students'] as const;
export const guardianDashboardQueryKey = (studentUuid?: string) =>
  ['guardian', 'dashboard', studentUuid ?? 'unselected'] as const;

export function useGuardianStudents(
  options?: Partial<UseQueryOptions<GuardianLinkedStudent[], Error>>
) {
  return useQuery({
    queryKey: guardianStudentsQueryKey,
    queryFn: fetchGuardianStudents,
    staleTime: 1000 * 60,
    ...options,
  });
}

export function useGuardianDashboard(
  studentUuid?: string,
  options?: Partial<UseQueryOptions<GuardianDashboardSnapshot, Error>>
) {
  return useQuery({
    queryKey: guardianDashboardQueryKey(studentUuid),
    queryFn: () => {
      if (!studentUuid) {
        throw new Error('Student UUID missing');
      }
      return fetchGuardianDashboard(studentUuid);
    },
    enabled: Boolean(studentUuid),
    refetchInterval: 60_000,
    ...options,
  });
}
