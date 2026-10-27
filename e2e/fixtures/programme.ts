import type { MockApi } from '../support/api';
import { STUDENT_UUID } from './grades';

export const PROGRAM_UUID = '77777777-7777-4777-8777-777777777777';

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
    courses: [
      {
        course_uuid: 'c1',
        course_title: 'Introduction to Piano',
        is_required: true,
        weight_percentage: 15,
        final_grade: 91.67,
        grade_band: 'Merit',
        result_status: 'PASSED',
        contribution: 13.75,
        sessions_attended: 12,
        sessions_counted: 12,
        sessions_excused: 0,
      },
      {
        course_uuid: 'c4',
        course_title: 'Drums & Rhythm',
        is_required: true,
        weight_percentage: 15,
        final_grade: 72,
        result_status: 'IN_PROGRESS',
        sessions_attended: 7,
        sessions_counted: 8,
        sessions_excused: 1,
      },
      {
        course_uuid: 'c5',
        course_title: 'Performance & Ensemble',
        is_required: true,
        weight_percentage: 25,
        result_status: 'NOT_STARTED',
        sessions_attended: 0,
        sessions_counted: 0,
        sessions_excused: 0,
      },
      {
        course_uuid: 'c6',
        course_title: 'Music Theory Club',
        is_required: false,
        final_grade: 88,
        grade_band: 'Merit',
        result_status: 'PASSED',
        sessions_attended: 6,
        sessions_counted: 6,
        sessions_excused: 0,
      },
    ],
    skills: [
      {
        skill_uuid: 's1',
        skill_name: 'Performance technique',
        level_name: 'Achieved',
        counts_as_achieved: true,
        score: 84,
        graded_at: '2026-10-14T09:00:00',
        history: [
          {
            course_assessment_uuid: 'a1',
            source_title: 'Lesson scores · Lesson 6',
            score: 84,
            level_name: 'Achieved',
            graded_at: '2026-10-14T09:00:00',
            superseded: false,
          },
          {
            course_assessment_uuid: 'a1',
            source_title: 'Lesson scores · Lesson 1',
            score: 55,
            level_name: 'Developing',
            graded_at: '2026-09-18T09:00:00',
            superseded: false,
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
        created_date: '2026-10-20T10:00:00',
      },
    ],
    ...overrides,
  };
}

/** The learner's programme list and report for one programme. */
export function mockProgrammeReport(
  api: MockApi,
  report = programmeReport(),
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
}
