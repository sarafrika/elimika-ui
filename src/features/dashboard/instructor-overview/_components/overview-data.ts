import {
  BarChart3,
  BookOpen,
  CheckSquare,
  GraduationCap,
  type LucideIcon,
} from 'lucide-react';

export type OverviewStat = {
  label: string;
  value: string;
  tone: 'blue' | 'green' | 'red' | 'orange';
};

export type SkillsProgressData = {
  title: string;
  verifiedSkills: number;
  growthLabel: string;
  percent: number;
};

export type OverviewCourse = {
  id: string;
  title: string;
  provider: string;
  level: string;
  students: number;
  progress: number;
  actionLabel: string;
  icon: LucideIcon;
};

export type OverviewLiveClass = {
  id: string;
  timeLabel: string;
  title: string;
  provider: string;
  students: string;
  actionLabel: string;
  attendeeInitials: string[];
};

export type OverviewUpcomingClass = {
  id: string;
  name: string;
  email: string;
  ageLabel: string;
  status?: string;
};

export type OverviewEarningCard = {
  id: string;
  title: string;
  subtitle: string;
  provider: string;
  students: string;
  valueLabel: string;
  attendeeInitials: string[];
  actionLabel?: string;
};

export type OverviewInvite = {
  id: string;
  title: string;
  host: string;
  schedule: string;
  actionLabel: string;
  actionTone: 'accept' | 'decline';
};

export const instructorOverviewStats: OverviewStat[] = [
  { label: 'Active Courses', value: '6', tone: 'blue' },
  { label: 'Total Students', value: '1,240', tone: 'green' },
  { label: 'Assignments to Grade', value: '28', tone: 'red' },
  { label: 'Course Completion', value: '78%', tone: 'orange' },
];

export const skillsProgress: SkillsProgressData = {
  title: 'Skills Progress',
  verifiedSkills: 15,
  growthLabel: '+2 this month',
  percent: 85,
};

export const coursePerformance: OverviewCourse[] = [
  {
    id: 'data-analysis',
    title: 'Data Analysis',
    provider: 'Google',
    level: 'beginner',
    students: 59,
    progress: 62,
    actionLabel: 'Enroll Students',
    icon: BarChart3,
  },
  {
    id: 'ui-ux-design',
    title: 'UI/UX Design',
    provider: 'Coursera',
    level: 'intermediate',
    students: 60,
    progress: 71,
    actionLabel: 'Enroll Students',
    icon: BookOpen,
  },
  {
    id: 'digital-marketing',
    title: 'Digital Marketing',
    provider: 'GQ Meta',
    level: 'full',
    students: 80,
    progress: 58,
    actionLabel: 'Enroll Students',
    icon: CheckSquare,
  },
  {
    id: 'graphic-design',
    title: 'Graphic Design Foundations',
    provider: 'Intermediate',
    level: 'intermediate',
    students: 90,
    progress: 45,
    actionLabel: 'Enroll Students',
    icon: GraduationCap,
  },
];

export const liveClasses: OverviewLiveClass[] = [
  {
    id: 'live-ui-ux',
    timeLabel: 'Today: 2:00 PM - 4:00 PM',
    title: 'UI/UX Design',
    provider: 'Google',
    students: '18 students',
    actionLabel: 'Manage',
    attendeeInitials: ['TM', 'JP', 'JK'],
  },
  {
    id: 'live-data-analysis',
    timeLabel: 'Tomorrow: 10:30 AM - 12:00 PM',
    title: 'Data Analysis',
    provider: 'Google',
    students: '20 students',
    actionLabel: 'Manage',
    attendeeInitials: ['EA', 'TM', 'SL'],
  },
];

export const upcomingClasses: OverviewUpcomingClass[] = [
  {
    id: 'tom-mwangi',
    name: 'Tom Mwangi',
    email: 'tormowingr299gmail.com',
    ageLabel: '2d',
  },
  {
    id: 'josh-patel',
    name: 'Josh Patel',
    email: 'josh.patel@email.com',
    ageLabel: '6d',
    status: 'Weting',
  },
  {
    id: 'janet-kim',
    name: 'Janet Kim',
    email: 'janet kim@email.com',
    ageLabel: '6d',
    status: 'Weting',
  },
];

export const earningOverview: OverviewEarningCard[] = [
  {
    id: 'earning-data-analysis',
    title: 'Data Analysis',
    subtitle: 'Tomorrow',
    provider: 'Google',
    students: '12 students',
    valueLabel: 'ss: 10:30 sd- 19:20PM',
    attendeeInitials: ['TM', 'JP', 'JK', 'EM'],
  },
  {
    id: 'earning-junior-web',
    title: 'Junior Web Developer',
    subtitle: 'Today. | Tlr. 8',
    provider: '11:00 AM - 12:00 PM',
    students: '54:40',
    valueLabel: 'Manage',
    attendeeInitials: [],
    actionLabel: 'Manage',
  },
];

export const classInvites: OverviewInvite[] = [
  {
    id: 'intro-to-python',
    title: 'Intro to Python',
    host: 'Kovh Patel',
    schedule: 'Werl, May 15. 4:00 PM',
    actionLabel: 'Accept',
    actionTone: 'accept',
  },
  {
    id: 'launch-marketing',
    title: 'Launch Marketing Campaign',
    host: 'Rejesh Kapoor',
    schedule: 'Fri, May 12 1:00 PM',
    actionLabel: 'Decline',
    actionTone: 'decline',
  },
  {
    id: 'foundations-web-design',
    title: 'Foundations of Web Design',
    host: 'Emily Johnson',
    schedule: 'Mon, 20, 10:20 AM',
    actionLabel: 'Decline',
    actionTone: 'decline',
  },
];
