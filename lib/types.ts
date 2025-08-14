import { schemas } from '@/services/api/zod-client';
import { z } from 'zod';
import { ReactNode } from 'react';
import { Instructor, InstructorEducation, InstructorExperience, InstructorProfessionalMembership, InstructorSkill, Organisation, Student, User } from '@/services/client';

export type UserDomain = 'student' | 'instructor' | 'admin' | 'organisation_user';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  error?: any;
}

export interface PageMetadata {
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  first: boolean;
  last: boolean;
}

export type SchemaType = any;

export interface PagedData<T> {
  content: T[];
  metadata: PageMetadata;
}

export type AllSchemas = typeof schemas;
export type AllSchemaTypes = {
  [K in keyof AllSchemas]: AllSchemas[K] extends z.ZodTypeAny ? z.infer<AllSchemas[K]> : never;
}[keyof AllSchemas];

export type ApiResponseWithPagination<T> = ApiResponse<PagedData<T>>;

export type DashboardChildrenTypes = {
  [key: string]: ReactNode;
};

export type UserProfileType = User & {
  student?: Student,
  instructor?: Instructor & {
    educations: InstructorEducation[],
    experience: InstructorExperience[],
    membership: InstructorProfessionalMembership[],
    skills: InstructorSkill
  },
  organization?: Organisation
}
