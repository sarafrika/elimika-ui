import type { LucideIcon } from 'lucide-react';
import {
  Award,
  BarChart3,
  Box,
  Code2,
  FileArchive,
  FileCheck2,
  FileText,
  Megaphone,
  Palette,
  PlaySquare,
  ShieldCheck,
} from 'lucide-react';

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

export const portfolioTabs: PortfolioTab[] = [
  { id: 'dashboard', label: 'Portfolio Dashboard' },
  { id: 'projects', label: 'Projects' },
  { id: 'videos', label: 'Videos' },
  { id: 'assessment', label: 'Assessment' },
  { id: 'files', label: 'Files' },
  { id: 'skill-badges', label: 'Skill Badges' },
];

export const portfolioProjects: PortfolioProject[] = [
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

export const recentProject = portfolioProjects[0] as PortfolioProject;
export const compactProjects = portfolioProjects.slice(0, 2);
export const featuredProjects = portfolioProjects.slice(0, 2);

export const portfolioVideos: PortfolioAsset[] = [
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
    date: 'March 02, 2024',
    description: 'Presentation video explaining charts, findings, and recommendations.',
    category: 'Analytics',
    icon: PlaySquare,
    meta: '06:08 video',
    status: 'Verified',
    rating: 4,
  },
];

export const portfolioAssessments: PortfolioAsset[] = [
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
    date: 'March 04, 2024',
    description: 'Evidence review for data cleaning, chart selection, and insight accuracy.',
    category: 'Data Analysis',
    icon: FileCheck2,
    meta: '89% score',
    status: 'Verified',
    rating: 4,
  },
];

export const portfolioFiles: PortfolioAsset[] = [
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

export const skillBadges: PortfolioAsset[] = [
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
    date: 'March 06, 2024',
    description: 'Awarded for turning data evidence into clear recommendations.',
    category: 'Analytics',
    icon: BarChart3,
    meta: 'Intermediate',
    status: 'Earned',
    rating: 4,
  },
];

export const evidenceItems: EvidenceItem[] = [
  { label: 'Projects Completed', value: 6 },
  { label: 'Videos Added', value: 4 },
  { label: 'Total Evidence', value: 8 },
];

export const highlights: Highlight[] = [
  { title: 'Web Design Project', icon: Palette, rating: 4, variant: 'flag' },
  { title: 'Marketing Presentation', icon: Box, rating: 4, variant: 'cube' },
];

export const insightHighlight: Highlight = {
  title: 'Data Analysis',
  icon: BarChart3,
  rating: 4,
  variant: 'bars',
};
