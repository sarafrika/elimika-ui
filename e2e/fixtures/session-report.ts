import { type MockApi, paged } from '../support/api';
import type { E2eUser } from '../support/session';

// Anonymised from the Drums D4 workbook: one class, one lesson session, two learners.
export const INSTRUCTOR: E2eUser = {
  uuid: '00000000-0000-4000-8000-000000000101',
  name: 'Faith Mwangi',
  email: 'trainer@e2e.test',
  domains: ['instructor'],
};
export const INSTRUCTOR_PROFILE = '00000000-0000-4000-8000-000000000102';
export const CLASS_ID = '00000000-0000-4000-8000-000000000201';
export const COURSE_ID = '00000000-0000-4000-8000-000000000202';
export const LESSON_ID = '00000000-0000-4000-8000-000000000203';
export const SESSION_ID = '00000000-0000-4000-8000-000000000204';
export const LEARNERS = {
  amani: { uuid: '00000000-0000-4000-8000-000000000301', user_uuid: '00000000-0000-4000-8000-000000000311', full_name: 'Amani Wekesa' },
  brian: { uuid: '00000000-0000-4000-8000-000000000302', user_uuid: '00000000-0000-4000-8000-000000000312', full_name: 'Brian Otieno' },
};

const CRITERIA = ['Posture', 'Rhythm', 'Technique', 'Reading', 'Dynamics', 'Effort'].map((name, i) => ({
  criteria_uuid: `00000000-0000-4000-8000-0000000004${String(i).padStart(2, '0')}`,
  name,
}));

/** A session report as the backend returns it; override fields per state. */
export function sessionReport(overrides: Record<string, unknown> = {}) {
  return {
    report_uuid: '00000000-0000-4000-8000-000000000501',
    instance_uuid: SESSION_ID,
    class_definition_uuid: CLASS_ID,
    class_title: 'Drums D4',
    course_uuid: COURSE_ID,
    lesson_uuid: LESSON_ID,
    lesson_number: 3,
    lesson_title: 'Rudiments',
    instructor_uuid: INSTRUCTOR_PROFILE,
    start_time: '2026-10-19T07:00:00Z',
    end_time: '2026-10-19T08:00:00Z',
    duration_minutes: 60,
    session_ended: true,
    topic_covered: '<p>Paradiddles</p>',
    status: 'draft',
    due_at: '2026-10-20T08:00:00Z',
    overdue: false,
    revision_count: 0,
    rubric_scored: true,
    max_score: 30,
    criteria: CRITERIA,
    assignment_titles: [],
    rows: [
      {
        student_uuid: LEARNERS.amani.uuid,
        class_enrollment_uuid: '00000000-0000-4000-8000-000000000601',
        attendance: 'ATTENDED',
        instrument_condition: 'GOOD',
        score_status: 'submitted',
        score: 27.5,
        max_score: 30,
        picks: CRITERIA.map(c => ({ criteria_uuid: c.criteria_uuid, criteria_name: c.name, points: 4.5 })),
        lesson_comment: '<p><strong>Steady</strong> sticking.</p>',
      },
      {
        student_uuid: LEARNERS.brian.uuid,
        class_enrollment_uuid: '00000000-0000-4000-8000-000000000602',
        attendance: 'ABSENT',
        score_status: 'none',
      },
    ],
    aggregates: {
      enrolled: 2,
      present: 1,
      absent: 1,
      not_marked: 0,
      attendance_rate: 50,
      scored: 1,
      class_average: 27.5,
      class_average_percentage: 91.67,
      highest: 27.5,
      lowest: 27.5,
      criterion_averages: CRITERIA.map(c => ({ criteria_uuid: c.criteria_uuid, name: c.name, average: 4.5 })),
      band_counts: [{ name: 'Merit', count: 1 }],
    },
    checklist: [],
    can_submit: true,
    ...overrides,
  };
}

/** Everything the instructor workbook needs to render one class session. */
export function mockInstructorWorkbook(api: MockApi) {
  const user = {
    uuid: INSTRUCTOR.uuid,
    email: INSTRUCTOR.email,
    first_name: 'Faith',
    last_name: 'Mwangi',
    full_name: INSTRUCTOR.name,
    user_domain: ['instructor'],
  };
  const session = {
    uuid: SESSION_ID,
    class_definition_uuid: CLASS_ID,
    instructor_uuid: INSTRUCTOR_PROFILE,
    lesson_uuid: LESSON_ID,
    start_time: '2026-10-19T07:00:00Z',
    end_time: '2026-10-19T08:00:00Z',
    status: 'COMPLETED',
    title: 'Drums D4',
  };
  return api
    .get(/^\/api\/v1\/me\/bootstrap$/, { user, profiles: {} })
    .get(/^\/api\/v1\/users\/me$/, user)
    .get(/^\/api\/v1\/instructors\/search$/, paged([{ uuid: INSTRUCTOR_PROFILE, user_uuid: INSTRUCTOR.uuid, full_name: INSTRUCTOR.name, admin_verified: true }]))
    .get(/^\/api\/v1\/notifications\/counts$/, { unread: 0 })
    .get(new RegExp(`^/api/v1/classes/${CLASS_ID}$`), {
      class_definition: {
        uuid: CLASS_ID,
        title: 'Drums D4',
        course_uuid: COURSE_ID,
        default_instructor_uuid: INSTRUCTOR_PROFILE,
        is_active: true,
      },
    })
    .get(new RegExp(`^/api/v1/courses/${COURSE_ID}$`), { uuid: COURSE_ID, name: 'Drums Grade 4', status: 'published' })
    .get(new RegExp(`^/api/v1/courses/${COURSE_ID}/lessons$`), paged([
      { uuid: LESSON_ID, course_uuid: COURSE_ID, title: 'Rudiments', lesson_number: 3, is_published: true, active: true },
    ]))
    .get(new RegExp(`^/api/v1/timetable/class/${CLASS_ID}/schedule$`), paged([session]))
    .get(new RegExp(`^/api/v1/timetable/schedule/${SESSION_ID}$`), session)
    .get(/^\/api\/v1\/students\/search$/, paged(Object.values(LEARNERS)))
    .get(/^\/api\/v1\/users\/directory$/, Object.values(LEARNERS).map(s => ({ uuid: s.user_uuid, full_name: s.full_name })));
}

