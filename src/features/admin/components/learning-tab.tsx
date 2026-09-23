'use client';

import {
  SectionCard,
  SectionCardSkeleton,
  StatCard,
  StatusBadge,
} from '@/components/data-display';
import { Progress } from '@/components/ui/progress';
import { formatDate } from '@/lib/date';
import type { Student } from '@/services/client';
import {
  useStudentAttendance,
  useStudentCertificates,
  useStudentEnrolments,
} from '../hooks/use-person-record';
import { SectionBoundary } from './section-boundary';

/** Certificate files are served from a public route, so the link is built from the path. */
const certificateHref = (url?: string | null) =>
  url ? `/api/proxy/api/v1/certificates/files/${url.replace(/^\/+/, '')}` : null;

export function LearningTab({
  student,
  loading,
  personName,
}: {
  student: Student | null;
  loading: boolean;
  personName: string;
}) {
  if (loading) return <SectionCardSkeleton rows={5} />;

  if (!student) {
    return (
      <SectionCard title='Learning'>
        <p className='text-muted-foreground text-sm'>
          {personName || 'This person'} has no learner profile, so there are no enrolments to show.
        </p>
      </SectionCard>
    );
  }

  return (
    <div className='flex flex-col gap-4'>
      <AttendanceRow studentUuid={student.uuid} />
      <div className='grid gap-4 xl:grid-cols-2'>
        <EnrolmentsBlock studentUuid={student.uuid} />
        <CertificatesBlock studentUuid={student.uuid} />
      </div>
    </div>
  );
}

function AttendanceRow({ studentUuid }: { studentUuid?: string }) {
  const { summary, query } = useStudentAttendance(studentUuid);
  const { courseEnrolments, classEnrolments } = useStudentEnrolments(studentUuid);

  return (
    <SectionBoundary
      label='the attendance summary'
      loading={query.isLoading && !query.data}
      error={query.error}
      onRetry={() => query.refetch()}
      skeleton={<SectionCardSkeleton rows={2} withHeader={false} />}
    >
      <div className='flex flex-col gap-2'>
        <div className='grid gap-4 sm:grid-cols-4'>
          <StatCard label='Course enrolments' value={courseEnrolments.length} />
          <StatCard label='Class enrolments' value={classEnrolments.length} />
          <StatCard label='Attended' value={summary.attended} hint='Marked present' />
          <StatCard label='Absent' value={summary.absent} hint='Marked absent' />
        </div>
        <p className='text-muted-foreground text-xs'>
          Attendance is counted from the {summary.counted} most recent session enrolments
          {summary.total > summary.counted ? ` of ${summary.total}` : ''}. A platform-wide
          attendance summary needs a backend change.
        </p>
      </div>
    </SectionBoundary>
  );
}

function EnrolmentsBlock({ studentUuid }: { studentUuid?: string }) {
  const { courseEnrolments, classEnrolments, query } = useStudentEnrolments(studentUuid);
  const isEmpty = courseEnrolments.length === 0 && classEnrolments.length === 0;

  return (
    <SectionBoundary
      label='the enrolments'
      loading={query.isLoading && !query.data}
      error={query.error}
      onRetry={() => query.refetch()}
      empty={!query.isLoading && isEmpty}
      skeleton={<SectionCardSkeleton rows={4} />}
      emptyTitle='No enrolments'
      emptyDescription='This learner has not enrolled in anything yet.'
    >
      <SectionCard title='Enrolments'>
        <div className='flex flex-col gap-4'>
          <div>
            <p className='text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase'>
              Courses
            </p>
            {courseEnrolments.length ? (
              <ul className='divide-border/60 divide-y'>
                {courseEnrolments.map(enrolment => (
                  <li key={enrolment.enrollment_uuid ?? enrolment.course_uuid} className='py-2.5 first:pt-0'>
                    <span className='flex flex-wrap items-center gap-2'>
                      <span className='text-foreground min-w-0 flex-1 truncate text-sm font-semibold'>
                        {enrolment.course_name ?? 'Course'}
                      </span>
                      <StatusBadge status={enrolment.enrollment_status} />
                    </span>
                    <span className='mt-1.5 flex items-center gap-2'>
                      <Progress value={enrolment.progress_percentage ?? 0} className='h-1.5' />
                      <span className='text-muted-foreground font-mono text-xs'>
                        {Math.round(enrolment.progress_percentage ?? 0)}%
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className='text-muted-foreground text-sm'>No course enrolments.</p>
            )}
          </div>

          <div>
            <p className='text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase'>
              Classes
            </p>
            {classEnrolments.length ? (
              <ul className='divide-border/60 divide-y'>
                {classEnrolments.map(enrolment => (
                  <li
                    key={enrolment.class_definition_uuid}
                    className='flex flex-wrap items-center gap-2 py-2.5 first:pt-0'
                  >
                    <span className='min-w-0 flex-1'>
                      <span className='text-foreground block truncate text-sm font-semibold'>
                        {enrolment.class_title ?? 'Class'}
                      </span>
                      <span className='text-muted-foreground text-xs'>
                        {enrolment.scheduled_instance_count ?? 0} sessions
                        {enrolment.latest_activity_date
                          ? ` · last activity ${formatDate(enrolment.latest_activity_date)}`
                          : ''}
                      </span>
                    </span>
                    <StatusBadge status={enrolment.latest_enrollment_status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className='text-muted-foreground text-sm'>No class enrolments.</p>
            )}
          </div>
        </div>
      </SectionCard>
    </SectionBoundary>
  );
}

function CertificatesBlock({ studentUuid }: { studentUuid?: string }) {
  const { certificates, query } = useStudentCertificates(studentUuid);

  return (
    <SectionBoundary
      label='the certificates'
      loading={query.isLoading && !query.data}
      error={query.error}
      onRetry={() => query.refetch()}
      empty={!query.isLoading && certificates.length === 0}
      skeleton={<SectionCardSkeleton rows={3} />}
      emptyTitle='No certificates'
      emptyDescription='This learner has not earned a certificate yet.'
    >
      <SectionCard title='Certificates'>
        <ul className='divide-border/60 divide-y'>
          {certificates.map(certificate => {
            const href = certificateHref(certificate.certificate_url);
            return (
              <li
                key={certificate.uuid}
                className='flex flex-wrap items-center gap-2 py-2.5 first:pt-0'
              >
                <span className='min-w-0 flex-1'>
                  <span className='text-foreground block font-mono text-sm'>
                    {certificate.certificate_number ?? '—'}
                  </span>
                  <span className='text-muted-foreground text-xs'>
                    {certificate.certificate_type ?? 'Certificate'}
                    {certificate.issued_date ? ` · issued ${formatDate(certificate.issued_date)}` : ''}
                    {certificate.final_grade != null ? ` · grade ${certificate.final_grade}` : ''}
                  </span>
                </span>
                <StatusBadge status={certificate.validity_status ?? (certificate.is_valid ? 'active' : 'expired')} />
                {href ? (
                  <a href={href} target='_blank' rel='noreferrer' className='text-primary text-sm font-semibold'>
                    Open
                  </a>
                ) : null}
              </li>
            );
          })}
        </ul>
      </SectionCard>
    </SectionBoundary>
  );
}
