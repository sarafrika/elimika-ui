'use client';
// admin-boundary: foundation

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { extractEntity, extractList, extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import { toNumber } from '@/lib/metrics';
import type {
  ClassDefinition,
  DocumentTypeOption,
  InstructorObligation,
  OrgInstructorSummary,
  Organisation,
  OrganisationDashboardStats,
  OrganisationDocument,
  OrganisationInvitation,
  SchemaEnum6Writable,
  SkillsFundSummary,
  TrainingBranch,
  User,
} from '@/services/client';
import {
  getClassDefinitionsForOrganisationOptions,
  getClassEnrolmentCountsOptions,
  getInstructorPayablesForOrganisationOptions,
  getMonthlySettlementsOptions,
  getOrganisationByUuidOptions,
  getOrganisationDocumentsOptions,
  getOrganisationInstructorSummariesOptions,
  getOrganisationStatisticsOptions,
  getSummaryOptions,
  getTrainingBranchesByOrganisationOptions,
  getUsersByOrganisationOptions,
  listDocumentTypesOptions,
  listObligationsOptions,
  listOrganisationInvitationsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { InstructorPayable, MonthlySettlement } from '../components/finance-tab';
import { configQuery, listQuery } from '../lib/admin-queries';

const BRANCH_PAGE = { page: 0, size: 20 };
export const MEMBER_PAGE_SIZE = 20;

/** The organisation record itself — the one read every tab needs. */
export function useOrganisation(uuid: string) {
  const query = useQuery({
    ...getOrganisationByUuidOptions({ path: { uuid } }),
    ...listQuery,
    enabled: Boolean(uuid),
  });

  const organisation = useMemo(() => extractEntity<Organisation>(query.data), [query.data]);
  return { organisation, query };
}

/**
 * Membership counts. The endpoint builds three full member lists server-side, so only
 * the tabs that show these numbers ask for them.
 */
export function useOrganisationStatistics(uuid: string, enabled = true) {
  const query = useQuery({
    ...getOrganisationStatisticsOptions({ path: { uuid } }),
    ...listQuery,
    enabled: Boolean(uuid) && enabled,
  });

  const statistics = useMemo(
    () => extractEntity<OrganisationDashboardStats>(query.data),
    [query.data]
  );
  return { statistics, query };
}

/** Evidence the organisation uploaded for verification. */
export function useOrganisationDocuments(uuid: string, enabled = true) {
  const query = useQuery({
    ...getOrganisationDocumentsOptions({ path: { uuid } }),
    ...listQuery,
    enabled: Boolean(uuid) && enabled,
  });

  const documents = useMemo(() => extractList<OrganisationDocument>(query.data), [query.data]);
  return { documents, query };
}

/** Branches, used to check that the organisation's locations are real. */
export function useOrganisationBranches(uuid: string, enabled = true) {
  const query = useQuery({
    ...getTrainingBranchesByOrganisationOptions({
      path: { uuid },
      query: { pageable: BRANCH_PAGE },
    }),
    ...listQuery,
    enabled: Boolean(uuid) && enabled,
  });

  const branches = useMemo(() => extractPage<TrainingBranch>(query.data).items, [query.data]);
  return { branches, query };
}

/** Members, paged, with their role and branch carried on each affiliation. */
export function useOrganisationMembers(uuid: string, page: number, enabled = true) {
  const query = useQuery({
    ...getUsersByOrganisationOptions({
      path: { uuid },
      query: { pageable: { page, size: MEMBER_PAGE_SIZE } },
    }),
    ...listQuery,
    enabled: Boolean(uuid) && enabled,
  });

  const { members, totalRows, pageCount } = useMemo(() => {
    const { items, metadata } = extractPage<User>(query.data);
    return {
      members: items,
      totalRows: getTotalFromMetadata(metadata),
      pageCount: metadata.totalPages ?? 1,
    };
  }, [query.data]);

  return { members, totalRows, pageCount, query };
}

/** Invitations sent but not yet accepted. */
export function useOrganisationInvitations(uuid: string, enabled = true) {
  const query = useQuery({
    ...listOrganisationInvitationsOptions({ path: { organisationUuid: uuid } }),
    ...listQuery,
    enabled: Boolean(uuid) && enabled,
  });

  const invitations = useMemo(() => extractList<OrganisationInvitation>(query.data), [query.data]);
  return { invitations, query };
}

/** Classes this organisation runs. */
export function useOrganisationClasses(uuid: string, enabled = true) {
  const query = useQuery({
    ...getClassDefinitionsForOrganisationOptions({ path: { organisationUuid: uuid } }),
    ...listQuery,
    enabled: Boolean(uuid) && enabled,
  });

  // The list endpoint wraps each definition; unwrap to the class itself.
  const classes = useMemo(() => {
    const items = extractList<{ class_definition?: ClassDefinition } | ClassDefinition>(query.data);
    return items.map(item =>
      'class_definition' in item && item.class_definition
        ? item.class_definition
        : (item as ClassDefinition)
    );
  }, [query.data]);

  return { classes, query };
}

/** Enrolled counts for every class in one query, keyed by class uuid. */
export function useOrganisationEnrolmentCounts(uuid: string, enabled = true) {
  const query = useQuery({
    ...getClassEnrolmentCountsOptions({ path: { organisationUuid: uuid } }),
    ...listQuery,
    enabled: Boolean(uuid) && enabled,
  });

  const counts = useMemo(() => {
    const rows = extractList<{ class_definition_uuid?: string; enrolled?: number }>(query.data);
    return Object.fromEntries(
      rows.map(row => [row.class_definition_uuid ?? '', toNumber(row.enrolled)])
    );
  }, [query.data]);

  return { counts, query };
}

/** Instructors with their qualification and rating, already denormalised server-side. */
export function useOrganisationInstructors(uuid: string, enabled = true) {
  const query = useQuery({
    ...getOrganisationInstructorSummariesOptions({ path: { organisationUuid: uuid } }),
    ...listQuery,
    enabled: Boolean(uuid) && enabled,
  });

  const instructors = useMemo(() => extractList<OrgInstructorSummary>(query.data), [query.data]);
  return { instructors, query };
}

/** What the organisation owes instructors for delivered sessions. */
export function useOrganisationObligations(uuid: string, status: string, enabled = true) {
  const query = useQuery({
    ...listObligationsOptions({
      path: { organisationUuid: uuid },
      query: {
        pageable: { page: 0, size: 50 },
        ...(status && status !== 'any' ? { status: status as SchemaEnum6Writable } : {}),
      },
    }),
    ...listQuery,
    enabled: Boolean(uuid) && enabled,
  });

  const obligations = useMemo(
    () => extractPage<InstructorObligation>(query.data).items,
    [query.data]
  );
  return { obligations, query };
}

/** Settlements per month, for the last half year. */
export function useOrganisationSettlements(uuid: string, enabled = true) {
  const query = useQuery({
    ...getMonthlySettlementsOptions({
      path: { organisationUuid: uuid },
      query: { months: 6 },
    }),
    ...listQuery,
    enabled: Boolean(uuid) && enabled,
  });

  const settlements = useMemo(() => extractList<MonthlySettlement>(query.data), [query.data]);
  return { settlements, query };
}

/** Outstanding against settled, per instructor. */
export function useOrganisationPayables(uuid: string, enabled = true) {
  const query = useQuery({
    ...getInstructorPayablesForOrganisationOptions({ path: { organisationUuid: uuid } }),
    ...listQuery,
    enabled: Boolean(uuid) && enabled,
  });

  const payables = useMemo(() => extractList<InstructorPayable>(query.data), [query.data]);
  return { payables, query };
}

/** Skills fund balances, read-only here. */
export function useOrganisationSkillsFund(uuid: string, enabled = true) {
  const query = useQuery({
    ...getSummaryOptions({ path: { organisationUuid: uuid } }),
    ...listQuery,
    enabled: Boolean(uuid) && enabled,
  });

  const skillsFund = useMemo(() => extractEntity<SkillsFundSummary>(query.data), [query.data]);
  return { skillsFund, query };
}

/** What the organisation was asked to upload, so a missing document is visible. */
export function useDocumentTypes(appliesTo: string, enabled = true) {
  const query = useQuery({
    ...listDocumentTypesOptions({ query: { applies_to: appliesTo } }),
    ...configQuery,
    enabled,
  });

  const documentTypes = useMemo(() => extractList<DocumentTypeOption>(query.data), [query.data]);
  return { documentTypes, query };
}
