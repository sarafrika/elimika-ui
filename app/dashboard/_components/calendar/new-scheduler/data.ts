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
    tone: 'bg-emerald-100 text-emerald-700',
  },
  {
    label: 'Exams',
    value: '0',
    helper: 'In range',
    icon: GraduationCap,
    tone: 'bg-pink-100 text-pink-700',
  },
  {
    label: 'Events',
    value: '0',
    helper: 'In range',
    icon: CalendarCheck,
    tone: 'bg-blue-100 text-blue-700',
  },
  {
    label: 'Competitions',
    value: '0',
    helper: 'In range',
    icon: Trophy,
    tone: 'bg-violet-100 text-violet-700',
  },
  {
    label: 'Instructors',
    value: '0',
    helper: 'Available in range',
    icon: User,
    tone: 'bg-sky-100 text-sky-700',
  },
  {
    label: 'Venues',
    value: '0',
    helper: 'In use',
    icon: MapPin,
    tone: 'bg-amber-100 text-amber-700',
  },
  {
    label: 'Equipment',
    value: '0',
    helper: 'Assigned',
    icon: Wrench,
    tone: 'bg-teal-100 text-teal-700',
  },
];
