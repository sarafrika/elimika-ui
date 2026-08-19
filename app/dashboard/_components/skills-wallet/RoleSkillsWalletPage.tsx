'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BadgeCheck,
  Briefcase,
  GraduationCap,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  UploadCloud,
} from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import { toast } from 'sonner';

import type { VerifiedSkillsRole } from '@/app/dashboard/_components/my-skills/verified-skills/types';
import { useVerifiedSkillsContent } from '@/app/dashboard/_components/skills-wallet/live-data';
import { SkillsWalletAchievementsTab } from '@/app/dashboard/student/skills-wallet/_components/SkillsWalletAchievementsTab';
import { SkillsWalletCompetenciesTab } from '@/app/dashboard/student/skills-wallet/_components/SkillsWalletCompetenciesTab';
import { SkillsWalletCredentialsVaultTab } from '@/app/dashboard/student/skills-wallet/_components/SkillsWalletCredentialsVaultTab';
import { SkillsWalletExperienceTab } from '@/app/dashboard/student/skills-wallet/_components/SkillsWalletExperienceTab';
import { SkillsWalletMySkillsTab } from '@/app/dashboard/student/skills-wallet/_components/SkillsWalletMySkillsTab';
import { SkillsWalletOverviewTab } from '@/app/dashboard/student/skills-wallet/_components/SkillsWalletOverviewTab';
import { SkillsWalletPortfolioTab } from '@/app/dashboard/student/skills-wallet/_components/SkillsWalletPortfolioTab';
import type {
  AchievementRecord,
  CompetencyRecord,
  CredentialRecord,
  ExperienceRecord,
  PortfolioRecord,
  SkillsWalletData,
  VerificationEventRecord,
} from '@/app/dashboard/student/skills-wallet/_components/SkillsWalletShared';
import { WalletIdCard } from '@/app/dashboard/student/skills-wallet/_components/SkillsWalletShared';
import { SkillsWalletTabs } from '@/app/dashboard/student/skills-wallet/_components/SkillsWalletTabs';
import { SkillsWalletVerficationTab } from '@/app/dashboard/student/skills-wallet/_components/SkillsWalletVerficationTab';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useUserProfile } from '@/context/profile-context';
import { extractPage } from '@/lib/api-helpers';
import { STALE_TIMES } from '@/lib/query-client';
import {
  addCourseCreatorExperienceMutation,
  addInstructorExperienceMutation,
  getCourseCreatorDocumentsQueryKey,
  getCourseCreatorEducationOptions,
  getCourseCreatorExperienceOptions,
  getCourseCreatorExperienceQueryKey,
  getCourseCreatorMembershipsOptions,
  getInstructorDocumentsQueryKey,
  getInstructorEducationOptions,
  getInstructorExperienceOptions,
  getInstructorExperienceQueryKey,
  getInstructorMembershipsOptions,
  listDocumentTypesOptions,
  uploadCourseCreatorDocumentMutation,
  uploadInstructorDocumentMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  Certificate,
  CourseCreatorExperience,
  DocumentTypeOption,
  InstructorEducation,
  InstructorExperience,
  InstructorProfessionalMembership
} from '@/services/client/types.gen';

export type SkillsWalletRole = Extract<VerifiedSkillsRole, 'instructor' | 'course_creator'>;

type RoleSkillsWalletPageProps = {
  role: SkillsWalletRole;
};

type WalletExperience = InstructorExperience | CourseCreatorExperience;

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'skills', label: 'My Skills', icon: Sparkles },
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
  { id: 'credentials', label: 'Credentials Vault', icon: ShieldCheck },
  { id: 'competencies', label: 'Competencies', icon: Target },
  { id: 'experience', label: 'Experience', icon: GraduationCap },
  { id: 'achievements', label: 'Achievements', icon: Trophy },
  { id: 'verification', label: 'Verification', icon: BadgeCheck },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function getRoleLabel(role: SkillsWalletRole) {
  return role === 'instructor' ? 'Instructor' : 'Course creator';
}

export function getRoleWalletId(role: SkillsWalletRole, uuid?: string) {
  if (!uuid) return `${role.toUpperCase()}-WALLET`;
  return `${role === 'instructor' ? 'INS' : 'CCR'}-${uuid.slice(0, 8).toUpperCase()}`;
}

