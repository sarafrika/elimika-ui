// @ts-nocheck -- 1:1 Lovable port; @hey-api generated-client type drift
'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  AcademicPeriodsPanel,
  addDays,
  type AcademicPeriod,
  type ApprovedRateCard,
  approvedRateFor,
  computeSessionWindows,
  computeUpcomingSessions,
  DAY_TOKEN,
  DAYS,
  DEFAULT_DAYS,
  type DayKey,
  type DayRow,
  type Delivery,
  EquipmentTarget,
  firstOccurrenceOnOrAfter,
  fmtDate,
  LocationVenue,
  num,
  type Offering,
  OfferingPicker,
  PickDatesPanel,
  type PreviewWindow,
  PricingCapacity,
  REMINDER_MINUTES,
  ReminderOptions,
  type ReminderState,
  ResourceAvailabilityPreview,
  ScheduleModeCards,
  SERVICE_TYPE_ENUM,
  type ScheduleMode,
  ServiceCards,
  serviceFormat,
  type ServiceKey,
  sessionEndFor,
  StandardSchedule,
  toDateTime,
  UpcomingSessions,
} from '@/components/class-form';
import { PageHeader } from '@/components/page-header';
import { type ConflictItem, parseConflictError } from '@/components/resourcing/conflicts';
import { ResourceConflictAlert } from '@/components/resourcing/ResourceConflictAlert';
import { Button } from '@/components/ui/button';
import { useOrganisation } from '@/context/organisation-context';
import { useCoursesByIds, useProgramsByIds } from '@/hooks/use-batched-lookups';
import { extractPage } from '@/lib/api-helpers';
import { STALE_TIMES } from '@/lib/query-client';
import type {
  Category,
  ClassMarketplaceJobRequest,
  ClassMarketplaceJobResource,
  ClassSessionTemplate,
  OrganisationResource,
} from '@/services/client';
import { RecurrenceTypeEnum, ResourceTypeEnum } from '@/services/client';
import {
  createJobMutation,
  getAllCategoriesOptions,
  getJobOptions,
  listResourcesOptions,
  searchProgramTrainingApplicationsOptions,
  searchTrainingApplicationsOptions,
  updateJobMutation,
} from '@/services/client/@tanstack/react-query.gen';

