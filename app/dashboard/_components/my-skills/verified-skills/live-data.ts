'use client';

import { createElement, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Award,
  BadgeCheck,
  BriefcaseBusiness,
  GraduationCap,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import { buildCredentialsContent } from '@/components/profile-credentials/live-data';
import { useUserProfile } from '@/context/profile-context';
import type { UserProfileType } from '@/lib/types';
import type {
  SharedCredentialSummary,
  SharedSkill,
  SharedTimelineItem,
} from '../types';
import type {
  Certificate,
  CourseCreatorDocumentDto,
  CourseCreatorEducation,
  CourseCreatorExperience,
  CourseCreatorProfessionalMembership,
  DocumentTypeOption,
  InstructorDocument,
  InstructorEducation,
  InstructorExperience,
  InstructorProfessionalMembership,
} from '@/services/client';
import {
  getCourseCreatorDocumentsOptions,
  getCourseCreatorEducationOptions,
  getCourseCreatorExperienceOptions,
  getCourseCreatorMembershipsOptions,
  getInstructorDocumentsOptions,
  getInstructorEducationOptions,
  getInstructorExperienceOptions,
  getInstructorMembershipsOptions,
  getStudentCertificatesOptions,
  listDocumentTypesOptions,
} from '@/services/client/@tanstack/react-query.gen';

import type {
  SuggestedSkill,
  VerifiedSkill,
  VerifiedSkillCategory,
  VerifiedSkillGroup,
  VerifiedSkillLevel,
  VerifiedSkillsContent,
  VerifiedSkillsRole,
  VerifiedSkillRecord,
} from './types';

const PAGEABLE = { page: 0, size: 200, sort: ['desc'] };

type LiveCredentialItem = ReturnType<typeof buildCredentialsContent>['credentialsByTab']['all'][number];

function inferRole(profile: UserProfileType | undefined, role?: VerifiedSkillsRole) {
  if (role) return role;
  if (profile?.student) return 'student';
  if (profile?.courseCreator) return 'course_creator';
  return 'instructor';
}

function getRoleProfile(profile: UserProfileType | undefined, role: VerifiedSkillsRole) {
  if (role === 'student') return profile?.student;
  if (role === 'course_creator') return profile?.courseCreator;
  return profile?.instructor;
}

function isVerifiedItem(item: LiveCredentialItem) {
  return item.status.toLowerCase().includes('verified');
}

function parseNumericScore(item: LiveCredentialItem) {
  const metadata = item.metadata?.toString().match(/(\d{1,3})/);
  if (metadata) {
    const value = Number(metadata[1]);
    if (Number.isFinite(value)) return Math.min(100, Math.max(0, value));
  }

  if (item.status.toLowerCase().includes('verified')) return 92;
  if (item.status.toLowerCase().includes('pending') || item.status.toLowerCase().includes('review')) {
    return 62;
  }
  if (item.status.toLowerCase().includes('rejected')) return 34;

  return 72;
}

function getLevelFromScore(score: number): VerifiedSkillLevel {
  if (score >= 75) return 'Advanced';
  if (score >= 50) return 'Intermediate';
  return 'Beginner';
}

function getToneFromScore(score: number): VerifiedSkill['tone'] {
  if (score >= 80) return 'success';
  if (score >= 60) return 'primary';
  if (score >= 40) return 'warning';
  return 'muted';
}

function getCategoryBucket(item: LiveCredentialItem, role: VerifiedSkillsRole) {
  if (role === 'student') return 'certificates';
  return item.recordKind ?? 'documents';
}

function getCategoryMeta(
  bucket: string,
  role: VerifiedSkillsRole
): { title: string; group: VerifiedSkillGroup } {
  if (role === 'student') {
    return {
      title: 'Platform Certificates',
      group: 'Micro-Credentials',
    };
  }

  switch (bucket) {
    case 'education':
      return {
        title: 'Education Records',
        group: 'Technical Skills',
      };
    case 'membership':
      return {
        title: 'Membership Records',
        group: 'Micro-Credentials',
      };
    case 'experience':
      return {
        title: 'Experience Records',
        group: 'Soft Skills',
      };
    default:
      return {
        title: 'Verified Documents',
        group: 'Micro-Credentials',
      };
  }
}

function getSkillIcon(bucket: string, role: VerifiedSkillsRole, index: number) {
  if (role === 'student') {
    return index % 2 === 0 ? Award : Sparkles;
  }

  switch (bucket) {
    case 'education':
      return GraduationCap;
    case 'membership':
      return BadgeCheck;
    case 'experience':
      return BriefcaseBusiness;
    default:
      return ShieldCheck;
  }
}

function toSkill(item: LiveCredentialItem, bucket: string, role: VerifiedSkillsRole, index: number): VerifiedSkill {
  const score = parseNumericScore(item);
  const level = getLevelFromScore(score);

  return {
    id: item.documentUuid ?? item.id,
    name: item.recordSummary || item.title,
    level,
    score,
    provider: item.issuer,
    category: item.documentLabel || item.issuer,
    icon: getSkillIcon(bucket, role, index),
    tone: getToneFromScore(score),
  };
}

function buildCategories(items: LiveCredentialItem[], role: VerifiedSkillsRole): VerifiedSkillCategory[] {
  const verifiedItems = items.filter(isVerifiedItem);
  const buckets = new Map<string, LiveCredentialItem[]>();

  verifiedItems.forEach(item => {
    const bucket = getCategoryBucket(item, role);
    const existing = buckets.get(bucket) ?? [];
    existing.push(item);
    buckets.set(bucket, existing);
  });

  const orderedBuckets =
    role === 'student'
      ? ['certificates']
      : ['education', 'membership', 'experience', 'documents'];

  return orderedBuckets
    .map(bucket => {
      const bucketItems = buckets.get(bucket) ?? [];
      if (!bucketItems.length) return null;

      const meta = getCategoryMeta(bucket, role);
      const skills = bucketItems
        .slice()
        .sort((left, right) => parseNumericScore(right) - parseNumericScore(left))
        .slice(0, 6)
        .map((item, index) => toSkill(item, bucket, role, index));
      const records: VerifiedSkillRecord[] = bucketItems
        .slice()
        .sort((left, right) => (left.timestamp ?? 0) - (right.timestamp ?? 0))
        .map(item => ({
          id: item.id,
          title: item.recordSummary || item.title,
          issuer: item.issuer,
          status: item.status,
          documentLabel: item.documentLabel,
          documentUrl: item.documentUrl,
          recordKind: item.recordKind,
          recordSummary: item.recordSummary,
          timestamp: item.timestamp,
          details: item.details,
        }));

      const averageScore = Math.round(
        skills.reduce((total, skill) => total + skill.score, 0) / Math.max(1, skills.length)
      );

      return {
        id: `${role}-${bucket}`,
        title: meta.title,
        group: meta.group,
        level: getLevelFromScore(averageScore),
        score: averageScore,
        indicators: Math.max(1, Math.min(5, Math.round(averageScore / 20))),
        skills,
        records,
      } satisfies VerifiedSkillCategory;
    })
    .filter((category): category is VerifiedSkillCategory => Boolean(category));
}

function buildInsights(categories: VerifiedSkillCategory[]) {
  if (!categories.length) return [];

  return categories.slice(0, 5).map(category => ({
    name: category.title,
    rating: Math.max(1, Math.min(5, Math.round(category.score / 20))),
  }));
}

function buildSuggestions(categories: VerifiedSkillCategory[]) {
  if (!categories.length) return [];

  return categories
    .slice()
    .sort((left, right) => left.score - right.score)
    .slice(0, 3)
    .map((category, index) => ({
      id: `${category.id}-suggestion`,
      name: `Strengthen ${category.title}`,
      level: Math.max(1, Math.round(category.score / 25)),
      progress: category.score,
      icon: category.skills[0]?.icon ?? (index === 0 ? ShieldCheck : Sparkles),
      tone: index === 0 ? 'warning' : index === 1 ? 'success' : 'primary',
    })) satisfies SuggestedSkill[];
}

function getWalletSkillScore(item: LiveCredentialItem, index: number, role: VerifiedSkillsRole) {
  const parsed = item.metadata?.match(/(\d{1,3})/)?.[1];
  if (role === 'student' && parsed) {
    return Math.min(100, Math.max(0, Number(parsed)));
  }

  const baseScore =
    role === 'student'
      ? 82
      : item.recordKind === 'experience'
        ? 94
        : item.recordKind === 'membership'
          ? 88
          : item.recordKind === 'education'
            ? 84
            : 80;

  const recencyBonus = Math.max(0, 8 - index * 2);
  return Math.min(100, baseScore + recencyBonus);
}

function getWalletSkillLevel(score: number): VerifiedSkill['level'] {
  if (score >= 75) return 'Advanced';
  if (score >= 50) return 'Intermediate';
  return 'Beginner';
}

function getWalletSkillVersion(item: LiveCredentialItem) {
  return item.recordSummary || item.stage;
}

function buildWalletSkills(items: LiveCredentialItem[], role: VerifiedSkillsRole): SharedSkill[] {
  return items
    .filter(item => item.status.toLowerCase().includes('verified'))
    .slice()
    .sort((left, right) => (right.timestamp ?? 0) - (left.timestamp ?? 0))
    .map((item, index) => {
      const score = getWalletSkillScore(item, index, role);
      return {
        id: item.documentUuid ?? item.id,
        name: item.recordSummary || item.title,
        level: getWalletSkillLevel(score),
        score,
        category: item.documentLabel,
        verified: true,
        version: getWalletSkillVersion(item),
      };
    });
}

function buildWalletTimeline(items: LiveCredentialItem[]): SharedTimelineItem[] {
  return items
    .filter(item => item.status.toLowerCase().includes('verified'))
    .slice()
    .sort((left, right) => (left.timestamp ?? 0) - (right.timestamp ?? 0))
    .map(item => ({
      id: `${item.id}-wallet`,
      title: item.recordSummary || item.title,
      provider: item.issuer,
      description: item.details?.[0]?.value || item.documentLabel || item.stage,
      metric: item.recordKind || item.level,
      timestamp: item.timestamp,
      icon: createElement(
        item.recordKind === 'experience'
          ? BriefcaseBusiness
          : item.recordKind === 'membership'
            ? BadgeCheck
            : item.recordKind === 'education'
              ? GraduationCap
              : item.level === 'Verified'
                ? Award
                : ShieldCheck,
        { className: 'size-4' }
      ),
    }))
    .slice(0, 6);
}

function buildWalletSummary(
  items: LiveCredentialItem[],
  role: VerifiedSkillsRole
): SharedCredentialSummary {
  const verified = items.filter(item => item.status.toLowerCase().includes('verified'));
  const records = verified.filter(item => item.recordSummary || item.recordKind);
  const certLike = role === 'student' ? verified : records.filter(item => item.recordKind !== 'experience');

  return {
    badgesEarned: verified.length,
    certificatesEarned: certLike.length,
    shares: records.length,
  };
}

export function useVerifiedSkillsContent(role?: VerifiedSkillsRole): VerifiedSkillsContent {
  const profile = useUserProfile();
  const profileData = profile as UserProfileType | undefined;
  const resolvedRole = inferRole(profileData, role);
  const roleProfile = getRoleProfile(profileData, resolvedRole);
  const profileUuid = roleProfile?.uuid as string | undefined;

  const documentTypesQuery = useQuery(listDocumentTypesOptions());

  const instructorDocumentsQuery = useQuery({
    ...getInstructorDocumentsOptions({ path: { instructorUuid: profileUuid ?? '' } }),
    enabled: resolvedRole === 'instructor' && !!profileUuid,
  });
  const instructorEducationQuery = useQuery({
    ...getInstructorEducationOptions({ path: { instructorUuid: profileUuid ?? '' } }),
    enabled: resolvedRole === 'instructor' && !!profileUuid,
  });
  const instructorMembershipQuery = useQuery({
    ...getInstructorMembershipsOptions({
      path: { instructorUuid: profileUuid ?? '' },
      query: { pageable: PAGEABLE },
    }),
    enabled: resolvedRole === 'instructor' && !!profileUuid,
  });
  const instructorExperienceQuery = useQuery({
    ...getInstructorExperienceOptions({
      path: { instructorUuid: profileUuid ?? '' },
      query: { pageable: PAGEABLE },
    }),
    enabled: resolvedRole === 'instructor' && !!profileUuid,
  });

  const courseCreatorDocumentsQuery = useQuery({
    ...getCourseCreatorDocumentsOptions({ path: { courseCreatorUuid: profileUuid ?? '' } }),
    enabled: resolvedRole === 'course_creator' && !!profileUuid,
  });
  const courseCreatorEducationQuery = useQuery({
    ...getCourseCreatorEducationOptions({
      path: { courseCreatorUuid: profileUuid ?? '' },
      query: { pageable: PAGEABLE },
    }),
    enabled: resolvedRole === 'course_creator' && !!profileUuid,
  });
  const courseCreatorMembershipQuery = useQuery({
    ...getCourseCreatorMembershipsOptions({
      path: { courseCreatorUuid: profileUuid ?? '' },
      query: { pageable: PAGEABLE },
    }),
    enabled: resolvedRole === 'course_creator' && !!profileUuid,
  });
  const courseCreatorExperienceQuery = useQuery({
    ...getCourseCreatorExperienceOptions({
      path: { courseCreatorUuid: profileUuid ?? '' },
      query: { pageable: PAGEABLE },
    }),
    enabled: resolvedRole === 'course_creator' && !!profileUuid,
  });

  const studentCertificatesQuery = useQuery({
    ...getStudentCertificatesOptions({ path: { studentUuid: profileUuid ?? '' } }),
    enabled: resolvedRole === 'student' && !!profileUuid,
  });

  const documentTypes = useMemo(
    () => (documentTypesQuery.data?.data ?? []) as DocumentTypeOption[],
    [documentTypesQuery.data?.data]
  );

  const content = useMemo(() => {
    const documents =
      resolvedRole === 'instructor'
        ? ((instructorDocumentsQuery.data?.data ?? []) as InstructorDocument[])
        : resolvedRole === 'course_creator'
          ? ((courseCreatorDocumentsQuery.data?.data ?? []) as CourseCreatorDocumentDto[])
          : [];

    const certificates =
      resolvedRole === 'student'
        ? ((studentCertificatesQuery.data?.data ?? []) as Certificate[])
        : [];

    const educationRecords =
      resolvedRole === 'instructor'
        ? ((instructorEducationQuery.data?.data ?? []) as InstructorEducation[])
        : resolvedRole === 'course_creator'
          ? ((courseCreatorEducationQuery.data?.data?.content ?? []) as CourseCreatorEducation[])
          : [];

    const membershipRecords =
      resolvedRole === 'instructor'
        ? ((instructorMembershipQuery.data?.data?.content ?? []) as InstructorProfessionalMembership[])
        : resolvedRole === 'course_creator'
          ? ((courseCreatorMembershipQuery.data?.data?.content ?? []) as CourseCreatorProfessionalMembership[])
          : [];

    const experienceRecords =
      resolvedRole === 'instructor'
        ? ((instructorExperienceQuery.data?.data?.content ?? []) as InstructorExperience[])
        : resolvedRole === 'course_creator'
          ? ((courseCreatorExperienceQuery.data?.data?.content ?? []) as CourseCreatorExperience[])
          : [];

    const credentialsContent = buildCredentialsContent({
      role: resolvedRole,
      profile: profileData,
      documents,
      certificates,
      educationRecords,
      membershipRecords,
      experienceRecords,
      documentTypes,
      searchValue: '',
      statusFilter: 'all',
    });

    const categories = buildCategories(credentialsContent.credentialsByTab.all, resolvedRole);
    const walletSkills = buildWalletSkills(credentialsContent.credentialsByTab.all, resolvedRole);
    const walletSummary = buildWalletSummary(credentialsContent.credentialsByTab.all, resolvedRole);
    const walletTimeline = buildWalletTimeline(credentialsContent.credentialsByTab.all);

    return {
      categories,
      insights: buildInsights(categories),
      suggestions: buildSuggestions(categories),
      skills: walletSkills,
      summary: walletSummary,
      timeline: walletTimeline,
      isLoading:
        documentTypesQuery.isLoading ||
        instructorDocumentsQuery.isLoading ||
        instructorEducationQuery.isLoading ||
        instructorMembershipQuery.isLoading ||
        instructorExperienceQuery.isLoading ||
        courseCreatorDocumentsQuery.isLoading ||
        courseCreatorEducationQuery.isLoading ||
        courseCreatorMembershipQuery.isLoading ||
        courseCreatorExperienceQuery.isLoading ||
        studentCertificatesQuery.isLoading,
    } satisfies VerifiedSkillsContent;
  }, [
    courseCreatorDocumentsQuery.data?.data,
    courseCreatorDocumentsQuery.isLoading,
    courseCreatorEducationQuery.data?.data?.content,
    courseCreatorEducationQuery.isLoading,
    courseCreatorExperienceQuery.data?.data?.content,
    courseCreatorExperienceQuery.isLoading,
    courseCreatorMembershipQuery.data?.data?.content,
    courseCreatorMembershipQuery.isLoading,
    documentTypes,
    documentTypesQuery.isLoading,
    instructorDocumentsQuery.data?.data,
    instructorDocumentsQuery.isLoading,
    instructorEducationQuery.data?.data,
    instructorEducationQuery.isLoading,
    instructorExperienceQuery.data?.data?.content,
    instructorExperienceQuery.isLoading,
    instructorMembershipQuery.data?.data?.content,
    instructorMembershipQuery.isLoading,
    profileData,
    resolvedRole,
    studentCertificatesQuery.data?.data,
    studentCertificatesQuery.isLoading,
  ]);

  return content;
}
