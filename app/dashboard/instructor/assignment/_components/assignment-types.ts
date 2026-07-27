export type AssignmentStatus = 'all' | 'ongoing' | 'graded' | 'overdue' | 'pending';

export type AssignmentCardData = {
  badge?: string;
  scheduleUuid: string;
  classUuid?: string;
  ctaLabel: string;
  classTitle?: string;
  courseTitle?: string;
  courseId?: string;
  dueLabel: string;
  iconTone: 'amber' | 'blue';
  id: string;
  instructor: string;
  lesson: string;
  lessonUuid?: string;
  metricLabel?: string;
  metricValue?: string;
  rubricUuid?: string | null;
  status: Exclude<AssignmentStatus, 'all'>;
  statusLabel: string;
  studentSummary?: string;
  subtitle: string;
  submissionCount?: number;
  availableCount?: number;
  uniqueEnrollmentCount?: number;
  taskType?: 'assignment' | 'quiz';
};

export type InsightMetric = {
  changeText?: string;
  progress: number;
  title: string;
  trendLabel?: string;
  value: string;
};

export type SubmissionMetric = {
  label: string;
  note?: string;
  score: number;
  total: number;
};

export type SubmissionSection = {
  gradeLabel: string;
  gradeScore: number;
  metrics: SubmissionMetric[];
  title: string;
  weight?: string;
};

export type SubmissionStudent = {
  attendanceLabel: string;
  comments: string[];
  fileUrls?: string[];
  id: string;
  student_uuid: string;
  insightLabel: string;
  name: string;
  roleLabel: string;
  score: number;
  sections: SubmissionSection[];
  submissionKind?: 'audio' | 'document' | 'quiz' | 'text';
  submissionStatus?: string;
  submissionText?: string;
  submittedAt?: string;
};
