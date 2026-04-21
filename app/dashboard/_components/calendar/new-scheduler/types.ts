import type { LucideIcon } from 'lucide-react';

export type SchedulerProfile = 'instructor' | 'organization' | 'student';
export type SchedulerView = 'week' | 'day' | 'month';
export type SchedulerCategory = 'TVET / Vocational' | 'STEM' | 'Arts' | 'Sports' | 'Certifications';

export type SchedulerEvent = {
  id: string;
  title: string;
  course: string;
  instructor: string;
  location: string;
  dayIndex: number;
  startHour: number;
  duration: number;
  category: SchedulerCategory;
  students: string[];
};

export type SchedulerMetric = {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone: string;
};
