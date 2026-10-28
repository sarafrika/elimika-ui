import type { MockApi } from '../support/api';
import { COURSE_UUID, ENROLLMENT_UUID, STUDENT_UUID } from './grades';

export const PROGRAM_UUID = '77777777-7777-4777-8777-777777777777';
export const OTHER_PROGRAM_UUID = '88888888-8888-4888-8888-888888888888';

const course = (row: Record<string, unknown>) => ({
  sessions_attended: 0,
  sessions_counted: 0,
  sessions_excused: 0,
  sessions_total: 0,
  ...row,
});

/** Amani in progress: four mandatory courses, one still running, one optional. */
export function programmeReport(overrides: Record<string, unknown> = {}) {
  return {
    program_uuid: PROGRAM_UUID,
    program_title: 'Foundation Music Certificate',
    program_code: 'PRG-MUS-01',
    student_uuid: STUDENT_UUID,
    final_grade: 75.76,
    final_grade_provisional: true,
    pass_mark: 50,
    result_status: 'IN_PROGRESS',
    mandatory_total: 5,
    mandatory_passed: 3,
    can_add_remarks: false,
    attendance: {
      sessions_attended: 25,
      sessions_counted: 26,
      sessions_excused: 1,
      sessions_total: 27,
      attendance_percentage: 96.15,
    },
    courses: [
      course({
        course_uuid: COURSE_UUID,
        course_title: 'Introduction to Piano',
        course_code: 'MUS101',
        course_enrollment_uuid: ENROLLMENT_UUID,
        is_required: true,
        weight_percentage: 15,
        final_grade: 91.67,
        grade_band: 'Merit',
        result_status: 'PASSED',
        contribution: 13.75,
        sessions_attended: 12,
        sessions_counted: 12,
        sessions_total: 12,
        attendance_percentage: 100,
      }),
      course({
        course_uuid: 'c4',
        course_title: 'Drums & Rhythm',
        course_code: 'MUS104',
        is_required: true,
        weight_percentage: 15,
        final_grade: 72,
        result_status: 'IN_PROGRESS',
        sessions_attended: 7,
        sessions_counted: 8,
        sessions_excused: 1,
        sessions_total: 9,
        attendance_percentage: 87.5,
      }),
      course({
        course_uuid: 'c5',
        course_title: 'Performance & Ensemble',
        course_code: 'MUS105',
        is_required: true,
        weight_percentage: 25,
        result_status: 'NOT_STARTED',
      }),
      course({
        course_uuid: 'c6',
        course_title: 'Music Theory Club',
        course_code: 'MUS110',
        is_required: false,
        final_grade: 88,
        grade_band: 'Merit',
        result_status: 'PASSED',
        sessions_attended: 6,
        sessions_counted: 6,
        sessions_total: 6,
        attendance_percentage: 100,
      }),
    ],
    skills: [
      {
        skill_uuid: 's1',
        skill_name: 'Performance technique',
        level_name: 'Achieved',
        counts_as_achieved: true,
        score: 84,
        graded_at: '2026-10-14T09:00:00Z',
        history: [
          {
            course_uuid: COURSE_UUID,
            course_title: 'Introduction to Piano',
            course_assessment_uuid: 'a1',
            assessment_title: 'Solo performance',
            source_title: 'Lesson scores · Lesson 6',
            score: 84,
            level_name: 'Achieved',
            graded_at: '2026-10-14T09:00:00Z',
            superseded: false,
            graded_by_uuid: 'u-grace',
            graded_by_name: 'Grace Njeri',
          },
          {
            course_uuid: COURSE_UUID,
            course_title: 'Introduction to Piano',
            course_assessment_uuid: 'a1',
            assessment_title: 'Solo performance',
            source_title: 'Lesson scores · Lesson 6',
            score: 55,
            level_name: 'Developing',
            graded_at: '2026-10-10T09:00:00Z',
            superseded: true,
            graded_by_uuid: 'u-grace',
            graded_by_name: 'Grace Njeri',
          },
        ],
      },
      {
        skill_uuid: 's2',
        skill_name: 'Ensemble communication',
        counts_as_achieved: false,
        history: [],
      },
    ],
    remarks: [
      {
        uuid: 'r1',
        strengths: '<p>Strong left-hand control.</p>',
        recommendations: '<p>Join the Friday rhythm circle.</p>',
        next_review_date: '2026-11-30',
        author_user_uuid: 'u-grace',
        author_name: 'Grace Njeri',
        created_date: '2026-10-20T10:00:00Z',
      },
      {
        uuid: 'r0',
        strengths: '<p>Good posture at the keyboard.</p>',
        next_review_date: '2026-10-20',
        author_user_uuid: 'u-grace',
        author_name: 'Grace Njeri',
        created_date: '2026-09-22T10:00:00Z',
      },
    ],
    ...overrides,
  };
}

/** Every mandatory course decided and passed: the mark is final. */
export function passedReport(overrides: Record<string, unknown> = {}) {
  const base = programmeReport();
  return programmeReport({
    final_grade: 81.24,
    final_grade_provisional: false,
    result_status: 'PASSED',
    mandatory_total: 3,
    mandatory_passed: 3,
    courses: [
      base.courses[0],
      { ...base.courses[1], result_status: 'PASSED', contribution: 10.8 },
      { ...base.courses[2], final_grade: 76, result_status: 'PASSED', contribution: 19 },
      base.courses[3],
    ],
    ...overrides,
  });
}

/** Above the pass mark, but a mandatory course failed. */
export function failedReport() {
  const base = passedReport();
  return programmeReport({
    final_grade: 76.02,
    final_grade_provisional: false,
    result_status: 'FAILED',
    mandatory_total: 3,
    mandatory_passed: 2,
    courses: [
      base.courses[0],
      {
        ...base.courses[1],
        final_grade: 45,
        grade_band: 'Fail',
        result_status: 'FAILED',
        contribution: 6.75,
      },
      base.courses[2],
      base.courses[3],
    ],
  });
}

/** The learner's programme list and report for one programme. */
export function mockProgrammeReport(
  api: MockApi,
  report: unknown = programmeReport(),
  studentUuid = STUDENT_UUID
) {
  api.get(new RegExp(`^/api/v1/programs/students/${studentUuid}/reports$`), [
    {
      program_uuid: PROGRAM_UUID,
      program_title: 'Foundation Music Certificate',
      final_grade: 75.76,
      final_grade_provisional: true,
      result_status: 'IN_PROGRESS',
    },
  ]);
  api.get(
    new RegExp(`^/api/v1/programs/${PROGRAM_UUID}/students/${studentUuid}/report`),
    () => report
  );
  api.get(/^\/api\/v1\/skill-levels$/, [
    { uuid: 'l0', name: 'Not achieved', min_percentage: 0, counts_as_achieved: false },
    { uuid: 'l1', name: 'Developing', min_percentage: 50, counts_as_achieved: false },
    { uuid: 'l2', name: 'Achieved', min_percentage: 70, counts_as_achieved: true },
  ]);
}
