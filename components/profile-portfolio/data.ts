import type { LucideIcon } from 'lucide-react';
import {
  Award,
  BarChart3,
  Box,
  BriefcaseBusiness,
  Code2,
  FileArchive,
  FileCheck2,
  FileText,
  GraduationCap,
  Megaphone,
  Palette,
  PlaySquare,
  ShieldCheck,
} from 'lucide-react';

export type PortfolioRole = 'student' | 'instructor';

export type PortfolioTabId =
  | 'dashboard'
  | 'projects'
  | 'videos'
  | 'assessment'
  | 'files'
  | 'skill-badges';

export type PortfolioTab = {
  id: PortfolioTabId;
  label: string;
};

export type EvidenceItem = {
  label: string;
  value: number;
};

export type PortfolioProject = {
  id: string;
  title: string;
  date: string;
  badge: string;
  description: string;
  category: string;
  accent: 'document' | 'video' | 'presentation';
  icon: LucideIcon;
  status?: 'approved' | 'verified';
  sponsor?: string;
  progress?: number;
  rating?: number;
  evidenceCount: number;
  tools: string[];
  outcome: string;
};

export type Highlight = {
  title: string;
  icon: LucideIcon;
  rating: number;
  variant: 'flag' | 'cube' | 'bars';
};

export type PortfolioAsset = {
  id: string;
  title: string;
  date: string;
  description: string;
  category: string;
  icon: LucideIcon;
  meta: string;
  status?: string;
  rating?: number;
};

export type PortfolioCopy = {
  pageTitle: string;
  ownerName: string;
  ownerLabel: string;
  projectsHeading: string;
  projectListDescription: string;
  recentUpdatesHeading: string;
  recentUpdatesAction: string;
  primaryProjectsHeading: string;
  featuredProjectsHeading: string;
  featuredProjectsCta: string;
  videosTitle: string;
  videosDescription: string;
  videosActionLabel?: string;
  assessmentsTitle: string;
  assessmentsDescription: string;
  assessmentsActionLabel?: string;
  filesTitle: string;
  filesDescription: string;
  filesActionLabel?: string;
  badgesTitle: string;
  badgesDescription: string;
  sidebarInsightTitle: string;
  sidebarHighlightsTitle: string;
  sidebarLedgerTitle: string;
  sidebarLedgerLabel: string;
  sidebarReportAction: string;
  sidebarUploadAction: string;
};

export type PortfolioDataset = {
  tabs: PortfolioTab[];
  projects: PortfolioProject[];
  videos: PortfolioAsset[];
  assessments: PortfolioAsset[];
  files: PortfolioAsset[];
  badges: PortfolioAsset[];
  evidenceItems: EvidenceItem[];
  highlights: Highlight[];
  insightHighlight: Highlight;
};

export type PortfolioContent = PortfolioDataset & {
  role: PortfolioRole;
  copy: PortfolioCopy;
};

const portfolioTabs: PortfolioTab[] = [
  { id: 'dashboard', label: 'Portfolio Dashboard' },
  { id: 'projects', label: 'Projects' },
  { id: 'videos', label: 'Videos' },
  { id: 'assessment', label: 'Assessment' },
  { id: 'files', label: 'Files' },
  { id: 'skill-badges', label: 'Skill Badges' },
];

