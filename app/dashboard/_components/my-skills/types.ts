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
  joinedLabel?: string;
};
