import type { LucideIcon } from 'lucide-react';

export type VerifiedSkillLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type VerifiedSkillGroup =
  | 'All Skills'
  | 'Technical Skills'
  | 'Soft Skills'
  | 'Micro-Credentials';
export type ProficiencyFilter = 'All Levels' | VerifiedSkillLevel;

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

export type VerifiedSkillCategory = {
  id: string;
  title: string;
  group: VerifiedSkillGroup;
  level: VerifiedSkillLevel;
  score: number;
  indicators: number;
  skills: VerifiedSkill[];
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