const studentProjects: PortfolioProject[] = [
  {
    id: 'web-design-project',
    title: 'Web Design Project',
    date: 'April 20, 2024',
    badge: 'Design Showcase',
    description: 'Great layout and responsive design. Keep it up!',
    category: 'Design Portfolio',
    accent: 'document',
    icon: Code2,
    status: 'approved',
    sponsor: 'DigitalOcean',
    progress: 72,
    evidenceCount: 8,
    tools: ['HTML', 'CSS', 'Responsive Layout', 'Accessibility'],
    outcome: 'Built a responsive landing experience with verified design evidence.',
  },
  {
    id: 'graphic-design-portfolio',
    title: 'Graphic Design Portfolio',
    date: 'March 15, 2024',
    badge: 'Design Portfolio',
    description: 'Collection of logo and branding designs',
    category: 'Design Portfolio',
    accent: 'presentation',
    icon: FileText,
    progress: 58,
    evidenceCount: 6,
    tools: ['Brand Systems', 'Logo Design', 'Presentation'],
    outcome: 'Curated a brand identity collection with logo and presentation artifacts.',
  },
  {
    id: 'marketing-presentation',
    title: 'Marketing Presentation',
    date: 'April 10, 2024',
    badge: 'Marketing Strategy',
    description: 'Presented campaign strategy for XYZ Company',
    category: 'Marketing Portfolio',
    accent: 'video',
    icon: Megaphone,
    progress: 76,
    evidenceCount: 5,
    tools: ['Campaign Planning', 'Storyboarding', 'Slides'],
    outcome: 'Delivered a structured campaign proposal with clear audience targeting.',
  },
  {
    id: 'data-analysis-report',
    title: 'Data Analysis Report',
    date: 'February 28, 2024',
    badge: 'Analytics Evidence',
    description: 'Cleaned survey data and presented insights with charts and recommendations.',
    category: 'Analytics Portfolio',
    accent: 'presentation',
    icon: BarChart3,
    status: 'verified',
    sponsor: 'Elimika Review',
    progress: 82,
    evidenceCount: 7,
    tools: ['Spreadsheets', 'Charts', 'Insight Writing'],
    outcome: 'Converted raw survey responses into an evidence-backed analysis report.',
  },
  {
    id: 'mobile-ui-prototype',
    title: 'Mobile UI Prototype',
    date: 'February 12, 2024',
    badge: 'Prototype Review',
    description: 'Designed a mobile-first course discovery flow with interactive screens.',
    category: 'Product Design',
    accent: 'document',
    icon: Code2,
    progress: 69,
    evidenceCount: 4,
    tools: ['Wireframes', 'User Flow', 'Prototype'],
    outcome: 'Produced a clickable prototype for course search and enrollment.',
  },
  {
    id: 'case-study-website',
    title: 'Case Study Website',
    date: 'January 30, 2024',
    badge: 'Case Study',
    description: 'Published a project case study explaining process, decisions, and results.',
    category: 'Web Portfolio',
    accent: 'document',
    icon: Palette,
    progress: 64,
    evidenceCount: 3,
    tools: ['Content Strategy', 'Web Layout', 'Publishing'],
    outcome: 'Created a polished case study page to document project learning outcomes.',
  },
];

const studentVideos: PortfolioAsset[] = [
  {
    id: 'campaign-walkthrough',
    title: 'Campaign Walkthrough',
    date: 'April 18, 2024',
    description: 'A narrated walkthrough of the marketing presentation and campaign strategy.',
    category: 'Marketing',
    icon: PlaySquare,
    meta: '04:35 video',
    status: 'Uploaded',
    rating: 4,
  },
  {
    id: 'web-design-demo',
    title: 'Web Design Demo',
    date: 'April 12, 2024',
    description: 'Screen recording showing responsive behavior across desktop and mobile.',
    category: 'Web Design',
    icon: PlaySquare,
    meta: '03:20 video',
    status: 'Verified',
    rating: 5,
  },
  {
    id: 'portfolio-review',
    title: 'Portfolio Review',
    date: 'March 22, 2024',
    description: 'Short critique session covering visual hierarchy and project storytelling.',
    category: 'Design Portfolio',
    icon: PlaySquare,
    meta: '05:12 video',
    status: 'Uploaded',
    rating: 4,
  },
  {
    id: 'data-story',
    title: 'Data Story Presentation',
    date: 'March 2, 2024',
    description: 'Presentation video explaining charts, findings, and recommendations.',
    category: 'Analytics',
    icon: PlaySquare,
    meta: '06:08 video',
    status: 'Verified',
    rating: 4,
  },
];

const studentAssessments: PortfolioAsset[] = [
  {
    id: 'responsive-design-assessment',
    title: 'Responsive Design Assessment',
    date: 'April 21, 2024',
    description: 'Assessment evidence for layout, spacing, typography, and accessibility.',
    category: 'Web Design',
    icon: FileCheck2,
    meta: '92% score',
    status: 'Approved',
    rating: 5,
  },
  {
    id: 'branding-rubric',
    title: 'Branding Rubric Review',
    date: 'March 18, 2024',
    description: 'Instructor rubric covering logo quality, consistency, and presentation.',
    category: 'Graphic Design',
    icon: FileCheck2,
    meta: '86% score',
    status: 'Reviewed',
    rating: 4,
  },
  {
    id: 'analytics-evaluation',
    title: 'Analytics Evaluation',
    date: 'March 4, 2024',
    description: 'Evidence review for data cleaning, chart selection, and insight accuracy.',
    category: 'Data Analysis',
    icon: FileCheck2,
    meta: '89% score',
    status: 'Verified',
    rating: 4,
  },
];

