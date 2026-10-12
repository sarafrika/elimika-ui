import {
  BadgeCheck,
  BookOpen,
  Building2,
  GraduationCap,
  type LucideIcon,
  MonitorPlay,
  ShieldCheck,
  UserRound,
  Users,
  Wallet,
} from 'lucide-react';
import type {
  OnboardingAccountType,
  RegisterableDomain,
  RoleDraft,
} from '@/src/features/onboarding/lib/user-onboarding';

export type AccountTypeOption = {
  id: OnboardingAccountType;
  name: string;
  detail: string;
  access: 'instant' | 'review' | 'invited';
  icon: LucideIcon;
};

export const ACCOUNT_TYPE_OPTIONS: AccountTypeOption[] = [
  {
    id: 'course_creator',
    name: 'Course Creator',
    detail: 'Design and publish courses to the Elimika catalogue.',
    access: 'review',
    icon: BookOpen,
  },
  {
    id: 'instructor',
    name: 'Instructor',
    detail: 'Deliver live classes and get hired by organisations.',
    access: 'review',
    icon: MonitorPlay,
  },
  {
    id: 'student',
    name: 'Student',
    detail: 'Enrol in courses and learn at your own pace.',
    access: 'instant',
    icon: GraduationCap,
  },
  {
    id: 'organisation_user',
    name: 'Organisation',
    detail: 'Manage learning programmes, branches and instructors.',
    access: 'review',
    icon: Building2,
  },
  {
    id: 'parent',
    name: 'Parent',
    detail: "Support your child's learning and give consent.",
    access: 'invited',
    icon: Users,
  },
];

export const ACCESS_LABEL: Record<AccountTypeOption['access'], string> = {
  instant: 'Instant access',
  review: 'Admin review',
  invited: 'Invited by your child',
};

type RoleCopy = {
  label: string;
  detailsStep: string;
  detailsTitle: string;
  detailsDescription: string;
  next: string;
  perks: { title: string; detail: string }[];
};

export const ROLE_COPY: Record<RegisterableDomain, RoleCopy> = {
  course_creator: {
    label: 'Course Creator',
    detailsStep: 'Categories',
    detailsTitle: 'Categories',
    detailsDescription: 'Pick the categories you will create courses in.',
    next: 'Next: your categories, profile and skills wallet, then an admin reviews your profile.',
    perks: [
      { title: 'Publish your courses', detail: 'Build courses and list them in the catalogue.' },
      {
        title: 'Reach organisations',
        detail: 'Organisations can apply to run your courses at their branches.',
      },
      {
        title: 'Get a verified profile',
        detail: 'Your skills and credentials, checked by Elimika.',
      },
    ],
  },
  instructor: {
    label: 'Instructor',
    detailsStep: 'Profile & location',
    detailsTitle: 'Profile and location',
    detailsDescription: 'Organisations see this when they look for instructors near them.',
    next: 'Next: your profile, teaching location and skills wallet, then an admin reviews it.',
    perks: [
      { title: 'Get hired for classes', detail: 'Organisations near you can find and hire you.' },
      { title: 'Set your own rates', detail: 'Publish a rate card for the classes you teach.' },
      {
        title: 'Get a verified profile',
        detail: 'Your skills and credentials, checked by Elimika.',
      },
    ],
  },
  student: {
    label: 'Student',
    detailsStep: 'Learner profile',
    detailsTitle: 'Learner profile',
    detailsDescription: 'A few details so we can set up your learning account.',
    next: 'Next: a short learner profile, then you can start learning. No review needed.',
    perks: [
      { title: 'Enrol in courses', detail: 'Join courses and live classes from the catalogue.' },
      { title: 'Build your skills wallet', detail: 'Keep a verified record of what you learn.' },
      { title: 'Earn certificates', detail: 'Complete courses and collect your certificates.' },
    ],
  },
  organisation_user: {
    label: 'Organisation',
    detailsStep: 'Organisation',
    detailsTitle: 'Organisation details',
    detailsDescription: 'We verify the organisation and its documents before it goes live.',
    next: 'Next: organisation details and documents, then an admin verifies them.',
    perks: [
      { title: 'Run programmes', detail: 'Offer courses and classes across your branches.' },
      {
        title: 'Hire instructors',
        detail: 'Find verified instructors and assign them to classes.',
      },
      { title: 'Enrol learners', detail: 'Invite students and track their progress.' },
    ],
  },
};

