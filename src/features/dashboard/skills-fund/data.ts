import {
  BriefcaseBusiness,
  Building2,
  CircleDollarSign,
  FileText,
  GraduationCap,
  Landmark,
  Medal,
  ShieldCheck,
  WalletCards,
  type LucideIcon,
} from 'lucide-react';

export type SkillsFundRole = 'student' | 'instructor';

export type SkillsFundTabId =
  | 'bursaries'
  | 'sponsorships'
  | 'scholarships'
  | 'apprenticeships';

export type SkillsFundSortValue = 'best-match' | 'highest-support' | 'recommended';

export type SkillsFundOpportunity = {
  id: string;
  tab: SkillsFundTabId;
  title: string;
  organisation: string;
  sponsor: string;
  location?: string;
  amountLabel: string;
  supportAmount: number;
  description: string;
  usagePercent: number;
  usageLabel: string;
  recommendation: string;
  eligibilityLabel: string;
  actionLabel: string;
  secondaryActionLabel: string;
  rating: number;
  accent: 'blue' | 'sky' | 'violet' | 'amber';
  eyebrow?: string;
  footerMeta?: string;
};

export type SkillsFundTrackerEntry = {
  id: string;
  title: string;
  amount: string;
  source: string;
  icon: LucideIcon;
  iconTone: 'blue' | 'amber' | 'violet';
};

export type SkillsFundActivityEntry = {
  id: string;
  title: string;
  amount: string;
  date: string;
  icon: LucideIcon;
  iconTone: 'green' | 'blue' | 'violet';
};

export type SkillsFundResource = {
  id: string;
  title: string;
  icon: LucideIcon;
};

export type SkillsFundMiniCard = {
  id: string;
  title: string;
  subtitle: string;
  amount: string;
  progressPercent: number;
  progressLabel: string;
  actionLabel: string;
  rating: number;
  chips: string[];
  accent: 'blue' | 'sky';
};

export type SkillsFundContent = {
  title: string;
  profileName: string;
  tabs: Array<{ id: SkillsFundTabId; label: string; count: number }>;
  filterCount: number;
  matchedScore: number;
  opportunities: SkillsFundOpportunity[];
  trackerEntries: SkillsFundTrackerEntry[];
  walletTitle: string;
  walletBalance: string;
  walletSubtitle: string;
  walletUtilizationLabel: string;
  walletUtilizationPercent: number;
  walletRemaining: string;
  walletActionLabel: string;
  walletSecondaryActionLabel: string;
  activityEntries: SkillsFundActivityEntry[];
  resources: SkillsFundResource[];
  bottomCards: SkillsFundMiniCard[];
};

const sharedOpportunities: SkillsFundOpportunity[] = [
  {
    id: 'google-skills-bursary',
    tab: 'bursaries',
    title: 'Google Skills Bursary',
    organisation: 'CreativeBrands',
    sponsor: 'Google',
    amountLabel: 'Up to $3,000 for Tech Skills',
    supportAmount: 3000,
    description: 'Helps learners cover practical training and certification costs.',
    usagePercent: 60,
    usageLabel: '60% used',
    recommendation: '75% Recommended',
    eligibilityLabel: 'Eligible for Skills Fund',
    actionLabel: 'Apply Now',
    secondaryActionLabel: 'Request Support',
    rating: 4,
    accent: 'blue',
  },
  {
    id: 'local-skills-grant',
    tab: 'bursaries',
    title: 'Local Skills Grant',
    organisation: 'IvoBi, Skills DevFund',
    sponsor: 'County Fund',
    location: 'Nairobi, Kenya',
    amountLabel: 'Up to $1000',
    supportAmount: 1000,
    description: 'Funding support for local training programs and learning resources.',
    usagePercent: 35,
    usageLabel: '35% used',
    recommendation: '80% Recommended',
    eligibilityLabel: 'Eligible for Skills Fund',
    actionLabel: 'Apply Now',
    secondaryActionLabel: 'Request Support',
    rating: 4,
    accent: 'sky',
    footerMeta: 'Rearie',
  },
  {
    id: 'women-in-tech-bursary',
    tab: 'scholarships',
    title: 'Women in Tech Bursary',
    organisation: 'SheCanTech',
    sponsor: 'SheCanTech',
    amountLabel: 'Opportunities, $5,108',
    supportAmount: 5108,
    description: 'Scholarship support tailored for women building skills in technology.',
    usagePercent: 20,
    usageLabel: '20% used',
    recommendation: 'Recommended',
    eligibilityLabel: 'Eligible for Skills Fund',
    actionLabel: 'Apply Now',
    secondaryActionLabel: 'Request Support',
    rating: 4,
    accent: 'violet',
    eyebrow: 'Recommended',
  },
  {
    id: 'creative-skills-sponsorship',
    tab: 'sponsorships',
    title: 'Creative Skills Sponsorship',
    organisation: 'BrightWave Marketing',
    sponsor: 'BrightWave',
    amountLabel: 'February 20,24',
    supportAmount: 2400,
    description: 'Sponsor-backed support for creative and digital upskilling tracks.',
    usagePercent: 35,
    usageLabel: '35% used',
    recommendation: 'AI Recommended',
    eligibilityLabel: 'Eligible for Skills Fund',
    actionLabel: 'Apply Now',
    secondaryActionLabel: 'Request Support',
    rating: 4,
    accent: 'amber',
    eyebrow: 'AI Recommended',
  },
  {
    id: 'career-launch-bursary',
    tab: 'bursaries',
    title: 'Career Launch Bursary',
    organisation: 'CareerFoundry',
    sponsor: 'CareerFoundry',
    amountLabel: 'Up to $2,500 for Portfolio Review',
    supportAmount: 2500,
    description: 'Supports portfolio building, mock interviews, and final assessments.',
    usagePercent: 42,
    usageLabel: '42% used',
    recommendation: '70% Recommended',
    eligibilityLabel: 'Eligible for Skills Fund',
    actionLabel: 'Apply Now',
    secondaryActionLabel: 'Request Support',
    rating: 5,
    accent: 'sky',
  },
  {
    id: 'apprenticeship-support-pack',
    tab: 'apprenticeships',
    title: 'Apprenticeship Support Pack',
    organisation: 'FutureWorks',
    sponsor: 'FutureWorks',
    amountLabel: 'Monthly stipend and tools allowance',
    supportAmount: 1800,
    description: 'Bridges learners into work-based training with stipends and support.',
    usagePercent: 28,
    usageLabel: '28% used',
    recommendation: '66% Recommended',
    eligibilityLabel: 'Eligible for Skills Fund',
    actionLabel: 'Apply Now',
    secondaryActionLabel: 'Request Support',
    rating: 4,
    accent: 'blue',
  },
];

