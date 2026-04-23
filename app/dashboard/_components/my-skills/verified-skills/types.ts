import type { LucideIcon } from 'lucide-react';
import type {
  SharedCredentialSummary,
  SharedSkill,
  SharedTimelineItem,
} from '../types';

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
  categories: VerifiedSkillCategory[];
  insights: SkillInsight[];
  suggestions: SuggestedSkill[];
  skills: SharedSkill[];
  summary: SharedCredentialSummary;
  timeline: SharedTimelineItem[];
  isLoading: boolean;
};
