import { localDate } from '@/lib/date';
import {
  addAchievement,
  addCertification,
  addCompetency,
  addExperience,
  addPortfolioItem,
  addSkill,
  deleteAchievement,
  deleteCertification,
  deleteCompetency,
  deleteExperience,
  deletePortfolioItem,
  deleteSkill,
} from '@/services/client';
import type { WalletSectionKey } from './registration-steps';

const proficiency = {
  Beginner: 'beginner',
  Intermediate: 'intermediate',
  Advanced: 'advanced',
  Expert: 'expert',
} as const;
const portfolioTypes = {
  Project: 'PROJECT',
  Performance: 'PERFORMANCE',
  'Work sample': 'WORK_SAMPLE',
  Media: 'MEDIA',
  Other: 'OTHER',
} as const;
const credentialTypes = {
  Certificate: 'CERTIFICATE',
  Badge: 'BADGE',
  Award: 'AWARD',
  'External credential': 'EXTERNAL_CREDENTIAL',
} as const;
const experienceTypes = {
  Training: 'TRAINING',
  Work: 'WORK',
  Volunteering: 'VOLUNTEERING',
  Project: 'PROJECT',
} as const;
const achievementTypes = {
  Award: 'AWARD',
  Milestone: 'MILESTONE',
  Competition: 'COMPETITION',
  'Unlocked skill': 'UNLOCKED_SKILL',
  Recognition: 'RECOGNITION',
} as const;

function option<T extends string>(options: Record<string, T>, value?: string): T | undefined {
  return value ? options[value] : undefined;
}

export async function saveRegistrationWalletEntry(
  section: WalletSectionKey,
  values: Record<string, string>
) {
  const text = (key: string) => values[key]?.trim() || undefined;
  const date = (key: string) => (text(key) ? localDate(values[key]!) : undefined);
  const save = () => {
    switch (section) {
      case 'skills':
        return addSkill({
          body: {
            skill_name: text('skill') || '',
            proficiency_level: option(proficiency, values.proficiency),
            evidence: text('evidence'),
            last_assessed_on: date('lastAssessed'),
          },
        });
      case 'portfolio':
        return addPortfolioItem({
          body: {
            title: text('title') || '',
            item_type: option(portfolioTypes, values.type) || 'OTHER',
            link_url: text('link'),
            completed_on: date('date'),
            description: text('description'),
          },
        });
      case 'credentials':
        return addCertification({
          body: {
            certification_name: text('name') || '',
            issuing_organization: text('issuer') || '',
            credential_type: option(credentialTypes, values.type),
            issued_date: date('issuedOn'),
            credential_id: text('credentialId'),
          },
        });
      case 'competencies':
        return addCompetency({
          body: {
            competency: text('competency') || '',
            framework: text('framework'),
            level: values.level ? Number(values.level.replace('Level ', '')) : undefined,
            evidence: text('evidence'),
          },
        });
      case 'experience':
        return addExperience({
          body: {
            position: text('role') || '',
            organisation_name: text('organisation') || '',
            experience_type: option(experienceTypes, values.type),
            start_date: date('startDate'),
            end_date: date('endDate'),
            responsibilities: text('description'),
          },
        });
      case 'achievements':
        return addAchievement({
          body: {
            title: text('title') || '',
            achievement_type: option(achievementTypes, values.type) || 'MILESTONE',
            awarded_by: text('awardedBy'),
            awarded_on: date('date'),
            description: text('description'),
          },
        });
      case 'verification':
        throw new Error('Verification is managed by the review team.');
    }
  };
  const response = await save();
  if (response.error) throw new Error('Unable to save this wallet entry. Please try again.');
  if (
    !response.data ||
    response.data.error ||
    response.data.success === false ||
    !response.data.data?.uuid
  ) {
    throw new Error(response.data?.message || 'The wallet entry was not saved. Please try again.');
  }
}

export async function removeRegistrationWalletEntry(section: WalletSectionKey, itemUuid: string) {
  const options = { path: { itemUuid } };
  const remove = () => {
    switch (section) {
      case 'skills':
        return deleteSkill(options);
      case 'portfolio':
        return deletePortfolioItem(options);
      case 'credentials':
        return deleteCertification(options);
      case 'competencies':
        return deleteCompetency(options);
      case 'experience':
        return deleteExperience(options);
      case 'achievements':
        return deleteAchievement(options);
      case 'verification':
        throw new Error('Verification is managed by the review team.');
    }
  };
  const response = await remove();
  if (response.error) {
    throw new Error('Unable to remove this wallet entry. Please try again.');
  }
  const result = response.data;
  if (
    result &&
    typeof result === 'object' &&
    (('error' in result && result.error) || ('success' in result && result.success === false))
  ) {
    throw new Error('Unable to remove this wallet entry. Please try again.');
  }
}
