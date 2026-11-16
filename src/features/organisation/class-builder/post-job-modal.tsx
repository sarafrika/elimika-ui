'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2, Send, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { SchedulingConflictAlert } from '@/components/scheduling/scheduling-conflict-alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { getErrorMessage } from '@/lib/error-utils';
import { formatRate, formatRateBasis } from '@/lib/rate-card';
import { parseSchedulingConflicts, type SchedulingConflict } from '@/lib/scheduling-conflicts';
import type { ClassMarketplaceJob } from '@/services/client';
import {
  createJobMutation,
  getJobOptions,
  updateJobMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { invalidateJobApplicationWorkflowQueries } from '@/src/features/dashboard/workflow-query-invalidation';
import { JobRequiredSkillsSection } from '@/src/features/organisation/jobs/components/job-required-skills';
import { jobHref } from '@/src/features/organisation/jobs/lib/job-routes';
import {
  IssuesPanel,
  LogisticsSections,
  OfferingSection,
  Section,
  ServiceSection,
} from './class-builder-sections';
import { deleteJobDraft, type JobDraft, listJobDrafts, saveJobDraft, timeAgo } from './job-drafts';
import { type Hiring, type MembershipPreference, useClassBuilder } from './use-class-builder';

export type PostJobPrefill = {
  jobUuid?: string;
  repostFrom?: string;
  courseUuid?: string;
  programUuid?: string;
};

const EMPTY_HIRING: Hiring = { description: '', requirements: '', membership: 'ANY' };

export function PostJobModal({ prefill, onClose }: { prefill: PostJobPrefill; onClose: () => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const editingJobUuid = prefill.jobUuid ?? '';
  const isEdit = Boolean(editingJobUuid);
  const sourceJobUuid = editingJobUuid || prefill.repostFrom || '';
  const builder = useClassBuilder({ requireOpenRegistration: !isEdit });
  const { schedule, pricing } = builder;

  const [hiring, setHiring] = useState<Hiring>(EMPTY_HIRING);
  const [instructorPay, setInstructorPay] = useState('');
  const [drafts, setDrafts] = useState<JobDraft[]>([]);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [posted, setPosted] = useState<{ uuid: string; title: string } | null>(null);
  const [conflicts, setConflicts] = useState<SchedulingConflict[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => setDrafts(listJobDrafts()), []);

  const sourceQuery = useQuery({
    ...getJobOptions({ path: { jobUuid: sourceJobUuid } }),
    enabled: Boolean(sourceJobUuid),
  });
  const sourceJob = sourceQuery.data?.data ?? null;
  const taxonomyReady = !builder.taxonomy.loading && !builder.approved.loading;
  const [hydrated, setHydrated] = useState(false);
  const hydrateFromJob = builder.hydrateFromJob;
  const prefillOffering = builder.prefillOffering;
  useEffect(() => {
    if (hydrated || !taxonomyReady) return;
    if (sourceJobUuid) {
      if (!sourceJob) return;
      hydrateFromJob(sourceJob);
      setHiring({
        description: sourceJob.description ?? '',
        requirements: sourceJob.requirements ?? '',
        membership: (sourceJob.membership_preference as MembershipPreference) ?? 'ANY',
      });
      setInstructorPay(sourceJob.instructor_pay != null ? String(sourceJob.instructor_pay) : '');
    } else if (prefill.courseUuid || prefill.programUuid) {
      prefillOffering(
        prefill.courseUuid ? `course:${prefill.courseUuid}` : `program:${prefill.programUuid}`
      );
    }
    setHydrated(true);
  }, [hydrated, taxonomyReady, sourceJobUuid, sourceJob, hydrateFromJob, prefill, prefillOffering]);

  const pay = Number(instructorPay);
  const issues = [
    ...builder.blockers,
    !instructorPay.trim() || !(pay > 0) ? 'Enter a rate greater than 0' : null,
    builder.salePrice !== null && pay > builder.salePrice
      ? 'Instructor pay cannot be more than the class price.'
      : null,
    hiring.description.trim().length > 0 && hiring.description.trim().length < 20
      ? 'Please provide a description of at least 20 characters'
      : null,
    !builder.isOrgVerified ? 'Your organisation must be verified before posting class jobs.' : null,
  ].filter((issue): issue is string => Boolean(issue));

  const onError = (error: unknown, fallback: string) => {
    const report = parseSchedulingConflicts(error);
    if (report) {
      setConflicts(report.conflicts);
      toast.error(report.message);
      return;
    }
    const message = getErrorMessage(error, fallback);
    setSubmitError(message);
    toast.error('Job posting failed', { description: message });
  };

  const createJob = useMutation({
    ...createJobMutation(),
    onSuccess: async response => {
      if (draftId) setDrafts(deleteJobDraft(draftId));
      await invalidateJobApplicationWorkflowQueries(queryClient);
      toast.success(`Job posted: ${builder.title} is now open for applications.`);
      setPosted({ uuid: response?.data?.uuid ?? '', title: builder.title });
    },
    onError: error => onError(error, 'Could not save the job posting. Please try again.'),
  });
  const updateJob = useMutation({
    ...updateJobMutation(),
    onSuccess: async () => {
      await invalidateJobApplicationWorkflowQueries(queryClient);
      toast.success('Job updated. Resource holds were re-evaluated.');
      onClose();
      router.push(jobHref(editingJobUuid));
    },
    onError: error => onError(error, 'Could not update the job posting. Please try again.'),
  });
  const submitting = createJob.isPending || updateJob.isPending;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    if (issues.length > 0) {
      toast.error('Please fix the errors in the form before posting the job.');
      return;
    }
    setConflicts([]);
    setSubmitError(null);
    const body = builder.buildJobRequest(pay, hiring);
    if (isEdit) updateJob.mutate({ path: { jobUuid: editingJobUuid }, body });
    else createJob.mutate({ body });
  };

  const saveDraft = () => {
    if (!builder.offering && !hiring.description.trim()) {
      toast.error('Nothing to save yet', {
        description: 'Pick a course or add details before saving a draft.',
      });
      return;
    }
    const next = saveJobDraft({
      id: draftId ?? undefined,
      title: builder.title,
      request: builder.buildJobRequest(pay || 0, hiring),
      place: builder.place,
      hiring,
      instructorPay,
    });
    setDraftId(next.id);
    setDrafts(listJobDrafts());
    toast.success(`Draft saved: ${next.title}`);
  };

  const resumeDraft = (draft: JobDraft) => {
    builder.hydrateFromJob(draft.request as unknown as ClassMarketplaceJob);
    builder.setPlace(draft.place);
    setHiring(draft.hiring);
    setInstructorPay(draft.instructorPay);
    setDraftId(draft.id);
    toast.success('Draft loaded');
  };

  if (posted) {
    return (
      <Dialog open onOpenChange={open => (open ? null : onClose())}>
        <DialogContent className='sm:max-w-2xl'>
          <DialogHeader className='items-center text-center sm:text-center'>
            <CheckCircle2 className='text-success size-10' aria-hidden />
            <DialogTitle>Job posted successfully</DialogTitle>
            <DialogDescription>
              {posted.title} is now open for applications. Applicants will see it on the job board.
            </DialogDescription>
          </DialogHeader>
          {posted.uuid ? <JobRequiredSkillsSection jobUuid={posted.uuid} canEdit /> : null}
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                setPosted(null);
                setDraftId(null);
                setHiring(EMPTY_HIRING);
                setInstructorPay('');
              }}
            >
              Post another job
            </Button>
            <Button
              type='button'
              onClick={() => {
                onClose();
                if (posted.uuid) router.push(jobHref(posted.uuid));
              }}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={open => (open ? null : onClose())}>
      <DialogContent className='flex max-h-[90dvh] w-full flex-col gap-0 p-0 sm:max-w-[95vw] xl:max-w-6xl'>
        <form onSubmit={submit} className='flex min-h-0 flex-1 flex-col'>
          <DialogHeader className='border-border/60 border-b px-6 py-4'>
            <DialogTitle>{isEdit ? 'Edit job' : 'Post a job'}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? 'Changing the schedule or resources releases the existing holds and re-checks them. If the new times clash, nothing is saved.'
                : 'Create an instructor job opening for a class and publish it to applicants.'}
            </DialogDescription>
          </DialogHeader>

          <div className='flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto px-6 py-5'>
            {!isEdit && drafts.length > 0 ? (
              <Section title={`Saved drafts (${drafts.length})`}>
                <ul className='divide-border/60 border-border/60 divide-y rounded-md border'>
                  {drafts.map(draft => (
                    <li key={draft.id} className='flex items-center justify-between gap-3 px-3 py-2'>
                      <div className='min-w-0'>
                        <p className='text-foreground truncate text-sm font-medium'>
                          {draft.title || 'Untitled job'}
                          {draft.id === draftId ? (
                            <span className='text-muted-foreground font-normal'> · editing</span>
                          ) : null}
                        </p>
                        <p className='text-muted-foreground text-xs'>Saved {timeAgo(draft.savedAt)}</p>
                      </div>
                      <div className='flex shrink-0 items-center gap-1'>
                        <Button
                          type='button'
                          size='sm'
                          variant='outline'
                          disabled={draft.id === draftId}
                          onClick={() => resumeDraft(draft)}
                        >
                          {draft.id === draftId ? 'Loaded' : 'Resume'}
                        </Button>
                        <Button
                          type='button'
                          size='icon'
                          variant='ghost'
                          aria-label='Delete draft'
                          onClick={() => {
                            setDrafts(deleteJobDraft(draft.id));
                            if (draft.id === draftId) setDraftId(null);
                            toast.success('Draft deleted');
                          }}
                        >
                          <Trash2 className='size-4' aria-hidden />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}

            <OfferingSection builder={builder} />
            <ServiceSection builder={builder} />

            <Section
              title='Pay'
              hint={
                pricing
                  ? `Learners pay ${formatRate(builder.salePrice, pricing.basis, builder.currency)}. Instructors can be hired only if their approved rate ${formatRateBasis(pricing.basis)} fits under what you offer.`
                  : 'Pick a course and service to see the class price.'
              }
            >
              <div className='flex max-w-xs flex-col gap-1.5'>
                <Label htmlFor='job-pay'>
                  Compensation {pricing ? formatRateBasis(pricing.basis) : ''} *
                </Label>
                <Input
                  id='job-pay'
                  type='number'
                  inputMode='decimal'
                  min={0}
                  step='0.01'
                  value={instructorPay}
                  onChange={event => setInstructorPay(event.target.value)}
                  placeholder={builder.currency ?? 'KES'}
                />
              </div>
            </Section>

            <LogisticsSections builder={builder} excludeJobUuid={editingJobUuid || undefined} />

            <Section title='About the role'>
              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='job-description'>Job description</Label>
                <Textarea
                  id='job-description'
                  maxLength={1000}
                  value={hiring.description}
                  onChange={event => setHiring(current => ({ ...current, description: event.target.value }))}
                  placeholder='Outline the role, responsibilities, and expectations...'
                />
                <p className='text-muted-foreground text-right text-xs'>{hiring.description.length}/1000</p>
              </div>
              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='job-requirements'>Requirements</Label>
                <Textarea
                  id='job-requirements'
                  maxLength={500}
                  value={hiring.requirements}
                  onChange={event => setHiring(current => ({ ...current, requirements: event.target.value }))}
                  placeholder='Minimum qualifications, experience, certifications...'
                />
                <p className='text-muted-foreground text-right text-xs'>{hiring.requirements.length}/500</p>
              </div>
              <div className='flex flex-col gap-2'>
                <Label>Membership preference</Label>
                <RadioGroup
                  value={hiring.membership}
                  onValueChange={value =>
                    setHiring(current => ({ ...current, membership: value as MembershipPreference }))
                  }
                  className='flex flex-wrap gap-4'
                >
                  <label className='flex items-center gap-2 text-sm'>
                    <RadioGroupItem value='ANY' /> Any instructor
                  </label>
                  <label className='flex items-center gap-2 text-sm'>
                    <RadioGroupItem value='ORGANISATION_ONLY' /> Our organisation’s instructors only
                  </label>
                </RadioGroup>
              </div>
              {isEdit ? (
                <JobRequiredSkillsSection jobUuid={editingJobUuid} canEdit />
              ) : (
                <p className='text-muted-foreground text-xs'>
                  You can add the skills applicants need right after posting.
                </p>
              )}
            </Section>

            <IssuesPanel issues={issues} />
            <SchedulingConflictAlert
              title='These sessions conflict with existing reservations'
              conflicts={conflicts}
              timeZone={schedule.timezone}
            />
            {submitError ? (
              <div role='alert' className='border-destructive/50 bg-destructive/10 rounded-md border p-3 text-sm'>
                <p className='font-semibold'>We couldn’t post your job</p>
                <p className='text-muted-foreground'>{submitError}</p>
              </div>
            ) : null}
          </div>

          <DialogFooter className='border-border/60 border-t px-6 py-4'>
            <Button type='button' variant='outline' onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            {isEdit ? null : (
              <Button type='button' variant='secondary' onClick={saveDraft} disabled={submitting}>
                {draftId ? 'Update draft' : 'Save as draft'}
              </Button>
            )}
            <Button type='submit' disabled={submitting || issues.length > 0}>
              {submitting ? (
                <Loader2 className='size-4 animate-spin' aria-hidden />
              ) : (
                <Send className='size-4' aria-hidden />
              )}
              {submitting
                ? 'Posting…'
                : isEdit
                  ? 'Save changes'
                  : submitError
                    ? 'Retry post'
                    : 'Post job'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
