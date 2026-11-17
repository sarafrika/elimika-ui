'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Send } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { getService, serviceFormat } from '@/components/class-form';
import { SchedulingConflictAlert } from '@/components/scheduling/scheduling-conflict-alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getErrorMessage } from '@/lib/error-utils';
import { formatRateBasis, RATE_BASES, rateFor, TRAINING_METHODS } from '@/lib/rate-card';
import { parseSchedulingConflicts, type SchedulingConflict } from '@/lib/scheduling-conflicts';
import { cn } from '@/lib/utils';
import {
  createClassDefinitionMultipartMutation,
  createClassForJobMutation,
  getJobOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { invalidateJobApplicationWorkflowQueries } from '@/src/features/dashboard/workflow-query-invalidation';
import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';
import { useOrganisationJobs } from '@/src/features/organisation/jobs/hooks/use-organisation-jobs';
import { hiredInstructorUuid, jobStage } from '@/src/features/organisation/jobs/lib/job-stage';
import {
  IssuesPanel,
  LogisticsSections,
  OfferingSection,
  Section,
  ServiceSection,
} from './class-builder-sections';
import { instructorServiceRate } from './instructor-service-rate';
import { viewClassHref } from './routes';
import { type HiringJob, useClassBuilder } from './use-class-builder';
import { useClassInstructors } from './use-class-instructors';

export type CreateClassPrefill = {
  job?: string;
  instructorUuid?: string;
  courseUuid?: string;
  programUuid?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
};

type JobScope = 'all' | 'schedule';
const NO_JOB = 'none';

export function CreateClassModal({
  prefill,
  onClose,
}: {
  prefill: CreateClassPrefill;
  onClose: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const builder = useClassBuilder({ requireOpenRegistration: true, requireClassTitle: true });
  const { organisationUuid, schedule } = builder;
  const selectedOffering = builder.selectedOffering;
  const hasMissingRates =
    Boolean(selectedOffering) &&
    TRAINING_METHODS.some(method =>
      RATE_BASES.some(
        basis =>
          rateFor(selectedOffering?.rateCard, {
            format: method.format,
            delivery: method.location === 'online' ? 'ONLINE' : 'IN_PERSON',
            basis: basis.value,
          }) === null
      )
    );
  const rateApplicationHref = selectedOffering?.applicationUuid
    ? dashboardUrl(
        'organisation',
        `approvals/${encodeURIComponent(selectedOffering.applicationUuid)}`
      )
    : null;

  const { jobs } = useOrganisationJobs(organisationUuid);
  const [jobUuid, setJobUuid] = useState(prefill.job ?? '');
  const jobQuery = useQuery({
    ...getJobOptions({ path: { jobUuid } }),
    enabled: Boolean(jobUuid),
  });
  const job: HiringJob | null = jobUuid ? (jobQuery.data?.data ?? null) : null;
  const jobIsHired = job ? jobStage(job) === 'awaiting_class' : false;
  const [scope, setScope] = useState<JobScope>(prefill.job ? 'all' : 'schedule');
  const fromJob = Boolean(job && jobIsHired && scope === 'all');
  const hiredUuid = job ? (hiredInstructorUuid(job) ?? '') : '';

  // Fill from the job once its details arrive, and again whenever the pick or scope changes.
  const [hydratedKey, setHydratedKey] = useState('');
  const hydrateFromJob = builder.hydrateFromJob;
  const taxonomyReady = !builder.taxonomy.loading && !builder.approved.loading;
  useEffect(() => {
    if (!job?.uuid || !taxonomyReady) return;
    const effectiveScope: JobScope = jobIsHired ? scope : 'schedule';
    const key = `${job.uuid}:${effectiveScope}`;
    if (key === hydratedKey) return;
    hydrateFromJob(job, effectiveScope);
    setHydratedKey(key);
  }, [job, jobIsHired, scope, hydratedKey, hydrateFromJob, taxonomyReady]);

  // Course and calendar prefills, applied once.
  const [prefilled, setPrefilled] = useState(false);
  const prefillOffering = builder.prefillOffering;
  const prefillSlot = schedule.prefillSlot;
  useEffect(() => {
    if (prefilled || prefill.job || !taxonomyReady) return;
    const offering = prefill.courseUuid
      ? `course:${prefill.courseUuid}`
      : prefill.programUuid
        ? `program:${prefill.programUuid}`
        : '';
    if (offering) prefillOffering(offering);
    if (prefill.date && prefill.startTime && prefill.endTime) {
      const [y, m, d] = prefill.date.split('-').map(Number);
      if (y && m && d) prefillSlot(new Date(y, m - 1, d), prefill.startTime, prefill.endTime);
    }
    setPrefilled(true);
  }, [prefilled, prefill, taxonomyReady, prefillOffering, prefillSlot]);

  const {
    instructors,
    busy,
    checking,
    loading: instructorsLoading,
    error: instructorsError,
  } = useClassInstructors({
    organisationUuid,
    offering: builder.offering,
    windows: schedule.windows,
  });
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [instructorUuid, setInstructorUuid] = useState(prefill.instructorUuid ?? '');
  const effectiveInstructorUuid = fromJob ? hiredUuid : instructorUuid;
  const visibleInstructors = useMemo(
    () =>
      instructors.filter(
        instructor =>
          !onlyAvailable || !busy.has(instructor.uuid) || instructor.uuid === instructorUuid
      ),
    [instructors, onlyAvailable, busy, instructorUuid]
  );
  const instructor = instructors.find(item => item.uuid === effectiveInstructorUuid);

  // Only a disclosed card can establish that a rate is missing. The API validates withheld rates.
  const instructorRateCheck =
    instructor && builder.service && builder.pricing
      ? instructorServiceRate(instructor.rateCard, {
          format: serviceFormat(builder.service),
          delivery: builder.delivery,
          basis: builder.pricing.basis,
        })
      : null;
  const instructorRate = instructorRateCheck?.rate ?? null;

  const issues = [
    ...builder.blockers,
    !builder.isOrgVerified ? 'Your organisation must be verified before publishing classes.' : null,
    fromJob ? null : !instructorUuid ? 'Instructor is required' : null,
    !fromJob && instructorUuid && instructorsLoading ? 'Checking instructor approval.' : null,
    !fromJob && instructorsError
      ? 'Could not verify the approved instructors. Please try again.'
      : null,
    !fromJob && instructorUuid && !instructorsLoading && !instructorsError && !instructor
      ? 'Select an instructor approved for the selected course or program.'
      : null,
    !fromJob && instructor && builder.service && instructorRateCheck?.status === 'missing'
      ? `${instructor.name} has no approved ${formatRateBasis(builder.pricing?.basis)} rate for a ${getService(builder.service)?.title.toLowerCase()} on this ${builder.selectedOffering?.kind.toLowerCase() ?? 'course'}.`
      : null,
    !fromJob &&
    instructorRate !== null &&
    builder.salePrice !== null &&
    instructorRate > builder.salePrice
      ? `${instructor?.name}'s rate is above the class price.`
      : null,
    !fromJob && instructorUuid && busy.has(instructorUuid)
      ? `${instructor?.name ?? 'The instructor'} is busy during some of these sessions.`
      : null,
  ].filter((issue): issue is string => Boolean(issue));

  const [conflicts, setConflicts] = useState<SchedulingConflict[]>([]);
  const onError = (error: unknown) => {
    const report = parseSchedulingConflicts(error);
    if (report) {
      setConflicts(report.conflicts);
      toast.error('Cannot publish — conflicts detected', {
        description: `${report.conflicts.length} overlap(s). Review the summary and pick alternatives.`,
      });
      return;
    }
    toast.error(getErrorMessage(error, 'Could not publish the class. Please try again.'));
  };
  const onPublished = async (classUuid?: string | null) => {
    toast.success('Class published', {
      description: `${builder.title}: ${schedule.totals.sessions} sessions. Reminders ${builder.reminder.window} before.`,
    });
    await Promise.all([
      invalidateJobApplicationWorkflowQueries(queryClient),
      queryClient.invalidateQueries({
        predicate: query => {
          const head = query.queryKey[0] as { _id?: string } | undefined;
          return /Class|Timetable|Schedule|Calendar/.test(head?._id ?? '');
        },
      }),
    ]);
    onClose();
    router.push(viewClassHref(classUuid));
  };

  const createDirect = useMutation({
    ...createClassDefinitionMultipartMutation(),
    onSuccess: response => {
      if (response?.error || response?.success === false) {
        onError(response);
        return;
      }
      return onPublished(response?.data?.class_definition?.uuid);
    },
    onError,
  });
  const createFromJob = useMutation({
    ...createClassForJobMutation(),
    onSuccess: response => onPublished(response?.data?.uuid),
    onError,
  });
  const publishing = createDirect.isPending || createFromJob.isPending;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (publishing) return;
    if (issues.length > 0) {
      toast.error('Fix schedule issues before publishing', {
        description: `Publishing blocked — ${issues.length} issue(s) must be resolved.`,
      });
      return;
    }
    setConflicts([]);
    if (fromJob && job?.uuid) {
      createFromJob.mutate({
        path: { jobUuid: job.uuid },
        // The generated client predates this endpoint's optional body.
        ...({
          body: builder.buildJobRequest(Number(job.instructor_pay ?? 0), {
            description: job.description ?? '',
            requirements: job.requirements ?? '',
            membership: job.membership_preference ?? 'ANY',
          }),
        } as object),
      });
      return;
    }
    createDirect.mutate({
      body: builder.buildClassRequest(instructorUuid, instructorRate),
      query: { formFields: {} },
    });
  };

  const instructorField = (
    <div className='flex min-w-0 flex-col gap-1.5'>
      <div className='flex items-center justify-between gap-2'>
        <Label htmlFor='class-instructor'>Instructor *</Label>
        {fromJob ? null : (
          <label className='text-muted-foreground flex items-center gap-1.5 text-xs'>
            <Checkbox
              checked={onlyAvailable}
              onCheckedChange={value => setOnlyAvailable(value === true)}
            />
            Only available
          </label>
        )}
      </div>
      {fromJob ? (
        <p className='border-border/60 bg-muted/20 rounded-md border px-3 py-2 text-sm'>
          {instructor?.name ?? 'Hired instructor'}{' '}
          <Badge variant='outline' className='ml-1'>
            Hired for this job
          </Badge>
        </p>
      ) : (
        <Select
          value={instructorUuid}
          onValueChange={next => next && setInstructorUuid(next)}
          disabled={!builder.offering || instructorsLoading}
        >
          <SelectTrigger id='class-instructor' className='w-full'>
            <SelectValue
              placeholder={
                !builder.offering
                  ? 'Pick a course first'
                  : instructorsLoading
                    ? 'Loading…'
                    : visibleInstructors.length === 0
                      ? 'All instructors busy for this time'
                      : 'Select instructor'
              }
            />
          </SelectTrigger>
          <SelectContent>
            {visibleInstructors.map(item => (
              <SelectItem key={item.uuid} value={item.uuid}>
                <span className='flex items-center gap-2'>
                  {item.name}
                  {busy.has(item.uuid) ? (
                    <span className='text-warning text-xs font-medium'>Busy</span>
                  ) : null}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {!fromJob && instructorRateCheck?.status === 'unavailable' ? (
        <p className='text-muted-foreground text-xs'>
          This instructor is approved to teach the selected{' '}
          {builder.selectedOffering?.kind.toLowerCase() ?? 'course'}. Their rate card is private;
          the approved rate for this service will be checked when you publish.
        </p>
      ) : null}
      {builder.offering && !fromJob && !instructorsLoading && instructors.length === 0 ? (
        <p className='text-muted-foreground text-xs'>
          None of your instructors is approved for this course yet. Post a job to hire one.
        </p>
      ) : null}
    </div>
  );

  return (
    <Dialog open onOpenChange={open => (open ? null : onClose())}>
      <DialogContent className='flex max-h-[90dvh] w-full flex-col gap-0 p-0 sm:max-w-[95vw] xl:max-w-6xl'>
        <form onSubmit={submit} className='flex min-h-0 flex-1 flex-col'>
          <DialogHeader className='border-border/60 border-b px-6 py-4 text-center sm:text-center'>
            <DialogTitle>Organisation — Create a class</DialogTitle>
            <DialogDescription>
              Pick what is taught, who teaches it, where and when. Nothing is published until you
              press Publish Class.
            </DialogDescription>
          </DialogHeader>

          <div className='flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto px-6 py-5'>
            <Section
              title='Start from a job'
              hint='Optional. Take a job’s schedule, or everything it defined once someone is hired.'
            >
              <div className='grid gap-4 sm:grid-cols-2'>
                <Select
                  value={jobUuid || NO_JOB}
                  onValueChange={value => {
                    setJobUuid(value === NO_JOB ? '' : value);
                    setHydratedKey('');
                  }}
                >
                  <SelectTrigger aria-label='Start from a job' className='w-full'>
                    <SelectValue placeholder='No job' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_JOB}>No job — start blank</SelectItem>
                    {jobs
                      .filter(item => {
                        if (!item.uuid) return false;
                        const stage = jobStage(item);
                        return stage === 'open' || stage === 'awaiting_class';
                      })
                      .map(item => (
                        <SelectItem key={item.uuid} value={item.uuid as string}>
                          {item.title}
                          {jobStage(item) === 'awaiting_class' ? ' · hired' : ''}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {job ? (
                  <RadioGroup
                    value={jobIsHired ? scope : 'schedule'}
                    onValueChange={value => {
                      setScope(value as JobScope);
                      setHydratedKey('');
                    }}
                    className='flex flex-col gap-2'
                  >
                    <label
                      className={cn('flex items-center gap-2 text-sm', !jobIsHired && 'opacity-50')}
                    >
                      <RadioGroupItem value='all' disabled={!jobIsHired} />
                      Everything from the job{jobIsHired ? '' : ' (hire someone first)'}
                    </label>
                    <label className='flex items-center gap-2 text-sm'>
                      <RadioGroupItem value='schedule' />
                      Only its schedule
                    </label>
                  </RadioGroup>
                ) : jobUuid && jobQuery.isLoading ? (
                  <p className='text-muted-foreground flex items-center gap-2 text-sm'>
                    <Loader2 className='size-4 animate-spin' aria-hidden /> Loading the job…
                  </p>
                ) : null}
              </div>
              {fromJob ? (
                <p className='text-muted-foreground text-xs'>
                  Publishing fills the job. Anything you change here is re-checked and the job’s
                  venue and equipment holds are rebooked to match.
                </p>
              ) : null}
            </Section>

            <OfferingSection builder={builder} aside={instructorField} />
            <ServiceSection builder={builder} />
            {hasMissingRates && rateApplicationHref ? (
              <div className='border-warning/40 bg-warning/10 flex flex-wrap items-center justify-between gap-3 rounded-md border p-3'>
                <p className='text-foreground text-sm'>
                  Some training rates are missing for {selectedOffering?.label}. Update your rate
                  application to add the rates you want to offer.
                </p>
                <Button asChild variant='outline' size='sm'>
                  <Link href={rateApplicationHref}>Update rate application</Link>
                </Button>
              </div>
            ) : null}
            <LogisticsSections builder={builder} excludeJobUuid={fromJob ? job?.uuid : undefined} />

            <IssuesPanel issues={issues} checking={checking} />
            <SchedulingConflictAlert
              title='These sessions conflict with existing bookings'
              conflicts={conflicts}
              timeZone={schedule.timezone}
            />
          </div>

          <DialogFooter className='border-border/60 border-t px-6 py-4'>
            <Button type='button' variant='outline' onClick={onClose} disabled={publishing}>
              Cancel
            </Button>
            <Button type='submit' disabled={publishing || issues.length > 0}>
              {publishing ? (
                <Loader2 className='size-4 animate-spin' aria-hidden />
              ) : (
                <Send className='size-4' aria-hidden />
              )}
              {publishing ? 'Publishing…' : 'Publish Class'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