function formatDate(value?: Date | string | null) {
  if (!value) return 'Recently';
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Recently';
  return parsed.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function formatLongDate(value?: Date | string | null) {
  if (!value) return '—';
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function scoreToLevel(score: number) {
  if (score >= 75) return 'Advanced';
  if (score >= 50) return 'Intermediate';
  return 'Beginner';
}

function getCertificationStatus(status?: string | null) {
  const normalized = (status ?? '').toLowerCase();
  if (normalized.includes('pending')) return 'Pending' as const;
  if (normalized.includes('expired') || normalized.includes('reject')) return 'Expired' as const;
  return 'Verified' as const;
}

function inferExperienceCategory(exp: WalletExperience): ExperienceRecord['category'] {
  const text = `${exp.position} ${exp.organisation_name} ${exp.responsibilities ?? ''}`.toLowerCase();
  if (text.includes('intern')) return 'internship';
  if (text.includes('volunteer') || text.includes('mentor')) return 'volunteer';
  if (text.includes('project') || text.includes('portfolio') || text.includes('course')) return 'project';
  return 'work';
}

function mapExperiences(experiences: WalletExperience[], role: SkillsWalletRole): ExperienceRecord[] {
  return experiences.map((exp, index) => ({
    id: exp.uuid ?? `${role}-experience-${index}`,
    role: exp.position,
    org: exp.organisation_name,
    start_date: formatDate(exp.start_date),
    end_date: exp.is_current_position ? null : formatDate(exp.end_date),
    is_current: Boolean(exp.is_current_position),
    description: exp.responsibilities || `${exp.position} at ${exp.organisation_name}`,
    tags: [role === 'instructor' ? 'Teaching' : 'Course creation', String(exp.years_of_experience ?? 'Experience')],
    category: inferExperienceCategory(exp),
    sort_order: index,
  }));
}

function mapPortfolio(experiences: ExperienceRecord[], role: SkillsWalletRole): PortfolioRecord[] {
  return experiences.slice(0, 6).map((experience, index) => ({
    id: `${experience.id}-portfolio`,
    title: experience.role,
    tag: role === 'instructor' ? 'Teaching history' : 'Curriculum history',
    description: experience.description,
    // views: 84 + index * 18,
    // likes: 12 + index * 4,
    views: 0,
    likes: 0,
    project_date: experience.start_date,
    featured: index === 0 || experience.is_current,
  }));
}

function mapCredentials(credentials: Array<{ id: string; title: string; issuer: string; status: string; documentLabel: string; metadata?: string; timestamp?: number }>): CredentialRecord[] {
  return credentials.map(item => ({
    id: item.id,
    name: item.title,
    org: item.issuer,
    issued_at: item.timestamp ? new Date(item.timestamp).toISOString() : new Date().toISOString(),
    credential_code: item.documentLabel,
    status: getCertificationStatus(item.status),
    source: 'platform',
  }));
}

function mapCompetencies(categories: NonNullable<ReturnType<typeof useVerifiedSkillsContent>['categories']>) {
  return categories.flatMap(category =>
    category.records.slice(0, 2).map((record, index) => ({
      id: `${category.id}-${index}`,
      competency: record.title,
      skill: category.title,
      level: category.level,
      level_num: category.level,
      pct: category.score,
      evidence_count: 1,
      last_updated: formatDate(record.timestamp ? new Date(record.timestamp) : null),
      course_id: null,
      assessment_id: null,
      badge: record.status,
      source: record.recordKind === 'experience' ? 'class' : 'assessment',
      course_title: record.recordSummary ?? record.title,
      class_title: null,
    }))
  ) as CompetencyRecord[];
}

function mapVerificationEvents(
  timeline: ReturnType<typeof useVerifiedSkillsContent>['credentialsContent']['timeline']
): VerificationEventRecord[] {
  return timeline.map((item, index) => ({
    id: item.id,
    source:
      item.recordKind === 'experience'
        ? 'instructor_evaluation'
        : item.recordKind === 'membership'
          ? 'competition'
          : 'assessment',
    title: item.title,
    skill: item.provider,
    change: item.recordSummary ?? item.metadata ?? item.badge,
    date: item.timestamp ? new Date(item.timestamp).toISOString() : new Date().toISOString(),
    status: item.badge.toLowerCase().includes('pend') ? 'pending' : 'verified',
  }));
}

function mapAchievements({
  role,
  profileName,
  skills,
  credentials,
  experiences,
  verificationEvents,
}: {
  role: SkillsWalletRole;
  profileName: string;
  skills: SkillsWalletData['skills'];
  credentials: CredentialRecord[];
  experiences: ExperienceRecord[];
  verificationEvents: VerificationEventRecord[];
}): AchievementRecord[] {
  const verifiedSkills = skills.filter(skill => skill.verified).length;
  const completedExperience = experiences.length;
  const verifiedCredentials = credentials.filter(item => item.status === 'Verified').length;
  const verifiedEvents = verificationEvents.filter(item => item.status === 'verified').length;
  const topSkill = [...skills].sort((a, b) => b.score - a.score)[0];

  return [
    {
      id: `${role}-milestone-1`,
      name: `${getRoleLabel(role)} Momentum`,
      description: `${profileName} has ${verifiedSkills} verified skills connected to the wallet.`,
      points: verifiedSkills * 40,
      achieved_at: verifiedSkills ? new Date().toISOString() : null,
      status: verifiedSkills ? 'Completed' : 'In Progress',
      color_key: 'bg-primary',
      progress: verifiedSkills ? null : 20,
    },
    {
      id: `${role}-milestone-2`,
      name: 'Credential Vault',
      description: `${verifiedCredentials} verified credentials are available in the wallet.`,
      points: verifiedCredentials * 30,
      achieved_at: verifiedCredentials ? new Date().toISOString() : null,
      status: verifiedCredentials ? 'Completed' : 'In Progress',
      color_key: 'bg-success',
      progress: verifiedCredentials ? null : 25,
    },
    {
      id: `${role}-milestone-3`,
      name: `${getRoleLabel(role)} Experience`,
      description: `${completedExperience} experience records showcase your professional journey.`,
      points: completedExperience * 25,
      achieved_at: completedExperience ? new Date().toISOString() : null,
      status: completedExperience ? 'Completed' : 'In Progress',
      color_key: 'bg-warning',
      progress: completedExperience ? null : 35,
    },
    {
      id: `${role}-milestone-4`,
      name: 'Trusted Verification',
      description: `${verifiedEvents} records have been updated from trusted sources.`,
      points: verifiedEvents * 35,
      achieved_at: verifiedEvents ? new Date().toISOString() : null,
      status: verifiedEvents ? 'Completed' : 'In Progress',
      color_key: 'bg-success/70',
      progress: verifiedEvents ? null : 30,
    },
    topSkill
      ? {
        id: `${role}-milestone-5`,
        name: `Top Skill: ${topSkill.name}`,
        description: `Your strongest skill is currently at ${topSkill.score}% proficiency.`,
        points: topSkill.score,
        achieved_at: topSkill.verified ? new Date().toISOString() : null,
        status: topSkill.verified ? 'Completed' : 'In Progress',
        color_key: 'bg-primary/70',
        progress: topSkill.score,
      }
      : {
        id: `${role}-milestone-5`,
        name: 'Top Skill Growth',
        description: 'No skills are connected yet.',
        points: 0,
        achieved_at: null,
        status: 'In Progress',
        color_key: 'bg-warning/70',
        progress: 0,
      },
  ];
}

export function buildRoleWalletData({
  role,
  profileName,
  skillsWalletContent,
  experiences,
}: {
  role: SkillsWalletRole;
  profileName: string;
  skillsWalletContent: ReturnType<typeof useVerifiedSkillsContent>;
  experiences: WalletExperience[];
}): RoleWalletData {
  const skills = skillsWalletContent.skills;
  const credentialsByTab = skillsWalletContent.credentialsContent.credentialsByTab;
  const credentialItems = credentialsByTab.all;
  const mappedExperiences = mapExperiences(experiences, role);
  const verificationEvents = mapVerificationEvents(skillsWalletContent.credentialsContent.timeline);
  const achievements = mapAchievements({
    role,
    profileName,
    skills,
    credentials: mapCredentials(
      credentialItems.map(item => ({
        id: item.id,
        title: item.title,
        issuer: item.issuer,
        status: item.status,
        documentLabel: item.documentLabel,
        metadata: item.metadata,
        timestamp: item.timestamp,
      }))
    ),
    experiences: mappedExperiences,
    verificationEvents,
  });
  const topSkills = [...skills].sort((a, b) => b.proficiency_pct - a.proficiency_pct).slice(0, 5);
  const averageScore = skills.length
    ? Math.round(skills.reduce((sum, skill) => sum + skill.proficiency_pct, 0) / skills.length)
    : 0;
  const verifiedSkillsCount = skills.filter(skill => skill.proficiency_pct >= 70).length;
  const skillsThisMonth = skillsWalletContent.credentialsContent.timeline.filter(item => {
    if (!item.timestamp) return false;
    const date = new Date(item.timestamp);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  return {
    skills,
    overviewMetrics: {
      skillsProgress: averageScore,
      verifiedSkills: verifiedSkillsCount,
      newSkillsThisMonth: skillsThisMonth,
      totalSkills: skills.length,
      completedSkills: verifiedSkillsCount,
      activeSkills: skills.filter(skill => skill.proficiency_pct > 0 && skill.proficiency_pct < 100).length,
      courseEnrollments: experiences.length,
      classEnrollments: mappedExperiences.length,
    },
    topSkills,
    competencies: mapCompetencies(skillsWalletContent.categories),
    levelBreakdown: [
      { name: 'Beginner', count: skills.filter(skill => scoreToLevel(skill.proficiency_pct) === 'Beginner').length },
      { name: 'Intermediate', count: skills.filter(skill => scoreToLevel(skill.proficiency_pct) === 'Intermediate').length },
      { name: 'Advanced', count: skills.filter(skill => scoreToLevel(skill.proficiency_pct) === 'Advanced').length },
    ],
    categoryCounts: Object.entries(
      skills.reduce<Record<string, number>>((acc, skill) => {
        acc[skill.category] = (acc[skill.category] ?? 0) + 1;
        return acc;
      }, {})
    ).map(([name, count]) => ({
      name,
      count,
      colorClass: name.toLowerCase().includes('design')
        ? 'bg-secondary'
        : name.toLowerCase().includes('data')
          ? 'bg-primary'
          : name.toLowerCase().includes('cloud')
            ? 'bg-success'
            : 'bg-warning',
    })),
    credentials: mapCredentials(
      credentialItems.map(item => ({
        id: item.id,
        title: item.title,
        issuer: item.issuer,
        status: item.status,
        documentLabel: item.documentLabel,
        metadata: item.metadata,
        timestamp: item.timestamp,
      }))
    ),
    externalCertificates: [],
    portfolio: mapPortfolio(mappedExperiences, role),
    certificates: Array.from(
      { length: credentialsByTab.certificates.length },
      (_, index) => ({ uuid: `${role}-certificate-${index}` } as Certificate)
    ),
    studentName: profileName,
    experiences: mappedExperiences,
    achievements,
    verificationEvents,
  };
}

export type RoleWalletData = SkillsWalletData & {
  experiences: ExperienceRecord[];
  achievements: AchievementRecord[];
  verificationEvents: VerificationEventRecord[];
};

function useProfileUuid(role: SkillsWalletRole) {
  const profile = useUserProfile();
  return role === 'instructor' ? profile?.instructor?.uuid : profile?.courseCreator?.uuid;
}

function AddExperienceDialog({
  role,
  profileUuid,
  open,
  onOpenChange,
  onSaved,
}: {
  role: SkillsWalletRole;
  profileUuid?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const queryClient = useQueryClient();
  const addInstructorExperience = useMutation(addInstructorExperienceMutation());
  const addCourseCreatorExperience = useMutation(addCourseCreatorExperienceMutation());
  const mutation = role === 'instructor' ? addInstructorExperience : addCourseCreatorExperience;
  const [draft, setDraft] = useState({
    position: '',
    organisation_name: '',
    responsibilities: '',
    years_of_experience: '',
    start_date: '',
    end_date: '',
    is_current_position: false,
  });

  const reset = () =>
    setDraft({
      position: '',
      organisation_name: '',
      responsibilities: '',
      years_of_experience: '',
      start_date: '',
      end_date: '',
      is_current_position: false,
    });

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profileUuid) return;

    const payload =
      role === 'instructor'
        ? {
          instructor_uuid: profileUuid,
          position: draft.position.trim(),
          organisation_name: draft.organisation_name.trim(),
          responsibilities: draft.responsibilities.trim() || undefined,
          years_of_experience: draft.years_of_experience ? Number(draft.years_of_experience) : undefined,
          start_date: draft.start_date ? new Date(draft.start_date) : undefined,
          end_date: draft.is_current_position || !draft.end_date ? undefined : new Date(draft.end_date),
          is_current_position: draft.is_current_position,
        }
        : {
          course_creator_uuid: profileUuid,
          position: draft.position.trim(),
          organisation_name: draft.organisation_name.trim(),
          responsibilities: draft.responsibilities.trim() || undefined,
          years_of_experience: draft.years_of_experience ? Number(draft.years_of_experience) : undefined,
          start_date: draft.start_date ? new Date(draft.start_date) : undefined,
          end_date: draft.is_current_position || !draft.end_date ? undefined : new Date(draft.end_date),
          is_current_position: draft.is_current_position,
        };

    const response = await mutation.mutateAsync({
      path:
        role === 'instructor'
          ? { instructorUuid: profileUuid }
          : { courseCreatorUuid: profileUuid },
      body: payload,
    } as never);

    if (response) {
      const queryKey =
        role === 'instructor'
          ? getInstructorExperienceQueryKey({ path: { instructorUuid: profileUuid }, query: { pageable: { page: 0, size: 200 } } })
          : getCourseCreatorExperienceQueryKey({ path: { courseCreatorUuid: profileUuid }, query: { pageable: { page: 0, size: 200 } } });
      await queryClient.invalidateQueries({ queryKey });
      toast.success('Experience saved');
      reset();
      onOpenChange(false);
      onSaved();
    }
  };

  return (
    <Dialog open={open} onOpenChange={nextOpen => (nextOpen ? onOpenChange(true) : (reset(), onOpenChange(false)))}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Add experience</DialogTitle>
          <DialogDescription>Record your work history, internships, volunteering and life experiences.</DialogDescription>
        </DialogHeader>
        <form className='grid gap-4 md:grid-cols-2' onSubmit={submit}>
          <div className='space-y-2'>
            <Label htmlFor='position'>Position</Label>
            <Input id='position' value={draft.position} onChange={e => setDraft(current => ({ ...current, position: e.target.value }))} required />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='org'>Organisation</Label>
            <Input id='org' value={draft.organisation_name} onChange={e => setDraft(current => ({ ...current, organisation_name: e.target.value }))} required />
          </div>
          <div className='space-y-2 md:col-span-2'>
            <Label htmlFor='responsibilities'>Responsibilities</Label>
            <Textarea id='responsibilities' rows={4} value={draft.responsibilities} onChange={e => setDraft(current => ({ ...current, responsibilities: e.target.value }))} />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='years'>Years of experience</Label>
            <Input id='years' type='number' min='0' step='0.1' value={draft.years_of_experience} onChange={e => setDraft(current => ({ ...current, years_of_experience: e.target.value }))} />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='start'>Start date</Label>
            <Input id='start' type='date' value={draft.start_date} onChange={e => setDraft(current => ({ ...current, start_date: e.target.value }))} />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='end'>End date</Label>
            <Input id='end' type='date' value={draft.end_date} disabled={draft.is_current_position} onChange={e => setDraft(current => ({ ...current, end_date: e.target.value }))} />
          </div>
          <label className='flex items-center gap-2 text-sm md:col-span-2'>
            <input type='checkbox' checked={draft.is_current_position} onChange={e => setDraft(current => ({ ...current, is_current_position: e.target.checked, end_date: e.target.checked ? '' : current.end_date }))} />
            This is my current position
          </label>
          <DialogFooter className='md:col-span-2'>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type='submit' disabled={mutation.isPending || !profileUuid}>{mutation.isPending ? 'Saving...' : 'Save experience'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddCredentialDialog({
  role,
  profileUuid,
  documentTypes,
  open,
  onOpenChange,
  onSaved,
}: {
  role: SkillsWalletRole;
  profileUuid?: string;
  documentTypes: DocumentTypeOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const queryClient = useQueryClient();
  const uploadInstructorDocument = useMutation(uploadInstructorDocumentMutation());
  const uploadCourseCreatorDocument = useMutation(uploadCourseCreatorDocumentMutation());
  const mutation = role === 'instructor' ? uploadInstructorDocument : uploadCourseCreatorDocument;
  const [draft, setDraft] = useState({
    document_type_uuid: '',
    title: '',
    description: '',
    expiry_date: '',
    file: null as File | null,
    related_kind: 'none',
    related_uuid: '',
  });

  const reset = () =>
    setDraft({
      document_type_uuid: '',
      title: '',
      description: '',
      expiry_date: '',
      file: null,
      related_kind: 'none',
      related_uuid: '',
    });

  // Fetch related records (educations, memberships, experiences) so user can attach a document
  const educationQuery = useQuery({
    ...(role === 'instructor'
      ? getInstructorEducationOptions({ path: { instructorUuid: profileUuid ?? '' } })
      : getCourseCreatorEducationOptions({ path: { courseCreatorUuid: profileUuid ?? '' } })),
    enabled: Boolean(profileUuid),
    staleTime: STALE_TIMES.reference,
  });

  const membershipQuery = useQuery({
    ...(role === 'instructor'
      ? getInstructorMembershipsOptions({ path: { instructorUuid: profileUuid ?? '' }, query: { pageable: { page: 0, size: 200 } } })
      : getCourseCreatorMembershipsOptions({ path: { courseCreatorUuid: profileUuid ?? '' }, query: { pageable: { page: 0, size: 200 } } })),
    enabled: Boolean(profileUuid),
    staleTime: STALE_TIMES.reference,
  });

  const relatedExperienceQuery = useQuery({
    ...(role === 'instructor'
      ? getInstructorExperienceOptions({ path: { instructorUuid: profileUuid ?? '' }, query: { pageable: { page: 0, size: 200 } } })
      : getCourseCreatorExperienceOptions({ path: { courseCreatorUuid: profileUuid ?? '' }, query: { pageable: { page: 0, size: 200 } } })),
    enabled: Boolean(profileUuid),
    staleTime: STALE_TIMES.reference,
  });

  const educations = (educationQuery.data?.data?.content ?? educationQuery.data?.data ?? []) as InstructorEducation[];
  const memberships = (membershipQuery.data?.data?.content ?? membershipQuery.data?.data ?? []) as InstructorProfessionalMembership[];
  const experiences = (relatedExperienceQuery.data?.data?.content ?? relatedExperienceQuery.data?.data ?? []) as InstructorExperience[];

  function RelatedRecordSelector() {
    return (
      <>
        <div className='space-y-2'>
          <Label htmlFor='related_kind'>Attach to</Label>
          <select
            id='related_kind'
            className='border-input bg-background h-10 w-full rounded-md border px-3 text-sm'
            value={draft.related_kind}
            onChange={e => setDraft(current => ({ ...current, related_kind: e.target.value, related_uuid: '' }))}
          >
            <option value='none'>None</option>
            <option value='education'>Education</option>
            <option value='membership'>Membership</option>
            <option value='experience'>Experience</option>
          </select>
        </div>

        {draft.related_kind !== 'none' ? (
          <div className='space-y-2'>
            <Label htmlFor='related_uuid'>Select record</Label>
            <select
              id='related_uuid'
              className='border-input bg-background h-10 w-full rounded-md border px-3 text-sm'
              value={draft.related_uuid}
              onChange={e => setDraft(current => ({ ...current, related_uuid: e.target.value }))}
              required={draft.related_kind !== 'none'}
            >
              <option value=''>Select a record</option>
              {draft.related_kind === 'education' && educations.map(ed => (
                <option key={ed.uuid ?? ed.id} value={ed.uuid ?? ed.id}>
                  {ed.school_name ?? ed.qualification ?? ed.title ?? ed.name ?? ed.uuid}
                </option>
              ))}
              {draft.related_kind === 'membership' && memberships.map(mb => (
                <option key={mb.uuid ?? mb.id} value={mb.uuid ?? mb.id}>
                  {mb.organisation_name ?? mb.name ?? mb.title ?? mb.uuid}
                </option>
              ))}
              {draft.related_kind === 'experience' && experiences.map(ex => (
                <option key={ex.uuid ?? ex.id} value={ex.uuid ?? ex.id}>
                  {ex.position ?? ex.title ?? `${ex.organisation_name ?? ''} ${ex.position ?? ''}`}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </>
    );
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profileUuid || !draft.file || !draft.document_type_uuid) return;

    const response = await mutation.mutateAsync({
      path:
        role === 'instructor'
          ? { instructorUuid: profileUuid }
          : { courseCreatorUuid: profileUuid },
      body: { file: draft.file },
      query: {
        document_type_uuid: draft.document_type_uuid,
        title: draft.title.trim() || undefined,
        description: draft.description.trim() || undefined,
        expiry_date: draft.expiry_date || undefined,
        education_uuid:
          draft.related_kind === 'education'
            ? draft.related_uuid || undefined
            : undefined,
        experience_uuid:
          draft.related_kind === 'experience'
            ? draft.related_uuid || undefined
            : undefined,
        membership_uuid:
          draft.related_kind === 'membership'
            ? draft.related_uuid || undefined
            : undefined,
      },
    } as never);


    if (response) {
      const queryKey =
        role === 'instructor'
          ? getInstructorDocumentsQueryKey({ path: { instructorUuid: profileUuid } })
          : getCourseCreatorDocumentsQueryKey({ path: { courseCreatorUuid: profileUuid } });
      await queryClient.invalidateQueries({ queryKey });
      toast.success('Credential uploaded');
      reset();
      onOpenChange(false);
      onSaved();
    }
  };

  return (
    <Dialog open={open} onOpenChange={nextOpen => (nextOpen ? onOpenChange(true) : (reset(), onOpenChange(false)))}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Add credential</DialogTitle>
          <DialogDescription>Upload a PDF credential or supporting document for your profile.</DialogDescription>
        </DialogHeader>
        <form className='grid gap-4 md:grid-cols-2' onSubmit={submit}>
          <div className='space-y-2 md:col-span-2'>
            <Label htmlFor='file'>Document (PDF, image, Word)</Label>
            <Input
              id='file'
              type='file'
              accept='.pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
              onChange={e => setDraft(current => ({ ...current, file: e.target.files?.[0] ?? null }))}
              required
            />
          </div>

          {/* Related record selector: education / membership / experience */}
          <RelatedRecordSelector />


          <div className='space-y-2'>
            <Label htmlFor='document_type_uuid'>Document type</Label>
            <select
              id='document_type_uuid'
              className='border-input bg-background h-10 w-full rounded-md border px-3 text-sm'
              value={draft.document_type_uuid}
              onChange={e => setDraft(current => ({ ...current, document_type_uuid: e.target.value }))}
              required
            >
              <option value='' disabled>
                Select a document type
              </option>
              {(() => {
                const prefs = ['pdf', 'image', 'word', 'doc', 'docx', 'png', 'jpg', 'jpeg'];
                const sorted = [...documentTypes].sort((a, b) => {
                  const aText = (a.name ?? a.description ?? '').toLowerCase();
                  const bText = (b.name ?? b.description ?? '').toLowerCase();
                  const aScore = prefs.findIndex(p => aText.includes(p)) === -1 ? 1 : 0;
                  const bScore = prefs.findIndex(p => bText.includes(p)) === -1 ? 1 : 0;
                  if (aScore !== bScore) return aScore - bScore;
                  return (aText > bText) ? 1 : -1;
                });
                return sorted.map(type => (
                  <option key={type.uuid} value={type.uuid ?? ''}>
                    {type.name ?? type.description ?? 'Document type'}
                  </option>
                ));
              })()}
            </select>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='expiry_date'>Expiry date</Label>
            <Input id='expiry_date' type='date' value={draft.expiry_date} onChange={e => setDraft(current => ({ ...current, expiry_date: e.target.value }))} />
          </div>
          <div className='space-y-2 md:col-span-2'>
            <Label htmlFor='title'>Title</Label>
            <Input id='title' value={draft.title} onChange={e => setDraft(current => ({ ...current, title: e.target.value }))} required />
          </div>
          <div className='space-y-2 md:col-span-2'>
            <Label htmlFor='description'>Description</Label>
            <Textarea id='description' rows={4} value={draft.description} onChange={e => setDraft(current => ({ ...current, description: e.target.value }))} required />
          </div>
          <DialogFooter className='md:col-span-2'>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type='submit' disabled={mutation.isPending || !profileUuid}>
              <UploadCloud className='mr-2 size-4' />
              {mutation.isPending ? 'Uploading...' : 'Upload credential'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RoleSkillsWalletPage({ role }: RoleSkillsWalletPageProps) {
  const profileUuid = useProfileUuid(role);
  const profile = useUserProfile();
  const roleProfile = role === 'instructor' ? profile?.instructor : profile?.courseCreator;
  const profileName =
    profile?.full_name ||
    (roleProfile as Record<string, unknown> | undefined)?.full_name?.toString() ||
    (role === 'instructor' ? 'Instructor Profile' : 'Course Creator Profile');

  const verifiedSkillsContent = useVerifiedSkillsContent(role);
  const experienceQuery = useQuery({
    ...(role === 'instructor'
      ? getInstructorExperienceOptions({
        path: { instructorUuid: profileUuid ?? '' },
        query: { pageable: { page: 0, size: 200 } },
      })
      : getCourseCreatorExperienceOptions({
        path: { courseCreatorUuid: profileUuid ?? '' },
        query: { pageable: { page: 0, size: 200 } },
      })),
    enabled: Boolean(profileUuid),
    staleTime: STALE_TIMES.entity,
  });
  const documentTypesQuery = useQuery({
    ...listDocumentTypesOptions(),
    enabled: Boolean(profileUuid),
    staleTime: STALE_TIMES.reference,
  });

  const [tab, setTab] = useState<TabId>('overview');
  const [experienceOpen, setExperienceOpen] = useState(false);
  const [credentialOpen, setCredentialOpen] = useState(false);

  const experiences = extractPage<WalletExperience>(experienceQuery.data).items;
  const documentTypes = (documentTypesQuery.data?.data ?? []) as DocumentTypeOption[];

  const data = useMemo(
    () => buildRoleWalletData({
      role,
      profileName,
      skillsWalletContent: verifiedSkillsContent,
      experiences,
    }),
    [experiences, profileName, role, verifiedSkillsContent]
  );

  const credentialData = {
    credentials: data.credentials,
    externalCertificates: data.externalCertificates,
    studentName: profileName,
  };

  return (
    <div className='min-h-screen'>
      <div className='border-b'>
        <div className='mx-auto px-4 py-5'>
          <div className='flex flex-row items-center justify-between'>
            <div>
              <h1 className='text-foreground text-2xl font-bold'>Skills Wallet</h1>
              <p className='text-muted-foreground text-sm'>
                Your verified record of skills, competencies, achievements and credentials.
              </p>
            </div>
            <WalletIdCard
              label={`${getRoleLabel(role)} Wallet ID`}
              walletId={getRoleWalletId(role, profileUuid)}
            />
          </div>

          <SkillsWalletTabs tabs={TABS} activeTab={tab} onTabChange={value => setTab(value as TabId)} />
        </div>
      </div>

      <div className='mx-auto px-4 py-6'>
        {tab === 'overview' ? (
          <SkillsWalletOverviewTab data={data} onNavigateToTab={value => setTab(value as TabId)} />
        ) : null}
        {tab === 'skills' ? <SkillsWalletMySkillsTab data={data} /> : null}
        {tab === 'portfolio' ? <SkillsWalletPortfolioTab data={data} /> : null}
        {tab === 'credentials' ? (
          <SkillsWalletCredentialsVaultTab
            data={credentialData}
            onAddCredential={() => setCredentialOpen(true)}
          />
        ) : null}
        {tab === 'competencies' ? <SkillsWalletCompetenciesTab data={data} /> : null}
        {tab === 'experience' ? (
          <SkillsWalletExperienceTab
            experiences={data.experiences}
            title={`${getRoleLabel(role)} Experience`}
            onAddExperience={() => setExperienceOpen(true)}
          />
        ) : null}
        {tab === 'achievements' ? (
          <SkillsWalletAchievementsTab
            achievements={data.achievements}
            title='Achievements'
            description={
              role === 'instructor'
                ? 'Track your milestones, teaching progress, and profile verification.'
                : 'Track your milestones, course creation progress, and profile verification.'
            }
          />
        ) : null}
        {tab === 'verification' ? (
          <SkillsWalletVerficationTab
            events={data.verificationEvents}
            title='Verification'
            description='Automatically updated after trusted profile records are completed.'
            onAddProof={() => setCredentialOpen(true)}
          />
        ) : null}
      </div>

      <Separator />

      <AddExperienceDialog
        role={role}
        profileUuid={profileUuid}
        open={experienceOpen}
        onOpenChange={setExperienceOpen}
        onSaved={() => {
          void experienceQuery.refetch();
        }}
      />

      <AddCredentialDialog
        role={role}
        profileUuid={profileUuid}
        documentTypes={documentTypes}
        open={credentialOpen}
        onOpenChange={setCredentialOpen}
        onSaved={() => undefined}
      />
    </div>
  );
}
