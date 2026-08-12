'use client';

import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { useQueries } from '@tanstack/react-query';

import { useStudent } from '@/context/student-context';
import useStudentClassDefinitions from '@/hooks/use-student-class-definition';
import { STALE_TIMES } from '@/lib/query-client';
import {
    getCourseAssessmentsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { CourseAssessment } from '@/services/client/types.gen';

import {
    CheckCircle2,
    Clock,
    Download,
    FileCheck2,
    Play,
    RotateCcw,
    XCircle,
} from 'lucide-react';

/* =========================================================================
   Types
   ========================================================================= */

type AssessmentType = 'quiz' | 'exam' | 'assignment' | 'project' | 'competition';
type AttemptStatus = 'in_progress' | 'submitted';

interface Question {
    id: string;
    prompt: string;
    points: number;
    options: string[];
    correct_index: number;
}

interface RubricCriterion {
    id: string;
    name: string;
    position: number;
}

interface RubricTask {
    id: string;
    name: string;
    position: number;
}

interface RubricScore {
    task_id: string;
    criterion_id: string;
    level: number; // 1–4
    comment?: string;
}

interface Assessment {
    id: string;
    title: string;
    type: AssessmentType;
    course_title: string;
    course_uuid?: string;
    duration_minutes: number;
    pass_mark: number;
    max_score: number;
    instructions?: string;
    questions: Question[];
    criteria: RubricCriterion[];
    tasks: RubricTask[];
    scores: RubricScore[];
}

interface Attempt {
    id: string;
    assessment_id: string;
    status: AttemptStatus;
    answers: Record<string, number>;
    score?: number;
    max_score?: number;
    passed?: boolean;
}

/* =========================================================================
   Static reference data
   ========================================================================= */

const ASSESSMENT_TYPES: AssessmentType[] = ['quiz', 'exam', 'assignment', 'project', 'competition'];

const TYPE_LABEL: Record<AssessmentType, string> = {
    quiz: 'Quiz',
    exam: 'Exam',
    assignment: 'Assignment',
    project: 'Project',
    competition: 'Competition',
};

const TYPE_TINT: Record<AssessmentType, string> = {
    quiz: 'bg-primary/10 text-primary border-primary/20',
    exam: 'bg-destructive/10 text-destructive border-destructive/20',
    assignment: 'bg-warning/10 text-warning border-warning/20',
    project: 'bg-success/10 text-success border-success/20',
    competition: 'bg-accent/10 text-accent-foreground border-accent/20',
};

const RUBRIC_LEVEL_LABEL: Record<number, string> = {
    1: 'Beginning',
    2: 'Developing',
    3: 'Proficient',
    4: 'Exemplary',
};
const RUBRIC_MAX_LEVEL = 4;

const assessmentType = (a: Assessment) => a.type;

function normalizeAssessmentType(type?: string): AssessmentType {
    const normalized = String(type ?? '').trim().toLowerCase();

    if (normalized.includes('quiz')) return 'quiz';
    if (normalized.includes('exam')) return 'exam';
    if (normalized.includes('assignment')) return 'assignment';
    if (normalized.includes('project')) return 'project';
    if (normalized.includes('competition')) return 'competition';

    return 'assignment';
}

function mapCourseAssessmentToUI(assessment: CourseAssessment, courseTitle: string): Assessment {
    return {
        id: assessment.uuid ?? assessment.title ?? 'untitled-assessment',
        course_uuid: assessment.course_uuid,
        title: assessment.title ?? 'Untitled assessment',
        type: normalizeAssessmentType(assessment.assessment_type),
        course_title: courseTitle,
        duration_minutes: 0,
        pass_mark: 0,
        max_score: 0,
        instructions: assessment.description ?? undefined,
        questions: [],
        criteria: [],
        tasks: [],
        scores: [],
    };
}

/* =========================================================================
   Small pieces
   ========================================================================= */

function AssessmentTypeBadge({ type }: { type: AssessmentType }) {
    return (
        <Badge variant="outline" className={TYPE_TINT[type]}>
            {TYPE_LABEL[type]}
        </Badge>
    );
}

function rubricAverageLevel(criteria: RubricCriterion[], taskId: string, scores: RubricScore[]) {
    const rows = scores.filter((s) => s.task_id === taskId);
    if (rows.length === 0) return null;
    const sum = rows.reduce((acc, r) => acc + r.level, 0);
    return sum / rows.length;
}

function rubricPercent(criteria: RubricCriterion[], tasks: RubricTask[], scores: RubricScore[]) {
    if (scores.length === 0) return null;
    const sum = scores.reduce((acc, s) => acc + s.level, 0);
    const max = tasks.length * criteria.length * RUBRIC_MAX_LEVEL;
    if (max === 0) return null;
    return Math.round((sum / max) * 100);
}

function RubricTable({
    criteria,
    tasks,
    scores,
}: {
    criteria: RubricCriterion[];
    tasks: RubricTask[];
    scores: RubricScore[];
}) {
    return (
        <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-left text-sm">
                <thead className="bg-muted">
                    <tr>
                        <th className="px-3 py-2 font-medium">Task</th>
                        {criteria.map((c) => (
                            <th key={c.id} className="px-3 py-2 font-medium whitespace-nowrap">{c.name}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {tasks.map((t) => (
                        <tr key={t.id}>
                            <td className="px-3 py-2 font-medium">{t.name}</td>
                            {criteria.map((c) => {
                                const cell = scores.find((s) => s.task_id === t.id && s.criterion_id === c.id);
                                return (
                                    <td key={c.id} className="px-3 py-2 align-top">
                                        {cell ? (
                                            <div className="space-y-0.5">
                                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                                    {RUBRIC_LEVEL_LABEL[cell.level] ?? cell.level}
                                                </Badge>
                                                {cell.comment && (
                                                    <p className="text-muted-foreground text-xs">{cell.comment}</p>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-xs italic">Not scored</span>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function downloadReport(assessment: Assessment, attempt: Attempt) {
    const lines = [
        `Assessment,${assessment.title}`,
        `Course,${assessment.course_title}`,
        `Status,${attempt.status}`,
        `Score,${attempt.score ?? ''}/${attempt.max_score ?? ''}`,
        `Passed,${attempt.passed ? 'Yes' : 'No'}`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${assessment.title.replace(/\s+/g, '-').toLowerCase()}-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

/* =========================================================================
   Main tab
   ========================================================================= */

const LessonHubAssessmentsTab = () => {
    const student = useStudent();
    const { classDefinitions } = useStudentClassDefinitions(student ?? undefined);
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [openId, setOpenId] = useState<string | null>(null);
    const [typeFilter, setTypeFilter] = useState<AssessmentType | 'all'>('all');

    const courseUuids = useMemo(
        () =>
            Array.from(
                new Set(
                    classDefinitions
                        .map((definition) => definition.course?.uuid)
                        .filter((value): value is string => Boolean(value))
                )
            ),
        [classDefinitions]
    );

    const courseTitleMap = useMemo(() => {
        const map = new Map<string, string>();

        classDefinitions.forEach((definition) => {
            const courseUuid = definition.course?.uuid;
            const courseName = definition.course?.name;

            if (courseUuid) {
                map.set(courseUuid, courseName ?? 'Untitled course');
            }
        });

        return map;
    }, [classDefinitions]);

    const assessmentQueries = useQueries({
        queries: courseUuids.map((courseUuid) => ({
            ...getCourseAssessmentsOptions({
                path: { courseUuid },
                query: { pageable: {} },
            }),
            enabled: !!courseUuid,
            staleTime: STALE_TIMES.entity,
        })),
    });

    const assessments = useMemo(() => {
        return courseUuids.flatMap((courseUuid, index) => {
            const query = assessmentQueries[index];
            const items = query?.data?.data?.content ?? [];
            const courseTitle = courseTitleMap.get(courseUuid) ?? 'Unknown course';

            return items.map((item) => mapCourseAssessmentToUI(item, courseTitle));
        });
    }, [assessmentQueries, courseTitleMap, courseUuids]);

    const loading = assessmentQueries.some((query) => query.isLoading);

    const attemptFor = (assessmentId: string) =>
        attempts.find((a) => a.assessment_id === assessmentId) ?? null;

    const upsertAttempt = (next: Attempt) => {
        setAttempts((prev) => {
            const exists = prev.some((a) => a.id === next.id);
            return exists ? prev.map((a) => (a.id === next.id ? next : a)) : [next, ...prev];
        });
    };

    const all = assessments;
    const list = typeFilter === 'all' ? all : all.filter((a) => assessmentType(a) === typeFilter);

    const openAssessment = openId ? assessments.find((a) => a.id === openId) ?? null : null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-foreground text-lg font-semibold">Assessments</h2>
                    <p className="text-muted-foreground text-sm">
                        Assignments, quizzes, exams, projects and competitions marked against rubrics.
                    </p>
                </div>
                <Badge variant="secondary">{list.length} available</Badge>
            </div>

            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" style={{ touchAction: 'pan-x' }}>
                {(['all', ...ASSESSMENT_TYPES] as const).map((t) => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => setTypeFilter(t)}
                        className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${typeFilter === t
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background text-muted-foreground hover:border-primary/40'
                            }`}
                    >
                        {t === 'all' ? 'All types' : TYPE_LABEL[t]}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-muted-foreground text-sm">Loading…</div>
            ) : list.length === 0 ? (
                <Card>
                    <CardContent className="text-muted-foreground py-10 text-center text-sm">
                        {all.length === 0
                            ? 'No assessments available yet. Enrol in a course to see assessments and rubric results here.'
                            : `No ${TYPE_LABEL[typeFilter as AssessmentType].toLowerCase()} assessments yet.`}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-3 md:grid-cols-2">
                    {list.map((a) => {
                        const att = attemptFor(a.id);
                        const submitted = att?.status === 'submitted';
                        const pct =
                            submitted && att?.score != null && att?.max_score
                                ? Math.round((att.score / att.max_score) * 100)
                                : null;
                        return (
                            <Card key={a.id} className="hover:border-primary transition-colors">
                                <CardHeader>
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <CardTitle className="text-base">{a.title}</CardTitle>
                                            <CardDescription>{a.course_title}</CardDescription>
                                            <div className="mt-2">
                                                <AssessmentTypeBadge type={assessmentType(a)} />
                                            </div>
                                        </div>
                                        <FileCheck2 className="text-primary h-5 w-5" />
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="text-muted-foreground flex flex-wrap gap-2 text-xs">
                                        {a.duration_minutes > 0 && (
                                            <span className="inline-flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {a.duration_minutes} min
                                            </span>
                                        )}
                                        {a.max_score > 0 && (
                                            <>
                                                <span>Pass: {a.pass_mark}%</span>
                                                <span>Max score: {a.max_score}</span>
                                            </>
                                        )}
                                        {a.max_score === 0 && a.criteria.length > 0 && (
                                            <span>Marked against a {a.criteria.length}-criteria rubric</span>
                                        )}
                                    </div>

                                    {submitted ? (
                                        <div className="bg-muted rounded-lg border p-3">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium">Result</span>
                                                <span className={att!.passed ? 'text-success' : 'text-destructive'}>
                                                    {att!.passed ? (
                                                        <span className="inline-flex items-center gap-1">
                                                            <CheckCircle2 className="h-4 w-4" />
                                                            Passed
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1">
                                                            <XCircle className="h-4 w-4" />
                                                            Not passed
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                            <div className="mt-2 flex items-center gap-3">
                                                <Progress value={pct ?? 0} className="h-2 flex-1" />
                                                <span className="text-sm font-semibold">
                                                    {att!.score}/{att!.max_score}
                                                </span>
                                            </div>
                                        </div>
                                    ) : att ? (
                                        <Badge variant="outline" className="text-warning border-warning/30">
                                            In progress
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline">Not started</Badge>
                                    )}

                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() => setOpenId(a.id)}
                                            className="bg-primary hover:bg-primary/90 gap-1"
                                        >
                                            {submitted ? (
                                                <>
                                                    <RotateCcw className="h-4 w-4" />
                                                    Review
                                                </>
                                            ) : att ? (
                                                <>
                                                    <Play className="h-4 w-4" />
                                                    Resume
                                                </>
                                            ) : (
                                                <>
                                                    <Play className="h-4 w-4" />
                                                    Start
                                                </>
                                            )}
                                        </Button>
                                        {submitted && (
                                            <Button size="sm" variant="outline" onClick={() => downloadReport(a, att!)} className="gap-1">
                                                <Download className="h-4 w-4" />
                                                Report
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            <AssessmentSheet
                assessment={openAssessment}
                attempt={openAssessment ? attemptFor(openAssessment.id) : null}
                onClose={() => setOpenId(null)}
                onUpsertAttempt={upsertAttempt}
            />
        </div>
    );
};

/* =========================================================================
   Sheet — take / review an assessment
   ========================================================================= */

function AssessmentSheet({
    assessment,
    attempt,
    onClose,
    onUpsertAttempt,
}: {
    assessment: Assessment | null;
    attempt: Attempt | null;
    onClose: () => void;
    onUpsertAttempt: (attempt: Attempt) => void;
}) {
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const initialized = useMemo(() => !!attempt, [attempt?.id]);
    useMemo(() => {
        if (attempt?.answers) setAnswers(attempt.answers);
        else if (assessment && !initialized) setAnswers({});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attempt?.id, assessment?.id]);

    if (!assessment) {
        return (
            <Sheet open={false} onOpenChange={(o) => !o && onClose()}>
                <SheetContent className="w-full sm:max-w-2xl overflow-y-auto" />
            </Sheet>
        );
    }

    const submitted = attempt?.status === 'submitted';

    function saveDraft() {
        if (!assessment) return;
        setSaving(true);
        const next: Attempt = {
            id: attempt?.id ?? `att-${assessment.id}-${Date.now()}`,
            assessment_id: assessment.id,
            status: 'in_progress',
            answers,
        };
        onUpsertAttempt(next);
        setSaving(false);
    }

    function submit() {
        if (!assessment) return;
        setSubmitting(true);
        let score = 0;
        let max = 0;
        for (const q of assessment.questions) {
            max += q.points;
            if (answers[q.id] === q.correct_index) score += q.points;
        }
        const pct = max ? (score / max) * 100 : 0;
        const passed = pct >= (assessment.pass_mark ?? 50);
        const next: Attempt = {
            id: attempt?.id ?? `att-${assessment.id}-${Date.now()}`,
            assessment_id: assessment.id,
            status: 'submitted',
            answers,
            score,
            max_score: max,
            passed,
        };
        onUpsertAttempt(next);
        setSubmitting(false);
    }

    const rubricAvailable = assessment.criteria.length > 0 && assessment.tasks.length > 0;
    const rubricPct = rubricAvailable ? rubricPercent(assessment.criteria, assessment.tasks, assessment.scores) : null;

    return (
        <Sheet open={!!assessment} onOpenChange={(o) => !o && onClose()}>
            <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{assessment.title}</SheetTitle>
                    <SheetDescription>
                        {assessment.course_title}
                        {assessment.duration_minutes > 0 && ` · ${assessment.duration_minutes} min`}
                        {assessment.pass_mark > 0 && ` · Pass mark ${assessment.pass_mark}%`}
                    </SheetDescription>
                    <div className="pt-1">
                        <AssessmentTypeBadge type={assessmentType(assessment)} />
                    </div>
                </SheetHeader>

                {assessment.instructions && (
                    <div className="bg-muted text-foreground mt-4 rounded-lg p-3 text-sm whitespace-pre-wrap">
                        {assessment.instructions}
                    </div>
                )}

                {rubricAvailable ? (
                    <div className="mt-6">
                        <div className="mb-2 flex items-baseline justify-between">
                            <h3 className="text-foreground text-sm font-semibold">Rubric results</h3>
                            <span className="text-muted-foreground text-xs">
                                {rubricPct == null ? 'Awaiting marking' : `Overall ${rubricPct}%`}
                            </span>
                        </div>
                        <RubricTable criteria={assessment.criteria} tasks={assessment.tasks} scores={assessment.scores} />
                    </div>
                ) : (assessment.criteria.length > 0 || assessment.tasks.length > 0) ? (
                    <div className="text-muted-foreground mt-6 rounded-lg border border-dashed p-4 text-sm">
                        No rubric has been published for this assessment yet.
                    </div>
                ) : null}

                {assessment.questions.length > 0 && (
                    <div className="mt-6 space-y-5">
                        {assessment.questions.map((q, idx) => (
                            <div key={q.id} className="rounded-lg border p-3">
                                <div className="text-foreground text-sm font-medium">
                                    {idx + 1}. {q.prompt}
                                    <span className="text-muted-foreground ml-2 text-xs">
                                        ({q.points} pt{q.points === 1 ? '' : 's'})
                                    </span>
                                </div>
                                <div className="mt-2 space-y-1">
                                    {q.options.map((opt, i) => {
                                        const selected = answers[q.id] === i;
                                        const correct = submitted && q.correct_index === i;
                                        const wrong = submitted && selected && q.correct_index !== i;
                                        return (
                                            <label
                                                key={i}
                                                className={`flex cursor-pointer items-start gap-2 rounded-md border p-2 text-sm transition-colors ${correct
                                                    ? 'border-success/40 bg-success/10'
                                                    : wrong
                                                        ? 'border-destructive/40 bg-destructive/10'
                                                        : selected
                                                            ? 'border-primary bg-primary/5'
                                                            : 'border-border hover:border-primary/40'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name={q.id}
                                                    className="mt-1"
                                                    checked={selected}
                                                    disabled={submitted}
                                                    onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: i }))}
                                                />
                                                <span>{opt}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {submitted ? (
                    <div className="bg-muted mt-6 rounded-lg border p-3 text-sm">
                        <div className="font-medium">
                            Result: {attempt!.score}/{attempt!.max_score} ·{' '}
                            <span className={attempt!.passed ? 'text-success' : 'text-destructive'}>
                                {attempt!.passed ? 'Passed' : 'Not passed'}
                            </span>
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 gap-1"
                            onClick={() => downloadReport(assessment, attempt!)}
                        >
                            <Download className="h-4 w-4" />
                            Download report
                        </Button>
                    </div>
                ) : (
                    assessment.questions.length > 0 && (
                        <div className="mt-6 flex gap-2">
                            <Button variant="outline" onClick={saveDraft} disabled={saving}>
                                Save draft
                            </Button>
                            <Button
                                className="bg-primary hover:bg-primary/90"
                                onClick={submit}
                                disabled={submitting || Object.keys(answers).length < assessment.questions.length}
                            >
                                Submit assessment
                            </Button>
                        </div>
                    )
                )}
            </SheetContent>
        </Sheet>
    );
}

export default LessonHubAssessmentsTab;