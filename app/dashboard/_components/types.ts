import type {
  ClassDefinition,
  Course,
  Instructor,
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
export type EnrolledScheduleItem = StudentSchedule & {
  progress_percentage?: number;
  status?: string;
};
export type StopPropagationEvent = {
  stopPropagation(): void;
};
