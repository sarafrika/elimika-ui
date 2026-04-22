import type { LucideIcon } from 'lucide-react';
import {
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  FolderKanban,
  Globe2,
  GraduationCap,
  MapPin,
  Star
} from 'lucide-react';

export type JobMarketplaceRole = 'organisations' | 'instructor';

export type MarketplaceTab = {
  id: string;
  label: string;
  count?: string;
  icon: LucideIcon;
};

export type FilterGroup = {
  title: string;
  icon: LucideIcon;
  items: {
    label: string;
    count?: string;
    active?: boolean;
  }[];
};

export type JobCardItem = {
  id: string;
  title: string;
  company: string;
  locationOrMeta: string;
  description: string;
  skills: string[];
  rating: number;
  ctaLabel: string;
  accent: 'blue' | 'teal' | 'gold';
  type: 'job' | 'portfolio' | 'video';
  duration?: string;
  matchLabel?: string;
};

export type MiniCardItem = {
  id: string;
  title: string;
  subtitle: string;
  rating: number;
  ctaLabel: string;
  iconLabel: string;
  accent: 'blue' | 'gold';
};

export type CourseRecommendation = {
  id: string;
  title: string;
  subtitle: string;
  hours: string;
  iconLabel: string;
  accent: 'blue' | 'azure';
};

export type PortfolioInsight = {
  label: string;
  value: string;
  icon: LucideIcon;
};

export type MarketplaceContent = {
  title: string;
  userName: string;
  sidebarHeading: string;
  sidebarCount: string;
  opportunitySummary: string;
  sortLabel: string;
  sortValue: string;
  filterValue: string;
  setAlertLabel: string;
  applicationsLabel: string;
  searchJobsPlaceholder: string;
  sendLabel: string;
  coursesTitle: string;
  insightsTitle: string;
  matchingTitle: string;
  matchingDescription: string;
  matchingAction: string;
  tabs: MarketplaceTab[];
  filterGroups: FilterGroup[];
  opportunities: JobCardItem[];
  performanceVideos: MiniCardItem[];
  courses: CourseRecommendation[];
  insightsCount: string;
  insights: PortfolioInsight[];
};

const tabs: MarketplaceTab[] = [
  { id: 'full-time', label: 'Full-Time', icon: BriefcaseBusiness },
  { id: 'internship', label: 'Internship', count: '23', icon: GraduationCap },
  { id: 'freelance', label: 'Freelance', count: '4', icon: Star },
  { id: 'remote', label: 'Remote', count: '16', icon: Globe2 },
];

const studentContent: MarketplaceContent = {
  title: 'Jobs Marketplace',
  userName: 'Sarah Otieno',
  sidebarHeading: 'Filters',
  sidebarCount: '243 Opportunities',
  opportunitySummary: '1ob Opportunities',
  sortLabel: 'Sort by',
  sortValue: 'Best Match',
  filterValue: 'All',
  setAlertLabel: 'Set Job Alerts',
  applicationsLabel: 'My Applications',
  searchJobsPlaceholder: 'Search For an Jobs',
  sendLabel: 'Send',
  coursesTitle: 'Recommended Courses',
  insightsTitle: 'Portfolio Insights',
  matchingTitle: 'Matching Opportunities',
  matchingDescription: 'We found 2 jobs and internships based on your skills.',
  matchingAction: 'See All',
  tabs,
  filterGroups: [
    {
      title: 'Location',
      icon: MapPin,
      items: [
        { label: 'Nairobi, Kenya', active: true },
        { label: 'Cape Town, South Africa' },
        { label: 'Lagos, Nigeria' },
      ],
    },
    {
      title: 'Skill Focus',
      icon: Star,
      items: [
        { label: 'Graphic Design', count: '3', active: true },
        { label: 'Data Analytics', count: '1' },
        { label: 'Marketing', count: '2' },
        { label: 'Web Development', count: '1' },
        { label: 'Communication', count: '1' },
      ],
    },
  ],
  opportunities: [
    {
      id: 'junior-graphic-designer',
      title: 'Junior Graphic Designer',
      company: 'CreativeBrands',
      locationOrMeta: 'Hybrid  (-4 year and Experienes',
      description: 'Data Analysis & Graphic Design',
      skills: ['Hybrid'],
      rating: 4,
      ctaLabel: 'Apply Now',
      accent: 'blue',
      type: 'job',
    },
    {
      id: 'graphic-design-portfolio',
      title: 'Graphic Design Portfolio',
      company: 'Design Portfolio',
      locationOrMeta: 'Nairobi, Kenya',
      description: 'Benefits; Salary fiun & Deth insurance; Mentorship. Stipe ret Janelifis',
      skills: ['Nairobi, Kenya'],
      rating: 4,
      ctaLabel: 'Apply Now',
      accent: 'blue',
      type: 'portfolio',
    },
    {
      id: 'data-analyst-internship',
      title: 'Data Analyst Internship',
      company: 'Data Insight Hub',
      locationOrMeta: 'enperfimess 40 23',
      description: 'Entry role aligned to analytics dashboards and insight reporting.',
      skills: ['Analytics'],
      rating: 4,
      ctaLabel: 'Apply Now',
      accent: 'teal',
      type: 'video',
      duration: '2:30',
    },
    {
      id: 'social-media-intern',
      title: 'Social Media Intern',
      company: 'BrightWave Marketing',
      locationOrMeta: 'reduary 20 23',
      description: 'Content scheduling, campaign tracking, and visual asset support.',
      skills: ['Marketing'],
      rating: 3,
      ctaLabel: 'Watch Video',
      accent: 'gold',
      type: 'video',
      duration: '5:45',
      matchLabel: 'GOM Greet Match',
    },
  ],
  performanceVideos: [
    {
      id: 'marketing-presentation',
      title: 'Marketing Presentation',
      subtitle: 'CreativeMinds Academy',
      rating: 4,
      ctaLabel: 'Apply.Now',
      iconLabel: 'A1',
      accent: 'gold',
    },
    {
      id: 'piano-recital',
      title: 'Piano Recital',
      subtitle: 'January 2024',
      rating: 4,
      ctaLabel: 'Watch Video',
      iconLabel: 'Ps',
      accent: 'blue',
    },
  ],
  courses: [
    {
      id: 'photoshop',
      title: 'Advanced Photoshop',
      subtitle: 'Intermediate',
      hours: '5 h',
      iconLabel: 'Ps',
      accent: 'blue',
    },
    {
      id: 'analytics-essentials',
      title: 'Data Analysis Essentials',
      subtitle: 'Beginner',
      hours: '6 h',
      iconLabel: '📊',
      accent: 'azure',
    },
  ],
  insightsCount: '8',
  insights: [
    { label: 'Portfolio Entites', value: '8', icon: FolderKanban },
    { label: '2 Projects', value: '2', icon: CheckCircle2 },
    { label: '2 Files', value: '2', icon: FileText },
    { label: '3 Badges', value: '3', icon: BadgeCheck },
  ],
};

