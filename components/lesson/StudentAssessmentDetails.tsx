'use client';

import RichTextRenderer from '@/components/editors/richTextRenders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDateTime } from '@/lib/date';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getStudentQuizReviewOptions,
  getSubmissionAttachmentsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { AssignmentSubmission, QuizAttempt } from '@/services/client/types.gen';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { isTaskGraded, taskGradeLabel } from './grading';
import { hasApiError } from './workbook-data';
import { WorkbookError } from './WorkbookError';
import { WorkbookLoading } from './WorkbookLoading';

const AttachmentPreview = dynamic(
  () =>
    import('@/components/content-preview/AssignmentContentPreview').then(
      module => module.AssignmentContentPreview
    ),
  { loading: () => <WorkbookLoading /> }
);

type StudentAssessmentDetailsProps = {
  loading: boolean;
  error: boolean;
  enrollmentId?: string;
  retry: () => void;
} & (
  | { kind: 'assignment'; submission?: AssignmentSubmission; maxPoints?: number }
  | { kind: 'quiz'; attempt?: QuizAttempt }
);

export function StudentAssessmentDetails(props: StudentAssessmentDetailsProps) {
  if (props.loading) return <WorkbookLoading />;
  if (props.error) return <WorkbookError title='Unable to load your results' retry={props.retry} />;
  if (!props.enrollmentId)
    return <EmptyState title='No course enrollment available for these results' />;

  const record = props.kind === 'assignment' ? props.submission : props.attempt;
  if (!record)
    return (
      <EmptyState
        title={props.kind === 'assignment' ? 'No submission yet' : 'No quiz attempt yet'}
        description='Open the details page to complete this task.'
      />
    );

  return (
    <div className='space-y-6'>
      <section className='bg-muted/40 space-y-3 rounded-lg border p-4'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <Badge variant='secondary'>{record.status.replaceAll('_', ' ')}</Badge>
          <p className='font-semibold'>
            Score:{' '}
            {taskGradeLabel(record, props.kind === 'assignment' ? props.maxPoints : undefined)}
          </p>
        </div>
        <dl className='grid gap-3 text-sm sm:grid-cols-2'>
          <div>
            <dt className='text-muted-foreground'>Submitted</dt>
            <dd>{formatDateTime(record.submitted_at, { fallback: 'Not submitted' })}</dd>
          </div>
          <div>
            <dt className='text-muted-foreground'>Graded</dt>
            <dd>{formatDateTime(record.graded_at, { fallback: 'Not graded' })}</dd>
          </div>
          {props.kind === 'quiz' && props.attempt?.attempt_number != null && (
            <div>
              <dt className='text-muted-foreground'>Attempt</dt>
              <dd>{props.attempt.attempt_number}</dd>
            </div>
          )}
          {props.kind === 'quiz' && props.attempt?.time_taken_minutes != null && (
            <div>
              <dt className='text-muted-foreground'>Time taken</dt>
              <dd>{props.attempt.time_taken_minutes} min</dd>
            </div>
          )}
        </dl>
      </section>

      {props.kind === 'assignment' && props.submission && (
        <>
          <section className='space-y-2'>
            <h3 className='font-semibold'>Your submission</h3>
            {props.submission.submission_text ? (
              <RichTextRenderer htmlString={props.submission.submission_text} />
            ) : (
              <p className='text-muted-foreground text-sm'>No written response submitted.</p>
            )}
          </section>
          {props.submission.uuid && (
            <SubmissionAttachments
              assignmentId={props.submission.assignment_uuid}
              submissionId={props.submission.uuid}
              fileUrls={props.submission.file_urls ?? []}
            />
          )}
          <section className='space-y-2'>
            <h3 className='font-semibold'>Instructor feedback</h3>
            {props.submission.instructor_comments ? (
              <RichTextRenderer htmlString={props.submission.instructor_comments} />
            ) : (
              <p className='text-muted-foreground text-sm'>No feedback available yet.</p>
            )}
          </section>
        </>
      )}
      {props.kind === 'quiz' &&
        props.attempt &&
        (isTaskGraded(props.attempt) && props.attempt.uuid ? (
          <QuizReview
            quizId={props.attempt.quiz_uuid}
            attemptId={props.attempt.uuid}
            enrollmentId={props.attempt.enrollment_uuid}
          />
        ) : (
          <EmptyState
            title='Quiz results are not available yet'
            description='Your answers and results will appear here after grading is complete.'
          />
        ))}
    </div>
  );
}

