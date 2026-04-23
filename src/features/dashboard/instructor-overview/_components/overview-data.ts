import type { LucideIcon } from 'lucide-react';

export type OverviewStat = {
  label: string;
  value: string;
  tone: 'blue' | 'green' | 'red' | 'orange';
};

export type OverviewCourseSummary = {
  title: string;
  primaryValue: string;
  secondaryValue: string;
  percent: number;
  primaryActionLabel: string;
  secondaryActionLabel: string;
};

export type OverviewCourse = {
  id: string;
  title: string;
  provider: string;
  level: string;
  students: number;
  progress: number;
  actionLabel: string;
  viewHref: string;
  editHref: string;
  icon: LucideIcon;
};

export type OverviewLiveClass = {
  id: string;
  timeLabel: string;
  title: string;
  provider: string;
  students: string;
  actionLabel: string;
  href: string;
  attendeeInitials: string[];
};

export type OverviewUpcomingClass = {
  id: string;
  title: string;
  scheduleLabel: string;
  metaLabel: string;
  status?: string;
  href: string;
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
