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
  visibleInstances: InstructorClassWithSchedule['schedule'];
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
    const sale = salesItems[index] ?? salesItems[0] ?? null;
    const fallbackAmount = selectedClass.training_fee ?? 0;

    return {
      id: instance.uuid ?? `${selectedClass.uuid ?? 'class'}-${index}`,
      index: index + 1,
      sessionDateTime:
        instance.time_range ||
        shortDateFormatter.format(new Date(instance.start_time ?? Date.now())),
      classDuration: instance.duration_formatted || formatDuration(instance.start_time, instance.end_time),
      trainerAttendance: attendanceValues.trainerAttendance,
      studentAttendance: attendanceValues.studentAttendance,
      training: attendanceValues.training,
      assessment: attendanceValues.assessment,
      payableAmount: showFinancialColumns
        ? formatCurrency(sale?.total ?? sale?.unit_price ?? fallbackAmount)
        : undefined,
      orderAmount: showFinancialColumns
        ? formatCurrency(sale?.order_total_amount ?? sale?.subtotal ?? fallbackAmount)
        : undefined,
      statusLabel,
      statusTone: resolveStatusTone(statusLabel),
    };
  });
}
