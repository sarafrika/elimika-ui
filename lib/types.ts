import { schemas } from '@/services/api/zod-client';
import {
  Course,
  CourseCreator,
  Instructor,
  InstructorEducation,
  InstructorExperience,
  InstructorProfessionalMembership,
  InstructorSkill,
  Organisation,
  Student,
  TrainingBranch,
  User,
} from '@/services/client';
import { ReactNode } from 'react';
import { z } from 'zod';

export type UserDomain =
  | 'student'
  | 'instructor'
  | 'admin'
  | 'parent'
  | 'course_creator'
  | 'organisation_user'
  | 'organisation';

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

export type TrainingCenter = Organisation & {
  branches?: TrainingBranch[];
  users?: User[];
  instructors?: Instructor[];
  courses?: Course[];
};

export type UserProfileType = User & {
  student?: Student;
  instructor?: Instructor & {
    educations: InstructorEducation[];
    experience: InstructorExperience[];
    membership: InstructorProfessionalMembership[];
    skills: InstructorSkill[];
  };
  courseCreator?: CourseCreator;
  organizations?: TrainingCenter[];
};