const instructorContent: MarketplaceContent = {
  ...studentContent,
  userName: 'Daniel Adebayo',
  sidebarCount: '118 Opportunities',
  insightsCount: '11',
  courses: [
    {
      id: 'instructional-design',
      title: 'Instructional Design Mastery',
      subtitle: 'Advanced',
      hours: '4 h',
      iconLabel: 'ID',
      accent: 'blue',
    },
    {
      id: 'learning-analytics',
      title: 'Learning Analytics Essentials',
      subtitle: 'Mentor',
      hours: '6 h',
      iconLabel: '📈',
      accent: 'azure',
    },
  ],
  opportunities: [
    {
      id: 'lead-design-mentor',
      title: 'Lead Design Mentor',
      company: 'CreativeBrands',
      locationOrMeta: 'Hybrid  (-4 year and Experienes',
      description: 'Facilitation, review cycles, and learner portfolio coaching.',
      skills: ['Hybrid'],
      rating: 4,
      ctaLabel: 'Apply Now',
      accent: 'blue',
      type: 'job',
    },
    {
      id: 'curriculum-design-portfolio',
      title: 'Curriculum Design Portfolio',
      company: 'Teaching Portfolio',
      locationOrMeta: 'Lagos, Nigeria',
      description: 'Benefits; mentorship track, delivery review, and quality bonuses.',
      skills: ['Lagos, Nigeria'],
      rating: 4,
      ctaLabel: 'Apply Now',
      accent: 'blue',
      type: 'portfolio',
    },
    {
      id: 'learning-strategist',
      title: 'Learning Strategist',
      company: 'Impact Academy',
      locationOrMeta: 'remote 18 12',
      description: 'Assessment planning, curriculum feedback, and outcomes reporting.',
      skills: ['Remote'],
      rating: 4,
      ctaLabel: 'Apply Now',
      accent: 'teal',
      type: 'video',
      duration: '3:10',
    },
    {
      id: 'content-facilitator',
      title: 'Content Facilitator',
      company: 'BrightWave Learning',
      locationOrMeta: 'march 10 24',
      description: 'Recorded facilitation sample and instructional delivery walkthrough.',
      skills: ['Teaching'],
      rating: 3,
      ctaLabel: 'Watch Video',
      accent: 'gold',
      type: 'video',
      duration: '6:05',
      matchLabel: 'Top Mentor Match',
    },
  ],
  performanceVideos: [
    {
      id: 'assessment-demo',
      title: 'Assessment Walkthrough',
      subtitle: 'Teaching Operations',
      rating: 4,
      ctaLabel: 'Apply.Now',
      iconLabel: 'A1',
      accent: 'gold',
    },
    {
      id: 'curriculum-recital',
      title: 'Curriculum Recital',
      subtitle: 'January 2024',
      rating: 4,
      ctaLabel: 'Watch Video',
      iconLabel: 'Ps',
      accent: 'blue',
    },
  ],
  insights: [
    { label: 'Portfolio Entites', value: '11', icon: FolderKanban },
    { label: '4 Projects', value: '4', icon: CheckCircle2 },
    { label: '3 Files', value: '3', icon: FileText },
    { label: '4 Badges', value: '4', icon: BadgeCheck },
  ],
};

export function getJobMarketplaceContent(role: JobMarketplaceRole) {
  return role === 'instructor' ? instructorContent : studentContent;
}
