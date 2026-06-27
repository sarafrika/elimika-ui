import type {
  ClassDefinitionResponse,
  TrainingBranch,
  User,
} from '@/services/client';
import {
  getClassDefinitionsForOrganisation,
  getTrainingBranchesByOrganisation,
  getUsersByOrganisation,
} from '@/services/client';
import type { ClassSummary } from './user-profile-360';

const PAGEABLE = { page: 0, size: 200 };

function formatDate(value?: Date | string | null): string | undefined {
  if (!value) return undefined;
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function humanize(value?: string | null): string | undefined {
  if (!value) return undefined;
  return String(value).replace(/_/g, ' ').toLowerCase();
}

/* ------------------------------------------------------------------ *
 * Branches                                                            *
 * ------------------------------------------------------------------ */

export interface OrgBranch {
  uuid: string;
  name: string;
  address?: string;
  pocName?: string;
  pocEmail?: string;
  pocPhone?: string;
  active: boolean;
}

export async function fetchOrganisationBranches(organisationUuid: string): Promise<OrgBranch[]> {
  const res = await getTrainingBranchesByOrganisation({
    path: { uuid: organisationUuid },
    query: { pageable: PAGEABLE },
  }).catch(() => null);

  const rows = (res?.data?.data?.content ?? []) as TrainingBranch[];
  return rows
    .filter(branch => branch.uuid)
    .map(branch => ({
      uuid: branch.uuid as string,
      name: branch.branch_name || 'Branch',
      address: branch.address ?? undefined,
      pocName: branch.poc_name || undefined,
      pocEmail: branch.poc_email || undefined,
      pocPhone: branch.poc_telephone || undefined,
      active: Boolean(branch.active),
    }));
}

/* ------------------------------------------------------------------ *
 * Members                                                             *
 * ------------------------------------------------------------------ */

export interface OrgMember {
  userUuid?: string;
  name: string;
  email?: string;
  domain?: string;
  branch?: string;
  active: boolean;
  joined?: string;
}

export async function fetchOrganisationMembers(organisationUuid: string): Promise<OrgMember[]> {
  const res = await getUsersByOrganisation({
    path: { uuid: organisationUuid },
    query: { pageable: PAGEABLE },
  }).catch(() => null);

  const rows = (res?.data?.data?.content ?? []) as User[];
  return rows.map(user => {
    const affiliation = user.organisation_affiliations?.find(
      item => item.organisation_uuid === organisationUuid
    );
    return {
      userUuid: user.uuid,
      name: user.full_name || `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || 'Member',
      email: user.email || undefined,
      domain: humanize(affiliation?.domain_in_organisation),
      branch: affiliation?.branch_name || undefined,
      active: affiliation ? Boolean(affiliation.active) : Boolean(user.active),
      joined: formatDate(affiliation?.affiliated_date ?? user.created_date),
    };
  });
}

/* ------------------------------------------------------------------ *
 * Classes offered by the organisation                                 *
 * ------------------------------------------------------------------ */

export async function fetchOrganisationClasses(organisationUuid: string): Promise<ClassSummary[]> {
  const res = await getClassDefinitionsForOrganisation({
    path: { organisationUuid },
  }).catch(() => null);

  const rows = (res?.data?.data ?? []) as ClassDefinitionResponse[];
  return rows
    .map(row => row.class_definition)
    .filter((cd): cd is NonNullable<typeof cd> => Boolean(cd?.uuid))
    .map(cd => ({
      uuid: cd.uuid as string,
      title: cd.title || 'Class',
      courseUuid: cd.course_uuid ?? undefined,
      sessionFormat: humanize(cd.session_format),
      locationType: humanize(cd.location_type),
      maxParticipants: cd.max_participants ?? undefined,
      isActive: Boolean(cd.is_active),
      startTime: formatDate(cd.default_start_time),
    }));
}
