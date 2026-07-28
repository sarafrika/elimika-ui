// @ts-nocheck -- 1:1 Lovable port of create-class; @hey-api generated-client type drift
'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  AcademicPeriodsPanel,
  addDays,
  type AcademicPeriod,
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
  PricingCapacity,
  REMINDER_MINUTES,
  ReminderOptions,
  type ReminderState,
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
  User,
} from '@/services/client';
import { RecurrenceTypeEnum, ResourceTypeEnum } from '@/services/client';
import {
  createJobMutation,
  getAllCategoriesOptions,
  getUsersByOrganisationAndDomainOptions,
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
        };
      }),
      ...approvedProgramUuids.map(uuid => ({
        value: `program:${uuid}`,
        label: programMap[uuid]?.title ?? `Program ${uuid.slice(0, 8)}`,
        kind: 'Program' as const,
        categoryNames: [],
        categoryUuid: programMap[uuid]?.category_uuid ?? undefined,
      })),
    ],
    [approvedCourseUuids, approvedProgramUuids, courseMap, programMap]
  );

  const [offering, setOffering] = useState('');
  useEffect(() => {
    if (offerings.length > 0 && !offerings.some(o => o.value === offering)) {
      setOffering(offerings[0].value);
    }
  }, [offerings, offering]);

  const selectedOffering = useMemo(() => offerings.find(o => o.value === offering), [offerings, offering]);

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

  const instructorsQuery = useQuery({
    ...getUsersByOrganisationAndDomainOptions({ path: { uuid: organisationUuid, domainName: 'instructor' } }),
    enabled: Boolean(organisationUuid),
  });
  const instructors = useMemo(() => extractPage<User>(instructorsQuery.data).items, [instructorsQuery.data]);
  const [instructorUuid, setInstructorUuid] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  useEffect(() => {
    if (instructors.length > 0 && !instructors.some(i => i.uuid === instructorUuid)) {
      setInstructorUuid(instructors[0].uuid ?? '');
    }
  }, [instructors, instructorUuid]);
  const selectedInstructor = instructors.find(i => i.uuid === instructorUuid);

  const orgResourcesQuery = useQuery({
    ...listResourcesOptions({ path: { organisationUuid }, query: { pageable: { page: 0, size: 100 }, active: true } }),
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

  // ── Form state ──────────────────────────────────────────────────────────────
  const [service, setService] = useState<ServiceKey>('group');
  const sessionFormat = serviceFormat(service);

  const [delivery, setDelivery] = useState<Delivery>('IN_PERSON');
  const [locationName, setLocationName] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [venueUuid, setVenueUuid] = useState('');
  const [equipmentUuids, setEquipmentUuids] = useState<string[]>([]);
  const [targetGroupUuids, setTargetGroupUuids] = useState<string[]>([]);

  const [feePerSession, setFeePerSession] = useState('');
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
  const [sessionDuration, setSessionDuration] = useState('2h');
  const [sessionStart, setSessionStart] = useState('10:00');
  const sessionEnd = sessionEndFor(sessionStart, sessionDuration);
  const sortedPickedDates = useMemo(() => [...pickedDates].sort((a, b) => a.getTime() - b.getTime()), [pickedDates]);

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
    const isoToKey: Record<number, DayKey> = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };
    const next = {} as Record<DayKey, DayRow>;
    for (const d of DAYS) next[d] = { active: false, start: sessionStart, end: sessionEnd, allDay: false };
    for (const d of sorted) next[isoToKey[d.getDay()]] = { active: true, start: sessionStart, end: sessionEnd, allDay: false };
    setDays(next);
    setStartDate(fmtDate(sorted[0]));
    setEndDate(fmtDate(sorted[sorted.length - 1]));
  }, [mode, pickedDates, sessionStart, sessionEnd]);

  useEffect(() => {
    if (mode !== 'academic' || academicPeriods.length === 0) return;
    const next = {} as Record<DayKey, DayRow>;
    for (const d of DAYS) next[d] = { active: false, start: '09:00', end: '10:00', allDay: false };
    for (const p of academicPeriods) {
      for (const s of p.slots) next[s.day] = { active: true, start: s.start, end: s.end, allDay: false };
    }
    setDays(next);
    const starts = academicPeriods.map(p => p.startDate).filter(Boolean).sort();
    const ends = academicPeriods.map(p => p.endDate).filter(Boolean).sort();
    if (starts.length) setStartDate(starts[0]);
    if (ends.length) setEndDate(ends[ends.length - 1]);
  }, [mode, academicPeriods]);

  const activeDays = useMemo(() => DAYS.filter(d => days[d].active), [days]);
  const upcomingSessions = useMemo(() => computeUpcomingSessions(startDate, endDate, days), [startDate, endDate, days]);
  const totalSessions = upcomingSessions.length;

  const updateDay = (d: DayKey, patch: Partial<DayRow>) => setDays(prev => ({ ...prev, [d]: { ...prev[d], ...patch } }));

  // ── Submit ────────────────────────────────────────────────────────────────
  const [resourceConflicts, setResourceConflicts] = useState<ConflictItem[]>([]);
  const createClass = useMutation({
    ...createJobMutation(),
    onSuccess: () => {
      toast.success('Class posted. Instructors can now apply.');
      router.push('/dashboard/organisation/classes');
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
    if (selectedOffering?.kind === 'Program' && !programCategoryUuid) {
      return toast.error('Pick the category these program classes fall under.');
    }
    const requiresPhysical = delivery === 'IN_PERSON' || delivery === 'HYBRID';
    const requiresLink = delivery === 'ONLINE' || delivery === 'HYBRID';
    if (requiresPhysical && !locationName.trim() && !venueUuid) {
      return toast.error('Add a location name or pick a venue for in-person / hybrid classes.');
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

    const apStarts = academicPeriods.map(p => p.startDate).filter(Boolean).sort();
    const apEnds = academicPeriods.map(p => p.endDate).filter(Boolean).sort();
    const academicBounds =
      mode === 'academic' && apStarts.length > 0 && apEnds.length > 0
        ? {
            academic_period_start_date: new Date(`${apStarts[0]}T00:00:00`),
            academic_period_end_date: new Date(`${apEnds[apEnds.length - 1]}T23:59:59`),
          }
        : {};

    const payload: ClassMarketplaceJobRequest = {
      organisation_uuid: organisationUuid,
      ...(offeringKind === 'program' ? { program_uuid: offeringUuid } : { course_uuid: offeringUuid }),
      title: title.trim(),
      class_visibility: 'PUBLIC',
      session_format: sessionFormat,
      default_start_time: earliest.start_time,
      default_end_time: earliest.end_time,
      location_type: delivery,
      location_name: requiresPhysical ? locationName.trim() || undefined : undefined,
      meeting_link: requiresLink ? meetingLink.trim() || undefined : undefined,
      max_participants: num(maxParticipants),
      allow_waitlist: allowWaitlist,
      training_fee: num(feePerSession),
      service_type: SERVICE_TYPE_ENUM[service],
      ...(instructorUuid ? { preferred_instructor_uuid: instructorUuid } : {}),
      ...(targetGroupUuids.length > 0 ? { target_group_uuids: targetGroupUuids } : {}),
      // Courses inherit their categories from the course record; only programs carry a choice.
      ...(offeringKind === 'program' && programCategoryUuid ? { category_uuid: programCategoryUuid } : {}),
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

    createClass.mutate({ body: payload });
  };

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-6 px-3 py-4 sm:px-5 lg:px-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <PageHeader
          title="Organisation — Create a class"
          description="Configure course, instructor, location, and schedule, then publish. Naming an instructor assigns and schedules the class immediately (on their calendar and yours); leaving it unset posts the class for instructors to apply. The class belongs to your organisation."
          action={
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.push('/dashboard/organisation/classes')}>
                Cancel
              </Button>
              <Button type="submit" disabled={createClass.isPending}>
                {createClass.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Publish Class
              </Button>
            </div>
          }
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
          instructorUuid={instructorUuid}
          onInstructorChange={setInstructorUuid}
          selectedInstructor={selectedInstructor}
          onlyAvailable={onlyAvailable}
          onOnlyAvailableChange={setOnlyAvailable}
        />

        <ServiceCards value={service} onChange={setService} />

        <PricingCapacity
          feePerSession={feePerSession}
          onFeeChange={setFeePerSession}
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

        <ReminderOptions value={reminder} onChange={patchReminder} />

        <UpcomingSessions sessions={upcomingSessions} />

        <ResourceConflictAlert
          title="These sessions conflict with existing reservations"
          conflicts={resourceConflicts}
        />
      </form>
    </div>
  );
}
