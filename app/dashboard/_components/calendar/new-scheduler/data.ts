// Scheduler presentation config (labels, icons, tones, styles). Values are computed
// from real data by the calendar view/grid — nothing here is sample content.
import { Building2, CalendarCheck2, GraduationCap, MapPinned } from 'lucide-react';
import type { SchedulerCategory, SchedulerMetric } from './types';

export const schedulerHours = Array.from({ length: 24 }, (_, index) => index);

export const categoryStyles: Record<SchedulerCategory, string> = {
  'TVET / Vocational': 'border-primary/50 bg-primary/10 text-primary',
  STEM: 'border-success/50 bg-success/10 text-success',
  Arts: 'border-warning/50 bg-warning/10 text-warning',
  Sports: 'border-secondary bg-secondary/70 text-secondary-foreground',
  Certifications: 'border-destructive/50 bg-destructive/10 text-destructive',
};

// Stat-card config. `value` is a placeholder that the view always overrides with the
// real count; only label/helper/icon/tone are consumed as-is.
export const schedulerMetrics: SchedulerMetric[] = [
  {
    label: 'Active Classes',
    value: '0',
    helper: 'This week',
    icon: CalendarCheck2,
    tone: 'bg-primary text-primary-foreground',
  },
  {
    label: 'Instructor Bookings',
    value: '0',
    helper: 'Assigned',
    icon: GraduationCap,
    tone: 'bg-warning text-warning-foreground',
  },
  {
    label: 'Venues in Use',
    value: '0',
    helper: 'Today',
    icon: Building2,
    tone: 'bg-success text-success-foreground',
  },
  {
    label: 'Students',
    value: '0',
    helper: 'Attending classes today',
    icon: MapPinned,
    tone: 'bg-secondary text-secondary-foreground',
  },
];
