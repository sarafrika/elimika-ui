import type { LucideIcon } from 'lucide-react';
import {
  Award,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  Cloud,
  Eye,
  Globe,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Share2,
  Star,
  WalletCards,
} from 'lucide-react';

export type CredentialsRole = 'student' | 'instructor';
export type CredentialsTabId = 'all' | 'badges' | 'certificates' | 'blockchain';

export type CredentialsTab = {
  id: CredentialsTabId;
  label: string;
  countLabel?: string;
  icon: LucideIcon;
};

export type CredentialsProfile = {
  name: string;
  title: string;
  location: string;
  website: string;
  email: string;
  phone: string;
  joined: string;
  entriesLabel: string;
  levelLabel: string;
  initials: string;
};

export type CredentialItem = {
  id: string;
  title: string;
  issuer: string;
  issuerIconText: string;
  stage: string;
  level: string;
  status: string;
  statusIcon: LucideIcon;
  actionLabel: string;
  documentLabel: string;
};

export type GrowthItem = {
  id: string;
  title: string;
  provider: string;
  badge: string;
  metadata: string;
  footerLabel: string;
  actionLabel: string;
  accent: 'green' | 'amber' | 'blue';
  icon: LucideIcon;
};

export type CredentialsContent = {
  pageTitle: string;
  pageDescription: string;
  addLabel: string;
  searchPlaceholder: string;
  tabs: CredentialsTab[];
  profile: CredentialsProfile;
  summary: {
    badges: string;
    blockchain: string;
    shares: string;
  };
  credentialsByTab: Record<CredentialsTabId, CredentialItem[]>;
  timeline: GrowthItem[];
};

const studentTabs: CredentialsTab[] = [
  { id: 'all', label: '35 Credentials', icon: WalletCards },
  { id: 'badges', label: 'Digital Badges', icon: BadgeCheck },
  { id: 'certificates', label: 'Certificates', icon: Award },
  { id: 'blockchain', label: 'Blockchain', icon: CheckCircle2 },
];

const instructorTabs: CredentialsTab[] = [
  { id: 'all', label: '28 Credentials', icon: WalletCards },
  { id: 'badges', label: 'Teaching Badges', icon: BadgeCheck },
  { id: 'certificates', label: 'Certificates', icon: Award },
  { id: 'blockchain', label: 'Blockchain', icon: CheckCircle2 },
];

const studentCredentials: Record<CredentialsTabId, CredentialItem[]> = {
  all: [
    {
      id: 'graphic-design-basics',
      title: 'Graphic Design Basics Badge',
      issuer: 'Google',
      issuerIconText: 'G',
      stage: 'Intermediate',
      level: 'Beginner',
      status: 'Verified on Blockchain',
      statusIcon: Eye,
      actionLabel: 'Share',
      documentLabel: 'coursera',
    },
    {
      id: 'ui-ux-design-certificate',
      title: 'UI/UX Design Certificate',
      issuer: 'Google',
      issuerIconText: 'G',
      stage: 'Beginner',
      level: 'Beginner',
      status: 'Verified on Blockchain',
      statusIcon: Eye,
      actionLabel: 'Share',
      documentLabel: 'google',
    },
  ],
  badges: [
    {
      id: 'graphic-design-basics',
      title: 'Graphic Design Basics Badge',
      issuer: 'Google',
      issuerIconText: 'G',
      stage: 'Intermediate',
      level: 'Beginner',
      status: 'Verified on Blockchain',
      statusIcon: Eye,
      actionLabel: 'Share',
      documentLabel: 'coursera',
    },
    {
      id: 'ui-ux-design-certificate',
      title: 'UI/UX Design Certificate',
      issuer: 'Google',
      issuerIconText: 'G',
      stage: 'Beginner',
      level: 'Beginner',
      status: 'Verified on Blockchain',
      statusIcon: Eye,
      actionLabel: 'Share',
      documentLabel: 'google',
    },
  ],
  certificates: [
    {
      id: 'data-analysis-foundation',
      title: 'Data Analysis Foundation',
      issuer: 'Meta',
      issuerIconText: 'M',
      stage: 'Intermediate',
      level: 'Verified',
      status: 'Certificate Published',
      statusIcon: CheckCircle2,
      actionLabel: 'View',
      documentLabel: 'meta',
    },
    {
      id: 'product-portfolio-review',
      title: 'Product Portfolio Review',
      issuer: 'DigitalOcean',
      issuerIconText: 'D',
      stage: 'Advanced',
      level: 'Verified',
      status: 'Verified on Blockchain',
      statusIcon: Eye,
      actionLabel: 'Share',
      documentLabel: 'digitalocean',
    },
  ],
  blockchain: [
    {
      id: 'blockchain-graphic-design',
      title: 'Graphic Design Basics Badge',
      issuer: 'Google',
      issuerIconText: 'G',
      stage: 'Blockchain Verified',
      level: 'Beginner',
      status: 'Verified on Blockchain',
      statusIcon: Eye,
      actionLabel: 'Share',
      documentLabel: 'google',
    },
    {
      id: 'blockchain-uiux',
      title: 'UI/UX Design Certificate',
      issuer: 'Google',
      issuerIconText: 'G',
      stage: 'Wallet Synced',
      level: 'Beginner',
      status: 'Verified on Blockchain',
      statusIcon: Eye,
      actionLabel: 'Share',
      documentLabel: 'google',
    },
  ],
};

