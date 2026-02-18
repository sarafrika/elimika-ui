import React from 'react';

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
  dob?: string;
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
  student_profile?: any;
}

export interface DomainTabProps {
  userUuid: string;
  domain: UserDomain;
  sharedProfile: SharedUserProfile;
  isPublic?: boolean; // NEW: indicates if viewing someone else's profile
}

export interface TabDefinition {
  id: string;
  label: string;
  component: React.ComponentType<DomainTabProps>;
}

export interface ProfilePageProps {
  tabs: TabDefinition[];
  profile: SharedUserProfile;
  isLoading?: boolean;
  headerBadge?: React.ReactNode;
  defaultTab?: string;
  isPublic?: boolean; // NEW: indicates if viewing someone else's profile
}
