import {
  getAllCourseCreators,
  getAllInstructors,
  getCourseCreatorCertifications,
  getCourseCreatorDocuments,
  getCourseCreatorEducation,
  getCourseCreatorExperience,
  getCourseCreatorMemberships,
  getCourseCreatorSkills,
  getCoursesByInstructor,
  getInstructorDocuments,
  getInstructorEducation,
  getInstructorExperience,
  getInstructorMemberships,
  getInstructorReviews,
  getInstructorSkills,
  getProgramsByCourseCreator,
  listDocumentTypes,
  searchCourseCreators,
  searchDocuments,
  searchInstructors,
} from '@/services/client';
import type {
  Course,
  CourseCreator,
  CourseCreatorCertification,
  CourseCreatorDocumentDto,
  CourseCreatorSkill,
  DocumentTypeOption,
  Instructor,
  InstructorDocument,
  InstructorReview,
  InstructorSkill,
  TrainingProgram,
} from '@/services/client';
import type { StatusTone } from '@/app/dashboard/@admin/_components/ui/admin-theme';

export type CredentialRole = 'instructor' | 'course_creator';

/** A normalized, serializable document ready for the review UI (server → client). */
export interface CredentialDocument {
  id: string;
  role: CredentialRole;
  roleLabel: string;
  ownerUuid: string;
  ownerName: string;
  documentUuid?: string;
  documentTypeLabel: string;
  title: string;
  fileUrl?: string;
  statusLabel: string;
  statusTone: StatusTone;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
  fileSize?: string;
  uploadedAt?: string;
  uploadedTimestamp: number;
}