const instructorCredentials: Record<CredentialsTabId, CredentialItem[]> = {
  all: [
    {
      id: 'facilitation-excellence',
      title: 'Facilitation Excellence Badge',
      issuer: 'Elimika',
      issuerIconText: 'E',
      stage: 'Advanced',
      level: 'Instructor',
      status: 'Verified on Blockchain',
      statusIcon: Eye,
      actionLabel: 'Share',
      documentLabel: 'elimika',
    },
    {
      id: 'curriculum-design-certificate',
      title: 'Curriculum Design Certificate',
      issuer: 'Google',
      issuerIconText: 'G',
      stage: 'Mentor',
      level: 'Advanced',
      status: 'Verified on Blockchain',
      statusIcon: Eye,
      actionLabel: 'Share',
      documentLabel: 'google',
    },
  ],
  badges: [
    {
      id: 'facilitation-excellence',
      title: 'Facilitation Excellence Badge',
      issuer: 'Elimika',
      issuerIconText: 'E',
      stage: 'Advanced',
      level: 'Instructor',
      status: 'Verified on Blockchain',
      statusIcon: Eye,
      actionLabel: 'Share',
      documentLabel: 'elimika',
    },
    {
      id: 'learner-outcomes',
      title: 'Learner Outcomes Award',
      issuer: 'Meta',
      issuerIconText: 'M',
      stage: 'Expert',
      level: 'Advanced',
      status: 'Wallet Synced',
      statusIcon: CheckCircle2,
      actionLabel: 'Share',
      documentLabel: 'meta',
    },
  ],
  certificates: [
    {
      id: 'curriculum-design-certificate',
      title: 'Curriculum Design Certificate',
      issuer: 'Google',
      issuerIconText: 'G',
      stage: 'Mentor',
      level: 'Advanced',
      status: 'Verified on Blockchain',
      statusIcon: Eye,
      actionLabel: 'Share',
      documentLabel: 'google',
    },
    {
      id: 'assessment-lead-certificate',
      title: 'Assessment Lead Certificate',
      issuer: 'IBM',
      issuerIconText: 'I',
      stage: 'Reviewed',
      level: 'Advanced',
      status: 'Certificate Published',
      statusIcon: CheckCircle2,
      actionLabel: 'View',
      documentLabel: 'ibm',
    },
  ],
  blockchain: [
    {
      id: 'wallet-facilitation',
      title: 'Facilitation Excellence Badge',
      issuer: 'Elimika',
      issuerIconText: 'E',
      stage: 'Wallet Synced',
      level: 'Instructor',
      status: 'Verified on Blockchain',
      statusIcon: Eye,
      actionLabel: 'Share',
      documentLabel: 'elimika',
    },
    {
      id: 'wallet-curriculum',
      title: 'Curriculum Design Certificate',
      issuer: 'Google',
      issuerIconText: 'G',
      stage: 'Wallet Synced',
      level: 'Advanced',
      status: 'Verified on Blockchain',
      statusIcon: Eye,
      actionLabel: 'Share',
      documentLabel: 'google',
    },
  ],
};

