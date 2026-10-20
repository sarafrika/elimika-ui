'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { RubricGradingMatrix } from '@/app/dashboard/instructor/classes/class-training/[id]/_components/RubricGradingMatrix';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor-lazy';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { formatDateTime } from '@/lib/date';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getEnrollmentGradeBookOptions,
  getEnrollmentGradeBookQueryKey,
  getGradeBandsOptions,
  getLineItemRevisionsOptions,
  getLineItemRevisionsQueryKey,
  getLineItemRubricEvaluationOptions,
  getLineItemRubricEvaluationQueryKey,
  getProgressReportQueryKey,
  getRubricMatrixOptions,
  upsertLineItemRubricEvaluationMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { StatusEnum7 } from '@/services/client/types.gen';
import { WorkbookError } from './WorkbookError';
import { WorkbookLoading } from './WorkbookLoading';
import { hasApiError } from './workbook-data';

type ScoringProps = {
  courseId: string;
  lessonId: string;
  enrollmentId: string;
  studentName: string;
  onClose: () => void;
};

/**
 * Scores one learner's lesson on the course's per-lesson rubric. Saves a draft or submits; the
 * score shown is always the one the server saved, and every submitted score stays in History.
 */
export function LessonScoringSheet({ studentName, onClose, ...props }: ScoringProps) {
  return (
    <Sheet
      open
      onOpenChange={open => {
        if (!open) onClose();
      }}
    >
      <SheetContent className='w-full sm:max-w-3xl'>
        <SheetHeader className='shrink-0 border-b pr-12'>
          <SheetTitle>{studentName} · Lesson score</SheetTitle>
          <SheetDescription>
            Pick a level for each criterion. Save a draft while you assess; submit when every
            criterion is scored.
          </SheetDescription>
        </SheetHeader>
        <div className='min-h-0 flex-1 space-y-6 overflow-y-auto p-4'>
          <LessonScoring {...props} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function LessonScoring({ courseId, lessonId, enrollmentId }: Omit<ScoringProps, 'studentName' | 'onClose'>) {
  const gradebookQuery = useQuery({
    ...getEnrollmentGradeBookOptions({ path: { courseUuid: courseId, enrollmentUuid: enrollmentId } }),
    enabled: Boolean(courseId && enrollmentId),
    staleTime: STALE_TIMES.live,
  });

  const cell = useMemo(() => {
    for (const component of gradebookQuery.data?.data?.components ?? []) {
      if (!component.assessment?.per_lesson || !component.assessment.uuid) continue;
      const entry = (component.line_items ?? []).find(
        item => item.line_item?.lesson_uuid === lessonId
      );
      const rubricUuid = entry?.line_item?.rubric_uuid ?? component.assessment.rubric_uuid;
      if (entry?.line_item?.uuid && rubricUuid) {
        return {
          assessmentUuid: component.assessment.uuid,
          lineItemUuid: entry.line_item.uuid,
          rubricUuid,
          title: component.assessment.title,
        };
      }
    }
    return null;
  }, [gradebookQuery.data, lessonId]);

  if (gradebookQuery.isLoading) return <WorkbookLoading />;
  if (gradebookQuery.isError || hasApiError(gradebookQuery.data)) {
    return (
      <WorkbookError
        title='Unable to load this student’s gradebook'
        retry={() => void gradebookQuery.refetch()}
      />
    );
  }
  if (!cell) {
    return (
      <EmptyState title='This lesson has no rubric score set up in the course’s evaluation plan' />
    );
  }
  return (
    <RubricCell
      courseId={courseId}
      enrollmentId={enrollmentId}
      passMark={gradebookQuery.data?.data?.pass_mark}
      {...cell}
    />
  );
}

function RubricCell({
  courseId,
  enrollmentId,
  assessmentUuid,
  lineItemUuid,
  rubricUuid,
  title,
  passMark,
}: {
  courseId: string;
  enrollmentId: string;
  assessmentUuid: string;
  lineItemUuid: string;
  rubricUuid: string;
  title?: string;
  passMark?: number | null;
}) {
  const client = useQueryClient();
  const bandsQuery = useQuery({
    ...getGradeBandsOptions({ path: { courseUuid: courseId } }),
    enabled: Boolean(courseId),
    staleTime: STALE_TIMES.entity,
  });
  const cellPath = { courseUuid: courseId, assessmentUuid, lineItemUuid, enrollmentUuid: enrollmentId };
  const matrixQuery = useQuery({
    ...getRubricMatrixOptions({ path: { rubricUuid } }),
    enabled: Boolean(rubricUuid),
    staleTime: STALE_TIMES.entity,
  });
  const evaluationQuery = useQuery({
    ...getLineItemRubricEvaluationOptions({ path: cellPath }),
    enabled: Boolean(lineItemUuid && enrollmentId),
    staleTime: STALE_TIMES.live,
  });
  const mutation = useMutation(upsertLineItemRubricEvaluationMutation());

  if (matrixQuery.isLoading || evaluationQuery.isLoading) return <WorkbookLoading />;
  if (
    matrixQuery.isError ||
    evaluationQuery.isError ||
    hasApiError(matrixQuery.data) ||
    hasApiError(evaluationQuery.data)
  ) {
    return (
      <WorkbookError
        title='Unable to load the rubric for this lesson'
        retry={() => {
          void matrixQuery.refetch();
          void evaluationQuery.refetch();
        }}
      />
    );
  }

  const matrix = matrixQuery.data?.data;
  const evaluation = evaluationQuery.data?.data;
  if (!matrix?.rubric.uuid) return <EmptyState title='This rubric has no criteria yet' />;

  const viewMatrix = {
    ...matrix,
    rubric: { ...matrix.rubric, uuid: matrix.rubric.uuid },
    criteria: matrix.criteria.flatMap(item => (item.uuid ? [{ ...item, uuid: item.uuid }] : [])),
    scoring_levels: matrix.scoring_levels.flatMap(item =>
      item.uuid ? [{ ...item, uuid: item.uuid }] : []
    ),
  };

  const save = async (
    status: (typeof StatusEnum7)[keyof typeof StatusEnum7],
    selections: Record<string, string>,
    comments: string
  ) => {
    const response = await mutation.mutateAsync({
      path: cellPath,
      body: {
        status,
        comments: comments.trim() || undefined,
        criteria_selections: Object.entries(selections).map(([criteria_uuid, scoring_level_uuid]) => ({
          criteria_uuid,
          scoring_level_uuid,
        })),
      },
    });
    if (hasApiError(response)) {
      toast.error(response.message || 'Unable to save the lesson score.');
      return;
    }
    toast.success(status === StatusEnum7.PENDING ? 'Draft saved.' : 'Lesson score submitted.');
    await Promise.all([
      client.invalidateQueries({ queryKey: getLineItemRubricEvaluationQueryKey({ path: cellPath }) }),
      client.invalidateQueries({ queryKey: getLineItemRevisionsQueryKey({ path: cellPath }) }),
      client.invalidateQueries({
        queryKey: getEnrollmentGradeBookQueryKey({
          path: { courseUuid: courseId, enrollmentUuid: enrollmentId },
        }),
      }),
      client.invalidateQueries({
        queryKey: getProgressReportQueryKey({
          path: { courseUuid: courseId, enrollmentUuid: enrollmentId },
        }),
      }),
    ]);
  };

  return (
    <>
      <ScoreForm
        key={`${evaluation?.uuid ?? 'new'}-${evaluation?.status ?? ''}-${evaluation?.score ?? ''}`}
        title={title}
        matrix={viewMatrix}
        initialSelections={Object.fromEntries(
          (evaluation?.criteria_selections ?? []).flatMap(row =>
            row.criteria_uuid && row.scoring_level_uuid
              ? [[row.criteria_uuid, row.scoring_level_uuid]]
              : []
          )
        )}
        initialComments={evaluation?.comments ?? ''}
        submitted={evaluation?.status === StatusEnum7.COMPLETED}
        savedScore={{ score: evaluation?.score, maxScore: evaluation?.max_score }}
        bands={(bandsQuery.data?.data ?? []).flatMap(band =>
          band.name && band.min_percentage != null ? [{ name: band.name, min: band.min_percentage }] : []
        )}
        passMark={passMark ?? null}
        isPending={mutation.isPending}
        onSave={save}
      />
      <RevisionHistory path={cellPath} />
    </>
  );
}

type Band = { name: string; min: number };

/** The band a percentage earns: the highest whose minimum it reaches. */
function bandFor(bands: Band[], pct: number) {
  return [...bands].sort((a, b) => b.min - a.min).find(band => pct >= band.min)?.name ?? null;
}

function ScoreForm({
  title,
  matrix,
  initialSelections,
  initialComments,
  submitted,
  savedScore,
  bands,
  passMark,
  isPending,
  onSave,
}: {
  title?: string;
  matrix: Parameters<typeof RubricGradingMatrix>[0]['matrix'];
  initialSelections: Record<string, string>;
  initialComments: string;
  submitted: boolean;
  savedScore: { score?: number | null; maxScore?: number | null };
  bands: Band[];
  passMark: number | null;
  isPending: boolean;
  onSave: (
    status: (typeof StatusEnum7)[keyof typeof StatusEnum7],
    selections: Record<string, string>,
    comments: string
  ) => Promise<void>;
}) {
  const [selections, setSelections] = useState(initialSelections);
  const [comments, setComments] = useState(initialComments);
  const [confirming, setConfirming] = useState(false);
  const everyCriterionScored = matrix.criteria.every(criterion => Boolean(selections[criterion.uuid]));

  // A preview while picking; the server saves the official total, the same plain sum.
  const levelPoints = new Map(matrix.scoring_levels.map(level => [level.uuid, Number(level.points ?? 0)]));
  const topPoints = Math.max(0, ...matrix.scoring_levels.map(level => Number(level.points ?? 0)));
  const liveMax = topPoints * matrix.criteria.length;
  const liveTotal = matrix.criteria.reduce((sum, criterion) => sum + (levelPoints.get(selections[criterion.uuid] ?? '') ?? 0), 0);
  const livePct = liveMax > 0 ? (liveTotal / liveMax) * 100 : 0;
  const scoredCount = matrix.criteria.filter(criterion => selections[criterion.uuid]).length;
  const band = everyCriterionScored ? bandFor(bands, livePct) : null;
  const low = everyCriterionScored && passMark != null && livePct < passMark;
  const passPoints = passMark != null ? Math.ceil((passMark / 100) * liveMax) : null;

  const submit = () => {
    if (low && !confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    void onSave(StatusEnum7.COMPLETED, selections, comments);
  };

  return (
    <section className='space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <h3 className='font-semibold'>{title ?? 'Lesson rubric'}</h3>
        <Badge variant={submitted ? 'success' : 'outline'}>{submitted ? 'Submitted' : 'Not submitted'}</Badge>
      </div>

      <div
        aria-live='polite'
        data-testid='live-score'
        className={`rounded-xl border p-4 ${low ? 'border-warning/60 bg-warning/10' : 'border-border bg-muted/40'}`}
      >
        <div className='flex flex-wrap items-baseline justify-between gap-2'>
          <p className='flex items-baseline gap-2'>
            <span className='font-mono text-3xl font-bold'>{liveTotal}</span>
            <span className='text-muted-foreground'>/ {liveMax} so far</span>
          </p>
          <Badge variant={low ? 'warning' : band ? 'success' : 'outline'}>
            {band ?? (everyCriterionScored ? 'No band' : 'Finish all criteria to see the band')}
          </Badge>
        </div>
        <div className='bg-border mt-3 h-2 overflow-hidden rounded-full'>
          <div
            className={`h-2 transition-[width] ${low ? 'bg-warning' : 'bg-primary'}`}
            style={{ width: `${Math.min(100, livePct)}%` }}
          />
        </div>
        <div className='text-muted-foreground mt-2 flex flex-wrap justify-between gap-2 text-xs'>
          <span>
            {scoredCount}/{matrix.criteria.length} criteria scored · {Math.round(livePct)}% of the lesson
          </span>
          <span>
            {savedScore.score != null ? `Last submitted ${savedScore.score} / ${savedScore.maxScore ?? liveMax}` : 'Nothing submitted yet'}
          </span>
        </div>
        {low && (
          <p className='text-warning-foreground mt-2 text-sm'>
            Below the course pass mark ({passPoints} / {liveMax}). You will be asked to confirm before it is submitted.
          </p>
        )}
      </div>

      <RubricGradingMatrix
        matrix={matrix}
        selections={selections}
        showScoreSummary={false}
        onChange={(criteriaUuid, levelUuid) => {
          setConfirming(false);
          setSelections(current => ({ ...current, [criteriaUuid]: levelUuid }));
        }}
      />

      <div className='space-y-2'>
        <Label>Comment on this lesson</Label>
        <SimpleEditor value={comments} onChange={setComments} />
      </div>

      {confirming && (
        <div role='alert' className='border-warning/60 bg-warning/10 space-y-3 rounded-xl border p-4'>
          <p className='font-semibold'>
            Submit {liveTotal} / {liveMax}{band ? ` (${band})` : ''}?
          </p>
          <p className='text-sm'>This is a low score. Check each criterion before it counts towards the final grade.</p>
          <div className='flex flex-wrap justify-end gap-2'>
            <Button variant='outline' onClick={() => setConfirming(false)}>
              Go back and check
            </Button>
            <Button onClick={submit}>Yes, submit {liveTotal} / {liveMax}</Button>
          </div>
        </div>
      )}

      <div className='flex flex-wrap justify-end gap-2'>
        <Button
          variant='outline'
          disabled={isPending || submitted}
          title={submitted ? 'A submitted score is corrected by submitting again' : undefined}
          onClick={() => void onSave(StatusEnum7.PENDING, selections, comments)}
        >
          Save draft
        </Button>
        <Button disabled={isPending || !everyCriterionScored} onClick={submit}>
          {submitted ? 'Submit correction' : 'Submit score'}
        </Button>
      </div>
    </section>
  );
}

function RevisionHistory({
  path,
}: {
  path: { courseUuid: string; assessmentUuid: string; lineItemUuid: string; enrollmentUuid: string };
}) {
  const query = useQuery({
    ...getLineItemRevisionsOptions({ path }),
    enabled: Boolean(path.lineItemUuid && path.enrollmentUuid),
    staleTime: STALE_TIMES.live,
  });
  const revisions = [...(query.data?.data ?? [])].reverse();

  return (
    <section className='space-y-3'>
      <h3 className='font-semibold'>History</h3>
      {query.isLoading ? (
        <WorkbookLoading />
      ) : query.isError || hasApiError(query.data) ? (
        <WorkbookError title='Unable to load score history' retry={() => void query.refetch()} />
      ) : !revisions.length ? (
        <p className='text-muted-foreground text-sm'>No submitted scores yet.</p>
      ) : (
        <ol className='space-y-2'>
          {revisions.map(revision => (
            <li key={revision.uuid} className='border-border/70 rounded-md border p-3 text-sm'>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <span className='font-medium'>
                  Score {revision.revision_number}: {revision.score ?? '—'} / {revision.max_score ?? '—'}
                </span>
                <span className='text-muted-foreground text-xs'>
                  {formatDateTime(revision.graded_at, { fallback: '' })}
                </span>
              </div>
              {revision.criteria?.length ? (
                <p className='text-muted-foreground mt-1 text-xs'>
                  {revision.criteria
                    .map(criterion => `${criterion.criteria_name}: ${criterion.points ?? '—'}`)
                    .join(' · ')}
                </p>
              ) : null}
              {revision.comments ? (
                <div className='mt-1'>
                  <RichTextRenderer htmlString={revision.comments} />
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
