import type { InstructorClassWithSchedule } from '@/hooks/use-instructor-classes-with-schedules';
import type {
  ClassAssignmentSchedule,
  ClassQuizSchedule,
} from '@/services/client/types.gen';
import { formatDuration } from './new-class-page.utils';

export type ClassSessionLedgerRow = {
  id: string;
  index: number;
  sessionDateTime: string;
  classDuration: string;
  trainerAttendance: string;
  studentAttendance: string;
  training: 'Yes' | 'No';
  assessment: 'Yes' | 'No';
  payableAmount?: string;
  orderAmount?: string;
  statusLabel: string;
  statusTone: 'success' | 'warning' | 'info' | 'muted';
};

export type BuildClassSessionLedgerRowsParams = {
  selectedClass: InstructorClassWithSchedule;
  visibleInstances: EnrichedScheduleInstance[];
  assignmentSchedules?: ClassAssignmentSchedule[];
  quizSchedules?: ClassQuizSchedule[];
  showFinancialColumns: boolean;
};

const shortDateFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

const currencyFormatter = new Intl.NumberFormat('en-KE', {
  maximumFractionDigits: 0,
});

function formatCurrency(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'Ksh 0';
  }

  return `Ksh ${currencyFormatter.format(Math.round(value))}`;
}

function formatElapsedDuration(
  startedAt?: Date | string | null,
  concludedAt?: Date | string | null
) {
  if (!startedAt) return null;

  const start = new Date(startedAt);
  if (Number.isNaN(start.getTime())) return null;

  const end = concludedAt ? new Date(concludedAt) : new Date();
  if (Number.isNaN(end.getTime())) return null;

  const totalMinutes = Math.max(Math.round((end.getTime() - start.getTime()) / (1000 * 60)), 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours && minutes) return `${hours}h ${minutes}m`;
  if (hours) return `${hours}h`;
  if (minutes) return `${minutes}m`;

  return '0m';
}

function isWithinScheduledWindow(
  instance: NonNullable<InstructorClassWithSchedule['schedule']>[number]
) {
  if (!instance.started_at || !instance.concluded_at) {
    return false;
  }

  const actualStart = new Date(instance.started_at);
  const actualEnd = new Date(instance.concluded_at);
  const scheduledStart = new Date(instance.start_time);
  const scheduledEnd = new Date(instance.end_time);

  if (
    Number.isNaN(actualStart.getTime()) ||
    Number.isNaN(actualEnd.getTime()) ||
    Number.isNaN(scheduledStart.getTime()) ||
    Number.isNaN(scheduledEnd.getTime())
  ) {
    return false;
  }

  return actualStart >= scheduledStart && actualEnd <= scheduledEnd;
}

function resolveStatusTone(statusLabel: string): ClassSessionLedgerRow['statusTone'] {
  switch (statusLabel) {
    case 'Completed':
      return 'success';
    case 'Upcoming':
      return 'info';
    case 'Ongoing':
    case 'Scheduled':
      return 'warning';
    default:
      return 'muted';
  }
}

function resolveSessionStatus(
  instance: NonNullable<InstructorClassWithSchedule['schedule']>[number]
) {
  const status = instance.status?.toUpperCase();

  if (status === 'COMPLETED' || instance.concluded_at) {
    return 'Completed';
  }

  if (status === 'ONGOING' || (instance.started_at && !instance.concluded_at)) {
    return 'Ongoing';
  }

  const startTime = new Date(instance.start_time);
  if (!Number.isNaN(startTime.getTime()) && startTime > new Date()) {
    return 'Upcoming';
  }

  return 'Scheduled';
}

