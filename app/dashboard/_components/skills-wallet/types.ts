import type { CredentialsContent } from '@/components/profile-credentials/data';
import type { LucideIcon } from 'lucide-react';

export type VerifiedSkillLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type VerifiedSkillGroup =
  | 'All Skills'
  | 'Technical Skills'
  | 'Soft Skills'
  | 'Micro-Credentials';
export type ProficiencyFilter = 'All Levels' | VerifiedSkillLevel;
export type VerifiedSkillsRole = 'student' | 'instructor' | 'course_creator';

export type VerifiedSkill = {
  id: string;
  name: string;
  level: VerifiedSkillLevel;
  score: number;
  hours?: string;
  provider: string;
  category: string;
  icon: LucideIcon;
  tone: 'primary' | 'success' | 'warning' | 'muted';
};

export type VerifiedSkillRecordDetail = {
  label: string;
  value: string;
};

export type VerifiedSkillRecord = {
  id: string;
  title: string;
  issuer: string;
  status: string;
  documentLabel: string;
  documentUrl?: string;
  recordKind?: 'education' | 'membership' | 'experience';
  recordSummary?: string;
  timestamp?: number;
  details?: VerifiedSkillRecordDetail[];
};

export type VerifiedSkillCategory = {
  id: string;
  title: string;
  group: VerifiedSkillGroup;
  level: VerifiedSkillLevel;
  score: number;
  indicators: number;
  skills: VerifiedSkill[];
  records: VerifiedSkillRecord[];
};

export type SkillInsight = {
  name: string;
  rating: number;
};

export type SuggestedSkill = {
  id: string;
  name: string;
  level: number;
  progress: number;
  icon: LucideIcon;
  tone: 'primary' | 'success' | 'warning';
};

export type VerifiedSkillsContent = {
  credentialsContent: CredentialsContent;
  categories: VerifiedSkillCategory[];
  insights: SkillInsight[];
  suggestions: SuggestedSkill[];
  skills: SharedSkill[];
  summary: SharedCredentialSummary;
  timeline: SharedTimelineItem[];
  isLoading: boolean;
};

import type { ReactNode } from 'react';

export type SharedSkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | string;

export type SharedSkill = {
  id: string;
  name: string;
  level: SharedSkillLevel;
  score: number;
  category?: string;
  verified?: boolean;
  version?: string;
};

export type SharedCredentialSummary = {
  badgesEarned: number;
  certificatesEarned: number;
  shares: number;
};

export type SharedTimelineItem = {
  id: string;
  title: string;
  provider: string;
  description: string;
  icon?: ReactNode;
  metric?: string;
  timestamp?: number;
};

export type SharedOpportunity = {
  id: string;
  title: string;
  provider: string;
  mode: string;
  match: number;
  status?: string;
  href?: string;
};

export type SharedMySkillsProfile = {
  name: string;
  title: string;
  location?: string;
  avatarUrl?: string;
  email?: string;
  phone?: string;
  website?: string;
  joinedLabel?: string;
};

