import type {
  BookingResponse,
  ClassDefinition,
  ClassRatingSummary,
  CommerceCatalogueItem,
  Course,
  Instructor,
  InstructorSkill,
  ScheduledInstance,
  StudentSchedule,
  TrainingProgram,
  User,
} from '@/services/client/types.gen';
// Cards only read the name and id; listings fill it from the batch class summary.
export type CardInstructor = {
  uuid?: string;
  full_name?: string | null;
  name?: string | null;
  data?: { full_name?: string | null };
};

type ScheduleFields = {
  schedule: ScheduledInstance[];
  // False on listings: the card loads the schedule itself when it needs dates.
  scheduleLoaded: boolean;
  sessionCount?: number | null;
};

export type BundledClass = ClassDefinition &
  ScheduleFields & {
    course: Course | null;
    instructor: CardInstructor | null;
    enrollments: StudentSchedule[];
    catalogue: CommerceCatalogueItem | null;
    classRating?: ClassRatingSummary | null;
    // From the batch class endpoint; null when the viewer is not a party to the class.
    enrolledCount?: number | null;
    isStudentEnrolled?: boolean;
  };

export type ProgramBundledClass = ClassDefinition &
  ScheduleFields & {
    course: Course[] | null;
    program: TrainingProgram | null;
    instructor: CardInstructor | null;
    enrollments: StudentSchedule[];
    catalogue: CommerceCatalogueItem | null;
    // From the batch class endpoint; null when the viewer is not a party to the class.
    enrolledCount?: number | null;
    isStudentEnrolled?: boolean;
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
  /** `rating` and `review_count` came with the list, so no card needs to fetch them. */
  ratings_inline?: boolean;
  /** Profile and skills came from the list's batched lookups, so no card fetches them again. */
  profile_inline?: boolean;
  skills_inline?: boolean;
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
