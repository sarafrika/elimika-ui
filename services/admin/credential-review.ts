import 'server-only';
import {
  getAllCourseCreators,
  getAllInstructors,
  getCourseCreatorDocuments,
  getInstructorDocuments,
  listDocumentTypes,
  searchCourseCreators,
  searchDocuments,
  searchInstructors,
} from '@/services/client';
import type {
  CourseCreator,
  CourseCreatorDocumentDto,
  DocumentTypeOption,
  Instructor,
  InstructorDocument,
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
    const documents = (docsRes?.data?.content ?? []) as unknown as InstructorDocument[];
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
