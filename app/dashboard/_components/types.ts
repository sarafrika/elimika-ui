import type {
  ClassDefinition,
  Course,
  CourseTrainingApplication,
  Instructor,
  InstructorCalendarEntry,
  ProgramCourse,
  Student,
  StudentSchedule,
  User,
} from '@/services/client';

export type DashboardClass = ClassDefinition & {
  course?: Course | null;
  instructor?: Instructor | null;
  schedule?: unknown;
  current_enrollments?: number;
};

export type DashboardResolvedStudent = User & {
  studentProfile: Student;
  enrollmentCount: number;
  notes?: string;
};

export type DashboardUserSummary = Pick<User, 'full_name' | 'email' | 'profile_image_url'>;

export type InstructorAvailabilitySlot = InstructorCalendarEntry & {
  custom_pattern?: string;
  time_range?: string;
  date?: Date | string;
};

export type EnrolledScheduleItem = StudentSchedule & {
  progress_percentage?: number;
  status?: string;
};

export type CourseWithApplication = Course & {
  application?: CourseTrainingApplication | null;
  is_free?: boolean;
};

export type ProgramCourseWithApplication = ProgramCourse & {
  application?: CourseTrainingApplication | null;
};

export type StopPropagationEvent = {
  stopPropagation(): void;
};
