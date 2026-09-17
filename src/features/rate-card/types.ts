import type {
  CourseTrainingApplication,
  ProgramTrainingApplication,
  TrainingApplicationEvent,
  TrainingRateUpdate,
} from '@/services/client';

/** Whether an application targets a course or a program; picks the endpoint family. */
export type TrainingApplicationKind = 'course' | 'program';

/** A course or program training application; both carry the same rate card fields. */
export type TrainingApplication = CourseTrainingApplication | ProgramTrainingApplication;

/** Lifecycle of a proposed rate card. */
export type RateUpdateStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';

/** A creator's verdict on a rate update. */
export type RateUpdateDecision = 'approve' | 'reject';

export type { TrainingApplicationEvent, TrainingRateUpdate };