const studentFiles: PortfolioAsset[] = [
  {
    id: 'design-showcase-pdf',
    title: 'Design Showcase PDF',
    date: 'April 20, 2024',
    description: 'Exported design showcase document with screens and annotations.',
    category: 'PDF Document',
    icon: FileArchive,
    meta: '2.4 MB',
    status: 'Attached',
  },
  {
    id: 'brand-assets',
    title: 'Brand Assets Pack',
    date: 'March 16, 2024',
    description: 'Logo files, color notes, and supporting brand presentation assets.',
    category: 'ZIP Archive',
    icon: FileArchive,
    meta: '8.1 MB',
    status: 'Attached',
  },
  {
    id: 'survey-analysis',
    title: 'Survey Analysis Sheet',
    date: 'February 28, 2024',
    description: 'Source spreadsheet used for the data analysis portfolio project.',
    category: 'Spreadsheet',
    icon: FileArchive,
    meta: '1.8 MB',
    status: 'Verified',
  },
  {
    id: 'case-study-outline',
    title: 'Case Study Outline',
    date: 'January 30, 2024',
    description: 'Written outline documenting the case study structure and evidence.',
    category: 'Document',
    icon: FileArchive,
    meta: '540 KB',
    status: 'Attached',
  },
];

const studentBadges: PortfolioAsset[] = [
  {
    id: 'responsive-layout',
    title: 'Responsive Layout',
    date: 'April 22, 2024',
    description: 'Awarded for building layouts that adapt cleanly across devices.',
    category: 'Web Design',
    icon: Award,
    meta: 'Advanced',
    status: 'Earned',
    rating: 5,
  },
  {
    id: 'visual-storytelling',
    title: 'Visual Storytelling',
    date: 'March 20, 2024',
    description: 'Recognizes strong presentation flow, hierarchy, and portfolio narrative.',
    category: 'Design',
    icon: ShieldCheck,
    meta: 'Intermediate',
    status: 'Earned',
    rating: 4,
  },
  {
    id: 'data-insights',
    title: 'Data Insights',
    date: 'March 6, 2024',
    description: 'Awarded for turning data evidence into clear recommendations.',
    category: 'Analytics',
    icon: BarChart3,
    meta: 'Intermediate',
    status: 'Earned',
    rating: 4,
  },
];

const studentDataset: PortfolioDataset = {
  tabs: portfolioTabs,
  projects: studentProjects,
  videos: studentVideos,
  assessments: studentAssessments,
  files: studentFiles,
  badges: studentBadges,
  evidenceItems: [
    { label: 'Projects Completed', value: 6 },
    { label: 'Videos Added', value: 4 },
    { label: 'Total Evidence', value: 8 },
  ],
  highlights: [
    { title: 'Web Design Project', icon: Palette, rating: 4, variant: 'flag' },
    { title: 'Marketing Presentation', icon: Box, rating: 4, variant: 'cube' },
  ],
  insightHighlight: {
    title: 'Data Analysis',
    icon: BarChart3,
    rating: 4,
    variant: 'bars',
  },
};

const instructorProjects: PortfolioProject[] = [
  {
    id: 'ux-cohort-capstone',
    title: 'UX Cohort Capstone',
    date: 'May 8, 2024',
    badge: 'Mentored Delivery',
    description: 'Guided a cohort through end-to-end product design and final stakeholder review.',
    category: 'Instructional Delivery',
    accent: 'presentation',
    icon: GraduationCap,
    status: 'approved',
    sponsor: 'Design School Board',
    progress: 84,
    evidenceCount: 10,
    tools: ['Mentorship', 'Critique', 'Capstone Review', 'Learning Outcomes'],
    outcome: 'Led learners from discovery to final presentation with strong completion rates.',
  },
  {
    id: 'frontend-bootcamp-sprint',
    title: 'Frontend Bootcamp Sprint',
    date: 'April 24, 2024',
    badge: 'Live Facilitation',
    description: 'Delivered a two-week sprint on semantic HTML, CSS systems, and responsive builds.',
    category: 'Technical Training',
    accent: 'document',
    icon: Code2,
    status: 'verified',
    sponsor: 'Elimika Academy',
    progress: 79,
    evidenceCount: 7,
    tools: ['Live Classes', 'Code Reviews', 'Rubrics', 'Assessments'],
    outcome: 'Improved learner project quality through structured demos and review cycles.',
  },
  {
    id: 'career-readiness-workshop',
    title: 'Career Readiness Workshop',
    date: 'April 11, 2024',
    badge: 'Workshop Series',
    description: 'Created a portfolio and interview-prep workshop for graduating learners.',
    category: 'Career Coaching',
    accent: 'video',
    icon: BriefcaseBusiness,
    progress: 73,
    evidenceCount: 5,
    tools: ['Workshop Design', 'Portfolio Reviews', 'Mock Interviews'],
    outcome: 'Prepared learners with portfolio narratives, case studies, and interview practice.',
  },
  {
    id: 'data-literacy-lab',
    title: 'Data Literacy Lab',
    date: 'March 29, 2024',
    badge: 'Assessment Design',
    description: 'Designed practical analytics tasks and rubric-based evaluation for student teams.',
    category: 'Assessment Portfolio',
    accent: 'presentation',
    icon: BarChart3,
    status: 'approved',
    sponsor: 'Quality Assurance Panel',
    progress: 88,
    evidenceCount: 9,
    tools: ['Curriculum Design', 'Evaluation Rubrics', 'Feedback'],
    outcome: 'Established an assessment flow that improved clarity and grading consistency.',
  },
];

