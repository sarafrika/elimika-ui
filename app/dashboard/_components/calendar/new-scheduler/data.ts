// Scheduler presentation config (labels, icons, tones, styles). Values are computed
// from real data by the calendar view/grid — nothing here is sample content.
import {
  Building2,
  CalendarCheck,
  CalendarDays,
  GraduationCap,
  MapPin,
  Trophy,
  User,
  Wrench,
} from 'lucide-react';
import type { SchedulerCategory, SchedulerMetric } from './types';

export const schedulerHours = Array.from({ length: 24 }, (_, index) => index);

export const categoryStyles: Record<SchedulerCategory, string> = {
  'TVET / Vocational': 'border-primary/50 bg-primary/10 text-primary',
  STEM: 'border-success/50 bg-success/10 text-success',
  Arts: 'border-warning/50 bg-warning/10 text-warning',
  Sports: 'border-secondary bg-secondary/70 text-secondary-foreground',
  Certifications: 'border-destructive/50 bg-destructive/10 text-destructive',
};

export const schedulerMetrics: SchedulerMetric[] = [
  {
    label: 'Classes',
    value: '0',
    helper: 'Visible in range',
    icon: CalendarDays,
    tone: 'bg-success/10 text-success',
  },
  {
    label: 'Exams',
    value: '0',
    helper: 'In range',
    icon: GraduationCap,
    tone: 'bg-destructive/10 text-destructive',
  },
  {
    label: 'Events',
    value: '0',
    helper: 'In range',
    icon: CalendarCheck,
    tone: 'bg-primary/10 text-primary',
  },
  {
    label: 'Competitions',
    value: '0',
    helper: 'In range',
    icon: Trophy,
    tone: 'bg-warning/10 text-warning',
  },
  {
    label: 'Instructors',
    value: '0',
    helper: 'Available in range',
    icon: User,
    tone: 'bg-secondary/10 text-secondary-foreground',
  },
  {
    label: 'Venues',
    value: '0',
    helper: 'In use',
    icon: MapPin,
    tone: 'bg-warning/10 text-warning',
  },
  {
    label: 'Equipment',
    value: '0',
    helper: 'Assigned',
    icon: Wrench,
    tone: 'bg-success/10 text-success',
  },
];
