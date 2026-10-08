export type WalletSectionKey =
  | 'skills' | 'education' | 'portfolio' | 'credentials'
  | 'competencies' | 'experience' | 'achievements' | 'verification';

export type EditableWalletSection = Exclude<WalletSectionKey, 'education' | 'verification'>;

export type WalletField = {
  key: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'date' | 'textarea' | 'select' | 'file' | 'number' | 'url' | 'checkbox';
  options?: { value: string; label: string }[];
  disabled?: boolean;
  required?: boolean;
  accept?: string;
  defaultValue?: string;
  min?: number;
  max?: number;
};

export type WalletSection = {
  key: WalletSectionKey;
  label: string;
  summary: string;
  addLabel: string;
  titleField: string;
  fields: WalletField[];
};

const options = (entries: [string, string][]) => entries.map(([value, label]) => ({ value, label }));

// Field keys match the /me/profile request bodies. Verification is always server-owned.
export const WALLET_SECTIONS: WalletSection[] = [
  {
    key: 'skills', label: 'My Skills', addLabel: 'Add skill', titleField: 'skill_name',
    summary: 'Your skills, proficiency, supporting evidence and date acquired.',
    fields: [
      { key: 'skill_name', label: 'Skill', required: true, placeholder: 'e.g. Curriculum design' },
      { key: 'proficiency_level', label: 'Proficiency level', type: 'select', options: options([
        ['beginner', 'Beginner'], ['intermediate', 'Intermediate'], ['advanced', 'Advanced'], ['expert', 'Expert'],
      ]) },
      { key: 'evidence', label: 'Evidence', type: 'textarea', placeholder: 'Link or description of supporting evidence' },
      { key: 'last_assessed_on', label: 'Date acquired / last assessed', type: 'date' },
    ],
  },
  {
    key: 'education', label: 'Education', addLabel: 'Add education', titleField: 'qualification',
    summary: 'Qualifications, field of study, awarding institution, evidence and year completed.',
    fields: [
      { key: 'qualification', label: 'Skill (qualification)', required: true },
      { key: 'field_of_study', label: 'Taxonomy / category (field of study)', required: true },
      { key: 'school_name', label: 'School name / awarding institution', required: true },
      { key: 'proficiency', label: 'Proficiency level', disabled: true },
      { key: 'evidence', label: 'Evidence (image or PDF)', type: 'file', accept: 'image/*,.pdf,application/pdf', required: true },
      { key: 'verificationStatus', label: 'Verification status', defaultValue: 'Pending', disabled: true },
      { key: 'year_completed', label: 'Date issued / obtained (year completed)', type: 'number', min: 1900, required: true },
    ],
  },
  {
    key: 'portfolio', label: 'Portfolio', addLabel: 'Add portfolio item', titleField: 'title',
    summary: 'Projects, performances, work samples and media.',
    fields: [
      { key: 'title', label: 'Title', required: true },
      { key: 'item_type', label: 'Type', type: 'select', required: true, options: options([
        ['PROJECT', 'Project'], ['PERFORMANCE', 'Performance'], ['WORK_SAMPLE', 'Work sample'], ['MEDIA', 'Media'], ['OTHER', 'Other'],
      ]) },
      { key: 'link_url', label: 'Media or evidence link', type: 'url', placeholder: 'https://' },
      { key: 'completed_on', label: 'Date completed', type: 'date' },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  {
    key: 'credentials', label: 'Credentials Vault', addLabel: 'Add credential', titleField: 'certification_name',
    summary: 'Certificates, badges, awards, issuers and credential links.',
    fields: [
      { key: 'certification_name', label: 'Credential', required: true },
      { key: 'credential_type', label: 'Type', type: 'select', options: options([
        ['CERTIFICATE', 'Certificate'], ['BADGE', 'Badge'], ['AWARD', 'Award'], ['EXTERNAL_CREDENTIAL', 'External credential'],
      ]) },
      { key: 'issuing_organization', label: 'Issuer', required: true },
      { key: 'issued_date', label: 'Issued on', type: 'date' },
      { key: 'expiry_date', label: 'Expiry date', type: 'date' },
      { key: 'credential_id', label: 'Credential ID' },
      { key: 'credential_url', label: 'Credential link', type: 'url', placeholder: 'https://' },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  {
    key: 'competencies', label: 'Competencies', addLabel: 'Add competency', titleField: 'competency',
    summary: 'Competency framework, level attained and assessment evidence.',
    fields: [
      { key: 'competency', label: 'Competency', required: true },
      { key: 'framework', label: 'Framework' },
      { key: 'level', label: 'Level attained', type: 'number', min: 1 },
      { key: 'evidence', label: 'Assessment evidence', type: 'textarea' },
    ],
  },
  {
    key: 'experience', label: 'Experience', addLabel: 'Add experience', titleField: 'position',
    summary: 'Training, work, volunteering and project experience.',
    fields: [
      { key: 'position', label: 'Role / position', required: true },
      { key: 'organisation_name', label: 'Organisation', required: true },
      { key: 'experience_type', label: 'Type', type: 'select', options: options([
        ['TRAINING', 'Training'], ['WORK', 'Work'], ['VOLUNTEERING', 'Volunteering'], ['PROJECT', 'Project'],
      ]) },
      { key: 'start_date', label: 'Start date', type: 'date' },
      { key: 'end_date', label: 'End date', type: 'date' },
      { key: 'is_current_position', label: 'I currently hold this position', type: 'checkbox' },
      { key: 'years_of_experience', label: 'Years of experience', type: 'number', min: 0 },
      { key: 'responsibilities', label: 'What you did', type: 'textarea' },
    ],
  },
  {
    key: 'achievements', label: 'Achievements', addLabel: 'Add achievement', titleField: 'title',
    summary: 'Awards, milestones, competitions, unlocked skills and recognition.',
    fields: [
      { key: 'title', label: 'Achievement', required: true },
      { key: 'achievement_type', label: 'Type', type: 'select', required: true, options: options([
        ['AWARD', 'Award'], ['MILESTONE', 'Milestone'], ['COMPETITION', 'Competition'], ['UNLOCKED_SKILL', 'Unlocked skill'], ['RECOGNITION', 'Recognition'],
      ]) },
      { key: 'awarded_by', label: 'Awarded by' },
      { key: 'awarded_on', label: 'Awarded on', type: 'date' },
      { key: 'description', label: 'Details', type: 'textarea' },
    ],
  },
  {
    key: 'verification', label: 'Verification', addLabel: '', titleField: '', fields: [],
    summary: 'All saved wallet information and the latest available admin verification decisions.',
  },
];

export function walletSection(key: WalletSectionKey) {
  const section = WALLET_SECTIONS.find(item => item.key === key);
  if (!section) throw new Error('Unknown wallet section.');
  return section;
}
