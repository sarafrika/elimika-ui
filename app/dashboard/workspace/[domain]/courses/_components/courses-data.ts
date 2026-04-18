import type { UserDomain } from '@/lib/types';
import type { LucideIcon } from 'lucide-react';
import {
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  Camera,
  GraduationCap,
  Headphones,
  Lightbulb,
  MonitorSmartphone,
  Music4,
  Palette,
  Rocket,
  Search,
  Trophy,
  Users,
} from 'lucide-react';

export type CoursesHeroAction = {
  title: string;
  subtitle: string;
  href: string;
  icon: LucideIcon;
  tone: 'primary' | 'warning' | 'success';
};

export type CoursesCatalogTab = 'programs' | 'short-courses' | 'all-courses';

export type CoursesFilterSection = {
  key: 'category' | 'contentType' | 'level' | 'duration' | 'price';
  title: string;
  options: Array<{
    label: string;
    value: string;
  }>;
};

export type CoursesCategoryTileData = {
  title: string;
  icon: LucideIcon;
  tone: 'rose' | 'amber' | 'sky' | 'violet' | 'green';
};

export type CoursesCatalogCardData = {
  id: string;
  title: string;
  provider: string;
  duration: string;
  secondaryMeta: string;
  ctaLabel: string;
  ctaDisabled?: boolean;
  ctaKind?: 'link' | 'apply-course' | 'apply-program';
  minimumRate?: number;
  showInstructorCta?: boolean;
  detailsHref: string;
  enrollHref: string;
  instructorHref: string;
  icon: LucideIcon;
  imageTone: 'primary' | 'warning' | 'success';
  imageUrl?: string;
};

export type CoursesRecommendationCardData = {
  id: string;
  title: string;
  provider: string;
  rating: string;
  weeks: string;
  secondaryMeta: string;
  detailsHref: string;
  enrollHref: string;
  icon: LucideIcon;
  imageTone: 'primary' | 'warning' | 'success';
  imageUrl?: string;
};

export const heroActions: CoursesHeroAction[] = [
  {
    title: 'Apply for Training',
    subtitle: 'Structured training made practical.',
    href: '/dashboard/skills-fund',
    icon: Rocket,
    tone: 'primary',
  },
  {
    title: 'Take a Short Course',
    subtitle: 'Fast skill boosts with concise lessons.',
    href: '/dashboard/courses',
    icon: BadgeCheck,
    tone: 'warning',
  },
  {
    title: 'Explore All Courses',
    subtitle: 'Browse role-ready learning paths.',
    href: '/dashboard/courses',
    icon: Search,
    tone: 'success',
  },
];

export const catalogTabs: Array<{ value: CoursesCatalogTab; label: string }> = [
  { value: 'all-courses', label: 'All Courses' },
  { value: 'programs', label: 'Programs' },
  { value: 'short-courses', label: 'Short Courses' },
];

const tileIcons = [
  Music4,
  Trophy,
  MonitorSmartphone,
  Palette,
  BookOpen,
  GraduationCap,
  Lightbulb,
  Camera,
];

const cardIcons = [
  Headphones,
  MonitorSmartphone,
  Users,
  BriefcaseBusiness,
  Camera,
  Lightbulb,
  Music4,
  BookOpen,
];

const tones = ['rose', 'amber', 'sky', 'violet', 'green'] as const;
const imageTones = ['primary', 'warning', 'success'] as const;

export function getCategoryTilePresentation(title: string, index: number): CoursesCategoryTileData {
  return {
    title,
    icon: tileIcons[index % tileIcons.length] ?? BookOpen,
    tone: tones[index % tones.length] ?? 'sky',
  };
}

export function getCardPresentation(index: number) {
  return {
    icon: cardIcons[index % cardIcons.length] ?? BookOpen,
    imageTone: imageTones[index % imageTones.length] ?? 'primary',
  };
}

const domainBasePaths: Record<UserDomain, string> = {
  admin: '/dashboard/courses',
  course_creator: '/dashboard/courses',
  instructor: '/dashboard/courses',
  organisation: '/dashboard/courses',
  organisation_user: '/dashboard/courses',
  parent: '/dashboard/courses',
  student: '/dashboard/courses',
};

export function getContentHref(domain: UserDomain, kind: 'course' | 'program', uuid: string) {
  const basePath = domainBasePaths[domain];
  return kind === 'program' ? `${basePath}/available-programs/${uuid}` : `${basePath}/${uuid}`;
}

export function getEnrollHref(domain: UserDomain, kind: 'course' | 'program', uuid: string) {
  const basePath = domainBasePaths[domain];
  return kind === 'program'
    ? `${basePath}/available-programs/${uuid}`
    : `${basePath}/available-classes/${uuid}`;
}

export function getInstructorHref(domain: UserDomain, uuid: string) {
  return `${domainBasePaths[domain]}/instructor?courseId=${uuid}`;
}

export function getApplyToTrainHref(uuid: string) {
  return `/dashboard/apply-to-train/${uuid}`;
}

export function getDurationBucket(totalMinutes: number) {
  if (totalMinutes <= 5 * 60) return '0-5-hours';
  if (totalMinutes <= 20 * 60) return '6-20-hours';
  return '20-plus-hours';
}

export function formatDurationFromParts(hours?: number, minutes?: number, display?: string | null) {
  if (display && display.trim() !== '') {
    return display;
  }

  const totalMinutes = Math.max(0, (hours ?? 0) * 60 + (minutes ?? 0));
  if (totalMinutes <= 0) {
    return '';
  }
  const totalHours = totalMinutes / 60;

  if (Number.isInteger(totalHours)) {
    return `${totalHours} Hours`;
  }

  return `${Math.round(totalHours * 10) / 10} Hours`;
}

export function stripHtml(value?: string | null) {
  return value?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() ?? '';
}

export function isShortCourse(totalMinutes: number) {
  return totalMinutes > 0 && totalMinutes <= 20 * 60;
}
