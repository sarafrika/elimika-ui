import type { ProgramCourseLike } from '@/hooks/use-programlessonwithcontent';
import { InstructorClassWithSchedule } from '../../../../../hooks/use-instructor-classes-with-schedules';

export type TrainingHubManagedCourse = {
  id: string;
  title: string;
  provider: string;
  level: string;
  students: string;
  classes: string;
  ctaLabel: string;
  ctaHref: string;
  accent: 'blue' | 'indigo' | 'orange' | 'yellow';
  imageUrl?: string;
  status?: 'approved';
};

export type TrainingHubLiveClass = {
  id: string;
  classUuid: string;
  class: InstructorClassWithSchedule;
  title: string;
  provider: string;
  level: string;
  students: string;
  classes: string;
  fee: string;
  sessions: string;
  status: 'published' | 'draft' | 'scheduled';
  href: string;
  imageUrl?: string;
  promotionalVideoUrl?: string;
  manageHref: string;
  inviteHref: string;
  duration_minutes: string;
  programCourses?: ProgramCourseLike[];
};

export type TrainingHubWaitingStudent = {
  id: string;
  name: string;
  email: string;
  status: string;
  age: string;
  classTitle: string;
  scheduleLabel: string;
  classId?: string;
};

export type TrainingHubBooking = {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  statusTone: 'info' | 'warning';
  meta: string;
  actionLabel: string;
  actionTone: 'primary' | 'destructive';
  href: string;
};

export const trainingHubTypeFilters = [
  { label: 'All Classes', value: 'all' },
  { label: 'Today Classes', value: 'today' }, //classes with schedule happening on that day
  { label: 'Upcoming', value: 'upcoming' }, // classes with schedule happening on a future date
  { label: 'Incomplete', value: 'incomplete' }, // classes whose completion rate are not 100%
  { label: 'Remedial', value: 'remedial' }, //
  { label: 'Make-up Classes', value: 'make-up' },
  { label: 'Cancelled', value: 'cancelled' }, // cancelled classes
  { label: 'Completed', value: 'completed' }, // classes whose completion rate is 100%
] as const;
