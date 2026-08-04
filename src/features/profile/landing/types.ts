import React from 'react';
import type { UserProfileType } from '@/lib/types';
import type { Student } from '@/services/client/types.gen';

export type UserDomain = 'instructor' | 'student' | 'admin' | 'course_creator' | 'organization';

export interface SharedUserProfile {
  uuid: string;
  user_uuid: string;
  full_name: string;
  avatar_url?: string;
  email?: string;
  phone?: string;
  website?: string;
  bio?: string;
  is_online?: boolean;
  dob?: string | Date;
  profile_image_url?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  professional_headline?: string;
  admin_verified?: boolean;
  is_profile_complete?: boolean;
  gender?: string;
  active?: boolean;
  username?: string;
  user_no?: string;
  student_profile?: Student;
  demographic_tag?: string;
  /** When the domain profile (student / instructor / course creator) was created. */
  created_date?: string | Date;
}

export interface DomainTabProps {
  userUuid?: string;
  domain?: UserDomain;
  sharedProfile: SharedUserProfile;
  isPublic?: boolean; // NEW: indicates if viewing someone else's profile
}

export interface TabDefinition {
  id: string;
  label: string;
  component: React.ComponentType<DomainTabProps>;
}

/**
 * One tile in the 4-up stat strip under the profile hero.
 *
 * Each domain profile page owns its own queries and passes finished tiles down
 * as props — `value` is a ReactNode so a page can hand in a loading skeleton
 * (see `StatValue`) rather than a placeholder zero.
 */
export interface StatDescriptor {
  id: string;
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}

/**
 * Props every domain profile page takes. Each domain owns its own page so it can
 * run its own queries and hand the shared layout finished stats / sidebar cards.
 */
export interface DomainProfilePageProps {
  profile: SharedUserProfile;
  profileSource?: Partial<UserProfileType> | null;
  headerBadge?: React.ReactNode;
  isPublic?: boolean;
}

export interface ProfilePageProps {
  tabs: TabDefinition[];
  profile: SharedUserProfile;
  domain?: UserDomain;
  profileSource?: Partial<UserProfileType> | null;
  isLoading?: boolean;
  headerBadge?: React.ReactNode;
  defaultTab?: string;
  isPublic?: boolean; // NEW: indicates if viewing someone else's profile
  /** Domain-supplied stat tiles for the strip under the hero. */
  stats?: StatDescriptor[];
  /** Domain-supplied cards for the right-hand column, under the detail summary. */
  sidebar?: React.ReactNode;
}
