export type WalletSectionKey =
  | 'skills'
  | 'portfolio'
  | 'credentials'
  | 'competencies'
  | 'experience'
  | 'achievements'
  | 'verification';

export type WalletField = {
  key: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'date' | 'textarea' | 'select';
  options?: string[];
  required?: boolean;
};

export type WalletSection = {
  key: WalletSectionKey;
  label: string;
  summary: string;
  addLabel: string;
  fields: WalletField[];
};

export const WALLET_SECTIONS: WalletSection[] = [
  {
    key: 'skills',
    label: 'My Skills',
    summary: 'Skills, proficiency level, evidence and last assessed date.',
    addLabel: 'Add skill',
    fields: [
      { key: 'skill', required: true, label: 'Skill', placeholder: 'e.g. Curriculum design' },
      {
        key: 'proficiency',
        label: 'Proficiency level',
        type: 'select',
        options: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      },
      { key: 'evidence', label: 'Evidence', placeholder: 'Link or short description' },
      { key: 'lastAssessed', label: 'Last assessed date', type: 'date' },
    ],
  },
  {
    key: 'portfolio',
    label: 'Portfolio',
    summary: 'Projects, performances, work samples, media and selected evidence.',
    addLabel: 'Add portfolio item',
    fields: [
      {
        key: 'title',
        required: true,
        label: 'Title',
        placeholder: 'e.g. Nairobi Choir Masterclass',
      },
      {
        key: 'type',
        required: true,
        label: 'Type',
        type: 'select',
        options: ['Project', 'Performance', 'Work sample', 'Media', 'Other'],
      },
      { key: 'link', label: 'Media or evidence link', placeholder: 'https://' },
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  {
    key: 'credentials',
    label: 'Credentials Vault',
    summary: 'Certificates, badges, awards, external credentials, issuer and verification status.',
    addLabel: 'Add credential',
    fields: [
      {
        key: 'name',
        required: true,
        label: 'Credential',
        placeholder: 'e.g. TVET Trainer Certificate',
      },
      {
        key: 'type',
        required: true,
        label: 'Type',
        type: 'select',
        options: ['Certificate', 'Badge', 'Award', 'External credential'],
      },
      { key: 'issuer', required: true, label: 'Issuer', placeholder: 'e.g. TVET Authority' },
      { key: 'issuedOn', label: 'Issued on', type: 'date' },
      { key: 'credentialId', label: 'Credential ID', placeholder: 'Credential ID' },
    ],
  },
  {
    key: 'competencies',
    label: 'Competencies',
    summary: 'Competency framework, level attained, assessment evidence and verification.',
    addLabel: 'Add competency',
    fields: [
      {
        key: 'competency',
        required: true,
        label: 'Competency',
        placeholder: 'e.g. Learner assessment',
      },
      { key: 'framework', label: 'Framework', placeholder: 'e.g. CBET Unit 4' },
      {
        key: 'level',
        label: 'Level attained',
        type: 'select',
        options: ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5'],
      },
      { key: 'evidence', label: 'Assessment evidence', type: 'textarea' },
    ],
  },
  {
    key: 'experience',
    label: 'Experience',
    summary: 'Training, work, volunteering, projects and relevant experience.',
    addLabel: 'Add experience',
    fields: [
      { key: 'role', required: true, label: 'Role', placeholder: 'e.g. Lead Trainer' },
      {
        key: 'organisation',
        required: true,
        label: 'Organisation',
        placeholder: 'e.g. Sarafrika Academy',
      },
      {
        key: 'type',
        required: true,
        label: 'Type',
        type: 'select',
        options: ['Training', 'Work', 'Volunteering', 'Project'],
      },
      { key: 'startDate', label: 'Start date', type: 'date' },
      { key: 'endDate', label: 'End date', type: 'date' },
      { key: 'description', label: 'What you did', type: 'textarea' },
    ],
  },
  {
    key: 'achievements',
    label: 'Achievements',
    summary: 'Awards, milestones, competitions, unlocked skills and recognitions.',
    addLabel: 'Add achievement',
    fields: [
      {
        key: 'title',
        required: true,
        label: 'Achievement',
        placeholder: 'e.g. National Music Award',
      },
      {
        key: 'type',
        required: true,
        label: 'Type',
        type: 'select',
        options: ['Award', 'Milestone', 'Competition', 'Unlocked skill', 'Recognition'],
      },
      { key: 'awardedBy', label: 'Awarded by', placeholder: 'e.g. Kenya Music Festival' },
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'description', label: 'Details', type: 'textarea' },
    ],
  },
];
