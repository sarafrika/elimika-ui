import type {
  AssignmentSubmission,
  ClassAssignmentSchedule,
  ClassQuizSchedule,
  ClassReport,
  CourseEnrollment,
  CourseGradeBand,
  Lesson,
  QuizAttempt,
} from '@/services/client/types.gen';
import { belongsToSession } from './assessment-scheduling';
import type { LessonGradingTask } from './LessonGradingPanel';
import {
  reportScoreBand,
  summarizeReportScores,
  type ReportStudentScore,
  type ReportTaskMark,
} from './session-report-scores';

/** Match tasks once per session; templates scheduled twice still count once within a session. */
export function classReportTasks(
  report: ClassReport,
  lessons: Pick<Lesson, 'uuid' | 'lesson_number' | 'title'>[],
  assignments: ClassAssignmentSchedule[],
  quizzes: ClassQuizSchedule[]
) {
  return new Map(
    (report.sessions ?? []).flatMap(session => {
      if (!session.instance_uuid) return [];
      const lesson = lessons.find(item =>
        session.lesson_number != null
          ? item.lesson_number === session.lesson_number
          : Boolean(session.lesson_title && item.title === session.lesson_title)
      );
      const tasks: LessonGradingTask[] = [];
      if (lesson?.uuid) {
        for (const schedule of assignments) {
          if (
            schedule.assignment_uuid &&
            schedule.lesson_uuid === lesson.uuid &&
            (!schedule.class_definition_uuid ||
              schedule.class_definition_uuid === report.class_definition_uuid) &&
            belongsToSession(schedule, session.instance_uuid)
          ) {
            tasks.push({
              id: `assignment:${schedule.assignment_uuid}`,
              kind: 'assignment',
              uuid: schedule.assignment_uuid,
              title: 'Assignment',
            });
          }
        }
        for (const schedule of quizzes) {
          if (
            schedule.quiz_uuid &&
            schedule.lesson_uuid === lesson.uuid &&
            (!schedule.class_definition_uuid ||
              schedule.class_definition_uuid === report.class_definition_uuid) &&
            belongsToSession(schedule, session.instance_uuid)
          ) {
            tasks.push({
              id: `quiz:${schedule.quiz_uuid}`,
              kind: 'quiz',
              uuid: schedule.quiz_uuid,
              title: 'Quiz',
            });
          }
        }
      }
      return [
        [session.instance_uuid, [...new Map(tasks.map(task => [task.id, task])).values()]] as const,
      ];
    })
  );
}

/** An arithmetic average of scored lesson totals; compare percentages when maxima differ. */
export function averageClassReportScores(
  scores: ReportStudentScore[],
  bands: CourseGradeBand[] = []
) {
  const available = scores.filter(score => score.complete && score.percentage != null);
  if (!available.length) return {};
  const percentage =
    available.reduce((sum, score) => sum + (score.percentage ?? 0), 0) / available.length;
  const firstMax = available[0]?.maxScore;
  const maxScore = available.every(score => score.maxScore === firstMax) ? firstMax : undefined;
  const average =
    maxScore != null
      ? available.reduce((sum, score) => sum + (score.score ?? 0), 0) / available.length
      : percentage;
  return { average, maxScore, percentage, band: reportScoreBand(percentage, bands) };
}

export function summarizeClassReportAssessments({
  report,
  tasks,
  enrollments,
  submissions,
  attempts,
  bands = [],
}: {
  report: ClassReport;
  tasks: Map<string, LessonGradingTask[]>;
  enrollments: CourseEnrollment[];
  submissions: Map<string, AssignmentSubmission>;
  attempts: Map<string, QuizAttempt>;
  bands?: CourseGradeBand[];
}) {
  const enrollmentByStudent = new Map(enrollments.map(entry => [entry.student_uuid, entry.uuid]));
  const sessions = new Map(
    [...tasks].map(([instanceId, sessionTasks]) => [
      instanceId,
      summarizeReportScores(
        (report.students ?? []).flatMap(student => {
          if (!student.student_uuid) return [];
          // A missing cell means this learner is not part of that session's roster.
          if (!student.cells?.some(cell => cell.instance_uuid === instanceId)) return [];
          const enrollmentId = enrollmentByStudent.get(student.student_uuid);
          const marks: ReportTaskMark[] = sessionTasks.map(task => {
            const result = enrollmentId
              ? (task.kind === 'quiz' ? attempts : submissions).get(`${enrollmentId}-${task.uuid}`)
              : undefined;
            return {
              id: task.id,
              kind: task.kind,
              title: task.title,
              status: result?.status,
              score: result?.score,
              maxScore: result?.max_score,
            };
          });
          return [{ key: student.student_uuid, marks }];
        }),
        bands
      ),
    ])
  );
  const students = new Map(
    (report.students ?? []).flatMap(student => {
      if (!student.student_uuid) return [];
      const totals = [...sessions.values()].flatMap(session => {
        const score = session.rows.get(student.student_uuid ?? '');
        return score ? [score] : [];
      });
      return [[student.student_uuid, averageClassReportScores(totals, bands)] as const];
    })
  );
  return { sessions, students };
}