function resolveAttendanceValues(
  statusLabel: string,
  instance: NonNullable<InstructorClassWithSchedule['schedule']>[number],
  hasAssessments: boolean
) {
  const duration = instance.duration_formatted || formatDuration(instance.start_time, instance.end_time);
  const actualAttendance = formatElapsedDuration(instance.started_at, instance.concluded_at);
  const startedOnlyAttendance = formatElapsedDuration(instance.started_at, null);

  if (statusLabel === 'Completed') {
    return {
      trainerAttendance: actualAttendance || duration || '1 hour',
      studentAttendance: '100%',
      training: isWithinScheduledWindow(instance) ? ('Yes' as const) : ('No' as const),
      assessment: hasAssessments ? ('Yes' as const) : ('No' as const),
    };
  }

  if (statusLabel === 'Ongoing') {
    return {
      trainerAttendance: actualAttendance || startedOnlyAttendance || duration || '1 hour',
      studentAttendance: '85%',
      training: 'No' as const,
      assessment: hasAssessments ? ('Yes' as const) : ('No' as const),
    };
  }

  if (statusLabel === 'Upcoming') {
    return {
      trainerAttendance: duration || 'TBD',
      studentAttendance: '60%',
      training: 'No' as const,
      assessment: hasAssessments ? ('Yes' as const) : ('No' as const),
    };
  }

  return {
    trainerAttendance: duration || 'TBD',
    studentAttendance: 'Absent',
    training: 'No' as const,
    assessment: hasAssessments ? ('Yes' as const) : ('No' as const),
  };
}

type EnrichedScheduleInstance =
  NonNullable<
    InstructorClassWithSchedule['schedule']
  >[number] & {
    enrollments?: {
      uuid: string;
      status?: string;
      student_uuid?: string;
    }[];
  };

export function buildClassSessionLedgerRows({
  selectedClass,
  visibleInstances,
  assignmentSchedules = [],
  quizSchedules = [],
  showFinancialColumns,
}: BuildClassSessionLedgerRowsParams): ClassSessionLedgerRow[] {
  const hasAssessments = assignmentSchedules.length > 0 || quizSchedules.length > 0;
  const sortedInstances = [...visibleInstances]
    .filter(instance => instance.status?.toUpperCase() !== 'CANCELLED')
    .filter(instance => instance.status?.toUpperCase() !== 'BLOCKED')
    .sort(
      (left, right) =>
        new Date(left.start_time ?? 0).getTime() - new Date(right.start_time ?? 0).getTime()
    );

  return sortedInstances.map((instance, index) => {
    const statusLabel = resolveSessionStatus(instance);
    const attendanceValues = resolveAttendanceValues(statusLabel, instance, hasAssessments);

    const enrolledCount = instance.enrollments?.length ?? 0;
    const attendedCount =
      instance.enrollments?.filter(e => e.status?.toUpperCase() === 'ATTENDED').length ?? 0;

    const studentAttendance =
      statusLabel === 'Upcoming' || enrolledCount === 0
        ? 'Pending'
        : `${Math.round((attendedCount / enrolledCount) * 100)}%`;

    const feePerHour = selectedClass.training_fee ?? 0;
    const start = new Date(instance.start_time);
    const end = new Date(instance.end_time);

    const durationHours = Math.max((end.getTime() - start.getTime()) / (1000 * 60 * 60), 1);

    const payableAmount =
      showFinancialColumns && statusLabel === 'Completed'
        ? formatCurrency(attendedCount * feePerHour * durationHours)
        : undefined;

    const orderAmount =
      showFinancialColumns
        ? formatCurrency(enrolledCount * feePerHour * durationHours)
        : undefined;

    return {
      id: instance.uuid ?? `${selectedClass.uuid ?? 'class'}-${index}`,
      index: index + 1,
      sessionDateTime:
        instance.time_range ||
        shortDateFormatter.format(new Date(instance.start_time ?? Date.now())),
      classDuration: instance.duration_formatted || formatDuration(instance.start_time, instance.end_time),
      trainerAttendance: attendanceValues.trainerAttendance,
      studentAttendance,
      training: attendanceValues.training,
      assessment: attendanceValues.assessment,
      payableAmount,
      orderAmount,
      statusLabel,
      statusTone: resolveStatusTone(statusLabel),
    };
  });
}


// buildclasssessionledgerrows component
// trainer attendance ... use the started at and concluded at data fields to calculate the number of hours instructor used to train a class (in hours and minutes)...
// training -- check if instructor really trained a class (i.e. if instructor started and ended class within the alloted time frame of the class)
// assessment -- check if the class instance has an assigned assignment or quiz
// also check if assignments/tasks can be assigned to a class-instance under a class
// update the class-delivery-status-bar page too


// newclasspage (instructor view) and studentclasspage (student view) component, 
// we need use the classhero UI (which was initially in the lessontabs) to be above the tablists on these 2 pages
// on the newclasspage, the tabscontent for delivery should remain the same,
// for the classoverviewtab component, remove the ClassSessionLedgerSection, and instead add a rich course overview page (class details which are currently there, course details etc)
