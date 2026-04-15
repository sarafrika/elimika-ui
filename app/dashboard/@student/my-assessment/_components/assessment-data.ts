import type { LucideIcon } from 'lucide-react';
import { Download, Send, Star } from 'lucide-react';

export type AssessmentTab = 'active' | 'completed' | 'competencies';

export type AssessmentAction = {
  icon: LucideIcon;
  label: string;
  variant: 'primary' | 'secondary';
};

export type AssessmentStatus = 'in-progress' | 'pending-review' | 'graded' | 'revision-requested';

export type AssessmentItem = {
  fileName: string;
  fileSize: string;
  highlight: string;
  id: string;
  learnerName: string;
  passed: boolean;
  score: number | null;
  status: AssessmentStatus;
  statusLabel: string;
  submittedAt: string;
  summaryUpdatedAt: string;
  title: string;
  totalScore: number;
};

export type RubricRow = {
  criteria: string;
  advanced: number;
  developing: number;
  note?: string;
  proficient: number;
};

export const assessmentActions: AssessmentAction[] = [
  {
    icon: Send,
    label: 'Submit Work',
    variant: 'primary',
  },
  {
    icon: Download,
    label: 'Assessment Report',
    variant: 'secondary',
  },
];

export const assessments: AssessmentItem[] = [
  {
    fileName: 'Design.pdf',
    fileSize: '3.2 MB',
    highlight: 'Revamp a nonprofit website with a new design',
    id: 'web-design-project',
    learnerName: 'Sarah Otieno',
    passed: false,
    score: null,
    status: 'pending-review',
    statusLabel: 'Pending Review',
    submittedAt: 'Apr 25, 2024',
    summaryUpdatedAt: 'April 25, 2024',
    title: 'Web Design Project',
    totalScore: 16,
  },
  {
    fileName: 'Research-notes.docx',
    fileSize: '1.4 MB',
    highlight: 'Prepare a short user research summary for the landing page',
    id: 'user-research-summary',
    learnerName: 'Sarah Otieno',
    passed: false,
    score: null,
    status: 'in-progress',
    statusLabel: 'In Progress',
    submittedAt: 'Apr 28, 2024',
    summaryUpdatedAt: 'April 28, 2024',
    title: 'User Research Summary',
    totalScore: 10,
  },
  {
    fileName: 'Portfolio.zip',
    fileSize: '8.8 MB',
    highlight: 'Build a responsive personal portfolio using semantic HTML and CSS',
    id: 'portfolio-build',
    learnerName: 'Sarah Otieno',
    passed: true,
    score: 14,
    status: 'graded',
    statusLabel: 'Graded',
    submittedAt: 'Apr 12, 2024',
    summaryUpdatedAt: 'April 12, 2024',
    title: 'Portfolio Build',
    totalScore: 16,
  },
  {
    fileName: 'Prototype.fig',
    fileSize: '5.6 MB',
    highlight: 'Create a clickable onboarding prototype with clear visual hierarchy',
    id: 'onboarding-prototype',
    learnerName: 'Sarah Otieno',
    passed: true,
    score: 18,
    status: 'graded',
    statusLabel: 'Graded',
    submittedAt: 'Apr 08, 2024',
    summaryUpdatedAt: 'April 08, 2024',
    title: 'Onboarding Prototype',
    totalScore: 20,
  },
  {
    fileName: 'Accessibility-audit.pdf',
    fileSize: '2.1 MB',
    highlight: 'Audit a dashboard flow and document accessibility improvements',
    id: 'accessibility-audit',
    learnerName: 'Sarah Otieno',
    passed: false,
    score: 9,
    status: 'revision-requested',
    statusLabel: 'Revision Requested',
    submittedAt: 'Apr 02, 2024',
    summaryUpdatedAt: 'April 02, 2024',
    title: 'Accessibility Audit',
    totalScore: 16,
  },
];

export const projectHighlights = [
  {
    icon: Star,
    label: 'Revamp a nonprofit website with a new design',
  },
];

export const rubricRows: RubricRow[] = [
  {
    advanced: 0,
    criteria: 'Graphic Design',
    developing: 3,
    note: 'Great use of colors and typography.',
    proficient: 0,
  },
  {
    advanced: 3,
    criteria: 'Responsive Layout',
    developing: 0,
    proficient: 0,
  },
  {
    advanced: 0,
    criteria: 'Coding',
    developing: 3,
    proficient: 0,
  },
  {
    advanced: 0,
    criteria: 'Presentation Quality',
    developing: 3,
    proficient: 0,
  },
];

export const competencyTags = [
  { checked: true, label: 'Graphic Design' },
  { checked: true, label: 'Responsive Layout' },
  { checked: true, label: 'HTML & CSS Coding' },
  { checked: false, label: 'JavaScript Basics' },
  { checked: false, label: 'Client Communication' },
  { checked: false, label: 'Presentation Skills' },
];
