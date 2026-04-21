import type { LucideIcon } from 'lucide-react';

export type SchedulerProfile = 'instructor' | 'organization' | 'student' | 'admin';
export type SchedulerView = 'week' | 'month' | 'year';
export type SchedulerCategory = 'TVET / Vocational' | 'STEM' | 'Arts' | 'Sports' | 'Certifications';

export type SchedulerEvent = {
  id: string;
  title: string;
  course: string;
  instructor: string;
  instructorUuid?: string;
  location: string;
  startTime: Date;
  endTime: Date;
  status?: string;
  category: SchedulerCategory;
  students: string[];
  maxParticipants?: number;
};

export type SchedulerFilterKey = 'course' | 'instructor' | 'location' | 'category';

export type SchedulerFilterValues = Record<SchedulerFilterKey, string> & {
  statuses: string[];
};

export type SchedulerFilterOptions = Record<SchedulerFilterKey, string[]> & {
  statuses: string[];
};

export type SchedulerMetric = {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone: string;
};
