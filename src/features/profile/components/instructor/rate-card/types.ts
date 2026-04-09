import type { Course, CourseTrainingApplication } from '@/services/client';

export type CourseWithApplication = Course & {
  application: CourseTrainingApplication | null;
};
