import { forwardRef } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BadgeDollarSign,
  BookOpen,
  Building2,
  CheckCircle2,
  Clock,
  Database,
  Headset,
  GaugeCircle,
  LayoutDashboard,
  LineChart,
  MessageCircle,
  PieChart,
  Shield,
  Sparkles,
  TrendingUp,
  UserCheck,
  UserCog,
  UserRound,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type LucideIconComponent = typeof Users;

export const dashboardIconMap = {
  users: Users,
  'user-active': UserCheck,
  'trend-up': TrendingUp,
  organizations: Building2,
  security: Shield,
  activity: Activity,
  warning: AlertTriangle,
  critical: AlertCircle,
  success: CheckCircle2,
  courses: BookOpen,
  analytics: BarChart3,
  chart: LineChart,
  pie: PieChart,
  database: Database,
  gauge: GaugeCircle,
  sparkle: Sparkles,
  clock: Clock,
  'delta-up': ArrowUpRight,
  'delta-down': ArrowDownRight,
  'delta-flat': ArrowRight,
  'layout-dashboard': LayoutDashboard,
  'badge-dollar': BadgeDollarSign,
  'message-circle': MessageCircle,
  headset: Headset,
  'user-cog': UserCog,
  'user-round': UserRound,
} satisfies Record<string, LucideIconComponent>;

export type DashboardIconName = keyof typeof dashboardIconMap;

export interface IconProps extends React.ComponentPropsWithoutRef<'svg'> {
  name: DashboardIconName;
  className?: string;
  strokeWidth?: number;
}

export const Icon = forwardRef<SVGSVGElement, IconProps>(
  ({ name, className, strokeWidth = 2, ...props }, ref) => {
    const LucideIcon = dashboardIconMap[name];
    return (
      <LucideIcon
        ref={ref}
        className={cn('h-5 w-5', className)}
        strokeWidth={strokeWidth}
        {...props}
      />
    );
  },
);

Icon.displayName = 'Icon';
