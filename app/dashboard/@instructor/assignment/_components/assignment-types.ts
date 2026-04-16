export type AssignmentStatus = 'all' | 'ongoing' | 'graded' | 'overdue';

export type AssignmentCardData = {
  badge?: string;
  ctaLabel: string;
  dueLabel: string;
  iconTone: 'amber' | 'blue';
  id: string;
  instructor: string;
  lesson: string;
  metricLabel?: string;
  metricValue?: string;
  status: Exclude<AssignmentStatus, 'all'>;
  statusLabel: string;
  studentSummary?: string;
  subtitle: string;
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
  id: string;
  insightLabel: string;
  name: string;
  roleLabel: string;
  score: number;
  sections: SubmissionSection[];
};
