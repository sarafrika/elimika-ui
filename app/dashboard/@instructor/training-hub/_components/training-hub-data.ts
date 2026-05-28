import type { ProgramCourseLike } from '@/hooks/use-programlessonwithcontent';

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
  { label: 'All Types', value: 'all' },
  { label: 'Manage Courses', value: 'manage-courses' },
  { label: 'Live Classes', value: 'live-classes' },
] as const;

export const trainingHubStatusFilters = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Approved', value: 'approved' },
  { label: 'Today', value: 'today' },
  { label: 'Tomorrow', value: 'tomorrow' },
  { label: 'Upcoming', value: 'upcoming' },
] as const;

export const managedCourses: TrainingHubManagedCourse[] = [
  {
    id: 'data-analysis',
    title: 'Data Analysis Essentials',
    provider: 'Google',
    level: 'Beginner',
    students: '100 students',
    classes: '10 Classes',
    ctaLabel: 'Create Classes',
    ctaHref: '/dashboard/classes/new',
    accent: 'blue',
  },
  {
    id: 'ui-ux-principles',
    title: 'UI/UX Design Principles',
    provider: 'Coursera',
    level: 'Intermediate',
    students: '65 students',
    classes: '10 Classes',
    ctaLabel: 'Create Classes',
    ctaHref: '/dashboard/classes/new',
    accent: 'indigo',
  },
  {
    id: 'digital-marketing',
    title: 'Digital Marketing',
    provider: 'Level 150',
    level: 'Certificate',
    students: '60 students',
    classes: '10 Classes',
    ctaLabel: 'Create Classes',
    ctaHref: '/dashboard/classes/new',
    accent: 'orange',
  },
  {
    id: 'sql-basics',
    title: 'SQL Basics',
    provider: 'Beginner 60',
    level: 'Foundational',
    students: '60 students',
    classes: '10 Classes',
    ctaLabel: 'Create Classes',
    ctaHref: '/dashboard/classes/new',
    accent: 'blue',
  },
  {
    id: 'javascript-basics',
    title: 'JavaScript Basics',
    provider: 'CreativeMinds Academy',
    level: 'Certificate',
    students: '6 Classes',
    classes: '10 Classes',
    ctaLabel: 'Create Classes',
    ctaHref: '/dashboard/classes/new',
    accent: 'yellow',
  },
];

export const waitingList: TrainingHubWaitingStudent[] = [
  {
    id: 'tom-mwangi',
    name: 'Tom Mwangi',
    email: 'tom.mwangi20@gmail.com',
    status: '',
    age: '2d',
    classTitle: 'UI/UX Design Principles',
    scheduleLabel: 'May 6, 2:00 PM',
  },
  {
    id: 'josh-patel',
    name: 'Josh Patel',
    email: 'josh.patel@email.com',
    status: 'Waiting',
    age: '6d',
    classTitle: 'Data Analysis',
    scheduleLabel: 'May 7, 10:30 AM',
  },
  {
    id: 'janet-kim',
    name: 'Janet Kim',
    email: 'janet.kim@email.com',
    status: 'Waiting',
    age: '8d',
    classTitle: 'SQL for Data Analysis',
    scheduleLabel: 'May 9, 11:00 AM',
  },
];

export const bookingPreviews: TrainingHubBooking[] = [
  {
    id: 'junior-web-dev',
    title: 'Junior Web Developer',
    subtitle: 'BrightWave Marketing',
    status: 'Early Bird',
    statusTone: 'info',
    meta: '5 bookings',
    actionLabel: 'Manage',
    actionTone: 'primary',
    href: '/dashboard/training-hub/bookings',
  },
  {
    id: 'josh-booking',
    title: 'Josh Patel',
    subtitle: 'josh.patel@email.com',
    status: 'Waiting 8d',
    statusTone: 'warning',
    meta: '8 bookings',
    actionLabel: 'View booking',
    actionTone: 'primary',
    href: '/dashboard/training-hub/bookings',
  },
];
