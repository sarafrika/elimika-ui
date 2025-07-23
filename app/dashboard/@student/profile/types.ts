// Types for student and user profile data, based on OpenAPI schema

export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';

export interface UserProfile {
  uuid: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  phone_number: string;
  dob: string;
  username: string;
  organisation_uuid?: string;
  active: boolean;
  roles?: Array<{
    uuid: string;
    name: string;
    description?: string;
  }>;
  gender?: Gender;
  user_domain?: ('student' | 'instructor' | 'admin' | 'organisation_user')[];
  displayName?: string;
  fullName?: string;
  profile_image_url?: string;
  created_date?: string;
  modified_date?: string;
}

export interface StudentProfile {
  uuid: string;
  user_uuid: string;
  first_guardian_name?: string;
  first_guardian_mobile?: string;
  second_guardian_name?: string;
  second_guardian_mobile?: string;
  created_date?: string;
  created_by?: string;
  updated_date?: string;
  updated_by?: string;
}
