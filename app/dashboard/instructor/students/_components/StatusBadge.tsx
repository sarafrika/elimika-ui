import { normalizeStudentStatus, type StudentStatus } from '../types';

const statusConfig: Record<StudentStatus, { label: string; className: string }> = {
  Enrolled: {
    label: 'Enrolled',
    className: 'bg-success/10 text-success border border-success/20',
  },
  Graduated: {
    label: 'Graduated',
    className: 'bg-primary/10 text-primary border border-primary/20',
  },
  'On Hold': {
    label: 'On Hold',
    className: 'bg-warning/10 text-warning border border-warning/20',
  },
};

interface StatusBadgeProps {
  status: StudentStatus | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalizedStatus = normalizeStudentStatus(status);
  const config = statusConfig[normalizedStatus];

  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${config.className}`}
    >
      {config.label}
    </span>
  );
}
