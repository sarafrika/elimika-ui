'use client';

import {
  Award,
  CheckCircle2,
  Cloud,
  Eye,
  FileText,
  Globe,
  GraduationCap,
  BriefcaseBusiness,
  Building2,
  Star,
  WalletCards,
} from 'lucide-react';
import type { UserProfileType } from '@/lib/types';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
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
} from '@/services/client/types.gen';
import type {
  CredentialItem,
  CredentialsContent,
  CredentialsStatusFilter,
  CredentialsProfile,
  CredentialsRole,
  CredentialsTabId,
  GrowthItem,
} from './data';
import { getCredentialsContent as getFallbackCredentialsContent } from './data';

type CredentialsDocument = InstructorDocument | CourseCreatorDocumentDto;
type StudentCertificate = Certificate;
type LinkedDocument = CredentialsDocument & {
  education_uuid?: string;
  membership_uuid?: string;
  experience_uuid?: string;
  title?: string;
  description?: string;
};

const badgeKeywords = ['badge', 'award', 'badge'];
const certificateKeywords = ['certificate', 'diploma', 'degree', 'qualification', 'transcript'];
const blockchainKeywords = ['blockchain', 'wallet', 'verified', 'verification'];

function formatMonthYear(value?: Date | string) {
  if (!value) return 'Recently';
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Recently';
  return parsed.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

function formatLongDate(value?: Date | string) {
  if (!value) return 'Recently';
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Recently';
  return parsed.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function getInitials(name?: string) {
  if (!name) return 'VA';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('');
}

function getFirstValue(...values: Array<string | undefined | null>) {
  return values.find(value => typeof value === 'string' && value.trim().length > 0)?.trim();
}

function formatYearValue(value?: number | string | Date | null) {
  if (value === null || value === undefined || value === '') return undefined;
  if (typeof value === 'number') return `${value}`;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : `${value.getFullYear()}`;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : `${parsed.getFullYear()}`;
}

function formatDateRange(start?: Date | string, end?: Date | string, active?: boolean) {
  const formatDate = (value?: Date | string) => {
    if (!value) return undefined;
    const parsed = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(parsed.getTime())) return undefined;
    return parsed.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  };

  const startValue = formatDate(start);
  const endValue = active ? 'Present' : formatDate(end);
  return [startValue, endValue].filter(Boolean).join(' - ');
}

function buildEducationDetails(education?: InstructorEducation | CourseCreatorEducation) {
  if (!education) return [];

  return [
    { label: 'Institution', value: education.school_name || 'Not specified' },
    { label: 'Qualification', value: education.qualification || 'Not specified' },
    {
      label: 'Field',
      value: education.field_of_study || 'Not specified',
    },
    {
      label: 'Completed',
      value:
        education.formatted_completion ||
        formatYearValue(education.year_completed) ||
        'Not specified',
    },
    {
      label: 'Certificate',
      value: education.certificate_number || 'Not specified',
    },
  ];
}

function buildMembershipDetails(
  membership?: InstructorProfessionalMembership | CourseCreatorProfessionalMembership
) {
  if (!membership) return [];

  const organisationName =
    'organisation_name' in membership
      ? membership.organisation_name
      : 'organization_name' in membership
        ? membership.organization_name
        : undefined;
  const statusLabel =
    'membership_status' in membership
      ? membership.membership_status
      : 'status_label' in membership
        ? membership.status_label
        : undefined;

  return [
    { label: 'Organisation', value: organisationName || 'Not specified' },
    {
      label: 'Membership No.',
      value: membership.membership_number || 'Not specified',
    },
    {
      label: 'Period',
      value:
        membership.membership_period ||
        formatDateRange(membership.start_date, membership.end_date, membership.is_active) ||
        'Not specified',
    },
    {
      label: 'Status',
      value:
        statusLabel ||
        (membership.is_active ? 'Active' : 'Inactive'),
    },
  ];
}

function buildExperienceDetails(
  experience?: InstructorExperience | CourseCreatorExperience
) {
  if (!experience) return [];

  const responsibilities = 'responsibilities' in experience ? experience.responsibilities : undefined;
  return [
    { label: 'Position', value: experience.position || 'Not specified' },
    { label: 'Organisation', value: experience.organisation_name || 'Not specified' },
    {
      label: 'Period',
      value:
        ('tenure_label' in experience ? experience.tenure_label : undefined) ||
        formatDateRange(experience.start_date, experience.end_date, experience.is_current_position) ||
        'Not specified',
    },
    {
      label: 'Experience',
      value:
        formatYearValue(experience.years_of_experience) ||
        (experience.is_current_position ? 'Current role' : 'Not specified'),
    },
    {
      label: 'Responsibilities',
      value: responsibilities || 'Not specified',
    },
  ];
}

function getLinkedRecordData({
  document,
  educationMap,
  membershipMap,
  experienceMap,
}: {
  document: LinkedDocument;
  educationMap?: Map<string, InstructorEducation | CourseCreatorEducation>;
  membershipMap?: Map<string, InstructorProfessionalMembership | CourseCreatorProfessionalMembership>;
  experienceMap?: Map<string, InstructorExperience | CourseCreatorExperience>;
}) {
  const educationUuid = document.education_uuid;
  const membershipUuid = document.membership_uuid;
  const experienceUuid = document.experience_uuid;

  const education = educationUuid ? educationMap?.get(educationUuid) : undefined;
  const membership = membershipUuid ? membershipMap?.get(membershipUuid) : undefined;
  const experience = experienceUuid ? experienceMap?.get(experienceUuid) : undefined;

  if (education) {
    return {
      recordKind: 'education' as const,
      recordUuid: educationUuid,
      recordSummary:
        education.full_description ||
        `${education.qualification || 'Education'} at ${education.school_name || 'Unknown institution'}`,
      details: buildEducationDetails(education),
    };
  }

  if (membership) {
    const organisationName =
      'organisation_name' in membership
        ? membership.organisation_name
        : 'organization_name' in membership
          ? membership.organization_name
          : undefined;
    return {
      recordKind: 'membership' as const,
      recordUuid: membershipUuid,
      recordSummary:
        ('summary' in membership && membership.summary) ||
        `${organisationName || 'Membership'} record`,
      details: buildMembershipDetails(membership),
    };
  }

  if (experience) {
    return {
      recordKind: 'experience' as const,
      recordUuid: experienceUuid,
      recordSummary:
        ('tenure_label' in experience && experience.tenure_label) ||
        `${experience.position || 'Experience'} at ${experience.organisation_name || 'Unknown organisation'}`,
      details: buildExperienceDetails(experience),
    };
  }

  return {
    recordKind: undefined,
    recordUuid: undefined,
    recordSummary: undefined,
    details: [] as ReturnType<typeof buildEducationDetails>,
  };
}

function getDocumentTypeMap(documentTypes: DocumentTypeOption[]) {
  return new Map(
    documentTypes
      .filter(item => typeof item.uuid === 'string')
      .map(item => [item.uuid as string, item])
  );
}

function getDocumentLabel(document: CredentialsDocument, documentTypes: DocumentTypeOption[]) {
  const lookup = getDocumentTypeMap(documentTypes);
  const resolved = lookup.get(document.document_type_uuid);
  return (
    getFirstValue(resolved?.name, resolved?.description) ??
    getFirstValue(
      (document as InstructorDocument).title,
      (document as InstructorDocument).description,
      document.original_filename,
      'Document'
    ) ??
    'Document'
  );
}

function getDocumentTypeText(document: CredentialsDocument, documentTypes: DocumentTypeOption[]) {
  const lookup = getDocumentTypeMap(documentTypes);
  return (
    getFirstValue(lookup.get(document.document_type_uuid)?.name) ??
    getFirstValue(lookup.get(document.document_type_uuid)?.description) ??
    'Document'
  );
}

function formatFileSize(bytes?: bigint) {
  if (!bytes) return undefined;

  const size = Number(bytes);
  if (!Number.isFinite(size) || size <= 0) {
    return undefined;
  }

  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getCertificateStatus(certificate: StudentCertificate) {
  const verified = certificate.is_valid !== false && certificate.validity_status !== 'pending';
  const rejected = certificate.is_valid === false;
  const pending = certificate.validity_status === 'pending';

  if (verified) {
    return {
      label: 'Verified on Blockchain',
      stage: 'Verified',
      icon: CheckCircle2,
      tone: 'success' as const,
    };
  }

  if (rejected) {
    return {
      label: 'Verification Rejected',
      stage: 'Rejected',
      icon: Award,
      tone: 'destructive' as const,
    };
  }

  if (pending) {
    return {
      label: 'Under Review',
      stage: 'Pending',
      icon: Eye,
      tone: 'secondary' as const,
    };
  }

  return {
    label: certificate.validity_status ?? 'Pending',
    stage: 'Pending',
    icon: Eye,
    tone: 'secondary' as const,
  };
}

function getCertificateTimestamp(certificate: StudentCertificate) {
  return certificate.issued_date ?? certificate.completion_date ?? certificate.created_date;
}

function getCertificateLabel(certificate: StudentCertificate) {
  return (
    getFirstValue(
      certificate.certificate_type,
      certificate.certificate_number,
      certificate.template_uuid,
      'Certificate'
    ) ?? 'Certificate'
  );
}

function getCertificateIssuer(certificate: StudentCertificate) {
  return getFirstValue(certificate.certificate_type, certificate.template_uuid, 'Certificate') ?? 'Certificate';
}

function mapCertificateItems(
  certificates: StudentCertificate[],
  searchValue = '',
  statusFilter: CredentialsStatusFilter = 'all'
) {
  const filter = searchValue.trim().toLowerCase();

  return certificates
    .slice()
    .sort((left, right) => {
      const leftDate = new Date(getCertificateTimestamp(left) ?? 0).getTime();
      const rightDate = new Date(getCertificateTimestamp(right) ?? 0).getTime();
      return rightDate - leftDate;
    })
    .filter(certificate => {
      const status = getCertificateStatus(certificate);

      if (!filter) return true;

      return [
        getCertificateLabel(certificate).toLowerCase(),
        getCertificateIssuer(certificate).toLowerCase(),
        certificate.certificate_number?.toLowerCase() ?? '',
        status.label.toLowerCase(),
      ].some(value => value.includes(filter));
    })
    .filter(certificate => {
      if (statusFilter === 'all') return true;

      const status = getCertificateStatus(certificate);

      if (statusFilter === 'verified') return status.stage === 'Verified';
      if (statusFilter === 'pending') return status.stage === 'Pending';
      if (statusFilter === 'rejected') return status.stage === 'Rejected';

      return true;
    })
    .map((certificate, index) => {
      const status = getCertificateStatus(certificate);
      const timestamp = getCertificateTimestamp(certificate);

      return {
        id: certificate.uuid ?? `${certificate.template_uuid}-${index}`,
        title: getCertificateLabel(certificate),
        issuer: getCertificateIssuer(certificate),
        issuerIconText: getInitials(getCertificateIssuer(certificate)).slice(0, 1) || 'C',
        stage: `Completed ${formatLongDate(timestamp)}`,
        level: status.stage,
        status: status.label,
        statusIcon: status.icon,
        actionLabel: certificate.certificate_url ? 'View' : 'Details',
        documentLabel: certificate.certificate_number ?? certificate.template_uuid,
        documentUrl: getFirstValue(certificate.certificate_url, undefined),
        metadata: certificate.final_grade ? `${certificate.final_grade}%` : undefined,
      } satisfies CredentialItem & {
        documentUrl?: string;
        metadata?: string;
      };
    });
}

function getDocumentStatus(document: CredentialsDocument) {
  const verificationStatus =
    'verification_status' in document ? document.verification_status : undefined;
  const isPendingVerification =
    'is_pending_verification' in document ? document.is_pending_verification : undefined;
  const verified = document.is_verified || verificationStatus === 'VERIFIED';
  const rejected = verificationStatus === 'REJECTED';
  const pending =
    verificationStatus === 'PENDING' ||
    isPendingVerification ||
    !verificationStatus;

  if (verified) {
    return {
      label: 'Verified on Blockchain',
      stage: 'Verified',
      icon: CheckCircle2,
      tone: 'success' as const,
    };
  }

  if (rejected) {
    return {
      label: 'Verification Rejected',
      stage: 'Rejected',
      icon: Award,
      tone: 'destructive' as const,
    };
  }

  if (pending) {
    return {
      label: 'Under Review',
      stage: 'Pending',
      icon: Eye,
      tone: 'secondary' as const,
    };
  }

  return {
    label: verificationStatus ?? 'Pending',
    stage: 'Pending',
    icon: Eye,
    tone: 'secondary' as const,
  };
}

function getDocumentFileUrl(document: CredentialsDocument) {
  const resolvedUrl = toAuthenticatedMediaUrl(document.file_url ?? document.file_path ?? undefined);
  return resolvedUrl || document.file_url || document.file_path || undefined;
}

function getDocumentTimestamp(document: CredentialsDocument) {
  if ('upload_date' in document && (document as InstructorDocument).upload_date) {
    return (document as InstructorDocument).upload_date;
  }

  return document.created_date ?? document.updated_date;
}

function mapCredentialItems(
  documents: CredentialsDocument[],
  documentTypes: DocumentTypeOption[],
  searchValue = '',
  statusFilter: CredentialsStatusFilter = 'all'
) {
  const filter = searchValue.trim().toLowerCase();

  return documents
    .slice()
    .sort((left, right) => {
      const leftDate = new Date(getDocumentTimestamp(left) ?? 0).getTime();
      const rightDate = new Date(getDocumentTimestamp(right) ?? 0).getTime();
      return rightDate - leftDate;
    })
    .filter(document => {
      const status = getDocumentStatus(document);

      if (!filter) return true;
      const label = getDocumentLabel(document, documentTypes).toLowerCase();
      const statusLabel = status.label.toLowerCase();
      return [label, document.original_filename.toLowerCase(), statusLabel].some(value =>
        value.includes(filter)
      );
    })
    .filter(document => {
      if (statusFilter === 'all') return true;

      const status = getDocumentStatus(document);

      if (statusFilter === 'verified') return status.stage === 'Verified';
      if (statusFilter === 'pending') return status.stage === 'Pending';
      if (statusFilter === 'rejected') return status.stage === 'Rejected';

      return true;
    })
    .map(document => {
      const label = getDocumentLabel(document, documentTypes);
      const status = getDocumentStatus(document);
      const stageDate = getDocumentTimestamp(document);
      const fileSize = formatFileSize(document.file_size_bytes);

      return {
        id: document.uuid ?? `${document.document_type_uuid}-${document.original_filename}`,
        title: label,
        issuer: getDocumentTypeText(document, documentTypes),
        issuerIconText: getInitials(getDocumentTypeText(document, documentTypes)).slice(0, 1) || 'D',
        stage: `Uploaded ${formatLongDate(stageDate)}`,
        level: status.stage,
        status: status.label,
        statusIcon: status.icon,
        actionLabel: document.file_url ? 'View' : 'Details',
        documentLabel: document.original_filename,
        documentUrl: getDocumentFileUrl(document),
        metadata: fileSize ?? undefined,
      } satisfies CredentialItem & {
        documentUrl?: string;
        metadata?: string;
      };
    });
}

function mapLinkedCredentialItems({
  documents,
  documentTypes,
  educationMap,
  membershipMap,
  experienceMap,
  searchValue = '',
  statusFilter = 'all',
}: {
  documents: LinkedDocument[];
  documentTypes: DocumentTypeOption[];
  educationMap?: Map<string, InstructorEducation | CourseCreatorEducation>;
  membershipMap?: Map<string, InstructorProfessionalMembership | CourseCreatorProfessionalMembership>;
  experienceMap?: Map<string, InstructorExperience | CourseCreatorExperience>;
  searchValue?: string;
  statusFilter?: CredentialsStatusFilter;
}) {
  const baseItems = mapCredentialItems(documents, documentTypes, searchValue, statusFilter);

  return baseItems.map(item => {
    const sourceDocument = documents.find(document => {
      const candidateUuid = document.uuid ?? `${document.document_type_uuid}-${document.original_filename}`;
      return candidateUuid === item.id || document.original_filename === item.documentLabel;
    });

    if (!sourceDocument) return item;

    const linked = getLinkedRecordData({
      document: sourceDocument,
      educationMap,
      membershipMap,
      experienceMap,
    });

    return {
      ...item,
      documentUuid:
        sourceDocument.uuid ||
        item.id ||
        undefined,
      recordKind: linked.recordKind,
      recordUuid: linked.recordUuid,
      recordSummary: linked.recordSummary,
      details: linked.details,
      title: item.title,
      issuer: item.issuer,
      metadata: linked.recordSummary ? linked.recordSummary : item.metadata,
    } satisfies CredentialItem;
  });
}

function buildTimelineItems(items: ReturnType<typeof mapCredentialItems>): GrowthItem[] {
  const timelineIcons = [GraduationCap, BriefcaseBusiness, Building2, WalletCards, Cloud, Globe, Star];

  return items
    .filter(item => item.level === 'Verified' || !!item.recordKind)
    .slice(0, 6)
    .map((item, index) => ({
      id: `${item.id}-timeline`,
      title: item.title,
      provider: item.issuer,
      documentName: item.documentLabel,
      documentUrl: item.documentUrl,
      recordKind: item.recordKind,
      recordSummary: item.recordSummary,
      details: item.details,
      badge: item.level,
      metadata: item.recordSummary ?? item.status,
      footerLabel: item.actionLabel,
      actionLabel: item.actionLabel,
      accent: index % 3 === 0 ? 'green' : index % 3 === 1 ? 'amber' : 'blue',
      icon: timelineIcons[index % timelineIcons.length] ?? FileText,
    }));
}

function resolveProfile(role: CredentialsRole, profile?: UserProfileType): CredentialsProfile {
  const user = profile;
  const student = profile?.student;
  const instructor = profile?.instructor;
  const courseCreator = profile?.courseCreator;
  const displayName =
    getFirstValue(user?.full_name, user?.display_name, user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : undefined) ??
    'Profile';
  const initials = getInitials(displayName);

  if (role === 'instructor') {
    return {
      name: displayName,
      title: getFirstValue(instructor?.professional_headline, 'Instructor') ?? 'Instructor',
      location:
        getFirstValue(instructor?.formatted_location, user?.organisation_affiliations?.[0]?.branch_name, user?.organisation_affiliations?.[0]?.organisation_name) ??
        'Location not set',
      website: getFirstValue(instructor?.website, 'Website not set') ?? 'Website not set',
      email: user?.email ?? 'Email not set',
      phone: getFirstValue(user?.phone_number, 'Phone not set') ?? 'Phone not set',
      joined: formatMonthYear(user?.created_date),
      entriesLabel: `${profile?.instructor?.educations?.length ?? 0} Education Entries`,
      levelLabel: instructor?.admin_verified ? 'Verified Instructor' : 'Instructor Profile',
      initials,
    };
  }

  if (role === 'course_creator') {
    return {
      name: getFirstValue(courseCreator?.full_name, displayName) ?? displayName,
      title: getFirstValue(courseCreator?.professional_headline, 'Course Creator') ?? 'Course Creator',
      location:
        getFirstValue(user?.organisation_affiliations?.[0]?.organisation_name, user?.organisation_affiliations?.[0]?.branch_name) ??
        'Location not set',
      website: getFirstValue(courseCreator?.website, 'Website not set') ?? 'Website not set',
      email: user?.email ?? 'Email not set',
      phone: getFirstValue(user?.phone_number, 'Phone not set') ?? 'Phone not set',
      joined: formatMonthYear(user?.created_date),
      entriesLabel: `${courseCreator?.full_name ? 1 : 0} Creator Entries`,
      levelLabel: courseCreator?.admin_verified ? 'Verified Creator' : 'Creator Profile',
      initials,
    };
  }

  return {
    name: displayName,
    title: getFirstValue(student?.bio, 'Student') ?? 'Student',
    location:
      getFirstValue(user?.organisation_affiliations?.[0]?.branch_name, user?.organisation_affiliations?.[0]?.organisation_name) ??
      'Location not set',
    website: 'Website not set',
    email: user?.email ?? 'Email not set',
    phone: getFirstValue(user?.phone_number, 'Phone not set') ?? 'Phone not set',
    joined: formatMonthYear(user?.created_date),
    entriesLabel: `${student ? 1 : 0} Portfolio Entries`,
    levelLabel: 'Learner Profile',
    initials,
  };
}

function buildSummary(
  itemCount: number,
  verifiedCount: number,
  documentTypes: DocumentTypeOption[],
  noun = 'Document'
) {
  const uploadCount = `${itemCount} ${noun}${itemCount === 1 ? '' : 's'}`;
  const shares = `${Math.max(itemCount, verifiedCount)} Share${Math.max(itemCount, verifiedCount) === 1 ? '' : 's'}`;
  const blockchainLabel =
    verifiedCount > 0
      ? `${verifiedCount} Verified on Blockchain`
      : documentTypes.length > 0
        ? `${documentTypes.length} Document Types`
        : 'Verified on Blockchain';

  return {
    badges: uploadCount,
    blockchain: blockchainLabel,
    shares,
  };
}

function filterFallbackContentWithStatus(
  content: CredentialsContent,
  searchValue: string,
  statusFilter: CredentialsStatusFilter
) {
  const filter = searchValue.trim().toLowerCase();
  const hasSearchFilter = filter.length > 0;

  return {
    ...content,
    tabs: content.tabs.map(tab => ({ ...tab, countLabel: undefined })),
    credentialsByTab: Object.fromEntries(
      Object.entries(content.credentialsByTab).map(([tabId, items]) => [
        tabId,
        items.filter(item => {
          const matchesSearch = !hasSearchFilter
            ? true
            : [item.title, item.issuer, item.status, item.documentLabel].some(value =>
                value.toLowerCase().includes(filter)
              );

          if (!matchesSearch) return false;

          if (statusFilter === 'all') return true;

          const statusText = item.status.toLowerCase();
          if (statusFilter === 'verified') return statusText.includes('verified');
          if (statusFilter === 'pending') return statusText.includes('pending') || statusText.includes('review');
          if (statusFilter === 'rejected') return statusText.includes('rejected');

          return true;
        }),
      ])
    ) as CredentialsContent['credentialsByTab'],
  };
}

export function buildCredentialsContent({
  role,
  profile,
  documents,
  certificates,
  educationRecords,
  membershipRecords,
  experienceRecords,
  documentTypes,
  searchValue,
  statusFilter = 'all',
}: {
  role: CredentialsRole;
  profile?: UserProfileType;
  documents?: CredentialsDocument[];
  certificates?: StudentCertificate[];
  educationRecords?: Array<InstructorEducation | CourseCreatorEducation>;
  membershipRecords?: Array<InstructorProfessionalMembership | CourseCreatorProfessionalMembership>;
  experienceRecords?: Array<InstructorExperience | CourseCreatorExperience>;
  documentTypes?: DocumentTypeOption[];
  searchValue?: string;
  statusFilter?: CredentialsStatusFilter;
}): CredentialsContent {
  const fallback = getFallbackCredentialsContent(role);
  const liveDocuments = (documents ?? []).filter(Boolean);
  const liveCertificates = (certificates ?? []).filter(Boolean);
  const educationMap = new Map(
    (educationRecords ?? [])
      .filter(item => typeof item.uuid === 'string')
      .map(item => [item.uuid as string, item])
  );
  const membershipMap = new Map(
    (membershipRecords ?? [])
      .filter(item => typeof item.uuid === 'string')
      .map(item => [item.uuid as string, item])
  );
  const experienceMap = new Map(
    (experienceRecords ?? [])
      .filter(item => typeof item.uuid === 'string')
      .map(item => [item.uuid as string, item])
  );
  const types = documentTypes ?? [];
  const linkedDocuments = liveDocuments as LinkedDocument[];
  const liveItems =
    role === 'student'
      ? mapCredentialItems(liveDocuments, types, searchValue, statusFilter)
      : mapLinkedCredentialItems({
          documents: linkedDocuments,
          documentTypes: types,
          educationMap,
          membershipMap,
          experienceMap,
          searchValue,
          statusFilter,
        });
  const verifiedItems = liveItems.filter(item => item.status.includes('Verified'));
  const groupedByTab = fallback.tabs.reduce<Record<CredentialsTabId, CredentialItem[]>>(
    (acc, tab) => {
      acc[tab.id as CredentialsTabId] = liveItems.filter(item => {
        const normalized = `${item.title} ${item.issuer} ${item.status} ${item.documentLabel}`.toLowerCase();

        if (tab.id === 'all') return true;
        if (tab.id === 'blockchain') return blockchainKeywords.some(keyword => normalized.includes(keyword));
        if (tab.id === 'badges') return badgeKeywords.some(keyword => normalized.includes(keyword));
        if (tab.id === 'certificates') return certificateKeywords.some(keyword => normalized.includes(keyword));

        return true;
      });
      return acc;
    },
    {
      all: liveItems,
      badges: [],
      certificates: [],
      blockchain: [],
    }
  );
  const totalCount = liveItems.length;
  const liveTabs = fallback.tabs.map(tab => {
    const tabItems = groupedByTab[tab.id as CredentialsTabId] ?? [];
    const count = tab.id === 'all' ? totalCount : tabItems.length;

    return {
      ...tab,
      label: tab.id === 'all' ? `${totalCount} Credentials` : tab.label,
      countLabel: tab.id === 'all' ? undefined : `${count}`,
    };
  });

  if (!profile) {
    return filterFallbackContentWithStatus(fallback, searchValue ?? '', statusFilter);
  }

  if (role === 'student') {
    const certificateItems = mapCertificateItems(liveCertificates, searchValue, statusFilter);
    const verifiedCertificates = certificateItems.filter(item => item.status.includes('Verified'));
    const groupedByTab = fallback.tabs.reduce<Record<CredentialsTabId, CredentialItem[]>>(
      (acc, tab) => {
        acc[tab.id as CredentialsTabId] = certificateItems.filter(item => {
          const normalized = `${item.title} ${item.issuer} ${item.status} ${item.documentLabel}`.toLowerCase();

          if (tab.id === 'all') return true;
          if (tab.id === 'blockchain') return blockchainKeywords.some(keyword => normalized.includes(keyword));
          if (tab.id === 'badges') return badgeKeywords.some(keyword => normalized.includes(keyword));
          if (tab.id === 'certificates') return certificateKeywords.some(keyword => normalized.includes(keyword));

          return true;
        });
        return acc;
      },
      {
        all: certificateItems,
        badges: [],
        certificates: [],
        blockchain: [],
      }
    );
    const totalCount = certificateItems.length;
    const liveTabs = fallback.tabs.map(tab => {
      const tabItems = groupedByTab[tab.id as CredentialsTabId] ?? [];
      const count = tab.id === 'all' ? totalCount : tabItems.length;

      return {
        ...tab,
        label: tab.id === 'all' ? `${totalCount} Credentials` : tab.label,
        countLabel: tab.id === 'all' ? undefined : `${count}`,
      };
    });

    return {
      ...fallback,
      tabs: liveTabs,
      profile: {
        ...resolveProfile(role, profile),
        entriesLabel: `${totalCount} Certificate${totalCount === 1 ? '' : 's'}`,
      },
      summary: buildSummary(totalCount, verifiedCertificates.length, [], 'Certificate'),
      credentialsByTab: groupedByTab,
      timeline: buildTimelineItems(certificateItems),
    };
  }

  return {
    ...fallback,
    tabs: liveTabs,
    profile: resolveProfile(role, profile),
    summary: buildSummary(liveItems.length, verifiedItems.length, types),
    credentialsByTab: groupedByTab,
    timeline: buildTimelineItems(liveItems),
  };
}
