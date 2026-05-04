import type {
  BookingResponse,
  ClassDefinition,
  CommerceCatalogueItem,
  Course,
  Instructor,
  InstructorSkill,
  InstructorReview,
  ProgramCourse,
  ScheduledInstance,
  StudentSchedule,
  TrainingProgram,
  User,
} from '@/services/client/types.gen';

export type CourseListItem = Course | TrainingProgram;

export type BundledClass = ClassDefinition & {
  course: Course | null;
  instructor: Instructor | null;
  schedule: ScheduledInstance[];
  enrollments: StudentSchedule[];
  catalogue: CommerceCatalogueItem | null;
};

export type ProgramBundledClass = ClassDefinition & {
  course: Course[] | null;
  instructor: Instructor | null;
  schedule: ScheduledInstance[];
  enrollments: StudentSchedule[];
  catalogue: CommerceCatalogueItem | null;
};

export type SearchInstructor = Instructor & {
  gender?: User['gender'] | null;
  user_domain?: string | string[] | null;
  username?: string | null;
  display_name?: string | null;
  dob?: User['dob'] | null;
  organisation_affiliations?: User['organisation_affiliations'];
  phone_number?: string | null;
  profile_image_url?: string | null;
  total_experience_years: number;
  specializations: InstructorSkill[];
  skill_categories: Record<string, InstructorSkill[]>;
  courses?: string[];
  rating?: number;
  review_count?: number;
  reviews?: InstructorReview[];
  location?: {
    city?: string;
  } | null;
};

export type BookingRecord = BookingResponse;

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    typeof (error as { error?: unknown }).error === 'string'
  ) {
    return (error as { error: string }).error;
  }

  return fallback;
}