function SubmissionAttachments({
  assignmentId,
  submissionId,
  fileUrls,
}: {
  assignmentId: string;
  submissionId: string;
  fileUrls: string[];
}) {
  const query = useQuery({
    ...getSubmissionAttachmentsOptions({
      path: { assignmentUuid: assignmentId, submissionUuid: submissionId },
    }),
    enabled: Boolean(assignmentId && submissionId),
    staleTime: STALE_TIMES.live,
  });
  if (query.isLoading) return <WorkbookLoading />;
  if (query.isError || hasApiError(query.data))
    return (
      <WorkbookError title='Unable to load submission files' retry={() => void query.refetch()} />
    );
  const attachments = query.data?.data ?? [];
  return (
    <section className='space-y-3'>
      <h3 className='font-semibold'>Submission files</h3>
      {attachments.length ? (
        <AttachmentPreview attachments={attachments} />
      ) : fileUrls.length ? (
        <div className='flex flex-wrap gap-2'>
          {fileUrls.map((url, index) => {
            const href = toAuthenticatedMediaUrl(url);
            return href ? (
              <Button key={url} asChild variant='outline' size='sm'>
                <a href={href} target='_blank' rel='noopener noreferrer'>
                  Open file {index + 1}
                </a>
              </Button>
            ) : null;
          })}
        </div>
      ) : (
        <p className='text-muted-foreground text-sm'>No files attached.</p>
      )}
    </section>
  );
}

function QuizReview({
  quizId,
  attemptId,
  enrollmentId,
}: {
  quizId: string;
  attemptId: string;
  enrollmentId: string;
}) {
  const query = useQuery({
    ...getStudentQuizReviewOptions({
      path: { quizUuid: quizId, attemptUuid: attemptId },
      query: { enrollment_uuid: enrollmentId },
    }),
    enabled: Boolean(quizId && attemptId && enrollmentId),
    staleTime: STALE_TIMES.live,
  });
  if (query.isLoading) return <WorkbookLoading />;
  if (query.isError || hasApiError(query.data))
    return <WorkbookError title='Unable to load quiz results' retry={() => void query.refetch()} />;
  const review = query.data?.data;
  if (!review?.questions?.length) return <EmptyState title='No quiz review available' />;

  return (
    <section className='space-y-4'>
      <h3 className='font-semibold'>Your answers</h3>
      {[...review.questions]
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
        .map((question, index) => (
          <section key={question.uuid ?? index} className='space-y-3 rounded-lg border p-4'>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <h4 className='font-medium'>Question {index + 1}</h4>
              <Badge variant='outline'>
                {question.response?.points_earned ?? 0} / {question.points ?? 0} points
              </Badge>
            </div>
            <RichTextRenderer htmlString={question.question_text ?? ''} />
            {question.response?.text_response ? (
              <div className='bg-muted rounded-md p-3 text-sm whitespace-pre-wrap'>
                {question.response.text_response}
              </div>
            ) : question.options?.length ? (
              <ul className='space-y-2'>
                {[...question.options]
                  .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
                  .map((option, optionIndex) => (
                    <li
                      key={option.uuid ?? optionIndex}
                      className='flex flex-wrap items-start gap-2 rounded-md border p-3'
                    >
                      <span className='min-w-0 flex-1 text-sm'>{option.option_text}</span>
                      {option.uuid && option.uuid === question.response?.selected_option_uuid && (
                        <Badge variant='secondary'>Your answer</Badge>
                      )}
                      {option.is_correct && <Badge variant='outline'>Correct answer</Badge>}
                    </li>
                  ))}
              </ul>
            ) : (
              <p className='text-muted-foreground text-sm'>No answer provided.</p>
            )}
          </section>
        ))}
    </section>
  );
}
