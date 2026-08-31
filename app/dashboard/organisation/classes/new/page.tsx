// @ts-nocheck -- 1:1 Lovable port of create-class; @hey-api generated-client type drift
'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  type AcademicPeriod,
  AcademicPeriodsPanel,
  type ApprovedRateCard,
  addDays,
  approvedRateFor,
  computeUpcomingSessions,
  DAY_TOKEN,
  DAYS,
  type DayKey,
  type DayRow,
  DEFAULT_DAYS,
  DEFAULT_RATE_BASIS,
  type Delivery,
  firstOccurrenceOnOrAfter,
  fmtDate,
  type InstructorOption,
  LocationVenue,
  num,
  type Offering,
  OfferingPicker,
  PickDatesPanel,
  PricingCapacity,
  type RateBasis,
  REMINDER_MINUTES,
  ReminderOptions,
  type ReminderState,
  rateBasisLabel,
  rateBasisUnit,
  type ScheduleMode,
  ScheduleModeCards,
  ServiceCards,
  type ServiceKey,
  StandardSchedule,
  serviceFormat,
  sessionMinutesFor,
  toDateTime,
  UpcomingSessions,
} from '@/components/class-form';
import { PageHeader } from '@/components/page-header';
import { type ConflictItem, parseConflictError } from '@/components/resourcing/conflicts';
import { ResourceConflictAlert } from '@/components/resourcing/ResourceConflictAlert';
import { Button } from '@/components/ui/button';
import { useOrganisation } from '@/context/organisation-context';
import { useCoursesByIds, useProgramsByIds } from '@/hooks/use-batched-lookups';
import { extractList, extractPage } from '@/lib/api-helpers';
import { toCoordinate } from '@/lib/location-types';
import { STALE_TIMES } from '@/lib/query-client';
import type {
  Category,
  ClassDefinitionCreateRequest,
  ClassSessionTemplate,
  OrganisationResource,
  OrgInstructorSummary,
} from '@/services/client';
import { RecurrenceTypeEnum, ResourceTypeEnum } from '@/services/client';
import {
  createClassDefinitionMultipartMutation,
  getAllCategoriesOptions,
  getOrganisationInstructorSummariesOptions,
  listResourcesOptions,
  searchProgramTrainingApplicationsOptions,
  searchTrainingApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';

export default function OrganisationCreateClassPage() {
  const router = useRouter();
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';

  // ── Real data: approved offerings, org instructors, bookable resources ──────
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
  // The application row carries the rate card its course creator approved — the only
  // fees this organisation may advertise the class at.
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

  const [offering, setOffering] = useState('');
  useEffect(() => {
    if (offerings.length > 0 && !offerings.some(o => o.value === offering)) {
      setOffering(offerings[0].value);
    }
  }, [offerings, offering]);

  const selectedOffering = useMemo(
    () => offerings.find(o => o.value === offering),
    [offerings, offering]
  );

  // A course brings its own categories; a program has none per class, so the org picks one.
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
    // Seed from the program's own category when it has one, else the first available.
    if (selectedOffering.categoryUuid) {
      setProgramCategoryUuid(selectedOffering.categoryUuid);
      return;
    }
    if (categories.length > 0 && !categories.some(c => c.uuid === programCategoryUuid)) {
      setProgramCategoryUuid(categories[0].uuid ?? '');
    }
  }, [selectedOffering, categories, programCategoryUuid]);

  const title = useMemo(() => selectedOffering?.label ?? 'New Class', [selectedOffering]);

  // Who may teach this class: the organisation's own instructor directory (everyone it has
  // hired or invited) narrowed to the ones the course creator approved for this offering.
  // The backend re-checks the same approval on create, so an unapproved pick is rejected —
  // the earlier list of every org user was both too wide and keyed by user uuid, while
  // `default_instructor_uuid` is matched against the instructor profile uuid.
  const [offeringKind, offeringUuid] = useMemo(() => {
    const [kind = '', uuid = ''] = offering.split(':');
    return [kind, uuid] as const;
  }, [offering]);

  const orgInstructorsQuery = useQuery({
    ...getOrganisationInstructorSummariesOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
  });
  const orgInstructors = useMemo(
    () => extractList<OrgInstructorSummary>(orgInstructorsQuery.data),
    [orgInstructorsQuery.data]
  );

  const approvedInstructorParams = {
    applicant_type_eq: 'instructor',
    status_eq: 'approved',
  };
  const courseQualifiedQuery = useQuery({
    ...searchTrainingApplicationsOptions({
      query: {
        searchParams: { ...approvedInstructorParams, course_uuid_eq: offeringUuid },
        pageable: { page: 0, size: 100 },
      },
    }),
    enabled: offeringKind === 'course' && Boolean(offeringUuid),
  });
  const programQualifiedQuery = useQuery({
    ...searchProgramTrainingApplicationsOptions({
      query: {
        searchParams: { ...approvedInstructorParams, program_uuid_eq: offeringUuid },
        pageable: { page: 0, size: 100 },
      },
    }),
    enabled: offeringKind === 'program' && Boolean(offeringUuid),
  });
  const qualifiedQuery = offeringKind === 'program' ? programQualifiedQuery : courseQualifiedQuery;
  const qualifiedInstructorUuids = useMemo(
    () =>
      new Set(
        (qualifiedQuery.data?.data?.content ?? [])
          .map(row => row.applicant_uuid)
          .filter((uuid): uuid is string => Boolean(uuid))
      ),
    [qualifiedQuery.data]
  );

  const instructors: InstructorOption[] = useMemo(
    () =>
      orgInstructors
        .filter(row => row.instructor_uuid && qualifiedInstructorUuids.has(row.instructor_uuid))
        .map(row => ({
          uuid: row.instructor_uuid as string,
          name: row.full_name || row.email || 'Instructor',
        })),
    [orgInstructors, qualifiedInstructorUuids]
  );
  const instructorsLoading = orgInstructorsQuery.isLoading || qualifiedQuery.isLoading;

  const [instructorUuid, setInstructorUuid] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  useEffect(() => {
    if (instructors.length === 0) {
      // The previous pick may not be approved for the newly selected offering.
      if (instructorUuid) setInstructorUuid('');
      return;
    }
    if (!instructors.some(i => i.uuid === instructorUuid)) {
      setInstructorUuid(instructors[0].uuid);
    }
  }, [instructors, instructorUuid]);
  const selectedInstructor = instructors.find(i => i.uuid === instructorUuid);

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

  // ── Form state ──────────────────────────────────────────────────────────────
  const [service, setService] = useState<ServiceKey>('group');
  const sessionFormat = serviceFormat(service);

  const [delivery, setDelivery] = useState<Delivery>('IN_PERSON');
  const [locationName, setLocationName] = useState('');
  const [locationLatitude, setLocationLatitude] = useState('');
  const [locationLongitude, setLocationLongitude] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [venueUuid, setVenueUuid] = useState('');

  const [rateBasis, setRateBasis] = useState<RateBasis>(DEFAULT_RATE_BASIS);
  const approvedFee = useMemo(
    () => approvedRateFor(selectedOffering?.rateCard, sessionFormat, delivery, rateBasis),
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
  const [continuousReg, setContinuousReg] = useState(true);
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
  const [sessionStart, setSessionStart] = useState('10:00');
  const [sessionEnd, setSessionEnd] = useState('12:00');
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

  // Project pick / academic selections into days+dates so the preview stays uniform.
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
      next[d] = {
        active: false,
        start: sessionStart,
        end: sessionEnd,
        allDay: false,
      };
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
    for (const d of DAYS)
      next[d] = {
        active: false,
        start: '09:00',
        end: '10:00',
        allDay: false,
      };
    for (const p of academicPeriods) {
      for (const s of p.slots)
        next[s.day] = {
          active: true,
          start: s.start,
          end: s.end,
          allDay: false,
        };
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

  const activeDays = useMemo(() => DAYS.filter(d => days[d].active), [days]);
  const upcomingSessions = useMemo(
    () => computeUpcomingSessions(startDate, endDate, days),
    [startDate, endDate, days]
  );
  const totalSessions = upcomingSessions.length;
  const totalMinutes = upcomingSessions.reduce((sum, session) => sum + (session.minutes ?? 0), 0);
  const totalDays = useMemo(
    () => new Set(upcomingSessions.map(session => session.date.toDateString())).size,
    [upcomingSessions]
  );

  const updateDay = (d: DayKey, patch: Partial<DayRow>) =>
    setDays(prev => ({ ...prev, [d]: { ...prev[d], ...patch } }));

  // ── Submit ────────────────────────────────────────────────────────────────
  const [resourceConflicts, setResourceConflicts] = useState<ConflictItem[]>([]);
  const createClass = useMutation({
    ...createClassDefinitionMultipartMutation(),
    onSuccess: response => {
      const createdClass = response?.data?.class_definition;
      const inviteParams = new URLSearchParams();
      if (createdClass?.uuid) inviteParams.set('classUuid', createdClass.uuid);
      if (createdClass?.program_uuid) {
        inviteParams.set('programUuid', createdClass.program_uuid);
      } else if (createdClass?.course_uuid) {
        inviteParams.set('courseUuid', createdClass.course_uuid);
      }
      const query = inviteParams.toString();
      const invitePath = '/dashboard/organisation/invite-students';
      toast.success('Class created and scheduled.', {
        description: 'Add recipients to share it with students.',
      });
      router.push(query ? `${invitePath}?${query}` : invitePath);
    },
    onError: error => {
      const report = parseConflictError(error);
      if (report) {
        setResourceConflicts(report.conflicts);
        toast.error(report.message);
        return;
      }
      toast.error(error instanceof Error ? error.message : 'Unable to create the class.');
    },
  });

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
    // standard
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
    if (!offering) return toast.error('Select an approved course or program.');
    if (!instructorUuid) {
      return toast.error(
        instructors.length === 0
          ? 'None of your instructors are approved to deliver this offering yet. Post a job to recruit one.'
          : 'Pick the instructor who will teach this class. To advertise it instead, post a job.'
      );
    }
    if (selectedOffering?.kind === 'Program' && !programCategoryUuid) {
      return toast.error('Pick the category these program classes fall under.');
    }
    if (approvedFee === undefined) {
      return toast.error(
        `The course creator has not approved a ${rateBasisLabel(rateBasis).toLowerCase()} rate for this session format and delivery mode.`
      );
    }
    const saleValue = num(salePrice);
    const payValue = num(instructorPay);
    if (saleValue === undefined || saleValue < 0) {
      return toast.error(
        `Enter the sale price learners are charged per ${rateBasisUnit(rateBasis)}.`
      );
    }
    if (payValue === undefined || payValue < 0) {
      return toast.error(`Enter the pay the instructor receives per ${rateBasisUnit(rateBasis)}.`);
    }
    if (payValue > saleValue) {
      return toast.error('Instructor pay cannot exceed the sale price.');
    }
    const requiresPhysical = delivery === 'IN_PERSON' || delivery === 'HYBRID';
    const requiresLink = delivery === 'ONLINE' || delivery === 'HYBRID';
    if (requiresPhysical && !locationName.trim() && !venueUuid) {
      return toast.error('Add a location name or pick a venue for in-person / hybrid classes.');
    }
    if (mode === 'pick' && sessionMinutesFor(sessionStart, sessionEnd) === undefined) {
      return toast.error('The session end time must be after the start time.');
    }
    if (
      mode === 'standard' &&
      activeDays.some(
        day => !days[day].allDay && sessionMinutesFor(days[day].start, days[day].end) === undefined
      )
    ) {
      return toast.error('Every active class day must end after it starts.');
    }
    if (
      mode === 'academic' &&
      academicPeriods.some(period =>
        period.slots.some(slot => sessionMinutesFor(slot.start, slot.end) === undefined)
      )
    ) {
      return toast.error('Every academic slot must end after it starts.');
    }

    const sessionTemplates = buildSessionTemplates();
    if (sessionTemplates.length === 0) {
      return toast.error('Add at least one session — pick a day, a date, or an academic slot.');
    }
    const earliest = sessionTemplates.reduce((a, b) => (a.start_time <= b.start_time ? a : b));

    setResourceConflicts([]);

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

    const payload: ClassDefinitionCreateRequest = {
      organisation_uuid: organisationUuid,
      default_instructor_uuid: instructorUuid,
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
      location_latitude: requiresPhysical ? toCoordinate(locationLatitude) : undefined,
      location_longitude: requiresPhysical ? toCoordinate(locationLongitude) : undefined,
      meeting_link: requiresLink ? meetingLink.trim() || undefined : undefined,
      max_participants: num(maxParticipants),
      allow_waitlist: allowWaitlist,
      sale_price: saleValue,
      instructor_pay: payValue,
      rate_basis: rateBasis,
      class_reminder_minutes: REMINDER_MINUTES[reminder.window],
      ...(continuousReg
        ? {}
        : {
            registration_period_start_date: new Date(`${regStart}T00:00:00`),
            registration_period_end_date: new Date(`${regEnd}T23:59:59`),
          }),
      ...academicBounds,
      session_templates: sessionTemplates,
    };

    createClass.mutate({ body: payload, query: { formFields: {} } });
  };

  return (
    <div className='mx-auto w-full max-w-[1200px] space-y-6 px-3 py-4 sm:px-5 lg:px-6'>
      <form onSubmit={handleSubmit} className='space-y-6'>
        <PageHeader
          title='Create a class'
          description='For an offering you already have an instructor for. The class is scheduled immediately on their calendar and yours. To advertise an opening instead, post a job — resources are reserved there, and the class is created once the job is filled.'
        />

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
          instructors={instructors}
          instructorsLoading={instructorsLoading}
          instructorEmptyHint='No hired instructor is approved to deliver this offering yet — post a job to recruit one.'
          instructorUuid={instructorUuid}
          onInstructorChange={setInstructorUuid}
          selectedInstructor={selectedInstructor}
          onlyAvailable={onlyAvailable}
          onOnlyAvailableChange={setOnlyAvailable}
        />

        <ServiceCards
          value={service}
          onChange={setService}
          rateCard={selectedOffering?.rateCard}
          delivery={delivery}
          rateBasis={rateBasis}
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
          totalMinutes={totalMinutes}
          totalDays={totalDays}
          rateBasis={rateBasis}
          onRateBasisChange={setRateBasis}
        />

        <LocationVenue
          delivery={delivery}
          onDeliveryChange={setDelivery}
          meetingLink={meetingLink}
          onMeetingLinkChange={setMeetingLink}
          locationName={locationName}
          onLocationNameChange={setLocationName}
          locationLatitude={locationLatitude}
          onLocationLatitudeChange={setLocationLatitude}
          locationLongitude={locationLongitude}
          onLocationLongitudeChange={setLocationLongitude}
          venueUuid={venueUuid}
          onVenueChange={setVenueUuid}
          venueResources={venueResources}
          onlyAvailable={onlyAvailable}
          onOnlyAvailableChange={setOnlyAvailable}
          showVenue={false}
        />

        <ScheduleModeCards value={mode} onChange={setMode} />

        {mode === 'pick' ? (
          <PickDatesPanel
            pickedDates={pickedDates}
            onPickedDatesChange={setPickedDates}
            sortedPickedDates={sortedPickedDates}
            pickMonth={pickMonth}
            onPickMonthChange={setPickMonth}
            sessionStart={sessionStart}
            onSessionStartChange={setSessionStart}
            sessionEnd={sessionEnd}
            onSessionEndChange={setSessionEnd}
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

        <ReminderOptions value={reminder} onChange={patchReminder} />

        <UpcomingSessions sessions={upcomingSessions} />

        <ResourceConflictAlert
          title='These sessions conflict with existing reservations'
          conflicts={resourceConflicts}
        />

        <div className='border-border/70 flex flex-wrap justify-end gap-2 border-t pt-4'>
          <Button
            type='button'
            variant='outline'
            onClick={() => router.push('/dashboard/organisation/classes')}
          >
            Cancel
          </Button>
          <Button type='submit' disabled={createClass.isPending}>
            {createClass.isPending ? <Loader2 className='mr-2 size-4 animate-spin' /> : null}
            Publish Class
          </Button>
        </div>
      </form>
    </div>
  );
}
