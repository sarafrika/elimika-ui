import type {
  Certificate,
  ClassDefinitionResponse,
  StudentClassEnrollmentSummary,
  StudentCourseEnrollmentSummary,
} from '@/services/client';
import {
  getClassDefinitionsForInstructor,
  getClassEnrollmentsForStudent,
  getCourseEnrollmentsForStudent,
  getStudentCertificates,
} from '@/services/client';

export type { ResolvedUserProfiles } from './credential-review';
export { resolveUserProfiles } from './credential-review';

const PAGEABLE = { page: 0, size: 200 };

function formatDate(value?: Date | string | null): string | undefined {
  if (!value) return undefined;
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function humanize(value?: string | null): string | undefined {
  if (!value) return undefined;
  return String(value).replace(/_/g, ' ').toLowerCase();
}

/* ------------------------------------------------------------------ *
 * Instructor classes (classes the instructor teaches / trained in)    *
 * ------------------------------------------------------------------ */

export interface ClassSummary {
  uuid: string;
  title: string;
  courseUuid?: string;
  sessionFormat?: string;
  locationType?: string;
  maxParticipants?: number;
  isActive: boolean;
  startTime?: string;
}

export async function fetchInstructorClasses(instructorUuid: string): Promise<ClassSummary[]> {
  const res = await getClassDefinitionsForInstructor({
    path: { instructorUuid },
  }).catch(() => null);

  const rows = (res?.data?.data ?? []) as ClassDefinitionResponse[];
  return rows
    .map(row => row.class_definition)
    .filter((cd): cd is NonNullable<typeof cd> => Boolean(cd?.uuid))
    .map(cd => ({
      uuid: cd.uuid as string,
      title: cd.title || 'Class',
      courseUuid: cd.course_uuid ?? undefined,
      sessionFormat: humanize(cd.session_format),
      locationType: humanize(cd.location_type),
      maxParticipants: cd.max_participants ?? undefined,
      isActive: Boolean(cd.is_active),
      startTime: formatDate(cd.default_start_time),
    }));
}

/* ------------------------------------------------------------------ *
 * Student activity (enrollments + earned certificates)                *
 * ------------------------------------------------------------------ */

export interface StudentCourseEnrollment {
  enrollmentUuid?: string;
  courseUuid: string;
  courseName: string;
  status: string;
  progress: number;
  updatedAt?: string;
}

export interface StudentClassEnrollment {
  classUuid: string;
  classTitle: string;
  status: string;
  scheduledInstanceCount: number;
  lastActivity?: string;
}

export interface StudentCertificateItem {
  uuid?: string;
  title: string;
  number?: string;
  issuedDate?: string;
  completionDate?: string;
  grade?: string;
  valid: boolean;
  downloadable: boolean;
  url?: string;
}

export interface StudentActivity {
  courseEnrollments: StudentCourseEnrollment[];
  classEnrollments: StudentClassEnrollment[];
  certificates: StudentCertificateItem[];
}

export async function fetchStudentActivity(studentUuid: string): Promise<StudentActivity> {
  const [courseRes, classRes, certRes] = await Promise.all([
    getCourseEnrollmentsForStudent({ path: { studentUuid }, query: { pageable: PAGEABLE } }).catch(() => null),
    getClassEnrollmentsForStudent({ path: { studentUuid }, query: { pageable: PAGEABLE } }).catch(() => null),
    getStudentCertificates({ path: { studentUuid } }).catch(() => null),
  ]);

  const courseRows = (courseRes?.data?.data?.content ?? []) as StudentCourseEnrollmentSummary[];
  const classRows = (classRes?.data?.data?.content ?? []) as StudentClassEnrollmentSummary[];
  const certRows = (certRes?.data?.data ?? []) as Certificate[];

  return {
    courseEnrollments: courseRows.map(row => ({
      enrollmentUuid: row.enrollment_uuid,
      courseUuid: row.course_uuid,
      courseName: row.course_name || 'Course',
      status: humanize(row.enrollment_status) || '—',
      progress: Math.round(row.progress_percentage ?? 0),
      updatedAt: formatDate(row.updated_date),
    })),
    classEnrollments: classRows.map(row => ({
      classUuid: row.class_definition_uuid,
      classTitle: row.class_title || 'Class',
      status: humanize(row.latest_enrollment_status) || '—',
      scheduledInstanceCount: row.scheduled_instance_count ?? 0,
      lastActivity: formatDate(row.latest_activity_date),
    })),
    certificates: certRows.map(cert => ({
      uuid: cert.uuid,
      title: cert.certificate_type || (cert.program_uuid ? 'Program certificate' : 'Course certificate'),
      number: cert.certificate_number,
      issuedDate: formatDate(cert.issued_date),
      completionDate: formatDate(cert.completion_date),
      grade: cert.grade_letter || (cert.final_grade != null ? String(cert.final_grade) : undefined),
      valid: cert.is_valid !== false,
      downloadable: Boolean(cert.is_downloadable),
      url: cert.certificate_url,
    })),
  };
}
