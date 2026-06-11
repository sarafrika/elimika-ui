import type {
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
import type { ReactNode } from 'react';

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
  error?: unknown;
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

export type SchemaType = unknown;

export interface PagedData<T> {
  content: T[];
  metadata: PageMetadata;
}

export type AllSchemaTypes = unknown;

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