function formatBytes(bytes?: bigint | number | null): string | undefined {
  if (bytes == null) return undefined;
  const size = typeof bytes === 'bigint' ? Number(bytes) : bytes;
  if (!Number.isFinite(size) || size <= 0) return undefined;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value?: Date | string | null): string | undefined {
  if (!value) return undefined;
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function typeLabel(uuid: string | undefined, map: Map<string, DocumentTypeOption>): string {
  if (!uuid) return 'Document';
  const resolved = map.get(uuid);
  return resolved?.name || resolved?.description || 'Document';
}

function instructorStatus(document: InstructorDocument): { label: string; tone: StatusTone; verified: boolean } {
  const verified = Boolean(document.is_verified) || document.verification_status === 'VERIFIED';
  if (verified) return { label: 'Verified', tone: 'success', verified: true };
  if (document.verification_status === 'REJECTED')
    return { label: 'Rejected', tone: 'destructive', verified: false };
  return { label: 'Pending review', tone: 'warning', verified: false };
}

function creatorStatus(document: CourseCreatorDocumentDto): { label: string; tone: StatusTone; verified: boolean } {
  if (document.is_verified) return { label: 'Verified', tone: 'success', verified: true };
  return { label: 'Pending review', tone: 'warning', verified: false };
}

const PAGEABLE = { page: 0, size: 200 };

/**
 * Fetch and normalize all credential documents for a single user (server-side).
 * Finds the user's instructor and/or course-creator profile, then loads their documents.
 */
export async function fetchUserCredentials(userUuid: string): Promise<CredentialDocument[]> {
  const [instructorsRes, creatorsRes, typesRes] = await Promise.all([
    searchInstructors({ query: { searchParams: { user_uuid: userUuid }, pageable: PAGEABLE } }).catch(
      () => null
    ),
    searchCourseCreators({ query: { searchParams: { user_uuid: userUuid }, pageable: PAGEABLE } }).catch(
      () => null
    ),
    listDocumentTypes().catch(() => null),
  ]);

  const types = (typesRes?.data?.data ?? []) as DocumentTypeOption[];
  const typeMap = new Map(types.filter(t => t.uuid).map(t => [t.uuid as string, t]));

  const instructor = (instructorsRes?.data?.content ?? [])[0] as Instructor | undefined;
  const creator = (creatorsRes?.data?.content ?? [])[0] as CourseCreator | undefined;

  const items: CredentialDocument[] = [];

  if (instructor?.uuid) {
    const docsRes = await getInstructorDocuments({ path: { instructorUuid: instructor.uuid } }).catch(
      () => null
    );
    const documents = (docsRes?.data?.data ?? []) as InstructorDocument[];
    const ownerName = instructor.full_name || 'Instructor';
    for (const document of documents) {
      items.push(mapInstructorDocument(document, instructor.uuid, ownerName, typeMap));
    }
  }

  if (creator?.uuid) {
    const docsRes = await getCourseCreatorDocuments({
      path: { courseCreatorUuid: creator.uuid },
    }).catch(() => null);
    const documents = (docsRes?.data?.data ?? []) as CourseCreatorDocumentDto[];
    const ownerName = creator.full_name || 'Course creator';
    for (const document of documents) {
      items.push(mapCreatorDocument(document, creator.uuid, ownerName, typeMap));
    }
  }

  return items.sort((a, b) => b.uploadedTimestamp - a.uploadedTimestamp);
}

function mapInstructorDocument(
  document: InstructorDocument,
  ownerUuid: string,
  ownerName: string,
  typeMap: Map<string, DocumentTypeOption>
): CredentialDocument {
  const status = instructorStatus(document);
  return {
    id: `instructor-${document.uuid ?? `${ownerUuid}-${document.original_filename}`}`,
    role: 'instructor',
    roleLabel: 'Instructor',
    ownerUuid,
    ownerName,
    documentUuid: document.uuid,
    documentTypeLabel: typeLabel(document.document_type_uuid, typeMap),
    title: document.title || document.original_filename || 'Document',
    fileUrl: document.file_url ?? document.file_path ?? undefined,
    statusLabel: status.label,
    statusTone: status.tone,
    isVerified: status.verified,
    verifiedBy: document.verified_by ?? undefined,
    verifiedAt: formatDate(document.verified_at),
    notes: document.verification_notes ?? undefined,
    fileSize: formatBytes(document.file_size_bytes),
    uploadedAt: formatDate(document.upload_date ?? document.created_date),
    uploadedTimestamp: new Date(document.upload_date ?? document.created_date ?? 0).getTime(),
  };
}

function mapCreatorDocument(
  document: CourseCreatorDocumentDto,
  ownerUuid: string,
  ownerName: string,
  typeMap: Map<string, DocumentTypeOption>
): CredentialDocument {
  const status = creatorStatus(document);
  return {
    id: `course-creator-${document.uuid ?? `${ownerUuid}-${document.original_filename}`}`,
    role: 'course_creator',
    roleLabel: 'Course creator',
    ownerUuid,
    ownerName,
    documentUuid: document.uuid,
    documentTypeLabel: typeLabel(document.document_type_uuid, typeMap),
    title: document.title || document.original_filename || 'Document',
    fileUrl: document.file_url ?? document.file_path ?? undefined,
    statusLabel: status.label,
    statusTone: status.tone,
    isVerified: status.verified,
    verifiedBy: document.verified_by ?? undefined,
    verifiedAt: formatDate(document.verified_at),
    notes: document.verification_notes ?? undefined,
    fileSize: formatBytes(document.file_size_bytes),
    uploadedAt: formatDate(document.created_date),
    uploadedTimestamp: new Date(document.created_date ?? 0).getTime(),
  };
}

/**
 * Build the platform-wide verification queue (server-side). Instructor documents use the
 * batched `instructor_uuid_in` search (one request); course-creator documents are fetched
 * per profile in parallel (no batch endpoint exists). Pending documents are surfaced first.
 */
export async function fetchVerificationQueue(): Promise<CredentialDocument[]> {
  const [instructorsRes, creatorsRes, typesRes] = await Promise.all([
    getAllInstructors({ query: { pageable: PAGEABLE } }).catch(() => null),
    getAllCourseCreators({ query: { pageable: PAGEABLE } }).catch(() => null),
    listDocumentTypes().catch(() => null),
  ]);

  const types = (typesRes?.data?.data ?? []) as DocumentTypeOption[];
  const typeMap = new Map(types.filter(t => t.uuid).map(t => [t.uuid as string, t]));

  const instructors = ((instructorsRes?.data?.data?.content ?? []) as Instructor[]).filter(
    i => i.uuid
  );
  const creators = ((creatorsRes?.data?.data?.content ?? []) as CourseCreator[]).filter(c => c.uuid);

  const instructorNames = new Map(instructors.map(i => [i.uuid as string, i.full_name || 'Instructor']));

  const items: CredentialDocument[] = [];

  // Instructor documents — one batched search.
  if (instructors.length > 0) {
    const csv = instructors.map(i => i.uuid).join(',');
    const docsRes = await searchDocuments({
      query: { searchParams: { instructor_uuid_in: csv }, pageable: { page: 0, size: 1000 } },
    }).catch(() => null);
    const documents = (docsRes?.data?.data?.content ?? []) as unknown as InstructorDocument[];
    for (const document of documents) {
      const ownerUuid = document.instructor_uuid;
      if (!ownerUuid) continue;
      items.push(
        mapInstructorDocument(document, ownerUuid, instructorNames.get(ownerUuid) ?? 'Instructor', typeMap)
      );
    }
  }

  // Course-creator documents — parallel per profile (no batch endpoint).
  const creatorDocs = await Promise.all(
    creators.map(creator =>
      getCourseCreatorDocuments({ path: { courseCreatorUuid: creator.uuid as string } })
        .then(res => ({ creator, documents: (res.data?.data ?? []) as CourseCreatorDocumentDto[] }))
        .catch(() => ({ creator, documents: [] as CourseCreatorDocumentDto[] }))
    )
  );
  for (const { creator, documents } of creatorDocs) {
    for (const document of documents) {
      items.push(
        mapCreatorDocument(document, creator.uuid as string, creator.full_name || 'Course creator', typeMap)
      );
    }
  }

  // Pending first, then newest.
  const rank = (item: CredentialDocument) => (item.statusTone === 'warning' ? 0 : item.isVerified ? 2 : 1);
  return items.sort((a, b) => rank(a) - rank(b) || b.uploadedTimestamp - a.uploadedTimestamp);
}

/* ------------------------------------------------------------------ *
 * Per-domain verification profile (powers the rich User-360 view)     *
 * ------------------------------------------------------------------ */

/** A normalized education / experience / membership record for display. */
export interface CredentialRecord {
  id: string;
  title: string;
  subtitle?: string;
  details: Array<{ label: string; value: string }>;
}

/** All verification context for a single domain a user holds. */
export interface DomainVerification {
  role: CredentialRole;
  roleLabel: string;
  profileUuid: string;
  fullName: string;
  headline?: string;
  location?: string;
  /** Domain-level verification status (admin-verified instructor / course creator). */
  adminVerified: boolean;
  documents: CredentialDocument[];
  education: CredentialRecord[];
  experience: CredentialRecord[];
  memberships: CredentialRecord[];
  /** Skills declared on the profile (name · proficiency). */
  skills: string[];
  /** Professional certifications (course-creator profiles). */
  certifications: CredentialRecord[];
  /** Reviews left by students. */
  reviews: CredentialRecord[];
  /** Average review rating (out of 5), when any reviews exist. */
  averageRating?: number;
  reviewCount: number;
  /** Authored content — courses for instructors, programs for course creators. */
  content: CredentialRecord[];
  contentLabel: string;
}

interface RawEducation {
  uuid?: string;
  qualification?: string | null;
  school_name?: string | null;
  field_of_study?: string | null;
  year_completed?: number | string | null;
  certificate_number?: string | null;
}
interface RawExperience {
  uuid?: string;
  position?: string | null;
  organisation_name?: string | null;
  responsibilities?: string | null;
  years_of_experience?: number | string | null;
  start_date?: Date | string | null;
  end_date?: Date | string | null;
  is_current_position?: boolean | null;
}
interface RawMembership {
  uuid?: string;
  organisation_name?: string | null;
  membership_number?: string | null;
  start_date?: Date | string | null;
  end_date?: Date | string | null;
  is_active?: boolean | null;
}

function year(value?: number | string | Date | null): string {
  if (value == null || value === '') return '—';
  if (typeof value === 'number') return String(value);
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : String(parsed.getFullYear());
}

function period(start?: Date | string | null, end?: Date | string | null, current?: boolean | null): string {
  const fmt = (v?: Date | string | null) => {
    if (!v) return undefined;
    const d = v instanceof Date ? v : new Date(v);
    return Number.isNaN(d.getTime()) ? undefined : d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  };
  return [fmt(start), current ? 'Present' : fmt(end)].filter(Boolean).join(' – ') || '—';
}

function mapEducation(record: RawEducation): CredentialRecord {
  return {
    id: `edu-${record.uuid}`,
    title: record.qualification || 'Education',
    subtitle: record.school_name || undefined,
    details: [
      { label: 'Field of study', value: record.field_of_study || '—' },
      { label: 'Year completed', value: year(record.year_completed) },
      { label: 'Certificate no.', value: record.certificate_number || '—' },
    ],
  };
}

function mapExperience(record: RawExperience): CredentialRecord {
  return {
    id: `exp-${record.uuid}`,
    title: record.position || 'Experience',
    subtitle: record.organisation_name || undefined,
    details: [
      { label: 'Period', value: period(record.start_date, record.end_date, record.is_current_position) },
      { label: 'Years', value: year(record.years_of_experience) },
      { label: 'Responsibilities', value: record.responsibilities || '—' },
    ],
  };
}

function mapMembership(record: RawMembership): CredentialRecord {
  return {
    id: `mem-${record.uuid}`,
    title: record.organisation_name || 'Membership',
    subtitle: record.membership_number ? `No. ${record.membership_number}` : undefined,
    details: [
      { label: 'Period', value: period(record.start_date, record.end_date) },
      { label: 'Status', value: record.is_active ? 'Active' : 'Inactive' },
    ],
  };
}

function mapReview(record: InstructorReview): CredentialRecord {
  return {
    id: `rev-${record.uuid}`,
    title: record.headline || `Rated ${record.rating}/5`,
    subtitle: record.comments || undefined,
    details: [
      { label: 'Rating', value: `${record.rating}/5` },
      { label: 'Date', value: formatDate(record.created_date) || '—' },
    ],
  };
}

function mapCertification(record: CourseCreatorCertification): CredentialRecord {
  return {
    id: `cert-${record.uuid}`,
    title: record.certification_name || 'Certification',
    subtitle: record.issuing_organisation || undefined,
    details: [
      { label: 'Issued', value: formatDate(record.issued_date) || '—' },
      { label: 'Expires', value: formatDate(record.expiry_date) || '—' },
      { label: 'Credential ID', value: record.credential_id || '—' },
      {
        label: 'Status',
        value: record.is_verified ? 'Verified' : record.is_expired ? 'Expired' : 'Unverified',
      },
    ],
  };
}

function mapCourseContent(record: Course): CredentialRecord {
  return {
    id: `course-${record.uuid}`,
    title: record.name || 'Course',
    subtitle: record.category_names?.length ? record.category_names.join(', ') : undefined,
    details: [
      { label: 'Status', value: record.status ? String(record.status) : '—' },
      { label: 'Published', value: record.is_published ? 'Yes' : 'No' },
    ],
  };
}

function mapProgramContent(record: TrainingProgram): CredentialRecord {
  return {
    id: `program-${record.uuid}`,
    title: record.title || 'Program',
    details: [
      { label: 'Status', value: record.status ? String(record.status) : '—' },
      { label: 'Published', value: record.published ? 'Yes' : 'No' },
    ],
  };
}

function skillLabel(name?: string | null, proficiency?: string | null): string {
  const label = (name || '').trim();
  const level = (proficiency || '').replace(/_/g, ' ').trim();
  if (label && level) return `${label} · ${level.toLowerCase()}`;
  return label || level || 'Skill';
}

function average(values: number[]): number | undefined {
  if (!values.length) return undefined;
  const sum = values.reduce((total, value) => total + value, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

function listOf<T>(payload: unknown): T[] {
  const data = (payload as { data?: { data?: unknown } })?.data?.data;
  if (Array.isArray(data)) return data as T[];
  const content = (data as { content?: unknown })?.content;
  return Array.isArray(content) ? (content as T[]) : [];
}

/**
 * Fetch the full per-domain verification profile for a user: their instructor and/or
 * course-creator profiles, each with documents, education, experience, and memberships,
 * plus the domain-level admin-verified status. Each domain verifies independently.
 */
export async function fetchUserVerification(userUuid: string): Promise<DomainVerification[]> {
  const [instructorsRes, creatorsRes, typesRes] = await Promise.all([
    searchInstructors({ query: { searchParams: { user_uuid: userUuid }, pageable: PAGEABLE } }).catch(() => null),
    searchCourseCreators({ query: { searchParams: { user_uuid: userUuid }, pageable: PAGEABLE } }).catch(() => null),
    listDocumentTypes().catch(() => null),
  ]);

  const types = (typesRes?.data?.data ?? []) as DocumentTypeOption[];
  const typeMap = new Map(types.filter(t => t.uuid).map(t => [t.uuid as string, t]));

  const instructor = (instructorsRes?.data?.content ?? [])[0] as Instructor | undefined;
  const creator = (creatorsRes?.data?.content ?? [])[0] as CourseCreator | undefined;

  const domains: DomainVerification[] = [];

  if (instructor?.uuid) {
    const uuid = instructor.uuid;
    const [docsRes, eduRes, expRes, memRes, skillRes, reviewRes, courseRes] = await Promise.all([
      getInstructorDocuments({ path: { instructorUuid: uuid } }).catch(() => null),
      getInstructorEducation({ path: { instructorUuid: uuid } }).catch(() => null),
      getInstructorExperience({ path: { instructorUuid: uuid }, query: { pageable: PAGEABLE } }).catch(() => null),
      getInstructorMemberships({ path: { instructorUuid: uuid }, query: { pageable: PAGEABLE } }).catch(() => null),
      getInstructorSkills({ path: { instructorUuid: uuid }, query: { pageable: PAGEABLE } }).catch(() => null),
      getInstructorReviews({ path: { instructorUuid: uuid } }).catch(() => null),
      getCoursesByInstructor({ path: { instructorUuid: uuid }, query: { pageable: PAGEABLE } }).catch(() => null),
    ]);
    const ownerName = instructor.full_name || 'Instructor';
    const reviews = ((reviewRes?.data?.data ?? []) as InstructorReview[]) ?? [];
    domains.push({
      role: 'instructor',
      roleLabel: 'Instructor',
      profileUuid: uuid,
      fullName: ownerName,
      headline: instructor.professional_headline ?? undefined,
      location: instructor.formatted_location ?? undefined,
      adminVerified: Boolean(instructor.admin_verified),
      documents: ((docsRes?.data?.data ?? []) as InstructorDocument[]).map(d =>
        mapInstructorDocument(d, uuid, ownerName, typeMap)
      ),
      education: listOf<RawEducation>(eduRes).map(mapEducation),
      experience: listOf<RawExperience>(expRes).map(mapExperience),
      memberships: listOf<RawMembership>(memRes).map(mapMembership),
      skills: listOf<InstructorSkill>(skillRes).map(s =>
        skillLabel(s.display_name || s.skill_name, s.proficiency_description || s.proficiency_level)
      ),
      certifications: [],
      reviews: reviews.map(mapReview),
      averageRating: average(reviews.map(r => r.rating).filter(n => typeof n === 'number')),
      reviewCount: reviews.length,
      content: listOf<Course>(courseRes).map(mapCourseContent),
      contentLabel: 'Courses taught',
    });
  }

  if (creator?.uuid) {
    const uuid = creator.uuid;
    const [docsRes, eduRes, expRes, memRes, skillRes, certRes, programRes] = await Promise.all([
      getCourseCreatorDocuments({ path: { courseCreatorUuid: uuid } }).catch(() => null),
      getCourseCreatorEducation({ path: { courseCreatorUuid: uuid }, query: { pageable: PAGEABLE } }).catch(() => null),
      getCourseCreatorExperience({ path: { courseCreatorUuid: uuid }, query: { pageable: PAGEABLE } }).catch(() => null),
      getCourseCreatorMemberships({ path: { courseCreatorUuid: uuid }, query: { pageable: PAGEABLE } }).catch(() => null),
      getCourseCreatorSkills({ path: { courseCreatorUuid: uuid }, query: { pageable: PAGEABLE } }).catch(() => null),
      getCourseCreatorCertifications({ path: { courseCreatorUuid: uuid }, query: { pageable: PAGEABLE } }).catch(() => null),
      getProgramsByCourseCreator({ path: { courseCreatorUuid: uuid }, query: { pageable: PAGEABLE } }).catch(() => null),
    ]);
    const ownerName = creator.full_name || 'Course creator';
    domains.push({
      role: 'course_creator',
      roleLabel: 'Course creator',
      profileUuid: uuid,
      fullName: ownerName,
      headline: creator.professional_headline ?? undefined,
      location: undefined,
      adminVerified: Boolean(creator.admin_verified),
      documents: ((docsRes?.data?.data ?? []) as CourseCreatorDocumentDto[]).map(d =>
        mapCreatorDocument(d, uuid, ownerName, typeMap)
      ),
      education: listOf<RawEducation>(eduRes).map(mapEducation),
      experience: listOf<RawExperience>(expRes).map(mapExperience),
      memberships: listOf<RawMembership>(memRes).map(mapMembership),
      skills: listOf<CourseCreatorSkill>(skillRes).map(s =>
        skillLabel(s.display_name || s.skill_name, s.proficiency_description || s.proficiency_level)
      ),
      certifications: listOf<CourseCreatorCertification>(certRes).map(mapCertification),
      reviews: [],
      averageRating: undefined,
      reviewCount: 0,
      content: listOf<TrainingProgram>(programRes).map(mapProgramContent),
      contentLabel: 'Programs authored',
    });
  }

  return domains;
}