const instructorVideos: PortfolioAsset[] = [
  {
    id: 'classroom-demo',
    title: 'Classroom Facilitation Demo',
    date: 'May 5, 2024',
    description: 'Recording of a live design critique session with structured learner feedback.',
    category: 'Facilitation',
    icon: PlaySquare,
    meta: '07:12 video',
    status: 'Verified',
    rating: 5,
  },
  {
    id: 'bootcamp-recap',
    title: 'Bootcamp Sprint Recap',
    date: 'April 26, 2024',
    description: 'Highlights from the frontend sprint showing instruction flow and learner outcomes.',
    category: 'Technical Training',
    icon: PlaySquare,
    meta: '05:48 video',
    status: 'Uploaded',
    rating: 4,
  },
];

const instructorAssessments: PortfolioAsset[] = [
  {
    id: 'cohort-review-rubric',
    title: 'Cohort Review Rubric',
    date: 'May 7, 2024',
    description: 'Evaluation pack used to assess learner capstones across usability and execution.',
    category: 'Rubric Design',
    icon: FileCheck2,
    meta: '94% rubric quality',
    status: 'Approved',
    rating: 5,
  },
  {
    id: 'teaching-observation',
    title: 'Teaching Observation',
    date: 'April 29, 2024',
    description: 'Observer notes on pacing, learner participation, and instructional clarity.',
    category: 'Instructional Review',
    icon: FileCheck2,
    meta: '4.8/5 score',
    status: 'Reviewed',
    rating: 5,
  },
];

const instructorFiles: PortfolioAsset[] = [
  {
    id: 'lesson-plan-kit',
    title: 'Lesson Plan Kit',
    date: 'May 2, 2024',
    description: 'Session plans, facilitation prompts, and challenge briefs for the cohort sprint.',
    category: 'Teaching Resources',
    icon: FileArchive,
    meta: '3.1 MB',
    status: 'Attached',
  },
  {
    id: 'grading-template',
    title: 'Grading Template',
    date: 'April 17, 2024',
    description: 'Reusable spreadsheet for learner scoring, comments, and progression tracking.',
    category: 'Assessment Tool',
    icon: FileArchive,
    meta: '1.2 MB',
    status: 'Verified',
  },
];

const instructorBadges: PortfolioAsset[] = [
  {
    id: 'facilitation-excellence',
    title: 'Facilitation Excellence',
    date: 'May 6, 2024',
    description: 'Recognizes strong session delivery, engagement, and classroom energy.',
    category: 'Instruction',
    icon: Award,
    meta: 'Expert',
    status: 'Earned',
    rating: 5,
  },
  {
    id: 'assessment-lead',
    title: 'Assessment Lead',
    date: 'April 30, 2024',
    description: 'Awarded for building reliable review systems and actionable learner feedback.',
    category: 'Quality Assurance',
    icon: ShieldCheck,
    meta: 'Advanced',
    status: 'Earned',
    rating: 4,
  },
];

