'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { APPROVAL_QUERY_FRESHNESS, STALE_TIMES } from '@/lib/query-client';
import {
  listAchievementsOptions, listCertificationsOptions, listCompetenciesOptions,
  listDocumentsOptions, listEducationOptions, listExperienceOptions, listPortfolioOptions, listSkillsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { UserDocument } from '@/services/client/types.gen';
import { PROFILE_SUMMARY_QUERY_KEY, PROFILE_WALLET_QUERY_KEYS } from '../lib/profile-wallet-api';
import { requireApiData } from '../lib/user-onboarding';
import { walletSection, type WalletSectionKey } from '../lib/wallet-sections';
import { creatorOnboardingQueryKey } from './useCourseCreatorOnboarding';

export type WalletRecord = {
  section: Exclude<WalletSectionKey, 'verification'>;
  uuid?: string;
  title: string;
  values: Record<string, string>;
  status: 'Pending' | 'Verified' | 'Rejected' | 'Expired' | null;
  statusBasis: 'record' | 'evidence' | 'unavailable';
  verifiedAt?: Date;
  notes?: string;
  updatedAt?: Date;
  document?: UserDocument;
};

function valuesFor(section: WalletSectionKey, item: Record<string, unknown>) {
  const values: Record<string, string> = {};
  for (const field of walletSection(section).fields) {
    const value = item[field.key];
    values[field.key] = value instanceof Date
      ? Number.isFinite(value.getTime()) ? value.toISOString().slice(0, 10) : ''
      : value === undefined || value === null ? '' : String(value);
  }
  return values;
}

function status(value?: string): WalletRecord['status'] {
  if (value === 'VERIFIED' || value === 'Approved') return 'Verified';
  if (value === 'REJECTED' || value === 'Rejected') return 'Rejected';
  if (value === 'Expired') return 'Expired';
  return 'Pending';
}

function toRecord(
  section: WalletRecord['section'],
  item: Record<string, unknown> & { uuid?: string; updated_date?: Date; created_date?: Date },
  verification?: { verification_status?: string; verified_at?: Date; verification_notes?: string },
): WalletRecord {
  const values = valuesFor(section, item);
  return {
    section, uuid: item.uuid, title: values[walletSection(section).titleField] || walletSection(section).label,
    values, status: verification ? status(verification.verification_status) : null,
    statusBasis: verification ? 'record' : 'unavailable',
    verifiedAt: verification?.verified_at, notes: verification?.verification_notes,
    updatedAt: item.updated_date ?? item.created_date,
  };
}

function withEvidence(record: WalletRecord, documents: UserDocument[]): WalletRecord {
  if (!documents.length) return record;
  const rejected = documents.find(document => document.status === 'Rejected');
  const expired = documents.find(document => document.status === 'Expired');
  const pending = documents.find(document => !document.is_verified && document.status !== 'Approved');
  const decision = rejected || expired || pending || documents[0];
  return {
    ...record, statusBasis: 'evidence',
    status: rejected ? 'Rejected' : expired ? 'Expired' : pending ? 'Pending' : 'Verified',
    verifiedAt: decision?.verified_at, notes: decision?.verification_notes,
  };
}

export function useProfileWallet(tab: WalletSectionKey, enabled: boolean) {
  const queryClient = useQueryClient();
  const active = (section: WalletSectionKey) => enabled && (section === tab || tab === 'verification');
  const freshness = {
    staleTime: STALE_TIMES.live, ...APPROVAL_QUERY_FRESHNESS,
    ...(tab === 'verification' ? { refetchOnMount: 'always' as const } : {}),
  };
  const skills = useQuery({ ...listSkillsOptions(), select: requireApiData, enabled: active('skills'), ...freshness });
  const education = useQuery({ ...listEducationOptions(), select: requireApiData, enabled: active('education'), ...freshness });
  const portfolio = useQuery({ ...listPortfolioOptions(), select: requireApiData, enabled: active('portfolio'), ...freshness });
  const credentials = useQuery({ ...listCertificationsOptions(), select: requireApiData, enabled: active('credentials'), ...freshness });
  const competencies = useQuery({ ...listCompetenciesOptions(), select: requireApiData, enabled: active('competencies'), ...freshness });
  const experience = useQuery({ ...listExperienceOptions(), select: requireApiData, enabled: active('experience'), ...freshness });
  const achievements = useQuery({ ...listAchievementsOptions(), select: requireApiData, enabled: active('achievements'), ...freshness });
  const documents = useQuery({
    ...listDocumentsOptions(), select: requireApiData,
    enabled: enabled && ['education', 'experience', 'credentials', 'verification'].includes(tab), ...freshness,
  });
  const queries = { skills, education, portfolio, credentials, competencies, experience, achievements, documents };
  const selectedQueries = tab === 'verification' ? Object.values(queries)
    : tab === 'education' || tab === 'experience' || tab === 'credentials' ? [queries[tab], documents] : [queries[tab]];

  const records = useMemo(() => {
    const evidence = new Map<string, UserDocument[]>();
    for (const document of documents.data ?? []) {
      const related = document.education_uuid || document.experience_uuid;
      if (related) evidence.set(related, [...(evidence.get(related) ?? []), document]);
    }
    const items: WalletRecord[] = [
      ...(skills.data ?? []).map(item => toRecord('skills', item, item)),
      ...(education.data ?? []).map(item => withEvidence(toRecord('education', item), item.uuid ? evidence.get(item.uuid) ?? [] : [])),
      ...(portfolio.data ?? []).map(item => toRecord('portfolio', item)),
      ...(credentials.data ?? []).map(item => toRecord('credentials', item, item)),
      ...(competencies.data ?? []).map(item => toRecord('competencies', item, item)),
      ...(experience.data ?? []).map(item => withEvidence(toRecord('experience', item), item.uuid ? evidence.get(item.uuid) ?? [] : [])),
      ...(achievements.data ?? []).map(item => toRecord('achievements', item)),
      ...(documents.data ?? []).map((document): WalletRecord => ({
        section: 'credentials', uuid: document.uuid,
        title: document.title || document.original_filename || 'Evidence document', values: {}, document,
        status: document.is_verified ? 'Verified' : status(document.status), statusBasis: 'record',
        verifiedAt: document.verified_at, notes: document.verification_notes,
        updatedAt: document.updated_date ?? document.upload_date,
      })),
    ];
    return items;
  }, [skills.data, education.data, portfolio.data, credentials.data, competencies.data, experience.data, achievements.data, documents.data]);

  const refresh = async () => {
    await Promise.all(selectedQueries.map(query => query.refetch()));
  };
  const invalidate = async (section: Exclude<WalletSectionKey, 'verification'>) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: PROFILE_WALLET_QUERY_KEYS[section] }),
      queryClient.invalidateQueries({ queryKey: PROFILE_SUMMARY_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: creatorOnboardingQueryKey() }),
    ]);
  };
  return {
    records, refresh, invalidate,
    isLoading: selectedQueries.some(query => query.isPending),
    failed: selectedQueries.some(query => query.isError),
    isFetching: selectedQueries.some(query => query.isFetching),
  };
}
