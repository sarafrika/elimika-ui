import { Building, GraduationCap, Presentation, Users } from 'lucide-react';

import { KpiCard, type KpiCardVariant } from '@/components/dashboard';
import type { OverviewStat } from './overview-data';

const variantMap = {
  blue: 'primary',
  green: 'green',
  orange: 'coral',
  red: 'amber',
} as const satisfies Record<OverviewStat['tone'], KpiCardVariant>;

const iconMap = {
  blue: Users,
  green: GraduationCap,
  orange: Presentation,
  red: Building,
} as const;

type OverviewStatCardProps = {
  stat: OverviewStat;
};

export function OverviewStatCard({ stat }: OverviewStatCardProps) {
  const Icon = iconMap[stat.tone];

  return (
    <KpiCard
      title={stat.label}
      value={stat.value}
      icon={<Icon className='h-5 w-5' />}
      variant={variantMap[stat.tone]}
    />
  );
}
