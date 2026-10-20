import type { MockApi } from '../support/api';
import { paged } from '../support/api';
import type { E2eUser } from '../support/session';

// Anonymised sample data for the St. Scholastica music programme screens.
export const ORG = '00000000-0000-4000-8000-0000000000f1';
export const ADMIN: E2eUser = {
  uuid: '00000000-0000-4000-8000-0000000000a1',
  name: 'School Admin',
  email: 'admin@e2e.test',
  domains: ['organisation_user'],
  organisationUuid: ORG,
};

export const TRAINERS = {
  antony: { uuid: '00000000-0000-4000-8000-0000000000b1', full_name: 'Antony Trainer' },
  george: { uuid: '00000000-0000-4000-8000-0000000000b2', full_name: 'George Trainer' },
  emmanuel: { uuid: '00000000-0000-4000-8000-0000000000b3', full_name: 'Emmanuel Trainer' },
};
export const CLASSES = {
  piano: { uuid: '00000000-0000-4000-8000-0000000000c1', title: 'Piano 2B' },
  guitar: { uuid: '00000000-0000-4000-8000-0000000000c2', title: 'Guitar 5A' },
  violin: { uuid: '00000000-0000-4000-8000-0000000000c3', title: 'Violin 4B' },
};
export const STUDENTS = {
  amani: { uuid: '00000000-0000-4000-8000-0000000000d1', user_uuid: '00000000-0000-4000-8000-0000000000e1', full_name: 'Amani Wekesa' },
  brian: { uuid: '00000000-0000-4000-8000-0000000000d2', user_uuid: '00000000-0000-4000-8000-0000000000e2', full_name: 'Brian Otieno' },
};
export const SUBMITTED_SESSION = '00000000-0000-4000-8000-000000000053';
export const COURSE = '00000000-0000-4000-8000-0000000000aa';
export const ENROLMENT = '00000000-0000-4000-8000-0000000000ab';

const iso = (offsetHours: number) => new Date(Date.now() + offsetHours * 3_600_000).toISOString();

export const SESSION_REPORTS = [
  { report_uuid: 'r1', instance_uuid: 's1', class_definition_uuid: CLASSES.piano.uuid, instructor_uuid: TRAINERS.antony.uuid, status: 'draft', overdue: true, due_at: iso(-3) },
  { report_uuid: 'r2', instance_uuid: 's2', class_definition_uuid: CLASSES.guitar.uuid, instructor_uuid: TRAINERS.george.uuid, status: 'draft', overdue: true, due_at: iso(-5) },
  { report_uuid: 'r3', instance_uuid: SUBMITTED_SESSION, class_definition_uuid: CLASSES.violin.uuid, instructor_uuid: TRAINERS.emmanuel.uuid, status: 'submitted', overdue: false, due_at: iso(-20), submitted_at: iso(-30), late: false },
  { report_uuid: 'r4', instance_uuid: 's4', class_definition_uuid: CLASSES.piano.uuid, instructor_uuid: TRAINERS.antony.uuid, status: 'locked', overdue: false, due_at: iso(-90), submitted_at: iso(-80), late: true },
];

export const SUBMITTED_REPORT = {
  report_uuid: 'r3',
  instance_uuid: SUBMITTED_SESSION,
  class_title: 'Violin 4B',
  lesson_number: 4,
  lesson_title: 'Bowing: legato strokes',
  topic_covered: '<p>Legato <strong>bowing</strong> on open strings</p>',
  status: 'submitted',
  start_time: iso(-50),
  duration_minutes: 45,
  submitted_at: iso(-30),
  max_score: 30,
  assignment_titles: ['Practise legato for 10 minutes daily'],
  aggregates: { enrolled: 2, present: 2, absent: 0, class_average: 28, highest: 29, lowest: 27, band_counts: [{ name: 'Distinction', count: 1 }, { name: 'Merit', count: 1 }] },
  rows: [
    { student_uuid: STUDENTS.amani.uuid, class_enrollment_uuid: 'ce1', attendance: 'ATTENDED', instrument_condition: 'GOOD', score_status: 'submitted', score: 29, max_score: 30, picks: [{ criteria_name: 'Technique', points: 5 }, { criteria_name: 'Pitch', points: 5 }], lesson_comment: '<p><strong>Lovely tone.</strong></p><img src=x onerror="window.__xss=1">' },
    { student_uuid: STUDENTS.brian.uuid, class_enrollment_uuid: 'ce2', attendance: 'ATTENDED', instrument_condition: 'NEEDS_REPAIR', score_status: 'submitted', score: 27, max_score: 30, picks: [{ criteria_name: 'Technique', points: 4 }], lesson_comment: null },
  ],
  checklist: [],
  can_submit: false,
};

/** The school admin's profile, organisation and the name lookups every organisation page makes. */
export function mockOrganisationSession(api: MockApi) {
  const user = {
    uuid: ADMIN.uuid,
    email: ADMIN.email,
    first_name: 'School',
    last_name: 'Admin',
    full_name: ADMIN.name,
    user_domain: ['organisation_user'],
    organisation_affiliations: [{ organisation_uuid: ORG, organisation_name: 'St. Scholastica', domain_in_organisation: 'organisation_user', active: true }],
  };
  api
    .get(/^\/api\/v1\/me\/bootstrap$/, { user, profiles: {} })
    .get(/^\/api\/v1\/users\/me$/, user)
    .get(new RegExp(`^/api/v1/organisations/${ORG}$`), { uuid: ORG, name: 'St. Scholastica', active: true, admin_verified: true })
    .get(/^\/api\/v1\/instructors\/search$/, paged(Object.values(TRAINERS)))
    .get(/^\/api\/v1\/classes\/batch$/, Object.values(CLASSES))
    .get(/^\/api\/v1\/students\/search$/, paged(Object.values(STUDENTS)))
    .get(/^\/api\/v1\/users\/search$/, paged(Object.values(STUDENTS).map(s => ({ uuid: s.user_uuid, full_name: s.full_name }))))
    .get(/^\/api\/v1\/notifications\/counts$/, { unread: 0 });
  return api;
}
