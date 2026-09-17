'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { OrgPage } from '@/app/dashboard/organisation/_components/org-page';
import {
  apiCalendarDay,
  basisStatus,
  billableUnits,
  DeliveryCards,
  deliveryModeLabel,
  getService,
  isPhysicalDelivery,
  num,
  OfferingPicker,
  PricingCapacity,
  priceAndPayIssue,
  REMINDER_MINUTES,
  ReminderOptions,
  type ReminderState,
  SERVICE_TYPE_ENUM,
  type ServiceKey,
  serviceFormat,
  serviceForDelivery,
  TargetGroupPicker,
  useBranchResources,
  useOrganisationBranches,
  useProposedRateCard,
  venueTooSmall,
  WhereItHappens,
  type WhereItHappensValue,
  whereItHappensBlockers,
} from '@/components/class-form';
import { PageHeader } from '@/components/dashboard';
import { AsyncSection } from '@/components/data/async-section';
import { SchedulingConflictAlert } from '@/components/scheduling/scheduling-conflict-alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrganisation } from '@/context/organisation-context';
import { extractEntity, extractPage } from '@/lib/api-helpers';
import { formatDateOnly } from '@/lib/date';
import { getErrorMessage } from '@/lib/error-utils';
import { STALE_TIMES } from '@/lib/query-client';
import {
  type DeliveryMode,
  formatRate,
  formatRateAmount,
  formatRateBasis,
  getRateBasis,
  type RateBasis,
  type RateCard,
  rateFor,
} from '@/lib/rate-card';
import { parseSchedulingConflicts, type SchedulingConflict } from '@/lib/scheduling-conflicts';
import type {
  Category,
  ClassMarketplaceJobRequest,
  ClassMarketplaceJobResource,
  OrganisationResource,
} from '@/services/client';
import { ResourceTypeEnum } from '@/services/client';
import {
  createJobMutation,
  getAllCategoriesOptions,
  getJobOptions,
  getResourceOptions,
  updateJobMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { invalidateJobApplicationWorkflowQueries } from '@/src/features/dashboard/workflow-query-invalidation';
import { jobHref, jobsHref } from '../../lib/job-routes';
import { BillingStep } from './billing-step';
import { isReachable, JOB_STEPS, REVIEW_STEP } from './job-steps';
import { ReviewRows } from './review-rows';
import { ScheduleStep } from './schedule-step';
import { StepFooter } from './step-footer';
import { type RailStepState, StepRail } from './step-rail';
import { useApprovedOfferings } from './use-approved-offerings';
import { useJobSchedule } from './use-job-schedule';

type Place = Omit<WhereItHappensValue, 'delivery'>;

const EMPTY_PLACE: Place = { branchUuid: '', meetingLink: '', venueUuid: '', equipmentUuids: [] };

function OfferingSkeleton() {
  return (
    <div className='flex flex-col gap-2'>
      <Skeleton className='h-4 w-48' />
      <Skeleton className='h-9 w-full' />
      <Skeleton className='h-14 w-full' />
    </div>
  );
}

export function PostJobStepper() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const isOrgVerified = Boolean(organisation?.admin_verified);

  const editingJobUuid = searchParams.get('jobUuid')?.trim() ?? '';
  const isEditMode = Boolean(editingJobUuid);
  // A repost starts from an existing job's answers but saves a brand-new job.
  const sourceJobUuid = editingJobUuid || (searchParams.get('repostFrom')?.trim() ?? '');
  const jobQuery = useQuery({
    ...getJobOptions({ path: { jobUuid: sourceJobUuid } }),
    enabled: Boolean(sourceJobUuid),
  });
  const sourceJob = jobQuery.data?.data ?? null;

  const approved = useApprovedOfferings(organisationUuid);
  const { offerings } = approved;

  const [step, setStep] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const panelRef = useRef<HTMLFormElement>(null);

  const [offering, setOffering] = useState('');
  const [programCategoryUuid, setProgramCategoryUuid] = useState('');
  const [delivery, setDelivery] = useState<DeliveryMode | null>(null);
  const [basis, setBasis] = useState<RateBasis | null>(null);
  const [service, setService] = useState<ServiceKey | null>(null);
  const [addedCards, setAddedCards] = useState<Record<string, RateCard>>({});
  const [place, setPlace] = useState<Place>(EMPTY_PLACE);
  const [salePrice, setSalePrice] = useState('');
  const [instructorPay, setInstructorPay] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('20');
  const [allowWaitlist, setAllowWaitlist] = useState(true);
  const [targetGroupUuids, setTargetGroupUuids] = useState<string[]>([]);
  const [reminder, setReminder] = useState<ReminderState>({
    window: '24h',
    sendStudents: true,
    sendInstructor: true,
    email: true,
    sms: false,
    push: true,
  });
  const [resourceConflicts, setResourceConflicts] = useState<SchedulingConflict[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const schedule = useJobSchedule({ requireOpenRegistration: !isEditMode });

  const selectedOffering = offerings.find(item => item.value === offering);
  const creatorName = approved.creatorNameFor(selectedOffering);
  const fetchedProposal = useProposedRateCard(selectedOffering);
  const proposedCard = addedCards[offering] ?? fetchedProposal;
  const rateCard = selectedOffering?.rateCard;
  const currency = rateCard?.currency;
  const whereValue: WhereItHappensValue = { ...place, delivery: delivery ?? 'IN_PERSON' };
  const physical = isPhysicalDelivery(whereValue.delivery);
  const title = selectedOffering?.label ?? 'New job';

  const approvedRate =
    delivery && basis && service
      ? rateFor(rateCard, { format: serviceFormat(service), delivery, basis })
      : null;

  const categoriesQuery = useQuery({
    ...getAllCategoriesOptions({ query: { pageable: { page: 0, size: 100 } } }),
    enabled: selectedOffering?.kind === 'Program',
    staleTime: STALE_TIMES.reference,
  });
  const categories = useMemo(
    () => extractPage<Category>(categoriesQuery.data).items,
    [categoriesQuery.data]
  );

  // A program's own category seeds the picker once its details arrive.
  const seedCategory = selectedOffering?.kind === 'Program' ? selectedOffering.categoryUuid : '';
  useEffect(() => {
    if (seedCategory) setProgramCategoryUuid(current => current || seedCategory);
  }, [seedCategory]);

  const prefillValue = useMemo(() => {
    const courseUuid = searchParams.get('courseUuid')?.trim();
    if (courseUuid) return `course:${courseUuid}`;
    const programUuid = searchParams.get('programUuid')?.trim();
    return programUuid ? `program:${programUuid}` : '';
  }, [searchParams]);
  const [prefillApplied, setPrefillApplied] = useState(false);
  useEffect(() => {
    if (sourceJobUuid || prefillApplied || !prefillValue) return;
    if (!offerings.some(item => item.value === prefillValue)) return;
    setOffering(prefillValue);
    setPrefillApplied(true);
  }, [offerings, prefillValue, prefillApplied, sourceJobUuid]);

  const { branches, query: branchesQuery } = useOrganisationBranches(organisationUuid);
  const selectedBranch = branches.find(branch => branch.uuid === place.branchUuid);
  const { venues, equipment, venuesQuery, equipmentQuery } = useBranchResources(
    organisationUuid,
    place.branchUuid
  );
  const selectedVenue = venues.find(venue => venue.uuid === place.venueUuid);
  const selectedEquipment = useMemo(
    () => equipment.filter(item => place.equipmentUuids.includes(item.uuid ?? '')),
    [equipment, place.equipmentUuids]
  );
  const selectedResources = useMemo(
    () => (physical ? [...(selectedVenue ? [selectedVenue] : []), ...selectedEquipment] : []),
    [physical, selectedVenue, selectedEquipment]
  );

  const [hydrated, setHydrated] = useState(false);
  const [untypedResourceUuids, setUntypedResourceUuids] = useState<string[]>([]);
  const hydrateSchedule = schedule.hydrate;
  useEffect(() => {
    if (!sourceJob || hydrated) return;
    const job = sourceJob;
    if (job.course_uuid) setOffering(`course:${job.course_uuid}`);
    else if (job.program_uuid) setOffering(`program:${job.program_uuid}`);
    if (job.category_uuid) setProgramCategoryUuid(job.category_uuid);

    const jobDelivery = (job.location_type as DeliveryMode | undefined) ?? 'IN_PERSON';
    setDelivery(jobDelivery);
    if (job.rate_basis) setBasis(job.rate_basis);
    setService(
      serviceForDelivery(jobDelivery, {
        serviceType: job.service_type,
        sessionFormat: job.session_format,
      })
    );

    const resources = job.resources ?? [];
    const resourceUuids = (matches: (type?: string) => boolean) =>
      resources
        .filter(resource => matches(resource.resource_type))
        .map(resource => resource.resource_uuid)
        .filter((uuid): uuid is string => Boolean(uuid));
    setPlace({
      branchUuid: job.branch_uuid ?? '',
      meetingLink: job.meeting_link ?? '',
      venueUuid: resourceUuids(type => type === ResourceTypeEnum.VENUE)[0] ?? '',
      equipmentUuids: resourceUuids(type => type === ResourceTypeEnum.EQUIPMENT_POOL),
    });
    // Jobs saved before resources carried their type are sorted once the branch's lists load.
    setUntypedResourceUuids(resourceUuids(type => !type));

    if (job.max_participants != null) setMaxParticipants(String(job.max_participants));
    if (job.allow_waitlist != null) setAllowWaitlist(job.allow_waitlist);
    if (job.sale_price != null) setSalePrice(String(job.sale_price));
    if (job.instructor_pay != null) setInstructorPay(String(job.instructor_pay));
    setTargetGroupUuids(job.target_group_uuids ?? []);
    hydrateSchedule(job);

    const reminderWindow = Object.entries(REMINDER_MINUTES).find(
      ([, minutes]) => minutes === Number(job.class_reminder_minutes)
    )?.[0];
    setReminder(current => ({
      window: reminderWindow ?? current.window,
      sendStudents: job.remind_students ?? current.sendStudents,
      sendInstructor: job.remind_instructor ?? current.sendInstructor,
      email: job.remind_via_email ?? current.email,
      sms: job.remind_via_sms ?? current.sms,
      push: job.remind_via_push ?? current.push,
    }));

    setStep(REVIEW_STEP);
    setFurthest(REVIEW_STEP);
    setHydrated(true);
  }, [sourceJob, hydrated, hydrateSchedule]);

  useEffect(() => {
    if (untypedResourceUuids.length === 0) return;
    if (!venuesQuery.isFetched || !equipmentQuery.isFetched) return;
    setPlace(current => ({
      ...current,
      venueUuid:
        current.venueUuid ||
        untypedResourceUuids.find(uuid => venues.some(venue => venue.uuid === uuid)) ||
        '',
      equipmentUuids: Array.from(
        new Set([
          ...current.equipmentUuids,
          ...untypedResourceUuids.filter(uuid => equipment.some(item => item.uuid === uuid)),
        ])
      ),
    }));
    setUntypedResourceUuids([]);
  }, [untypedResourceUuids, venuesQuery.isFetched, equipmentQuery.isFetched, venues, equipment]);

  // A job from before branches were required: its venue's branch is the best first guess.
  const isLegacyJob = Boolean(sourceJob && !sourceJob.branch_uuid);
  const legacyResourceUuid = isLegacyJob
    ? ((
        sourceJob?.resources?.find(resource => resource.resource_type === ResourceTypeEnum.VENUE) ??
        sourceJob?.resources?.[0]
      )?.resource_uuid ?? '')
    : '';
  const legacyResourceQuery = useQuery({
    ...getResourceOptions({ path: { organisationUuid, resourceUuid: legacyResourceUuid } }),
    enabled: Boolean(organisationUuid && legacyResourceUuid),
  });
  const legacyBranchUuid =
    extractEntity<OrganisationResource>(legacyResourceQuery.data)?.branch_uuid ?? '';
  useEffect(() => {
    if (!hydrated || !legacyBranchUuid) return;
    setPlace(current =>
      current.branchUuid ? current : { ...current, branchUuid: legacyBranchUuid }
    );
  }, [hydrated, legacyBranchUuid]);

  const changeOffering = (value: string) => {
    if (value === offering) return;
    setOffering(value);
    setProgramCategoryUuid('');
    setBasis(null);
    setService(null);
    setSalePrice('');
    setInstructorPay('');
  };

  const changeDelivery = (next: DeliveryMode) => {
    setDelivery(next);
    setService(null);
    if (basis && basisStatus(rateCard, null, next, basis) !== 'approved') setBasis(null);
    if (!isPhysicalDelivery(next)) {
      setPlace(current => ({ ...current, venueUuid: '', equipmentUuids: [] }));
    }
  };

  const changeBasis = (next: RateBasis) => {
    if (next === basis || !delivery) return;
    setBasis(next);
    setSalePrice('');
    setInstructorPay('');
    const rate = service
      ? rateFor(rateCard, { format: serviceFormat(service), delivery, basis: next })
      : null;
    if (rate === null) setService(null);
    else setSalePrice(String(rate));
  };

  const changeService = (next: ServiceKey) => {
    setService(next);
    if (!delivery || !basis || salePrice.trim()) return;
    const rate = rateFor(rateCard, { format: serviceFormat(next), delivery, basis });
    if (rate !== null) setSalePrice(String(rate));
  };

  const maxValue = num(maxParticipants);
  const priceIssue = basis
    ? priceAndPayIssue({ salePrice, instructorPay, approvedRate, basis, currency })
    : null;
  const venueIssue =
    physical && selectedVenue && venueTooSmall(selectedVenue, maxValue)
      ? `${selectedVenue.name} seats ${selectedVenue.seat_capacity}, fewer than your ${maxValue} max participants.`
      : null;

  const blockers: (string | null)[] = [
    !selectedOffering
      ? 'Pick an approved course or program.'
      : selectedOffering.kind === 'Program' && !programCategoryUuid
        ? 'Pick the category these program classes fall under.'
        : !delivery
          ? 'Pick how the class is delivered.'
          : null,
    !delivery || !basis || basisStatus(rateCard, null, delivery, basis) !== 'approved'
      ? 'Pick a billing basis on your rate card.'
      : !service || approvedRate === null
        ? 'Pick a service.'
        : null,
    whereItHappensBlockers(whereValue, selectedBranch)[0] ??
      (place.branchUuid && branchesQuery.isLoading ? 'Checking the branch.' : null),
    schedule.blocker,
    priceIssue?.message ??
      (maxValue !== undefined && maxValue < 1 ? 'Max participants must be at least 1.' : null) ??
      venueIssue,
    isOrgVerified ? null : 'Your organisation must be verified before posting class jobs.',
  ];
  const firstBlocked = blockers.findIndex(Boolean);
  const reviewBlocker =
    firstBlocked >= 0 && firstBlocked < REVIEW_STEP
      ? `Finish “${JOB_STEPS[firstBlocked]!.title}” first.`
      : blockers[REVIEW_STEP];
  const currentBlocker = step === REVIEW_STEP ? reviewBlocker : blockers[step];

  const goTo = (index: number) => {
    if (index < 0 || index > REVIEW_STEP || !isReachable(blockers, index)) return;
    setStep(index);
    setFurthest(current => Math.max(current, index));
    panelRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  const basisInfo = basis ? getRateBasis(basis) : null;
  const units = basis ? billableUnits(basis, schedule.totals) : 0;
  const sale = num(salePrice) ?? 0;
  const pay = num(instructorPay) ?? 0;
  const branchName = selectedBranch?.branch_name || 'No branch';
  const placeSummary = physical
    ? [branchName, selectedVenue?.name ?? 'No venue', ...selectedEquipment.map(item => item.name)]
    : [branchName, 'online'];
  const firstSession = schedule.sessions[0];
  const lastSession = schedule.sessions[schedule.sessions.length - 1];

  const summaries = [
    delivery && selectedOffering
      ? `${deliveryModeLabel(delivery)} · ${selectedOffering.label}`
      : '',
    service && basisInfo ? `${getService(service)?.title} · ${basisInfo.label.toLowerCase()}` : '',
    place.branchUuid ? placeSummary.slice(0, 2).join(' · ') : '',
    firstSession ? `${schedule.totals.sessions} sessions from ${firstSession.label}` : '',
    salePrice && basis ? formatRate(sale, basis, currency) : '',
    '',
  ];

  const railSteps = JOB_STEPS.map((meta, index) => {
    let state: RailStepState = 'open';
    if (index === step) state = 'current';
    else if (!isReachable(blockers, index)) state = 'locked';
    else if (index < furthest && !blockers[index]) state = 'done';
    return { title: meta.title, summary: state === 'done' ? summaries[index]! : '', state };
  });

  const onMutationError = (error: unknown, fallback: string) => {
    const report = parseSchedulingConflicts(error);
    if (report) {
      setResourceConflicts(report.conflicts);
      toast.error(report.message);
      return;
    }
    const message = getErrorMessage(error, fallback);
    setSubmitError(message);
    toast.error(message);
  };

  const postJob = useMutation({
    ...createJobMutation(),
    onSuccess: async response => {
      toast.success('Job posted. Instructors can now apply.');
      await invalidateJobApplicationWorkflowQueries(queryClient);
      const jobUuid = response?.data?.uuid;
      router.push(jobUuid ? jobHref(jobUuid) : jobsHref());
    },
    onError: error => onMutationError(error, 'Unable to post the job.'),
  });
  const saveJob = useMutation({
    ...updateJobMutation(),
    onSuccess: async () => {
      toast.success('Job updated. Resource holds were re-evaluated.');
      await invalidateJobApplicationWorkflowQueries(queryClient);
      router.push(jobHref(editingJobUuid));
    },
    onError: error => onMutationError(error, 'Unable to update the job.'),
  });
  const submitting = postJob.isPending || saveJob.isPending;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (step !== REVIEW_STEP || submitting) return;
    if (firstBlocked >= 0) {
      if (firstBlocked < REVIEW_STEP) goTo(firstBlocked);
      toast.error(blockers[firstBlocked]);
      return;
    }
    if (!selectedOffering || !delivery || !basis || !service) return;

    const sessionTemplates = schedule.buildSessionTemplates();
    if (sessionTemplates.length === 0) {
      toast.error('Add at least one session.');
      return;
    }
    const earliest = sessionTemplates.reduce((a, b) => (a.start_time <= b.start_time ? a : b));
    const [offeringKind, offeringUuid] = offering.split(':');
    const resources: ClassMarketplaceJobResource[] = selectedResources.map(resource => ({
      resource_uuid: resource.uuid ?? '',
      quantity: 1,
    }));

    const payload: ClassMarketplaceJobRequest = {
      organisation_uuid: organisationUuid,
      branch_uuid: place.branchUuid,
      ...(offeringKind === 'program'
        ? { program_uuid: offeringUuid, category_uuid: programCategoryUuid }
        : { course_uuid: offeringUuid }),
      title: title.trim(),
      class_visibility: 'PUBLIC',
      session_format: serviceFormat(service),
      service_type: SERVICE_TYPE_ENUM[service],
      default_start_time: earliest.start_time,
      default_end_time: earliest.end_time,
      location_type: delivery,
      meeting_link: delivery === 'IN_PERSON' ? undefined : place.meetingLink.trim() || undefined,
      max_participants: maxValue,
      allow_waitlist: allowWaitlist,
      sale_price: sale,
      instructor_pay: pay,
      rate_basis: basis,
      ...(targetGroupUuids.length > 0 ? { target_group_uuids: targetGroupUuids } : {}),
      remind_students: reminder.sendStudents,
      remind_instructor: reminder.sendInstructor,
      remind_via_email: reminder.email,
      remind_via_sms: reminder.sms,
      remind_via_push: reminder.push,
      class_reminder_minutes: REMINDER_MINUTES[reminder.window],
      registration_period_start_date: apiCalendarDay(schedule.regStart),
      registration_period_end_date: apiCalendarDay(schedule.regEnd),
      ...schedule.academicBounds(),
      session_templates: sessionTemplates,
      ...(resources.length > 0 ? { resources } : {}),
    };

    setResourceConflicts([]);
    setSubmitError(null);
    if (isEditMode) saveJob.mutate({ path: { jobUuid: editingJobUuid }, body: payload });
    else postJob.mutate({ body: payload });
  };

  const reviewRows = [
    {
      title: JOB_STEPS[0].title,
      value: [title, delivery ? deliveryModeLabel(delivery) : 'Delivery not picked'].join(' · '),
    },
    {
      title: JOB_STEPS[1].title,
      value:
        service && basis
          ? `${getService(service)?.title} · billed ${formatRateBasis(basis)} · approved rate ${formatRate(approvedRate, basis, currency)}`
          : 'Not picked yet',
    },
    { title: JOB_STEPS[2].title, value: placeSummary.join(' · ') },
    {
      title: JOB_STEPS[3].title,
      value:
        firstSession && lastSession
          ? `${schedule.totals.sessions} sessions · ${firstSession.label} to ${lastSession.label} · registration ${formatDateOnly(schedule.regStart)} to ${formatDateOnly(schedule.regEnd)}`
          : 'No sessions yet',
    },
    {
      title: JOB_STEPS[4].title,
      value: basisInfo
        ? `${formatRate(sale, basis, currency)} price · ${formatRate(pay, basis, currency)} pay · margin ${formatRateAmount(Math.max(sale - pay, 0) * units, currency)} per learner · up to ${maxParticipants || '—'} participants${allowWaitlist ? ' with a waitlist' : ''}`
        : 'Not set yet',
    },
  ].map((row, index) => ({ ...row, onEdit: () => goTo(index) }));

  const meta = JOB_STEPS[step]!;
  const sourceLoading = Boolean(sourceJobUuid) && jobQuery.isLoading && !sourceJob;

  return (
    <OrgPage className='space-y-5'>
      <PageHeader
        title={isEditMode ? 'Edit job' : 'Post a job'}
        description={
          isEditMode
            ? 'Changing the schedule or resources releases the existing holds and re-evaluates them. If the new windows clash, nothing is saved.'
            : 'Six short steps. Each one only asks what the next needs, and nothing is picked for you.'
        }
        actions={
          <Button asChild variant='ghost'>
            <Link href={isEditMode ? jobHref(editingJobUuid) : jobsHref()}>Cancel</Link>
          </Button>
        }
      />

      {!isOrgVerified ? (
        <div className='border-warning/40 bg-warning/5 rounded-md border p-4 text-sm'>
          <p className='font-semibold'>Your organisation is not verified yet</p>
          <p className='text-muted-foreground mt-0.5 text-xs'>
            You can prepare a job here, but posting stays blocked until an administrator verifies
            your organisation.
          </p>
        </div>
      ) : null}

      {jobQuery.error ? (
        <AsyncSection
          error={jobQuery.error}
          onRetry={() => jobQuery.refetch()}
          errorTitle='Couldn’t load the job to start from'
        >
          {null}
        </AsyncSection>
      ) : null}

      <div className='grid items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)]'>
        <StepRail steps={railSteps} onSelect={goTo} />

        <form
          ref={panelRef}
          onSubmit={handleSubmit}
          aria-labelledby='job-step-title'
          className='border-border/70 bg-card min-w-0 scroll-mt-4 rounded-md border shadow-sm'
        >
          <div className='border-border/60 border-b px-5 py-4'>
            <p className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
              Step {step + 1} of {JOB_STEPS.length}
            </p>
            <h2 id='job-step-title' className='text-foreground mt-0.5 text-lg font-semibold'>
              {meta.title}
            </h2>
            <p className='text-muted-foreground text-sm'>{meta.description}</p>
          </div>

          <div className='flex flex-col gap-6 p-5'>
            {sourceLoading ? (
              <OfferingSkeleton />
            ) : step === 0 ? (
              <>
                <AsyncSection
                  loading={approved.loading}
                  error={approved.error}
                  onRetry={() => approved.refetch()}
                  skeleton={<OfferingSkeleton />}
                  errorTitle='Couldn’t load your approved courses and programs'
                >
                  <OfferingPicker
                    loading={approved.loading}
                    categories={categories}
                    categoriesLoading={categoriesQuery.isLoading}
                    programCategoryUuid={programCategoryUuid}
                    onProgramCategoryChange={setProgramCategoryUuid}
                    offerings={offerings}
                    offering={offering}
                    onOfferingChange={changeOffering}
                    selectedOffering={selectedOffering}
                    title={title}
                    showInstructor={false}
                    titleLabel='Job title'
                    titleHint='Taken from the approved course or program. Instructors see it in the marketplace.'
                  />
                </AsyncSection>
                <DeliveryCards value={delivery} onChange={changeDelivery} />
              </>
            ) : step === 1 && selectedOffering && delivery ? (
              <BillingStep
                offering={selectedOffering}
                creatorName={creatorName}
                delivery={delivery}
                basis={basis}
                onBasisChange={changeBasis}
                service={service}
                onServiceChange={changeService}
                proposedCard={proposedCard}
                onRatesAdded={card => {
                  if (card) setAddedCards(current => ({ ...current, [offering]: card }));
                }}
              />
            ) : step === 2 ? (
              <WhereItHappens
                organisationUuid={organisationUuid}
                value={whereValue}
                onChange={patch => setPlace(current => ({ ...current, ...patch }))}
                maxParticipants={maxValue}
                notice={
                  isLegacyJob ? (
                    <div className='border-warning/60 bg-warning/10 text-foreground flex items-start gap-2 rounded-md border p-3 text-sm'>
                      <TriangleAlert className='text-warning mt-0.5 size-4 shrink-0' />
                      <p>
                        <strong className='font-semibold'>Pick the branch this job runs at.</strong>{' '}
                        {legacyBranchUuid
                          ? 'It was posted before jobs belonged to a branch, so the branch its venue belongs to is preselected.'
                          : 'It was posted before jobs belonged to a branch.'}
                      </p>
                    </div>
                  ) : null
                }
              />
            ) : step === 3 ? (
              <ScheduleStep
                schedule={schedule}
                organisationUuid={organisationUuid}
                resources={selectedResources}
                excludeJobUuid={editingJobUuid || undefined}
              />
            ) : step === 4 && basis ? (
              <PricingCapacity
                basis={basis}
                approvedRate={approvedRate}
                currency={currency}
                salePrice={salePrice}
                onSalePriceChange={setSalePrice}
                instructorPay={instructorPay}
                onInstructorPayChange={setInstructorPay}
                maxParticipants={maxParticipants}
                onMaxChange={setMaxParticipants}
                allowWaitlist={allowWaitlist}
                onAllowWaitlistChange={setAllowWaitlist}
                totals={schedule.totals}
                payHint={`Instructors can be hired only if their approved rate ${formatRateBasis(basis)} fits under this.`}
              >
                {venueIssue ? (
                  <p className='text-warning text-sm'>
                    {venueIssue} Lower the cap or pick a bigger room.
                  </p>
                ) : null}
                <TargetGroupPicker
                  organisationUuid={organisationUuid}
                  targetGroupUuids={targetGroupUuids}
                  onTargetGroupsChange={setTargetGroupUuids}
                />
              </PricingCapacity>
            ) : step === REVIEW_STEP ? (
              <>
                <ReviewRows rows={reviewRows} />
                <ReminderOptions
                  value={reminder}
                  onChange={patch => setReminder(current => ({ ...current, ...patch }))}
                />
                <SchedulingConflictAlert
                  title='These sessions conflict with existing reservations'
                  conflicts={resourceConflicts}
                  timeZone={schedule.timezone}
                />
                {submitError ? (
                  <div
                    role='alert'
                    className='border-destructive/50 bg-destructive/10 text-foreground flex items-start gap-2 rounded-md border p-3 text-sm'
                  >
                    <TriangleAlert className='text-destructive mt-0.5 size-4 shrink-0' />
                    <span>{submitError}</span>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>

          <StepFooter
            onBack={() => goTo(step - 1)}
            backDisabled={step === 0 || submitting}
            blocker={sourceLoading ? null : (currentBlocker ?? null)}
            nextLabel={
              step === REVIEW_STEP ? (isEditMode ? 'Save changes' : 'Post job') : 'Continue'
            }
            nextDisabled={sourceLoading || Boolean(currentBlocker)}
            pending={submitting}
            onNext={step === REVIEW_STEP ? undefined : () => goTo(step + 1)}
            finalIcon={step === REVIEW_STEP ? <Send aria-hidden /> : undefined}
          />
        </form>
      </div>
    </OrgPage>
  );
}
