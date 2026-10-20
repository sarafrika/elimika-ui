'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useUserProfile } from '@/context/profile-context';
import { extractEntity, extractList } from '@/lib/api-helpers';
import type { SkillsFundSource, SkillsFundSummary, SkillsFundTransaction } from '@/services/client';
import {
  getSummary2Options,
  listSourcesOptions,
  listTransactionsOptions,
} from '@/services/client/@tanstack/react-query.gen';

/** The Skills Fund of the caller's active (or first) organisation affiliation. */
export function useSkillsFundData() {
  const profile = useUserProfile();
  const affiliation = useMemo(
    () => profile?.organisation_affiliations?.find(item => item.active) ?? profile?.organisation_affiliations?.[0] ?? null,
    [profile?.organisation_affiliations]
  );
  const organisationUuid = affiliation?.organisation_uuid ?? '';
  const path = { path: { organisationUuid } };
  const enabled = Boolean(organisationUuid);

  const summaryQuery = useQuery({ ...getSummary2Options(path), enabled });
  const sourcesQuery = useQuery({ ...listSourcesOptions(path), enabled });
  const transactionsQuery = useQuery({ ...listTransactionsOptions(path), enabled });

  const summary = extractEntity<SkillsFundSummary>(summaryQuery.data);
  return {
    userUuid: profile?.uuid ?? null,
    organisationUuid: organisationUuid || null,
    organisationName: affiliation?.organisation_name ?? 'your organisation',
    currencyCode: summary?.currency_code ?? 'KES',
    summary,
    sources: extractList<SkillsFundSource>(sourcesQuery.data),
    transactions: extractList<SkillsFundTransaction>(transactionsQuery.data),
    profileLoading: profile?.isLoading === true,
    summaryLoading: summaryQuery.isLoading,
    sourcesLoading: sourcesQuery.isLoading,
    transactionsLoading: transactionsQuery.isLoading,
  };
}
