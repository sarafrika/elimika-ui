export type TrainingHubCourse = {
  id: string;
  title: string;
  provider: string;
  level: string;
  rating?: string;
  students: string;
  classes: string;
  ctaLabel: string;
  accent: 'blue' | 'indigo' | 'orange' | 'yellow';
};

export type TrainingHubLiveClass = {
  id: string;
  day: string;
  time: string;
  title: string;
  provider: string;
  students: string;
  fee: string;
  sessions: string;
};

export type TrainingHubWaitingStudent = {
  id: string;
  name: string;
  email: string;
  status: string;
  age: string;
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
  progress?: number;
};

export const courseFilters = [
  'All Types',
  'All Statuses',
  'Filter 4',
] as const;

export const managedCourses: TrainingHubCourse[] = [
  {
    id: 'data-analysis',
    title: 'Data Analysis Essentials',
    provider: 'Google',
    level: 'Beginner',
    rating: '3.5 (2254)',
    students: '100 students',
    classes: '10 Classes',
    ctaLabel: 'Create Classes',
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
    accent: 'yellow',
  },
];

export const liveClasses: TrainingHubLiveClass[] = [
  {
    id: 'ui-ux-live',
    day: 'Today',
    time: '2:00 PM - 4:00 PM',
    title: 'UI/UX Design Principles',
    provider: 'Google',
    students: '85 students',
    fee: 'KSh 3,300',
    sessions: '5',
  },
  {
    id: 'data-analysis-live',
    day: 'Tomorrow',
    time: '10:30 AM - 12:00 PM',
    title: 'Data Analysis',
    provider: 'Google',
    students: '60 students',
    fee: 'KSh 2,000',
    sessions: '10',
  },
  {
    id: 'advanced-photoshop-live',
    day: 'Wed, May 8',
    time: '9:00 PM - 4:00 PM',
    title: 'Advanced Photoshop',
    provider: 'Google',
    students: '100 students',
    fee: 'KSh 4,500',
    sessions: '5',
  },
  {
    id: 'sql-analysis-live',
    day: 'Thu, May 9',
    time: '11:00 AM - 1:00 PM',
    title: 'SQL for Data Analysis',
    provider: 'Acaiemy',
    students: '40 students',
    fee: 'KSh 3,500',
    sessions: '5',
  },
  {
    id: 'creative-writing-live',
    day: 'Fri, May 10',
    time: '2:00 PM - 3:00 PM',
    title: 'Creative Writing for UX',
    provider: 'CreativeMinds',
    students: '5 students',
    fee: 'KSh 2,000',
    sessions: '5',
  },
];

export const waitingList: TrainingHubWaitingStudent[] = [
  {
    id: 'tom-mwangi',
    name: 'Tom Mwangi',
    email: 'tom.mwangi20@gmail.com',
    status: '',
    age: '2d',
  },
  {
    id: 'josh-patel',
    name: 'Josh Patel',
    email: 'josh.patel@email.com',
    status: 'Waiting',
    age: '6d',
  },
  {
    id: 'janet-kim',
    name: 'Janet Kim',
    email: 'janet.kim@email.com',
    status: 'Waiting',
    age: '8d',
  },
];

export const bookings: TrainingHubBooking[] = [
  {
    id: 'junior-web-dev',
    title: 'Junior Web Developer',
    subtitle: 'BrightWave Marketing',
    status: 'Early Bird',
    statusTone: 'info',
    meta: '5 bookings',
    actionLabel: 'Manage',
    actionTone: 'primary',
  },
  {
    id: 'josh-booking',
    title: 'Josh Patel',
    subtitle: 'josh.patel@email.com',
    status: 'Waiting 8d',
    statusTone: 'warning',
    meta: '8 bookings',
    actionLabel: 'Remove',
    actionTone: 'destructive',
    progress: 56,
  },
];