const instructorDataset: PortfolioDataset = {
  tabs: portfolioTabs,
  projects: instructorProjects,
  videos: instructorVideos,
  assessments: instructorAssessments,
  files: instructorFiles,
  badges: instructorBadges,
  evidenceItems: [
    { label: 'Programs Led', value: 4 },
    { label: 'Reviews Shared', value: 6 },
    { label: 'Evidence Sets', value: 11 },
  ],
  highlights: [
    { title: 'UX Cohort Capstone', icon: GraduationCap, rating: 5, variant: 'flag' },
    { title: 'Data Literacy Lab', icon: BarChart3, rating: 4, variant: 'bars' },
  ],
  insightHighlight: {
    title: 'Learner Outcomes',
    icon: BriefcaseBusiness,
    rating: 5,
    variant: 'cube',
  },
};

const portfolioCopy: Record<PortfolioRole, PortfolioCopy> = {
  student: {
    pageTitle: 'My Portfolio',
    ownerName: 'Sarah Otieno',
    ownerLabel: 'Student portfolio owner',
    projectsHeading: 'All Portfolio Projects',
    projectListDescription:
      'A complete list of projects in this portfolio, including verification status, evidence progress, and supporting artifacts.',
    recentUpdatesHeading: 'Recent Portfolio Updates',
    recentUpdatesAction: 'All Projects',
    primaryProjectsHeading: 'My Projects',
    featuredProjectsHeading: 'My Projects',
    featuredProjectsCta: 'View All 6 Projects',
    videosTitle: 'Uploaded Videos',
    videosDescription:
      'Video evidence attached to the portfolio, including demos, walkthroughs, and presentation recordings.',
    videosActionLabel: 'Upload Video',
    assessmentsTitle: 'Portfolio Assessments',
    assessmentsDescription:
      'Reviewed assessments and rubrics connected to portfolio evidence and project submissions.',
    assessmentsActionLabel: 'Add Assessment',
    filesTitle: 'Portfolio Files',
    filesDescription:
      'Documents, archives, spreadsheets, and other files associated with this portfolio.',
    filesActionLabel: 'Upload File',
    badgesTitle: 'Skill Badges',
    badgesDescription:
      'Badges earned from verified project work, assessments, and portfolio milestones.',
    sidebarInsightTitle: 'Portfolio Insights',
    sidebarHighlightsTitle: 'Portfolio Highlights',
    sidebarLedgerTitle: 'Portfolio Ledger',
    sidebarLedgerLabel: 'Relevant for',
    sidebarReportAction: 'View Report',
    sidebarUploadAction: 'Upload Case Study',
  },
  instructor: {
    pageTitle: 'Instructor Portfolio',
    ownerName: 'Daniel Adebayo',
    ownerLabel: 'Instructor portfolio owner',
    projectsHeading: 'Teaching Portfolio Projects',
    projectListDescription:
      'A reusable teaching portfolio that brings together delivery case studies, assessments, and classroom evidence.',
    recentUpdatesHeading: 'Recent Delivery Updates',
    recentUpdatesAction: 'All Portfolio Projects',
    primaryProjectsHeading: 'Programs and Workshops',
    featuredProjectsHeading: 'Featured Instructor Work',
    featuredProjectsCta: 'View All 4 Projects',
    videosTitle: 'Teaching Videos',
    videosDescription:
      'Classroom recordings, demo sessions, and walkthroughs that capture instructional delivery.',
    videosActionLabel: 'Upload Session Video',
    assessmentsTitle: 'Reviews and Assessments',
    assessmentsDescription:
      'Observation notes, rubrics, and evaluation packs connected to instructor-led delivery.',
    assessmentsActionLabel: 'Add Review Pack',
    filesTitle: 'Resources and Files',
    filesDescription:
      'Lesson plans, grading tools, and supporting documents attached to this instructor portfolio.',
    filesActionLabel: 'Upload Resource',
    badgesTitle: 'Teaching Badges',
    badgesDescription:
      'Recognition earned through facilitation quality, assessment leadership, and learner outcomes.',
    sidebarInsightTitle: 'Delivery Insights',
    sidebarHighlightsTitle: 'Top Portfolio Highlights',
    sidebarLedgerTitle: 'Portfolio Ledger',
    sidebarLedgerLabel: 'Strongest signal',
    sidebarReportAction: 'View Teaching Report',
    sidebarUploadAction: 'Upload Teaching Evidence',
  },
};

const datasets: Record<PortfolioRole, PortfolioDataset> = {
  student: studentDataset,
  instructor: instructorDataset,
};

export function getPortfolioContent(role: PortfolioRole): PortfolioContent {
  return {
    role,
    copy: portfolioCopy[role],
    ...datasets[role],
  };
}
