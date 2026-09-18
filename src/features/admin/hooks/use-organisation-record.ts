'use client';
// admin-boundary: foundation

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { extractEntity, extractList, extractPage } from '@/lib/api-helpers';
import type {
  DocumentTypeOption,
  Organisation,
  OrganisationDashboardStats,
  OrganisationDocument,
  TrainingBranch,
} from '@/services/client';
import {
  getOrganisationByUuidOptions,
  getOrganisationDocumentsOptions,
  getOrganisationStatisticsOptions,
  getTrainingBranchesByOrganisationOptions,
  listDocumentTypesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { configQuery, listQuery } from '../lib/admin-queries';

const BRANCH_PAGE = { page: 0, size: 20 };

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