export type WizardStep = { label: string; icon: LucideIcon };

export function wizardSteps(domain: RegisterableDomain | ''): WizardStep[] {
  return [
    { label: 'Sarafrika account', icon: BadgeCheck },
    { label: 'Account type', icon: UserRound },
    { label: domain ? ROLE_COPY[domain].detailsStep : 'Categories', icon: BookOpen },
    { label: 'Skills wallet', icon: Wallet },
    { label: domain === 'student' ? 'Get started' : 'Submit for review', icon: ShieldCheck },
  ];
}

/** Under 18 on the learner's date of birth; minors need a guardian before they can start. */
export function isMinor(dob: string | Date | undefined | null, now = new Date()) {
  if (!dob) return false;
  const born = typeof dob === 'string' ? new Date(`${dob.slice(0, 10)}T00:00:00Z`) : dob;
  if (!Number.isFinite(born.getTime())) return false;
  const eighteenth = new Date(born);
  eighteenth.setUTCFullYear(born.getUTCFullYear() + 18);
  return eighteenth > now;
}

export type Requirement = { key: string; label: string; required: boolean; done: boolean };

export type RequirementContext = {
  minor: boolean;
  /** Skills already saved on the account, counted alongside the ones in the draft. */
  savedSkills: number;
  requiredDocuments: number;
  providedDocuments: number;
};

/** What each account type needs before it can be submitted, mirroring the backend's steps. */
export function roleRequirements(
  domain: RegisterableDomain,
  role: RoleDraft,
  context: RequirementContext
): Requirement[] {
  const profileDone = Boolean(role.headline.trim() && role.bio.trim());
  const skillDone = role.skills.length + context.savedSkills > 0;
  const account = { key: 'account', label: 'Your account details', required: true, done: true };
  switch (domain) {
    case 'course_creator':
      return [
        account,
        {
          key: 'categories',
          label: 'At least one category',
          required: true,
          done: role.categories.length > 0,
        },
        { key: 'profile', label: 'Headline and short bio', required: true, done: profileDone },
        { key: 'skills', label: 'At least one skill', required: true, done: skillDone },
      ];
    case 'instructor':
      return [
        account,
        { key: 'profile', label: 'Headline and short bio', required: true, done: profileDone },
        {
          key: 'location',
          label: 'Where you teach',
          required: true,
          done: Boolean(role.location_name.trim()),
        },
        { key: 'skills', label: 'At least one skill', required: true, done: skillDone },
      ];
    case 'student':
      return [
        account,
        {
          key: 'guardians',
          label: context.minor ? 'A parent or guardian' : 'A parent or guardian (under 18 only)',
          required: context.minor,
          done: role.guardians.some(g => g.name.trim() && g.email.trim()),
        },
        { key: 'skills', label: 'Skills', required: false, done: skillDone },
      ];
    case 'organisation_user':
      return [
        account,
        {
          key: 'organisation',
          label: 'Organisation name and location',
          required: true,
          done: Boolean(
            role.organisation.name.trim() &&
              (role.organisation.location.trim() || role.organisation.country.trim())
          ),
        },
        {
          key: 'documents',
          label: 'Registration documents',
          required: true,
          done: context.providedDocuments >= context.requiredDocuments,
        },
      ];
  }
}

/** The list shown on the Account type step, before anything is filled in. */
export const ROLE_NEEDS: Record<OnboardingAccountType, { label: string; required: boolean }[]> = {
  course_creator: [
    { label: 'Categories you will create courses in', required: true },
    { label: 'Headline and short bio', required: true },
    { label: 'At least one skill', required: true },
    { label: 'Education, experience and credentials', required: false },
  ],
  instructor: [
    { label: 'Headline and short bio', required: true },
    { label: 'Where you teach', required: true },
    { label: 'At least one skill', required: true },
    { label: 'Education, experience and credentials', required: false },
  ],
  student: [
    { label: 'A parent or guardian, if you are under 18', required: true },
    { label: 'Skills and interests', required: false },
  ],
  organisation_user: [
    { label: 'Organisation name and location', required: true },
    { label: 'Registration documents (PDF or image)', required: true },
  ],
  parent: [{ label: 'An invitation from your child’s learner account', required: true }],
};
