import type {
  Assignment,
  Lesson,
  PageMetadata,
  Quiz,
  QuizQuestion,
} from '@/services/client/types.gen';

export type LessonAssessment = {
  id: string;
  uuid: string;
  type: 'assignment' | 'quiz';
  title: string;
  maxAttempts?: number;
  totalMarks?: number;
  passPercentage?: number;
  questionCount?: number;
};

export type EvaluationLesson = {
  id: string;
  number: number;
  title: string;
  assessments: LessonAssessment[];
};

export type EvaluationPage<T = unknown> = {
  success?: boolean;
  error?: unknown;
  data?: { content?: T[]; metadata?: PageMetadata };
};

export function evaluationPageFailed(page: EvaluationPage) {
  return Boolean(page.error) || page.success === false;
}

export function nextCourseEvaluationPage(page: EvaluationPage, pages: EvaluationPage[]) {
  if (evaluationPageFailed(page)) return undefined;
  const metadata = page.data?.metadata;
  const current = metadata?.pageNumber ?? pages.length - 1;
  if (metadata?.hasNext === false || metadata?.last === true) return undefined;
  return metadata?.hasNext || (metadata?.totalPages ?? 0) > current + 1 ? current + 1 : undefined;
}

function uniqueRows<T extends { uuid?: string }>(rows: T[]) {
  return [...new Map(rows.flatMap(row => (row.uuid ? [[row.uuid, row] as const] : []))).values()];
}

export function buildCourseEvaluationLessons(
  courseUuid: string,
  lessons: Lesson[],
  assignments: Assignment[],
  quizzes: Quiz[],
  questions: QuizQuestion[]
): EvaluationLesson[] {
  const questionsByQuiz = new Map<string, { count: number; marks: number }>();
  for (const question of uniqueRows(questions)) {
    const summary = questionsByQuiz.get(question.quiz_uuid) ?? { count: 0, marks: 0 };
    summary.count += 1;
    summary.marks += question.points;
    questionsByQuiz.set(question.quiz_uuid, summary);
  }
  const assessmentsByLesson = new Map<string, LessonAssessment[]>();
  const append = (lessonUuid: string, assessment: LessonAssessment) => {
    const rows = assessmentsByLesson.get(lessonUuid) ?? [];
    rows.push(assessment);
    assessmentsByLesson.set(lessonUuid, rows);
  };
  for (const assignment of uniqueRows(assignments)) {
    if (!assignment.uuid || assignment.scope === 'CLASS_CLONE' || assignment.class_definition_uuid)
      continue;
    append(assignment.lesson_uuid, {
      id: `assignment:${assignment.uuid}`,
      uuid: assignment.uuid,
      type: 'assignment',
      title: assignment.title,
      totalMarks: assignment.max_points,
      // The assignment API does not expose an attempt limit.
    });
  }
  for (const quiz of uniqueRows(quizzes)) {
    if (!quiz.uuid || quiz.scope === 'CLASS_CLONE' || quiz.class_definition_uuid) continue;
    const summary = questionsByQuiz.get(quiz.uuid ?? '') ?? { count: 0, marks: 0 };
    append(quiz.lesson_uuid, {
      id: `quiz:${quiz.uuid}`,
      uuid: quiz.uuid,
      type: 'quiz',
      title: quiz.title,
      maxAttempts: quiz.attempts_allowed,
      passPercentage: quiz.passing_score,
      questionCount: summary.count,
      totalMarks: summary.marks,
    });
  }
  return uniqueRows(lessons)
    .filter(lesson => lesson.course_uuid === courseUuid)
    .sort((a, b) => a.lesson_number - b.lesson_number)
    .map(lesson => ({
      id: lesson.uuid ?? '',
      number: lesson.lesson_number,
      title: lesson.title,
      assessments: assessmentsByLesson.get(lesson.uuid ?? '') ?? [],
    }));
}
