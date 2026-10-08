import { localDate } from '@/lib/date';
import { getErrorMessage } from '@/lib/error-utils';
import {
  addAchievement, addCertification, addCompetency, addExperience, addPortfolioItem, addSkill,
  deleteAchievement, deleteCertification, deleteCompetency, deleteExperience, deletePortfolioItem, deleteSkill,
  updateAchievement, updateCertification, updateCompetency, updateExperience, updatePortfolioItem, updateSkill,
} from '@/services/client/sdk.gen';
import {
  getSummaryQueryKey, listAchievementsQueryKey, listCertificationsQueryKey,
  listCompetenciesQueryKey, listDocumentsQueryKey, listEducationQueryKey,
  listExperienceQueryKey, listPortfolioQueryKey, listSkillsQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import {
  AchievementTypeEnum, CredentialTypeEnum, ExperienceTypeEnum, ItemTypeEnum, ProficiencyLevelEnum,
} from '@/services/client/types.gen';
import { requireApiData } from './user-onboarding';
import type { EditableWalletSection } from './wallet-sections';

export const PROFILE_WALLET_QUERY_KEYS = {
  skills: listSkillsQueryKey(), education: listEducationQueryKey(),
  portfolio: listPortfolioQueryKey(), credentials: listCertificationsQueryKey(),
  competencies: listCompetenciesQueryKey(), experience: listExperienceQueryKey(),
  achievements: listAchievementsQueryKey(), documents: listDocumentsQueryKey(),
};
export const PROFILE_SUMMARY_QUERY_KEY = getSummaryQueryKey();

function required(value: string | undefined, label: string) {
  if (!value?.trim()) throw new Error(`${label} is required.`);
  return value.trim();
}

const optional = (value?: string) => value?.trim() || undefined;

function enumValue<T extends string>(value: string | undefined, options: readonly T[]): T {
  const match = options.find(option => option === value);
  if (!match) throw new Error('Choose a valid type or proficiency level.');
  return match;
}

function date(value?: string) {
  if (!value) return undefined;
  const parsed = new Date(`${value}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value)
    throw new Error('Enter a valid date.');
  return localDate(value);
}

function integer(value: string | undefined, min: number) {
  if (!value) return undefined;
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min) throw new Error(`Enter a whole number of at least ${min}.`);
  return number;
}

function url(value?: string) {
  if (!value?.trim()) return undefined;
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return parsed.toString();
  } catch { /* Show the field validation message below. */ }
  throw new Error('Enter a valid http or https link.');
}

function saved<T>(response: {
  error?: unknown;
  data?: { success?: boolean; error?: unknown; message?: string; data?: T };
}) {
  if (response.error) throw new Error(getErrorMessage(response.error, 'Unable to save this record.'));
  if (!response.data) throw new Error('No saved record was returned.');
  return requireApiData(response.data);
}

// Each branch is checked against its generated request type. No response casts or user-set verdicts.
export async function saveWalletRecord(section: EditableWalletSection, values: Record<string, string>, uuid?: string) {
  const path = uuid ? { itemUuid: uuid } : undefined;
  switch (section) {
    case 'skills': {
      const body = {
        skill_name: required(values.skill_name, 'Skill'),
        proficiency_level: values.proficiency_level ? enumValue(values.proficiency_level, Object.values(ProficiencyLevelEnum)) : undefined,
        evidence: optional(values.evidence), last_assessed_on: date(values.last_assessed_on),
      };
      return saved(path ? await updateSkill({ path, body }) : await addSkill({ body }));
    }
    case 'portfolio': {
      const body = {
        title: required(values.title, 'Title'), item_type: enumValue(values.item_type, Object.values(ItemTypeEnum)),
        link_url: url(values.link_url), completed_on: date(values.completed_on), description: optional(values.description),
      };
      return saved(path ? await updatePortfolioItem({ path, body }) : await addPortfolioItem({ body }));
    }
    case 'credentials': {
      if (values.issued_date && values.expiry_date && values.expiry_date < values.issued_date)
        throw new Error('Expiry date must be on or after the issue date.');
      const body = {
        certification_name: required(values.certification_name, 'Credential'),
        issuing_organization: required(values.issuing_organization, 'Issuer'),
        credential_type: values.credential_type ? enumValue(values.credential_type, Object.values(CredentialTypeEnum)) : undefined,
        issued_date: date(values.issued_date), expiry_date: date(values.expiry_date),
        credential_id: optional(values.credential_id), credential_url: url(values.credential_url),
        description: optional(values.description),
      };
      return saved(path ? await updateCertification({ path, body }) : await addCertification({ body }));
    }
    case 'competencies': {
      const body = {
        competency: required(values.competency, 'Competency'), framework: optional(values.framework),
        level: integer(values.level, 1), evidence: optional(values.evidence),
      };
      return saved(path ? await updateCompetency({ path, body }) : await addCompetency({ body }));
    }
    case 'experience': {
      const current = values.is_current_position === 'true';
      if (!current && values.start_date && values.end_date && values.end_date < values.start_date)
        throw new Error('End date must be on or after the start date.');
      const body = {
        position: required(values.position, 'Role / position'), organisation_name: required(values.organisation_name, 'Organisation'),
        experience_type: values.experience_type ? enumValue(values.experience_type, Object.values(ExperienceTypeEnum)) : undefined,
        start_date: date(values.start_date), end_date: current ? undefined : date(values.end_date),
        is_current_position: current, years_of_experience: integer(values.years_of_experience, 0),
        responsibilities: optional(values.responsibilities),
      };
      return saved(path ? await updateExperience({ path, body }) : await addExperience({ body }));
    }
    case 'achievements': {
      const body = {
        title: required(values.title, 'Achievement'), achievement_type: enumValue(values.achievement_type, Object.values(AchievementTypeEnum)),
        awarded_by: optional(values.awarded_by), awarded_on: date(values.awarded_on), description: optional(values.description),
      };
      return saved(path ? await updateAchievement({ path, body }) : await addAchievement({ body }));
    }
  }
}

export async function deleteWalletRecord(section: EditableWalletSection, uuid: string) {
  const options = { path: { itemUuid: uuid } };
  const deletions = {
    skills: deleteSkill, portfolio: deletePortfolioItem, credentials: deleteCertification,
    competencies: deleteCompetency, experience: deleteExperience, achievements: deleteAchievement,
  };
  const response = await deletions[section](options);
  if (response.error) throw new Error(getErrorMessage(response.error, 'Unable to delete this record.'));
  const result = response.data;
  if (typeof result === 'object' && result !== null &&
    (('error' in result && result.error) || ('success' in result && result.success === false)))
    throw new Error(getErrorMessage(result, 'Unable to delete this record.'));
}
