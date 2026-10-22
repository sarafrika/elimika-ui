import assert from 'node:assert/strict';
import { test } from 'node:test';
import type {
  AssignmentSubmission,
  ClassReport,
  CourseEnrollment,
  QuizAttempt,
} from '@/services/client/types.gen';
import {
  averageClassReportScores,
  classReportTasks,
  summarizeClassReportAssessments,
} from './class-report-scores';
import { summarizeStudentMarks } from './session-report-scores';

const report: ClassReport = {
  class_definition_uuid: 'class',
  sessions: [
    { instance_uuid: 'session-1', lesson_number: 1 },
    { instance_uuid: 'session-2', lesson_number: 2 },
  ],
  students: [
    {
      student_uuid: 'a',
      cells: [{ instance_uuid: 'session-1' }, { instance_uuid: 'session-2' }],
      average: 99,
      band: 'Rubric band',
    },
    { student_uuid: 'b', cells: [{ instance_uuid: 'session-1', attendance: 'ABSENT' }] },
  ],
};
const tasks = classReportTasks(
  report,
  [
    { uuid: 'lesson-1', lesson_number: 1, title: 'Lesson 1' },
    { uuid: 'lesson-2', lesson_number: 2, title: 'Lesson 2' },
  ],
  [
    { lesson_uuid: 'lesson-1', assignment_uuid: 'assignment-1' },
    { lesson_uuid: 'lesson-1', assignment_uuid: 'assignment-2' },
    { lesson_uuid: 'lesson-2', assignment_uuid: 'assignment-3' },
  ],
  [
    { lesson_uuid: 'lesson-1', quiz_uuid: 'quiz-1' },
    { lesson_uuid: 'lesson-1', quiz_uuid: 'quiz-2' },
  ]
);
const enrollment: CourseEnrollment = {
  uuid: 'course-enrollment',
  course_uuid: 'course',
  student_uuid: 'a',
  status: 'ACTIVE',
};
const submission: AssignmentSubmission = {
  assignment_uuid: 'assignment-1',
  enrollment_uuid: 'course-enrollment',
  status: 'GRADED',
  score: 10,
  max_score: 20,
};
const attempt: QuizAttempt = {
  quiz_uuid: 'quiz-1',
  enrollment_uuid: 'course-enrollment',
  status: 'GRADED',
  score: 5,
  max_score: 10,
};

test('uses all three available assessments, skipping a fourth task with no score', () => {
  const summary = summarizeClassReportAssessments({
    report,
    tasks,
    enrollments: [enrollment],
    submissions: new Map([
      ['course-enrollment-assignment-1', submission],
      [
        'course-enrollment-assignment-2',
        { ...submission, assignment_uuid: 'assignment-2', score: 15 },
      ],
      [
        'course-enrollment-assignment-3',
        { ...submission, assignment_uuid: 'assignment-3', score: 18 },
      ],
    ]),
    attempts: new Map([
      ['course-enrollment-quiz-1', attempt],
      ['course-enrollment-quiz-2', { ...attempt, quiz_uuid: 'quiz-2', score: undefined }],
    ]),
    bands: [
      { name: 'Pass', min_percentage: 70 },
      { name: 'Merit', min_percentage: 80 },
    ],
  });
  const firstLesson = summary.sessions.get('session-1');
  assert.equal(firstLesson?.rows.get('a')?.score, 30);
  assert.equal(firstLesson?.rows.get('a')?.maxScore, 50);
  assert.equal(firstLesson?.rows.get('a')?.graded, 3);
  assert.equal(firstLesson?.average, 30);
  assert.equal(firstLesson?.scored, 1);
  assert.equal(firstLesson?.rows.get('b')?.score, undefined);
  assert.equal(summary.sessions.get('session-2')?.rows.has('b'), false);
  assert.equal(summary.students.get('a')?.average, 75);
  assert.equal(summary.students.get('a')?.maxScore, undefined);
  assert.equal(summary.students.get('a')?.band, 'Pass');
  assert.equal(summary.students.get('b')?.average, undefined);
  assert.equal(summary.students.get('b')?.band, undefined);
});

test('keeps fractional averages when lesson maxima match and retains graded zeroes', () => {
  const marks = [0, 10].map(score =>
    summarizeStudentMarks([
      { id: 'task', title: 'Task', kind: 'quiz', status: 'GRADED', score, maxScore: 20 },
    ])
  );
  const result = averageClassReportScores(marks, [{ name: 'Pass', min_percentage: 25 }]);
  assert.equal(result.average, 5);
  assert.equal(result.maxScore, 20);
  assert.equal(result.percentage, 25);
  assert.equal(result.band, 'Pass');
});

test('leaves missing grades out of student averages rather than adding zeros', () => {
  const result = averageClassReportScores([
    summarizeStudentMarks([
      { id: 'task', title: 'Task', kind: 'assignment', status: 'GRADED', score: 8, maxScore: 10 },
    ]),
    summarizeStudentMarks([
      {
        id: 'task',
        title: 'Task',
        kind: 'assignment',
        status: 'SUBMITTED',
        score: 0,
        maxScore: 10,
      },
    ]),
  ]);
  assert.equal(result.average, 8);
  assert.equal(result.percentage, 80);
  assert.deepEqual(averageClassReportScores([]), {});
});

test('scopes schedules by class, lesson and session and deduplicates tasks', () => {
  const schedules = [
    {
      class_definition_uuid: 'class',
      lesson_uuid: 'lesson-1',
      assignment_uuid: 'correct',
      class_lesson_plan_uuid: 'session-1',
    },
    {
      class_definition_uuid: 'class',
      lesson_uuid: 'lesson-1',
      assignment_uuid: 'correct',
      class_lesson_plan_uuid: 'session-1',
    },
    {
      class_definition_uuid: 'other-class',
      lesson_uuid: 'lesson-1',
      assignment_uuid: 'other-class',
    },
    {
      lesson_uuid: 'lesson-1',
      assignment_uuid: 'other-session',
      class_lesson_plan_uuid: 'other-session',
    },
    { lesson_uuid: 'other-lesson', assignment_uuid: 'other-lesson' },
  ];
  const result = classReportTasks(
    report,
    [{ uuid: 'lesson-1', lesson_number: 1, title: 'Lesson 1' }],
    schedules,
    []
  );
  assert.deepEqual(
    result.get('session-1')?.map(task => task.uuid),
    ['correct']
  );
  assert.deepEqual(result.get('session-2'), []);
});
