import type { UserDomain } from '@/lib/types';
import type { CourseTrainingRateCard } from '@/services/client';
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

export type CoursesCatalogTab = 'programs' | 'short-courses' | 'all-courses' | 'my-courses';

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
  contentKind: 'course' | 'program';
  title: string;
  provider: string;
  duration: string;
  secondaryMeta: string;
  enrolledClasses: number;
  applicationStatus?: string | null;
  ctaLabel: string;
  ctaDisabled?: boolean;
  ctaKind?: 'link' | 'apply-course' | 'apply-program';
  ctaTone?: 'default' | 'pending' | 'approved' | 'revoked';
  minimumRate?: number;
  showInstructorCta?: boolean;
  detailsHref: string;
  certificateHref: string;
  enrollHref: string;
  instructorHref: string;
  icon: LucideIcon;
  imageTone: 'primary' | 'warning' | 'success';
  imageUrl?: string;
  videoUrl?: string;
  rating?: number;
  reviewCount?: number;
  enrollmentCount?: number | undefined;
  activeClasses?: number;
  minAge?: number;
  maxAge?: number;
  instructorCount?: number;
  categoryNames?: string[];
  description?: string;
  units?: number | undefined;
  skillsFundEligible: boolean | null;
  application?: CatalogTrainingApplicationData | null;
};

export type CatalogTrainingApplicationData = {
  uuid?: string;
  status?: string | null;
  application_notes?: string | null;
  review_notes?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: Date | string | null;
  created_date?: Date | string | null;
  rate_card?: CourseTrainingRateCard | null;
};

export type CoursesRecommendationCardData = {
  id: string;
  title: string;
  provider: string;
  rating: string;
  weeks: string;
  secondaryMeta: string;
  minimumRate?: number;
  ctaLabel: string;
  ctaHref: string;
  ctaKind: 'enroll' | 'apply-to-train';
  detailsHref: string;
  icon: LucideIcon;
  imageTone: 'primary' | 'warning' | 'success';
  imageUrl?: string;
  reason?: string;
};

export const heroActions: CoursesHeroAction[] = [
  {
    title: 'Apply to Train',
    subtitle: 'Structured training made practical.',
    href: '#',
    icon: Rocket,
    tone: 'primary',
  },
  {
    title: 'Take a Short Course',
    subtitle: 'Fast skill boosts with concise lessons.',
    href: '#',
    icon: BadgeCheck,
    tone: 'warning',
  },
  {
    title: 'Explore All Courses',
    subtitle: 'Browse role-ready learning paths.',
    href: '#',
    icon: Search,
    tone: 'success',
  },
];

export const catalogTabs: Array<{ value: CoursesCatalogTab; label: string }> = [
  { value: 'all-courses', label: 'All Courses' },
  { value: 'programs', label: 'Programs' },
  { value: 'short-courses', label: 'Short Courses' },
  { value: 'my-courses', label: 'My Courses' },
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
  return kind === 'program' ? `${basePath}/programs/${uuid}` : `${basePath}/${uuid}`;
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

export function getApplyToTrainHref(kind: 'course' | 'program', uuid: string) {
  return `/dashboard/apply-to-train/${uuid}?kind=${kind}`;
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
  return (
    value
      ?.replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() ?? ''
  );
}

export function isShortCourse(totalMinutes: number) {
  return totalMinutes > 0 && totalMinutes <= 20 * 60;
}

type TrainingApplicationLike = {
  status?: string | null;
  created_date?: string | Date | null;
};

/** Lower sorts first: the state that should decide what the catalogue shows. */
const APPLICATION_STATUS_RANK: Record<string, number> = {
  approved: 0,
  pending: 1,
  revoked: 2,
  rejected: 3,
};

/**
 * The application that decides an applicant's standing on a course or program.
 *
 * An applicant can hold several rows for the same offering — a rejection followed by a fresh
 * attempt, or a revocation followed by a re-approval. Taking whichever row the API happened to
 * return last showed a stale status that survived reloads, which is what made a freshly approved
 * organisation still look unapproved until it signed out and back in. Approval wins, then a live
 * pending application, then the most recent of the rest.
 */
export function decisiveTrainingApplication<T extends TrainingApplicationLike>(
  candidates: readonly T[]
): T | undefined {
  const time = (value?: string | Date | null) => {
    if (!value) return 0;
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  return [...candidates].sort((left, right) => {
    const leftRank = APPLICATION_STATUS_RANK[(left.status ?? '').toLowerCase()] ?? 9;
    const rightRank = APPLICATION_STATUS_RANK[(right.status ?? '').toLowerCase()] ?? 9;
    if (leftRank !== rightRank) return leftRank - rightRank;
    return time(right.created_date) - time(left.created_date);
  })[0];
}