export const REPORT_PATH = new RegExp(`^/api/v1/timetable/schedule/${SESSION_ID}/report$`);
export const SUBMIT_PATH = new RegExp(`^/api/v1/timetable/schedule/${SESSION_ID}/report/submit$`);
export const WORKBOOK_URL = `/dashboard/instructor/classes/training/${CLASS_ID}?lesson=${LESSON_ID}&schedule=${SESSION_ID}&tab=report`;

export const ASSESSMENT_ID = '00000000-0000-4000-8000-000000000701';
export const LINE_ITEM_ID = '00000000-0000-4000-8000-000000000702';
export const RUBRIC_ID = '00000000-0000-4000-8000-000000000703';
export const COURSE_ENROLMENT_ID = '00000000-0000-4000-8000-000000000704';
export const SCORE_CRITERIA = CRITERIA.map(c => c.name);
export const EVALUATION_PATH = new RegExp(
  `^/api/v1/courses/${COURSE_ID}/assessments/${ASSESSMENT_ID}/line-items/${LINE_ITEM_ID}/rubric-evaluations/${COURSE_ENROLMENT_ID}$`
);
export const GRADING_URL = `/dashboard/instructor/classes/training/${CLASS_ID}?lesson=${LESSON_ID}&schedule=${SESSION_ID}&tab=grading`;

/** A six-criterion lesson rubric scored 1–5, so a lesson is out of 30 as in the workbook. */
export function mockLessonScoring(api: MockApi, evaluation: Record<string, unknown> | null = null) {
  const levels = [1, 2, 3, 4, 5].map(points => ({
    uuid: `00000000-0000-4000-8000-0000000008${String(points).padStart(2, '0')}`,
    name: `Level ${points}`,
    points,
    level_order: points,
  }));
  return api
    .get(new RegExp(`^/api/v1/courses/${COURSE_ID}/assessments$`), paged([
      { uuid: ASSESSMENT_ID, course_uuid: COURSE_ID, title: 'Lesson performance', per_lesson: true, rubric_uuid: RUBRIC_ID, active: true },
    ]))
    .get(new RegExp(`^/api/v1/classes/${CLASS_ID}/enrollments$`), [
      { uuid: '00000000-0000-4000-8000-000000000601', student_uuid: LEARNERS.amani.uuid, scheduled_instance_uuid: SESSION_ID, status: 'ATTENDED' },
    ])
    .get(new RegExp(`^/api/v1/courses/${COURSE_ID}/enrollments$`), paged([
      { uuid: COURSE_ENROLMENT_ID, course_uuid: COURSE_ID, student_uuid: LEARNERS.amani.uuid, status: 'ACTIVE' },
    ]))
    .get(new RegExp(`^/api/v1/courses/${COURSE_ID}/gradebook/enrollments/${COURSE_ENROLMENT_ID}$`), {
      pass_mark: 60,
      components: [
        {
          assessment: { uuid: ASSESSMENT_ID, title: 'Lesson performance', per_lesson: true, rubric_uuid: RUBRIC_ID },
          line_items: [{ line_item: { uuid: LINE_ITEM_ID, lesson_uuid: LESSON_ID, rubric_uuid: RUBRIC_ID } }],
        },
      ],
    })
    .get(new RegExp(`^/api/v1/courses/${COURSE_ID}/grade-bands$`), [
      { name: 'Distinction', min_percentage: 93.33 },
      { name: 'Merit', min_percentage: 80 },
      { name: 'Pass', min_percentage: 60 },
      { name: 'Fail', min_percentage: 40 },
    ])
    .get(new RegExp(`^/api/v1/rubrics/${RUBRIC_ID}/matrix$`), {
      rubric: { uuid: RUBRIC_ID, title: 'Lesson performance' },
      scoring_levels: levels,
      criteria: CRITERIA.map((c, i) => ({ uuid: c.criteria_uuid, component_name: c.name, display_order: i })),
      matrix_cells: {},
    })
    .get(EVALUATION_PATH, evaluation)
    .get(/\/revisions\/[^/]+$/, []);
}