const sharedTrackerEntries: SkillsFundTrackerEntry[] = [
  {
    id: 'tracker-google',
    title: 'Google Skills Bursary',
    amount: '$3,000',
    source: 'GlsdreSiiES',
    icon: CircleDollarSign,
    iconTone: 'blue',
  },
  {
    id: 'tracker-local',
    title: 'Local Skills Grant',
    amount: '$1,000',
    source: 'Buonittee @ 2.6',
    icon: Landmark,
    iconTone: 'amber',
  },
  {
    id: 'tracker-women',
    title: 'Women in Tech Bursary',
    amount: '$1,000',
    source: 'Experience',
    icon: Medal,
    iconTone: 'violet',
  },
];

const sharedActivityEntries: SkillsFundActivityEntry[] = [
  {
    id: 'aws-certification',
    title: 'Paid for AWS Certification',
    amount: 'Ksh 10,000',
    date: 'Mar 12',
    icon: ShieldCheck,
    iconTone: 'green',
  },
  {
    id: 'data-course',
    title: 'Data Analytics Course',
    amount: 'Ksh 5,000',
    date: 'Feb 28',
    icon: GraduationCap,
    iconTone: 'blue',
  },
  {
    id: 'cisco-voucher',
    title: 'Cisco Exam Voucher',
    amount: 'Ksh 3,000',
    date: 'Feb 10',
    icon: BriefcaseBusiness,
    iconTone: 'violet',
  },
];

const sharedResources: SkillsFundResource[] = [
  {
    id: 'winning-application',
    title: 'How to Write a Winning Application',
    icon: FileText,
  },
  {
    id: 'career-portfolio',
    title: 'Building a Career Portfolio',
    icon: WalletCards,
  },
  {
    id: 'online-courses',
    title: 'Free Online Courses',
    icon: Building2,
  },
];

const sharedBottomCards: SkillsFundMiniCard[] = [
  {
    id: 'mini-google',
    title: 'Google Skills Bursary',
    subtitle: 'Bursary received',
    amount: 'Ksh 10,000 used',
    progressPercent: 50,
    progressLabel: '50%',
    actionLabel: 'Apply Now',
    rating: 4,
    chips: ['Ksh 1,450', 'Health Insurance'],
    accent: 'blue',
  },
  {
    id: 'mini-career-workshop',
    title: 'Career Workshop',
    subtitle: 'Course Payment',
    amount: 'Ksh 2,500 used',
    progressPercent: 25,
    progressLabel: '25%',
    actionLabel: 'Apply Now',
    rating: 1,
    chips: ['Skills Fund Payout', 'Ksh 250'],
    accent: 'sky',
  },
];

export function getSkillsFundContent(
  role: SkillsFundRole,
  profileName: string
): SkillsFundContent {
  return {
    title: 'Skills Funding Hub',
    profileName,
    tabs: [
      { id: 'bursaries', label: 'Bursaries', count: 6 },
      { id: 'sponsorships', label: 'Sponsorships', count: 4 },
      { id: 'scholarships', label: 'Scholarships', count: 3 },
      { id: 'apprenticeships', label: 'Apprenticeships', count: 2 },
    ],
    filterCount: 8,
    matchedScore: 9988,
    opportunities:
      role === 'instructor'
        ? [
            sharedOpportunities[0],
            sharedOpportunities[1],
            sharedOpportunities[3],
            sharedOpportunities[5],
            sharedOpportunities[2],
            sharedOpportunities[4],
          ]
        : sharedOpportunities,
    trackerEntries: sharedTrackerEntries,
    walletTitle: 'Skills Fund Wallet',
    walletBalance: role === 'instructor' ? 'Ksh 28,000' : 'Ksh 20,000',
    walletSubtitle:
      role === 'instructor' ? 'Available for mentoring and training' : 'Available',
    walletUtilizationLabel: role === 'instructor' ? '48% Used' : '40% Used',
    walletUtilizationPercent: role === 'instructor' ? 48 : 40,
    walletRemaining: role === 'instructor' ? 'Ksh 18,000 remaining' : 'Ksh 30,000 remaining',
    walletActionLabel: role === 'instructor' ? 'Apply for Facilitation' : 'Apply for Support',
    walletSecondaryActionLabel: 'View Full Wallet',
    activityEntries: sharedActivityEntries,
    resources: sharedResources,
    bottomCards: sharedBottomCards,
  };
}