const studentTimeline: GrowthItem[] = [
  {
    id: 'python-programming',
    title: 'Python Programming',
    provider: 'Meta',
    badge: 'Wanted',
    metadata: 'Verified on Blockchain',
    footerLabel: 'Share',
    actionLabel: 'Share',
    accent: 'green',
    icon: GraduationCap,
  },
  {
    id: 'digital-marketing',
    title: 'Digital Marketing',
    provider: 'Meta',
    badge: 'Intermediate',
    metadata: 'Verified on Blockchain',
    footerLabel: 'Share',
    actionLabel: 'Share',
    accent: 'amber',
    icon: BriefcaseBusiness,
  },
  {
    id: 'sql-analysis',
    title: 'SQL for Data Analysis',
    provider: 'Google',
    badge: 'Beginner',
    metadata: 'On 57, 2024',
    footerLabel: 'Share',
    actionLabel: 'Share',
    accent: 'blue',
    icon: Building2,
  },
  {
    id: 'google-ads',
    title: 'Google Ads',
    provider: 'Google Ads',
    badge: 'Earned',
    metadata: 'Due 25on',
    footerLabel: 'Share',
    actionLabel: 'Share',
    accent: 'blue',
    icon: Globe,
  },
  {
    id: 'data-science',
    title: 'IBM Data Science',
    provider: 'Data-Advysie',
    badge: 'In.Office - Internship',
    metadata: 'Share',
    footerLabel: 'Share',
    actionLabel: 'Share',
    accent: 'amber',
    icon: WalletCards,
  },
  {
    id: 'digital-ocean',
    title: 'DigitalOcean',
    provider: 'Portfolio Verified',
    badge: 'AI Match',
    metadata: '75% 655',
    footerLabel: 'Apply New',
    actionLabel: 'Apply New',
    accent: 'blue',
    icon: Cloud,
  },
];

const instructorTimeline: GrowthItem[] = [
  {
    id: 'instructional-design',
    title: 'Instructional Design',
    provider: 'Elimika',
    badge: 'Advanced',
    metadata: 'Verified on Blockchain',
    footerLabel: 'Share',
    actionLabel: 'Share',
    accent: 'green',
    icon: GraduationCap,
  },
  {
    id: 'cohort-facilitation',
    title: 'Cohort Facilitation',
    provider: 'Meta',
    badge: 'Mentor',
    metadata: 'Verified on Blockchain',
    footerLabel: 'Share',
    actionLabel: 'Share',
    accent: 'amber',
    icon: BriefcaseBusiness,
  },
  {
    id: 'assessment-ops',
    title: 'Assessment Operations',
    provider: 'IBM',
    badge: 'Advanced',
    metadata: 'Quality tracked',
    footerLabel: 'Share',
    actionLabel: 'Share',
    accent: 'blue',
    icon: Building2,
  },
  {
    id: 'remote-teaching',
    title: 'Remote Teaching',
    provider: 'DigitalOcean',
    badge: 'Earned',
    metadata: 'Part-Time - Remote',
    footerLabel: 'Share',
    actionLabel: 'Share',
    accent: 'blue',
    icon: Cloud,
  },
  {
    id: 'content-systems',
    title: 'Content Systems',
    provider: 'Google',
    badge: 'Curriculum',
    metadata: 'Reviewed and shared',
    footerLabel: 'Share',
    actionLabel: 'Share',
    accent: 'amber',
    icon: Globe,
  },
  {
    id: 'teaching-report',
    title: 'Teaching Report',
    provider: 'Portfolio Verified',
    badge: 'AI Match',
    metadata: '82% 712',
    footerLabel: 'View Report',
    actionLabel: 'View Report',
    accent: 'green',
    icon: Star,
  },
];

export function getCredentialsContent(role: CredentialsRole): CredentialsContent {
  if (role === 'instructor') {
    return {
      pageTitle: 'Credentials Vault',
      pageDescription: 'Manage and showcase your earned badges and certificates.',
      addLabel: 'Add',
      searchPlaceholder: 'Search credentials...',
      tabs: instructorTabs,
      profile: {
        name: 'Daniel Adebayo',
        title: 'Instructor, Product Design',
        location: 'Lagos, Nigeria',
        website: 'daniel-portfolio.dev',
        email: 'daniel@elimika.com',
        phone: '+234 801 555 8944',
        joined: 'May 2022',
        entriesLabel: '18 Teaching Entries',
        levelLabel: 'Level 5 Mentor',
        initials: 'DA',
      },
      summary: {
        badges: '12 Badges',
        blockchain: 'Verified on Blockchain',
        shares: '18 Share',
      },
      credentialsByTab: instructorCredentials,
      timeline: instructorTimeline,
    };
  }

  return {
    pageTitle: 'Credentials Vault',
    pageDescription: 'Manage and showcase your earned badges and certificates.',
    addLabel: 'Add',
    searchPlaceholder: 'Search credentials...',
    tabs: studentTabs,
    profile: {
      name: 'Sarah Otieno',
      title: 'Web Design & Data Analytics',
      location: 'Nairobi, Kenya',
      website: 'sarahotieno.com',
      email: 'sarah@example.com',
      phone: '+254 200 125456',
      joined: 'May 2023',
      entriesLabel: '25 Portfolio Entries',
      levelLabel: 'Level 4 Advanced',
      initials: 'SO',
    },
    summary: {
      badges: '14 Badges',
      blockchain: 'Verified on Blockchain',
      shares: '21 Share',
    },
    credentialsByTab: studentCredentials,
    timeline: studentTimeline,
  };
}
