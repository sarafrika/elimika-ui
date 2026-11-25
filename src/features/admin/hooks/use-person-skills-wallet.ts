'use client';

import { useQuery } from '@tanstack/react-query';
import { formatDateOnly } from '@/lib/date';
import {
  achievementsOptions,
  certificationsOptions,
  competenciesOptions,
  experienceOptions,
  portfolioOptions,
  skillsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { WalletSectionKey } from '@/src/features/onboarding/lib/registration-steps';
import { listQuery } from '../lib/admin-queries';

export type WalletDetail = { label: string; value?: string; link?: boolean };
export type PersonWalletEntry = {
  uuid?: string;
  title: string;
  status?: string;
  notes?: string;
  fields: WalletDetail[];
};

const date = (value?: Date) => (value ? formatDateOnly(value) : undefined);
const label = (value?: string) =>
  value
    ?.replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, character => character.toUpperCase());

function entries<T>(
  response: { data?: T[]; error?: unknown; success?: boolean; message?: string },
  map: (item: T) => PersonWalletEntry
): PersonWalletEntry[] {
  if (response.error || response.success === false)
    throw new Error(response.message || 'Unable to load this skills wallet section.');
  return (response.data ?? []).map(map);
}

/** Each read is scoped to this applicant. Sections load only when opened. */
export function usePersonSkillsWallet(userUuid: string, tab: WalletSectionKey) {
  const options = { path: { userUuid } };
  return [
    useQuery({
      ...skillsOptions(options),
      ...listQuery,
      enabled: !!userUuid && (tab === 'skills' || tab === 'verification'),
      select: response =>
        entries(response, item => ({
          uuid: item.uuid,
          title: item.skill_name,
          status: item.verification_status,
          notes: item.verification_notes,
          fields: [
            { label: 'Proficiency level', value: label(item.proficiency_level) },
            { label: 'Evidence', value: item.evidence, link: true },
            { label: 'Last assessed date', value: date(item.last_assessed_on) },
            { label: 'Source programme', value: item.source_program_title },
            { label: 'Verified on', value: date(item.verified_at) },
            { label: 'Verification notes', value: item.verification_notes },
          ],
        })),
    }),
    useQuery({
      ...portfolioOptions(options),
      ...listQuery,
      enabled: !!userUuid && tab === 'portfolio',
      select: response =>
        entries(response, item => ({
          uuid: item.uuid,
          title: item.title,
          fields: [
            { label: 'Type', value: label(item.item_type) },
            { label: 'Media or evidence link', value: item.link_url, link: true },
            { label: 'Date', value: date(item.completed_on) },
            { label: 'Description', value: item.description },
          ],
        })),
    }),
    useQuery({
      ...certificationsOptions(options),
      ...listQuery,
      enabled: !!userUuid && (tab === 'credentials' || tab === 'verification'),
      select: response =>
        entries(response, item => ({
          uuid: item.uuid,
          title: item.certification_name,
          status: item.verification_status,
          notes: item.verification_notes,
          fields: [
            { label: 'Type', value: label(item.credential_type) },
            { label: 'Issuer', value: item.issuing_organization },
            { label: 'Issued on', value: date(item.issued_date) },
            { label: 'Expires on', value: date(item.expiry_date) },
            { label: 'Credential ID', value: item.credential_id },
            { label: 'Credential link', value: item.credential_url, link: true },
            { label: 'Description', value: item.description },
            { label: 'Verified on', value: date(item.verified_at) },
            { label: 'Verification notes', value: item.verification_notes },
          ],
        })),
    }),
    useQuery({
      ...competenciesOptions(options),
      ...listQuery,
      enabled: !!userUuid && (tab === 'competencies' || tab === 'verification'),
      select: response =>
        entries(response, item => ({
          uuid: item.uuid,
          title: item.competency,
          status: item.verification_status,
          notes: item.verification_notes,
          fields: [
            { label: 'Framework', value: item.framework },
            {
              label: 'Level attained',
              value: item.level == null ? undefined : `Level ${item.level}`,
            },
            { label: 'Assessment evidence', value: item.evidence, link: true },
            { label: 'Verified on', value: date(item.verified_at) },
            { label: 'Verification notes', value: item.verification_notes },
          ],
        })),
    }),
    useQuery({
      ...experienceOptions(options),
      ...listQuery,
      enabled: !!userUuid && tab === 'experience',
      select: response =>
        entries(response, item => ({
          uuid: item.uuid,
          title: item.position,
          fields: [
            { label: 'Organisation', value: item.organisation_name },
            { label: 'Type', value: label(item.experience_type) },
            { label: 'Start date', value: date(item.start_date) },
            {
              label: 'End date',
              value: item.is_current_position ? 'Present' : date(item.end_date),
            },
            { label: 'Years of experience', value: item.years_of_experience?.toString() },
            { label: 'What they did', value: item.responsibilities },
          ],
        })),
    }),
    useQuery({
      ...achievementsOptions(options),
      ...listQuery,
      enabled: !!userUuid && tab === 'achievements',
      select: response =>
        entries(response, item => ({
          uuid: item.uuid,
          title: item.title,
          fields: [
            { label: 'Type', value: label(item.achievement_type) },
            { label: 'Awarded by', value: item.awarded_by },
            { label: 'Date', value: date(item.awarded_on) },
            { label: 'Details', value: item.description },
          ],
        })),
    }),
  ] as const;
}
