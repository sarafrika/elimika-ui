import { Badge } from '@/components/ui/badge';
import { normalizeStudentStatus, type StudentStatus } from '../types';

const statusConfig: Record<StudentStatus, { label: string; className: string }> = {
  Enrolled: {
    label: 'Enrolled',
    className: 'bg-primary/10 text-primary',
  },
  Graduated: {
    label: 'Graduated',
    className: 'bg-info/10 text-info',
  },
  'On Hold': {
    label: 'On Hold',
    className: 'bg-warning/10 text-warning',
  },
};

interface StatusBadgeProps {
  status: StudentStatus | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalizedStatus = normalizeStudentStatus(status);
  const config = statusConfig[normalizedStatus];

  return (
    <Badge
      variant='outline'
      className={`gap-1.5 rounded-full border-transparent px-2.5 py-1 text-xs font-semibold ${config.className}`}
    >
      <span aria-hidden='true' className='size-1.5 rounded-full bg-current' />
      {config.label}
    </Badge>
  );
}
