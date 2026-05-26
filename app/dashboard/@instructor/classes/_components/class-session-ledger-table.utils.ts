import type { InstructorClassWithSchedule } from '@/hooks/use-instructor-classes-with-schedules';
import type { RevenueSaleLineItemDto } from '@/services/client/types.gen';
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
  salesItems?: RevenueSaleLineItemDto[];
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
  instance: NonNullable<InstructorClassWithSchedule['schedule']>[number]
) {
  const duration = instance.duration_formatted || formatDuration(instance.start_time, instance.end_time);

  if (statusLabel === 'Completed') {
    return {
      trainerAttendance: duration || '1 hour',
      studentAttendance: '100%',
      training: 'Yes' as const,
      assessment: 'Yes' as const,
    };
  }

  if (statusLabel === 'Ongoing') {
    return {
      trainerAttendance: duration || '1 hour',
      studentAttendance: '85%',
      training: 'Yes' as const,
      assessment: 'No' as const,
    };
  }

  if (statusLabel === 'Upcoming') {
    return {
      trainerAttendance: duration || 'TBD',
      studentAttendance: '60%',
      training: 'No' as const,
      assessment: 'No' as const,
    };
  }

  return {
    trainerAttendance: duration || 'TBD',
    studentAttendance: 'Absent',
    training: 'No' as const,
    assessment: 'No' as const,
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
  salesItems = [],
  showFinancialColumns,
}: BuildClassSessionLedgerRowsParams): ClassSessionLedgerRow[] {
  const sortedInstances = [...visibleInstances]
    .filter(instance => instance.status?.toUpperCase() !== 'CANCELLED')
    .filter(instance => instance.status?.toUpperCase() !== 'BLOCKED')
    .sort(
      (left, right) =>
        new Date(left.start_time ?? 0).getTime() - new Date(right.start_time ?? 0).getTime()
    );

  return sortedInstances.map((instance, index) => {
    const statusLabel = resolveSessionStatus(instance);
    const attendanceValues = resolveAttendanceValues(statusLabel, instance);

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

    const durationHours = Math.max(
      (end.getTime() - start.getTime()) /
      (1000 * 60 * 60),
      1
    );

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

// trainer attendance ... use the started at and concluded at data fields to calculate the number of hours instructor used to train a class (in hours and minutes)...
// training -- check if instructor really trained a class (i.e. if instructor started and ended class within the alloted time frame of the class)
// assessment -- check if the class instance has an assigned assignment or quiz
// also check if assignments/tasks can be assigned to a class-instance under a class
// update the class-delivery-status-bar page too


// now for newclasspage (instructor view) and studentclasspage (student view), we need use the classhero UI (which was initially in the lessontabs) to be above the tablists on these 2 pages
// 