export default function OrganisationPostJobPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const isOrgVerified = Boolean(organisation?.admin_verified);

  const approvedSearchParams = {
    applicant_uuid_eq: organisationUuid,
    applicant_type_eq: 'organisation',
    status_eq: 'approved',
  };
  const approvedCoursesQuery = useQuery({
    ...searchTrainingApplicationsOptions({
      query: { searchParams: approvedSearchParams, pageable: { page: 0, size: 100 } },
    }),
    enabled: Boolean(organisationUuid),
  });
  const approvedProgramsQuery = useQuery({
    ...searchProgramTrainingApplicationsOptions({
      query: { searchParams: approvedSearchParams, pageable: { page: 0, size: 100 } },
    }),
    enabled: Boolean(organisationUuid),
  });
  const loading = approvedCoursesQuery.isLoading || approvedProgramsQuery.isLoading;

  const approvedCourseUuids = useMemo(
    () =>
      Array.from(
        new Set(
          (approvedCoursesQuery.data?.data?.content ?? [])
            .map(row => row.course_uuid)
            .filter((uuid): uuid is string => Boolean(uuid))
        )
      ),
    [approvedCoursesQuery.data]
  );
  const rateCardByOffering = useMemo(() => {
    const map = new Map<string, ApprovedRateCard>();
    for (const row of approvedCoursesQuery.data?.data?.content ?? []) {
      if (row.course_uuid && row.rate_card) map.set(`course:${row.course_uuid}`, row.rate_card);
    }
    for (const row of approvedProgramsQuery.data?.data?.content ?? []) {
      if (row.program_uuid && row.rate_card) map.set(`program:${row.program_uuid}`, row.rate_card);
    }
    return map;
  }, [approvedCoursesQuery.data, approvedProgramsQuery.data]);
  const approvedProgramUuids = useMemo(
    () =>
      Array.from(
        new Set(
          (approvedProgramsQuery.data?.data?.content ?? [])
            .map(row => row.program_uuid)
            .filter((uuid): uuid is string => Boolean(uuid))
        )
      ),
    [approvedProgramsQuery.data]
  );

  const { courseMap } = useCoursesByIds(approvedCourseUuids);
  const { programMap } = useProgramsByIds(approvedProgramUuids);

  const offerings: Offering[] = useMemo(
    () => [
      ...approvedCourseUuids.map(uuid => {
        const course = courseMap[uuid];
        return {
          value: `course:${uuid}`,
          label: course?.name ?? `Course ${uuid.slice(0, 8)}`,
          kind: 'Course' as const,
          categoryNames: (course?.category_names ?? []) as string[],
          rateCard: rateCardByOffering.get(`course:${uuid}`),
        };
      }),
      ...approvedProgramUuids.map(uuid => ({
        value: `program:${uuid}`,
        label: programMap[uuid]?.title ?? `Program ${uuid.slice(0, 8)}`,
        kind: 'Program' as const,
        categoryNames: [],
        categoryUuid: programMap[uuid]?.category_uuid ?? undefined,
        rateCard: rateCardByOffering.get(`program:${uuid}`),
      })),
    ],
    [approvedCourseUuids, approvedProgramUuids, courseMap, programMap, rateCardByOffering]
  );

  const editingJobUuid = searchParams.get('jobUuid')?.trim() ?? '';
  const isEditMode = Boolean(editingJobUuid);
  const editingJobQuery = useQuery({
    ...getJobOptions({ path: { jobUuid: editingJobUuid } }),
    enabled: isEditMode,
  });
  const editingJob = editingJobQuery.data?.data ?? null;

  const prefillValue = useMemo(() => {
    const courseUuid = searchParams.get('courseUuid')?.trim();
    if (courseUuid) return `course:${courseUuid}`;
    const programUuid = searchParams.get('programUuid')?.trim();
    if (programUuid) return `program:${programUuid}`;
    return '';
  }, [searchParams]);

  const [offering, setOffering] = useState('');
  const [prefillApplied, setPrefillApplied] = useState(false);
  useEffect(() => {
    if (offerings.length === 0) return;
    if (isEditMode) return;
    if (!prefillApplied && prefillValue && offerings.some(o => o.value === prefillValue)) {
      setOffering(prefillValue);
      setPrefillApplied(true);
      return;
    }
    if (!offerings.some(o => o.value === offering)) setOffering(offerings[0].value);
  }, [offerings, offering, prefillValue, prefillApplied, isEditMode]);

  const selectedOffering = useMemo(
    () => offerings.find(o => o.value === offering),
    [offerings, offering]
  );

  const categoriesQuery = useQuery({
    ...getAllCategoriesOptions({ query: { pageable: { page: 0, size: 100 } } }),
    enabled: selectedOffering?.kind === 'Program',
    staleTime: STALE_TIMES.reference,
  });
  const categories = useMemo(
    () => extractPage<Category>(categoriesQuery.data).items,
    [categoriesQuery.data]
  );
  const [programCategoryUuid, setProgramCategoryUuid] = useState('');
  useEffect(() => {
    if (selectedOffering?.kind !== 'Program') return;
    if (selectedOffering.categoryUuid) {
      setProgramCategoryUuid(selectedOffering.categoryUuid);
      return;
    }
    if (categories.length > 0 && !categories.some(c => c.uuid === programCategoryUuid)) {
      setProgramCategoryUuid(categories[0].uuid ?? '');
    }
  }, [selectedOffering, categories, programCategoryUuid]);

  const title = useMemo(() => selectedOffering?.label ?? 'New job', [selectedOffering]);

  const orgResourcesQuery = useQuery({
    ...listResourcesOptions({
      path: { organisationUuid },
      query: { pageable: { page: 0, size: 100 }, active: true },
    }),
    enabled: Boolean(organisationUuid),
  });
  const orgResources = useMemo(
    () => extractPage<OrganisationResource>(orgResourcesQuery.data).items,
    [orgResourcesQuery.data]
  );
  const venueResources = useMemo(
    () => orgResources.filter(r => r.resource_type === ResourceTypeEnum.VENUE),
    [orgResources]
  );
  const equipmentResources = useMemo(
    () => orgResources.filter(r => r.resource_type === ResourceTypeEnum.EQUIPMENT_POOL),
    [orgResources]
  );

  const [service, setService] = useState<ServiceKey>('group');
  const sessionFormat = serviceFormat(service);

  const [delivery, setDelivery] = useState<Delivery>('IN_PERSON');
  const [locationName, setLocationName] = useState('');
  const [locationLatitude, setLocationLatitude] = useState('');
  const [locationLongitude, setLocationLongitude] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [venueUuid, setVenueUuid] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [equipmentUuids, setEquipmentUuids] = useState<string[]>([]);
  const [targetGroupUuids, setTargetGroupUuids] = useState<string[]>([]);

  const approvedFee = useMemo(
    () => approvedRateFor(selectedOffering?.rateCard, sessionFormat, delivery),
    [selectedOffering, sessionFormat, delivery]
  );
  const [salePrice, setSalePrice] = useState('');
  const [instructorPay, setInstructorPay] = useState('');
  const [feesDirty, setFeesDirty] = useState(false);
  useEffect(() => {
    if (feesDirty) return;
    const suggested = approvedFee === undefined ? '' : String(approvedFee);
    setSalePrice(suggested);
    setInstructorPay(suggested);
  }, [approvedFee, feesDirty]);
  const handleSalePriceChange = (value: string) => {
    setFeesDirty(true);
    setSalePrice(value);
  };
  const handleInstructorPayChange = (value: string) => {
    setFeesDirty(true);
    setInstructorPay(value);
  };
  const [maxParticipants, setMaxParticipants] = useState('20');
  const [allowWaitlist, setAllowWaitlist] = useState(true);

  const [mode, setMode] = useState<ScheduleMode>('standard');
  const [days, setDays] = useState<Record<DayKey, DayRow>>(DEFAULT_DAYS);
  const [repeatEvery, setRepeatEvery] = useState('1');
  const [repeatUnit, setRepeatUnit] = useState('Week');

  const today = useMemo(() => new Date(), []);
  const [startDate, setStartDate] = useState(fmtDate(today));
  const [endDate, setEndDate] = useState(fmtDate(addDays(today, 42)));
  const [regStart, setRegStart] = useState(fmtDate(today));
  const [regEnd, setRegEnd] = useState(fmtDate(addDays(today, 7)));
  const [continuousReg, setContinuousReg] = useState(false);
  const [timezone, setTimezone] = useState('EAT East Africa Time');

  const [reminder, setReminder] = useState<ReminderState>({
    window: '24h',
    sendStudents: true,
    sendInstructor: true,
    email: true,
    sms: false,
    push: true,
  });
  const patchReminder = (patch: Partial<ReminderState>) => setReminder(r => ({ ...r, ...patch }));

  const [pickedDates, setPickedDates] = useState<Date[]>([]);
  const [pickMonth, setPickMonth] = useState<Date>(new Date());
  const [sessionDuration, setSessionDuration] = useState('2h');
  const [sessionStart, setSessionStart] = useState('10:00');
  const sessionEnd = sessionEndFor(sessionStart, sessionDuration);
  const sortedPickedDates = useMemo(
    () => [...pickedDates].sort((a, b) => a.getTime() - b.getTime()),
    [pickedDates]
  );

  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([
    {
      id: 'ap-1',
      name: 'Academic Period 1',
      startDate: fmtDate(today),
      endDate: fmtDate(addDays(today, 77)),
      slots: [{ day: 'Wed', start: '09:00', end: '11:00' }],
    },
  ]);

  useEffect(() => {
    if (mode !== 'pick' || pickedDates.length === 0) return;
    const sorted = [...pickedDates].sort((a, b) => a.getTime() - b.getTime());
    const isoToKey: Record<number, DayKey> = {
      0: 'Sun',
      1: 'Mon',
      2: 'Tue',
      3: 'Wed',
      4: 'Thu',
      5: 'Fri',
      6: 'Sat',
    };
    const next = {} as Record<DayKey, DayRow>;
    for (const d of DAYS)
      next[d] = { active: false, start: sessionStart, end: sessionEnd, allDay: false };
    for (const d of sorted)
      next[isoToKey[d.getDay()]] = {
        active: true,
        start: sessionStart,
        end: sessionEnd,
        allDay: false,
      };
    setDays(next);
    setStartDate(fmtDate(sorted[0]));
    setEndDate(fmtDate(sorted[sorted.length - 1]));
  }, [mode, pickedDates, sessionStart, sessionEnd]);

  useEffect(() => {
    if (mode !== 'academic' || academicPeriods.length === 0) return;
    const next = {} as Record<DayKey, DayRow>;
    for (const d of DAYS) next[d] = { active: false, start: '09:00', end: '10:00', allDay: false };
    for (const p of academicPeriods) {
      for (const s of p.slots)
        next[s.day] = { active: true, start: s.start, end: s.end, allDay: false };
    }
    setDays(next);
    const starts = academicPeriods
      .map(p => p.startDate)
      .filter(Boolean)
      .sort();
    const ends = academicPeriods
      .map(p => p.endDate)
      .filter(Boolean)
      .sort();
    if (starts.length) setStartDate(starts[0]);
    if (ends.length) setEndDate(ends[ends.length - 1]);
  }, [mode, academicPeriods]);

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (!isEditMode || hydrated || !editingJob) return;
    if (!orgResourcesQuery.isFetched) return;

    if (editingJob.course_uuid) setOffering(`course:${editingJob.course_uuid}`);
    else if (editingJob.program_uuid) setOffering(`program:${editingJob.program_uuid}`);

    if (editingJob.location_type) setDelivery(editingJob.location_type as Delivery);
    if (editingJob.location_name) setLocationName(editingJob.location_name);
    if (editingJob.location_latitude != null) {
      setLocationLatitude(String(editingJob.location_latitude));
    }
    if (editingJob.location_longitude != null) {
      setLocationLongitude(String(editingJob.location_longitude));
    }
    if (editingJob.meeting_link) setMeetingLink(editingJob.meeting_link);
    if (editingJob.max_participants != null) {
      setMaxParticipants(String(editingJob.max_participants));
    }
    if (editingJob.allow_waitlist != null) setAllowWaitlist(editingJob.allow_waitlist);
    if (editingJob.sale_price != null || editingJob.instructor_pay != null) {
      setFeesDirty(true);
      if (editingJob.sale_price != null) setSalePrice(String(editingJob.sale_price));
      if (editingJob.instructor_pay != null) {
        setInstructorPay(String(editingJob.instructor_pay));
      }
    }

    const jobResources = editingJob.resources ?? [];
    const venue = jobResources.find(r =>
      venueResources.some(v => v.uuid === r.resource_uuid)
    );
    if (venue?.resource_uuid) setVenueUuid(venue.resource_uuid);
    setEquipmentUuids(
      jobResources
        .map(r => r.resource_uuid)
        .filter(
          (uuid): uuid is string =>
            Boolean(uuid) && equipmentResources.some(e => e.uuid === uuid)
        )
    );

    const templates = editingJob.session_templates ?? [];
    const recurring = templates.filter(t => t.recurrence?.recurrence_type);
    const oneOff = templates.filter(t => !t.recurrence?.recurrence_type);

    if (recurring.length > 0) {
      setMode('standard');
      const next = {} as Record<DayKey, DayRow>;
      for (const d of DAYS) next[d] = { ...DEFAULT_DAYS[d], active: false };
      for (const template of recurring) {
        const token = (template.recurrence?.days_of_week ?? '').split(',')[0]?.trim();
        const dayKey = DAYS.find(d => DAY_TOKEN[d] === token);
        if (!dayKey || !template.start_time || !template.end_time) continue;
        const start = new Date(template.start_time);
        const end = new Date(template.end_time);
        next[dayKey] = {
          active: true,
          start: `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`,
          end: `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`,
          allDay: false,
        };
      }
      setDays(next);
      const interval = recurring[0]?.recurrence?.interval_value;
      if (interval) setRepeatEvery(String(interval));
      const earliest = recurring
        .map(t => (t.start_time ? new Date(t.start_time) : null))
        .filter((d): d is Date => d !== null)
        .sort((a, b) => a.getTime() - b.getTime())[0];
      if (earliest) setStartDate(fmtDate(earliest));
      const seriesEnd = recurring[0]?.recurrence?.end_date;
      if (seriesEnd) setEndDate(fmtDate(new Date(seriesEnd)));
    } else if (oneOff.length > 0) {
      setMode('pick');
      setPickedDates(
        oneOff
          .map(t => (t.start_time ? new Date(t.start_time) : null))
          .filter((d): d is Date => d !== null)
      );
      const first = oneOff[0];
      if (first?.start_time) {
        const start = new Date(first.start_time);
        setSessionStart(
          `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`
        );
      }
    }

    if (editingJob.registration_period_start_date && editingJob.registration_period_end_date) {
      setContinuousReg(false);
      setRegStart(fmtDate(new Date(editingJob.registration_period_start_date)));
      setRegEnd(fmtDate(new Date(editingJob.registration_period_end_date)));
    } else {
      setContinuousReg(true);
    }

    setReminder(r => ({
      ...r,
      sendStudents: editingJob.remind_students ?? r.sendStudents,
      sendInstructor: editingJob.remind_instructor ?? r.sendInstructor,
      email: editingJob.remind_via_email ?? r.email,
      sms: editingJob.remind_via_sms ?? r.sms,
      push: editingJob.remind_via_push ?? r.push,
    }));

    setHydrated(true);
  }, [
    isEditMode,
    hydrated,
    editingJob,
    venueResources,
    equipmentResources,
    orgResourcesQuery.isFetched,
  ]);

  const activeDays = useMemo(() => DAYS.filter(d => days[d].active), [days]);
  const upcomingSessions = useMemo(
    () => computeUpcomingSessions(startDate, endDate, days),
    [startDate, endDate, days]
  );
  const totalSessions = upcomingSessions.length;

  const updateDay = (d: DayKey, patch: Partial<DayRow>) =>
    setDays(prev => ({ ...prev, [d]: { ...prev[d], ...patch } }));

  const previewWindows: PreviewWindow[] = useMemo(
    () => computeSessionWindows(startDate, endDate, days),
    [startDate, endDate, days]
  );
  const selectedResources = useMemo(
    () =>
      orgResources.filter(r => r.uuid === venueUuid || equipmentUuids.includes(r.uuid ?? '')),
    [orgResources, venueUuid, equipmentUuids]
  );

  const [resourceConflicts, setResourceConflicts] = useState<ConflictItem[]>([]);
  const onMutationError = (error: unknown, fallback: string) => {
    const report = parseConflictError(error);
    if (report) {
      setResourceConflicts(report.conflicts);
      toast.error(report.message);
      return;
    }
    toast.error(error instanceof Error ? error.message : fallback);
  };

  const postJob = useMutation({
    ...createJobMutation(),
    onSuccess: () => {
      toast.success('Job posted. Instructors can now apply.');
      router.push('/dashboard/organisation/opportunities');
    },
    onError: error => onMutationError(error, 'Unable to post the job.'),
  });

  const saveJob = useMutation({
    ...updateJobMutation(),
    onSuccess: () => {
      toast.success('Job updated. Resource holds were re-evaluated.');
      router.push('/dashboard/organisation/opportunities');
    },
    onError: error => onMutationError(error, 'Unable to update the job.'),
  });

  const isSubmitting = postJob.isPending || saveJob.isPending;

  const buildSessionTemplates = (): ClassSessionTemplate[] => {
    const interval = Math.max(1, Math.trunc(Number(repeatEvery) || 1));
    if (mode === 'pick') {
      return sortedPickedDates.map(d => ({
        start_time: toDateTime(fmtDate(d), sessionStart),
        end_time: toDateTime(fmtDate(d), sessionEnd),
        conflict_resolution: 'FAIL' as const,
      }));
    }
    if (mode === 'academic') {
      const templates: ClassSessionTemplate[] = [];
      for (const p of academicPeriods) {
        const periodEnd = new Date(`${p.endDate}T23:59:59`);
        for (const slot of p.slots) {
          const first = firstOccurrenceOnOrAfter(p.startDate, slot.day);
          if (!first || (!Number.isNaN(periodEnd.getTime()) && first > periodEnd)) continue;
          templates.push({
            start_time: toDateTime(fmtDate(first), slot.start),
            end_time: toDateTime(fmtDate(first), slot.end),
            recurrence: {
              recurrence_type: RecurrenceTypeEnum.WEEKLY,
              interval_value: interval,
              days_of_week: DAY_TOKEN[slot.day],
              ...(Number.isNaN(periodEnd.getTime()) ? {} : { end_date: periodEnd }),
            },
            conflict_resolution: 'FAIL' as const,
          });
        }
      }
      return templates;
    }
    const endBoundary = new Date(`${endDate}T23:59:59`);
    const templates: ClassSessionTemplate[] = [];
    for (const d of activeDays) {
      const row = days[d];
      const first = firstOccurrenceOnOrAfter(startDate, d);
      if (!first || first > endBoundary) continue;
      const startT = row.allDay ? '00:00' : row.start;
      const endT = row.allDay ? '23:59' : row.end;
      templates.push({
        start_time: toDateTime(fmtDate(first), startT),
        end_time: toDateTime(fmtDate(first), endT),
        recurrence: {
          recurrence_type: RecurrenceTypeEnum.WEEKLY,
          interval_value: interval,
          days_of_week: DAY_TOKEN[d],
          end_date: endBoundary,
        },
        conflict_resolution: 'FAIL' as const,
      });
    }
    return templates;
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!organisationUuid) return toast.error('No active organisation.');
    if (!isOrgVerified) {
      return toast.error('Your organisation must be verified before posting class jobs.');
    }
    if (!offering) return toast.error('Select an approved course or program.');
    if (selectedOffering?.kind === 'Program' && !programCategoryUuid) {
      return toast.error('Pick the category these program classes fall under.');
    }
    if (approvedFee === undefined) {
      return toast.error(
        'The course creator has not approved a rate for this session format and delivery mode.'
      );
    }
    const saleValue = num(salePrice);
    const payValue = num(instructorPay);
    if (saleValue === undefined || saleValue < 0) {
      return toast.error('Enter the sale price learners are charged per session.');
    }
    if (payValue === undefined || payValue < 0) {
      return toast.error('Enter the pay the instructor receives per session.');
    }
    if (payValue > saleValue) {
      return toast.error('Instructor pay cannot exceed the sale price.');
    }

    const requiresPhysical = delivery === 'IN_PERSON' || delivery === 'HYBRID';
    const requiresLink = delivery === 'ONLINE' || delivery === 'HYBRID';
    if (requiresPhysical) {
      if (!locationName.trim() && !venueUuid) {
        return toast.error('Add a location name or pick a venue for in-person / hybrid classes.');
      }
      const latitude = num(locationLatitude);
      const longitude = num(locationLongitude);
      if (latitude === undefined || longitude === undefined) {
        return toast.error('Add latitude and longitude for in-person / hybrid classes.');
      }
      if (latitude < -90 || latitude > 90) {
        return toast.error('Latitude must be between -90 and 90 degrees.');
      }
      if (longitude < -180 || longitude > 180) {
        return toast.error('Longitude must be between -180 and 180 degrees.');
      }
    }

    const sessionTemplates = buildSessionTemplates();
    if (sessionTemplates.length === 0) {
      return toast.error('Add at least one session — pick a day, a date, or an academic slot.');
    }
    const earliest = sessionTemplates.reduce((a, b) => (a.start_time <= b.start_time ? a : b));

    setResourceConflicts([]);
    const [offeringKind, offeringUuid] = offering.split(':');
    const resources: ClassMarketplaceJobResource[] = [
      ...(venueUuid ? [{ resource_uuid: venueUuid, quantity: 1 }] : []),
      ...equipmentUuids.map(uuid => ({ resource_uuid: uuid, quantity: 1 })),
    ];

    const apStarts = academicPeriods
      .map(p => p.startDate)
      .filter(Boolean)
      .sort();
    const apEnds = academicPeriods
      .map(p => p.endDate)
      .filter(Boolean)
      .sort();
    const academicBounds =
      mode === 'academic' && apStarts.length > 0 && apEnds.length > 0
        ? {
            academic_period_start_date: new Date(`${apStarts[0]}T00:00:00`),
            academic_period_end_date: new Date(`${apEnds[apEnds.length - 1]}T23:59:59`),
          }
        : {};

    const payload: ClassMarketplaceJobRequest = {
      organisation_uuid: organisationUuid,
      ...(offeringKind === 'program'
        ? { program_uuid: offeringUuid }
        : { course_uuid: offeringUuid }),
      title: title.trim(),
      class_visibility: 'PUBLIC',
      session_format: sessionFormat,
      default_start_time: earliest.start_time,
      default_end_time: earliest.end_time,
      location_type: delivery,
      location_name: requiresPhysical ? locationName.trim() || undefined : undefined,
      location_latitude: requiresPhysical ? num(locationLatitude) : undefined,
      location_longitude: requiresPhysical ? num(locationLongitude) : undefined,
      meeting_link: requiresLink ? meetingLink.trim() || undefined : undefined,
      max_participants: num(maxParticipants),
      allow_waitlist: allowWaitlist,
      sale_price: saleValue,
      instructor_pay: payValue,
      service_type: SERVICE_TYPE_ENUM[service],
      ...(targetGroupUuids.length > 0 ? { target_group_uuids: targetGroupUuids } : {}),
      ...(offeringKind === 'program' && programCategoryUuid
        ? { category_uuid: programCategoryUuid }
        : {}),
      remind_students: reminder.sendStudents,
      remind_instructor: reminder.sendInstructor,
      remind_via_email: reminder.email,
      remind_via_sms: reminder.sms,
      remind_via_push: reminder.push,
      class_reminder_minutes: REMINDER_MINUTES[reminder.window],
      ...(continuousReg
        ? {}
        : {
            registration_period_start_date: new Date(`${regStart}T00:00:00`),
            registration_period_end_date: new Date(`${regEnd}T23:59:59`),
          }),
      ...academicBounds,
      session_templates: sessionTemplates,
      ...(resources.length > 0 ? { resources } : {}),
    };

    if (isEditMode) {
      saveJob.mutate({ path: { jobUuid: editingJobUuid }, body: payload });
      return;
    }
    postJob.mutate({ body: payload });
  };

  return (
    <div className='mx-auto w-full max-w-[1600px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]'>
      <form onSubmit={handleSubmit} className='space-y-6'>
        <PageHeader
          title={isEditMode ? 'Edit job' : 'Post a job'}
          description={
            isEditMode
              ? 'Changing the schedule or resources releases the existing holds and re-evaluates them. If the new windows clash, nothing is saved.'
              : 'Advertise an approved course or program for instructors to apply to. The sessions you schedule here reserve your venue and equipment for those exact windows — the class itself is created once you assign an instructor.'
          }
          action={
            <div className='flex gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => router.push('/dashboard/organisation/opportunities')}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className='mr-2 size-4 animate-spin' /> : null}
                {isEditMode ? 'Save changes' : 'Post job'}
              </Button>
            </div>
          }
        />

        {!isOrgVerified ? (
          <div className='border-warning/40 bg-warning/5 rounded-lg border p-4 text-sm'>
            <div className='font-semibold'>Your organisation is not verified yet</div>
            <p className='text-muted-foreground mt-0.5 text-xs'>
              Class jobs can be drafted here, but posting stays blocked until an administrator
              verifies your organisation.
            </p>
          </div>
        ) : null}

        <OfferingPicker
          loading={loading}
          categories={categories}
          categoriesLoading={categoriesQuery.isLoading}
          programCategoryUuid={programCategoryUuid}
          onProgramCategoryChange={setProgramCategoryUuid}
          offerings={offerings}
          offering={offering}
          onOfferingChange={setOffering}
          selectedOffering={selectedOffering}
          title={title}
          showInstructor={false}
          titleLabel='Job title'
          titleHint='Auto-generated from the approved offering. This is what instructors see in the marketplace.'
        />

        <ServiceCards
          value={service}
          onChange={setService}
          rateCard={selectedOffering?.rateCard}
          delivery={delivery}
        />

        <PricingCapacity
          approvedFee={approvedFee}
          currency={selectedOffering?.rateCard?.currency}
          salePrice={salePrice}
          onSalePriceChange={handleSalePriceChange}
          instructorPay={instructorPay}
          onInstructorPayChange={handleInstructorPayChange}
          maxParticipants={maxParticipants}
          onMaxChange={setMaxParticipants}
          allowWaitlist={allowWaitlist}
          onAllowWaitlistChange={setAllowWaitlist}
          totalSessions={totalSessions}
        />

        <LocationVenue
          delivery={delivery}
          onDeliveryChange={setDelivery}
          meetingLink={meetingLink}
          onMeetingLinkChange={setMeetingLink}
          locationName={locationName}
          onLocationNameChange={setLocationName}
          venueUuid={venueUuid}
          onVenueChange={setVenueUuid}
          venueResources={venueResources}
          onlyAvailable={onlyAvailable}
          onOnlyAvailableChange={setOnlyAvailable}
          locationLatitude={locationLatitude}
          onLocationLatitudeChange={setLocationLatitude}
          locationLongitude={locationLongitude}
          onLocationLongitudeChange={setLocationLongitude}
        />

        <EquipmentTarget
          equipmentResources={equipmentResources}
          equipmentUuids={equipmentUuids}
          onEquipmentChange={setEquipmentUuids}
          organisationUuid={organisationUuid}
          targetGroupUuids={targetGroupUuids}
          onTargetGroupsChange={setTargetGroupUuids}
        />

        <ScheduleModeCards value={mode} onChange={setMode} />

        {mode === 'pick' ? (
          <PickDatesPanel
            pickedDates={pickedDates}
            onPickedDatesChange={setPickedDates}
            sortedPickedDates={sortedPickedDates}
            pickMonth={pickMonth}
            onPickMonthChange={setPickMonth}
            sessionDuration={sessionDuration}
            onSessionDurationChange={setSessionDuration}
            sessionStart={sessionStart}
            onSessionStartChange={setSessionStart}
            sessionEnd={sessionEnd}
            timezone={timezone}
            onTimezoneChange={setTimezone}
          />
        ) : mode === 'academic' ? (
          <AcademicPeriodsPanel periods={academicPeriods} onChange={setAcademicPeriods} />
        ) : (
          <StandardSchedule
            days={days}
            onDayChange={updateDay}
            repeatEvery={repeatEvery}
            onRepeatEveryChange={setRepeatEvery}
            repeatUnit={repeatUnit}
            onRepeatUnitChange={setRepeatUnit}
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
            regStart={regStart}
            onRegStartChange={setRegStart}
            regEnd={regEnd}
            onRegEndChange={setRegEnd}
            continuousReg={continuousReg}
            onContinuousRegChange={setContinuousReg}
            timezone={timezone}
            onTimezoneChange={setTimezone}
            totalSessions={totalSessions}
          />
        )}

        {continuousReg ? (
          <p className='text-muted-foreground text-xs'>
            Continuous registration leaves no closing date, so this job will never auto-expire and
            its resource holds stay in place until it is filled or cancelled.
          </p>
        ) : null}

        <ReminderOptions value={reminder} onChange={patchReminder} />

        <UpcomingSessions sessions={upcomingSessions} />

        <ResourceAvailabilityPreview
          organisationUuid={organisationUuid}
          resources={selectedResources}
          windows={previewWindows}
          excludeJobUuid={editingJobUuid || undefined}
        />

        <ResourceConflictAlert
          title='These sessions conflict with existing reservations'
          conflicts={resourceConflicts}
        />
      </form>
    </div>
  );
}
