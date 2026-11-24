import {
  Baby,
  Briefcase,
  Building2,
  GraduationCap,
  HandCoins,
  type LucideIcon,
  PenTool,
  Presentation,
} from 'lucide-react';
import type { UserDomain } from '@/lib/types';

export const ADULT_AGE = 18;

export function ageFrom(dob: string | Date | undefined, now = new Date()): number | null {
  if (!dob) return null;
  if (dob instanceof Date && Number.isNaN(dob.getTime())) return null;
  // API dates are date-only strings at runtime despite the generated Date type.
  const date = dob instanceof Date ? dob.toISOString().slice(0, 10) : dob.slice(0, 10);
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime()) || parsed > now) return null;
  let age = now.getFullYear() - parsed.getFullYear();
  const month = now.getMonth() - parsed.getMonth();
  if (month < 0 || (month === 0 && now.getDate() < parsed.getDate())) age--;
  return age;
}

export type StartingPath = {
  id: string;
  title: string;
  description: string;
  mapping: string;
  destination: string;
  icon: LucideIcon;
  kind: 'profile' | 'organisation';
  profileLabel?: string;
  domain?: UserDomain;
  onboardingHref?: string;
  dashboardHref?: string;
  adultOnly?: boolean;
};

export const STARTING_PATHS: StartingPath[] = [
  {
    id: 'learn',
    title: 'Learn & Grow',
    description: 'Take courses, earn credentials and build your skills wallet.',
    mapping: 'Student profile',
    destination: 'Learning Hub',
    icon: GraduationCap,
    kind: 'profile',
    profileLabel: 'Student',
    domain: 'student',
    onboardingHref: '/onboarding/student',
    dashboardHref: '/dashboard/student/learning-hub',
  },
  {
    id: 'train',
    title: 'Train & Earn',
    description: 'Set rate cards, schedule classes and earn from teaching.',
    mapping: 'Instructor profile',
    destination: 'Instructor Hub',
    icon: Presentation,
    kind: 'profile',
    profileLabel: 'Instructor',
    domain: 'instructor',
    onboardingHref: '/onboarding/instructor',
    dashboardHref: '/dashboard/instructor/training-hub',
    adultOnly: true,
  },
  {
    id: 'create',
    title: 'Create & Earn',
    description: 'Build courses and license content to institutions.',
    mapping: 'Creator profile',
    destination: 'Course Studio',
    icon: PenTool,
    kind: 'profile',
    profileLabel: 'Course Creator',
    domain: 'course_creator',
    onboardingHref: '/onboarding/course-creator',
    dashboardHref: '/dashboard/course-creator/course-management',
    adultOnly: true,
  },
  {
    id: 'manage',
    title: 'Train & Manage',
    description: 'Run a school or training institution on Elimika.',
    mapping: 'Organisation + training',
    destination: 'Institution Dashboard',
    icon: Building2,
    kind: 'organisation',
    domain: 'organisation',
    onboardingHref: '/onboarding/organisation',
    dashboardHref: '/dashboard/organisation/overview',
    adultOnly: true,
  },
  {
    id: 'fund',
    title: 'Fund & Empower',
    description: 'Sponsor learners and track programme impact.',
    mapping: 'Funder profile',
    destination: 'Skills Fund',
    icon: HandCoins,
    kind: 'profile',
    profileLabel: 'Individual Funder',
    adultOnly: true,
  },
  {
    id: 'child',
    title: 'Support My Child',
    description: 'Set up a learner profile and guardian controls.',
    mapping: 'Parent/Guardian profile',
    destination: 'Family Hub',
    icon: Baby,
    kind: 'profile',
    profileLabel: 'Parent / Guardian',
    domain: 'parent',
    dashboardHref: '/dashboard/parent/overview',
    adultOnly: true,
  },
  {
    id: 'hire',
    title: 'Hire & Recruit',
    description: 'Recruit instructors and talent via Eneza.',
    mapping: 'Organisation hiring capability',
    destination: 'Hiring',
    icon: Briefcase,
    kind: 'organisation',
    domain: 'organisation',
    onboardingHref: '/onboarding/organisation',
    dashboardHref: '/dashboard/organisation/jobs',
    adultOnly: true,
  },
];
