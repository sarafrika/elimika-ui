import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Assignment, Lesson, Quiz, QuizQuestion } from '@/services/client/types.gen';
import {
  buildCourseEvaluationLessons,
  evaluationPageFailed,
  nextCourseEvaluationPage,
} from './program-course-evaluations';

const lessons: Lesson[] = [
  {
    uuid: 'lesson-2',
    course_uuid: 'course-1',
    lesson_number: 2,
    title: 'Second lesson',
    status: 'DRAFT',
  },
  {
    uuid: 'lesson-1',
    course_uuid: 'course-1',
    lesson_number: 1,
    title: 'First lesson',
    status: 'DRAFT',
  },
  {
    uuid: 'other-lesson',
    course_uuid: 'course-2',
    lesson_number: 1,
    title: 'Other course',
    status: 'DRAFT',
  },
];
const assignment: Assignment = {
  uuid: 'assignment-1',
  lesson_uuid: 'lesson-1',
  title: 'First assignment',
  max_points: 20,
};
const quiz: Quiz = {
  uuid: 'quiz-1',
  lesson_uuid: 'lesson-1',
  title: 'First quiz',
  attempts_allowed: 3,
  passing_score: 60,
  status: 'DRAFT',
};
const questions: QuizQuestion[] = [
  {
    uuid: 'question-1',
    quiz_uuid: 'quiz-1',
    question_text: 'One',
    question_type: 'MULTIPLE_CHOICE',
    points: 5,
    display_order: 1,
  },
  {
    uuid: 'question-2',
    quiz_uuid: 'quiz-1',
    question_text: 'Two',
    question_type: 'MULTIPLE_CHOICE',
    points: 10,
    display_order: 2,
  },
];

test('groups assessments under their lessons, orders lessons, and scopes to the selected course', () => {
  const result = buildCourseEvaluationLessons('course-1', lessons, [assignment], [quiz], questions);
  assert.deepEqual(
    result.map(lesson => lesson.id),
    ['lesson-1', 'lesson-2']
  );
  assert.deepEqual(result[0]?.assessments, [
    {
      id: 'assignment:assignment-1',
      type: 'assignment',
      title: 'First assignment',
      totalMarks: 20,
    },
    {
      id: 'quiz:quiz-1',
      type: 'quiz',
      title: 'First quiz',
      maxAttempts: 3,
      passPercentage: 60,
      questionCount: 2,
      totalMarks: 15,
    },
  ]);
  assert.deepEqual(result[1]?.assessments, []);
});

test('does not invent marks or an unlimited attempt limit for assignments', () => {
  const result = buildCourseEvaluationLessons(
    'course-1',
    lessons,
    [{ ...assignment, max_points: undefined }],
    [],
    []
  );
  assert.equal(result[0]?.assessments[0]?.totalMarks, undefined);
  assert.equal(result[0]?.assessments[0]?.maxAttempts, undefined);
});

test('ignores class clones and unrelated lesson assessments in broad API responses', () => {
  const result = buildCourseEvaluationLessons(
    'course-1',
    lessons,
    [
      assignment,
      { ...assignment, uuid: 'clone', scope: 'CLASS_CLONE' },
      { ...assignment, uuid: 'class-owned', class_definition_uuid: 'class-1' },
      { ...assignment, uuid: 'other-assignment', lesson_uuid: 'other-lesson' },
    ],
    [
      quiz,
      { ...quiz, uuid: 'clone-quiz', scope: 'CLASS_CLONE' },
      { ...quiz, uuid: 'other-quiz', lesson_uuid: 'other-lesson' },
    ],
    questions
  );
  assert.equal(result.flatMap(lesson => lesson.assessments).length, 2);
});

test('deduplicates overlapping API pages and counts only the quiz own questions', () => {
  const result = buildCourseEvaluationLessons(
    'course-1',
    [...lessons, ...lessons],
    [assignment, assignment],
    [quiz, quiz],
    [
      ...questions,
      ...questions,
      { ...questions[0]!, uuid: 'other-question', quiz_uuid: 'other-quiz', points: 99 },
    ]
  );
  assert.equal(result.length, 2);
  assert.equal(result[0]?.assessments.length, 2);
  assert.equal(result[0]?.assessments[1]?.questionCount, 2);
  assert.equal(result[0]?.assessments[1]?.totalMarks, 15);
});

test('an empty quiz has zero questions and zero obtainable marks', () => {
  const result = buildCourseEvaluationLessons('course-1', lessons, [], [quiz], []);
  assert.equal(result[0]?.assessments[0]?.questionCount, 0);
  assert.equal(result[0]?.assessments[0]?.totalMarks, 0);
});

test('follows metadata through later pages and stops on the last page or API errors', () => {
  const first = { data: { metadata: { pageNumber: 0, totalPages: 3 } } };
  const second = { data: { metadata: { hasNext: true } } };
  assert.equal(nextCourseEvaluationPage(first, [first]), 1);
  assert.equal(nextCourseEvaluationPage(second, [first, second]), 2);
  assert.equal(
    nextCourseEvaluationPage({ data: { metadata: { last: true, totalPages: 3 } } }, [first]),
    undefined
  );
  assert.equal(
    nextCourseEvaluationPage({ data: { metadata: { hasNext: false } } }, [first]),
    undefined
  );
  assert.equal(
    nextCourseEvaluationPage({ success: false, data: { metadata: { hasNext: true } } }, [first]),
    undefined
  );
  assert.equal(nextCourseEvaluationPage({ error: 'Denied' }, [first]), undefined);
  assert.equal(evaluationPageFailed({ success: false }), true);
  assert.equal(evaluationPageFailed({ error: 'Denied' }), true);
});
