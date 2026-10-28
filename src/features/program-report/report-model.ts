import type { StatusTone } from '@/components/data-display';
import { resultLabel } from '@/lib/grades';
import type {
  ProgramReport,
  ProgramReportEvidence,
  ProgramReportSkill,
} from '@/services/client/types.gen';
import { points, shortDate } from './use-program-report';

export type ReportAudience = 'learner' | 'guardian' | 'instructor';

const RESULT_TONE: Record<string, StatusTone> = { PASSED: 'success', FAILED: 'destructive' };

export function resultTone(status?: string | null): StatusTone {
  return RESULT_TONE[(status ?? '').toUpperCase()] ?? 'neutral';
}

export function courseResultLabel(status?: string | null) {
  return (status ?? '').toUpperCase() === 'NOT_STARTED' ? 'Not started' : resultLabel(status);
}

/** Level pill tone: achieved is the brand tint, the lowest level a warning. */
export function levelTone(level?: string | null, achieved?: boolean): StatusTone {
  if (!level) return 'neutral';
  if (achieved) return 'info';
  return /not achieved/i.test(level) ? 'warning' : 'neutral';
}

/** "Your" for the learner, "Amani's" for anyone else reading. */
export function possessive(audience: ReportAudience, learnerName?: string) {
  if (audience === 'learner') return 'Your';
  const first = learnerName?.trim().split(/\s+/)[0];
  return first ? `${first}'s` : "The learner's";
}

/** Facts the card, the preview and the print route all phrase the same way. */
export function reportFacts(report: ProgramReport) {
  const courses = report.courses ?? [];
  const mandatory = courses.filter(course => course.is_required);
  const decided = mandatory.filter(course => course.contribution != null);
  const pointsSoFar = decided.reduce((sum, course) => sum + Number(course.contribution ?? 0), 0);
  const weightDecided = decided.reduce(
    (sum, course) => sum + Number(course.weight_percentage ?? 0),
    0
  );
  const failedMandatory = mandatory.filter(
    course => (course.result_status ?? '').toUpperCase() === 'FAILED'
  );
  const pendingMandatory = mandatory.filter(
    course => !['PASSED', 'FAILED'].includes((course.result_status ?? '').toUpperCase())
  );
  const provisional = report.final_grade_provisional !== false;
  const total = report.mandatory_total ?? mandatory.length;
  const sumNote = provisional
    ? `${points(pointsSoFar)} points ÷ ${Math.round(weightDecided)}% of weight decided so far`
    : `${points(pointsSoFar)} points over ${Math.round(weightDecided)}% of weight`;
  return { courses, mandatory, failedMandatory, pendingMandatory, provisional, total, sumNote };
}

export function passRuleText(passMark?: number | null) {
  return `Pass rule: program mark at least ${passMark == null ? 'the pass mark' : `${Number(passMark)}%`} and every mandatory course passed. Optional courses never count. Points = course final × weight.`;
}

/** Newest first; superseded rows keep their place in time. */
export function sortedHistory(skill: ProgramReportSkill) {
  return [...(skill.history ?? [])].sort(
    (a, b) => new Date(b.graded_at ?? 0).getTime() - new Date(a.graded_at ?? 0).getTime()
  );
}

/** Where a piece of evidence came from, e.g. "Piano Fundamentals · Solo performance". */
export function evidenceSource(item: ProgramReportEvidence) {
  const parts = [item.course_title, item.assessment_title].filter(Boolean);
  return parts.length ? parts.join(' · ') : (item.source_title ?? 'Graded work');
}

/** A regrade replaces an earlier score on the same assessment; both rows stay. */
export function evidenceNote(item: ProgramReportEvidence, history: ProgramReportEvidence[]) {
  const sameAssessment = history.filter(
    other => other !== item && other.course_assessment_uuid === item.course_assessment_uuid
  );
  if (item.superseded) {
    const regrade = sameAssessment
      .filter(other => !other.superseded)
      .find(other => new Date(other.graded_at ?? 0) >= new Date(item.graded_at ?? 0));
    return regrade ? `Replaced by the regrade on ${shortDate(regrade.graded_at)}` : 'Regraded';
  }
  return sameAssessment.some(other => other.superseded) ? 'Regrade' : '';
}
