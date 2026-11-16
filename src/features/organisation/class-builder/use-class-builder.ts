'use client';

import { useCallback, useMemo, useState } from 'react';

import {
  apiCalendarDay,
  getService,
  isPhysicalDelivery,
  type Offering,
  REMINDER_MINUTES,
  type ReminderState,
  SERVICE_TYPE_ENUM,
  type ServiceKey,
  serviceForDelivery,
  serviceFormat,
  useBranchResources,
  useOrganisationBranches,
  venueTooSmall,
  type WhereItHappensValue,
  whereItHappensBlockers,
} from '@/components/class-form';
import { useOrganisation } from '@/context/organisation-context';
import { type DeliveryMode, rateFor, type SelectableRateBasis } from '@/lib/rate-card';
import type {
  ClassDefinitionCreateRequestWritable,
  ClassMarketplaceJob,
  ClassMarketplaceJobRequest,
  ClassMarketplaceJobResource,
} from '@/services/client';
import { ResourceTypeEnum } from '@/services/client';
import { useApprovedOfferings } from './use-approved-offerings';
import { useClassSchedule } from './use-class-schedule';
import { GENERAL_SUBJECT, UNCATEGORISED, useOfferingTaxonomy } from './use-offering-taxonomy';

/** The most specific real category picked, if any. */
const categoryFor = (category: string, subject: string) =>
  subject !== GENERAL_SUBJECT ? subject : category !== UNCATEGORISED ? category : undefined;

export type Place = Omit<WhereItHappensValue, 'delivery'>;
export type MembershipPreference = 'ANY' | 'ORGANISATION_ONLY';
export type Hiring = { description: string; requirements: string; membership: MembershipPreference };

// Fields the API has that the checked-in generated client predates; drop once it is regenerated.
type HiringFields = { requirements?: string | null; membership_preference?: MembershipPreference | null };
export type HiringJob = ClassMarketplaceJob & HiringFields;
export type HiringJobRequest = ClassMarketplaceJobRequest & HiringFields;
export type ClassCreateRequest = ClassDefinitionCreateRequestWritable & {
  resources?: ClassMarketplaceJobResource[];
};

const EMPTY_PLACE: Place = { branchUuid: '', meetingLink: '', venueUuid: '', equipmentUuids: [] };
const BASES: SelectableRateBasis[] = ['per_hour', 'per_day'];


export const deliveryForService = (service: ServiceKey | null): DeliveryMode =>
  getService(service)?.online ? 'ONLINE' : 'IN_PERSON';

/** The approved basis and rate a service is priced at: per hour first, else per day. */
export function serviceRate(
  card: Offering['rateCard'] | null | undefined,
  service: ServiceKey,
  delivery: DeliveryMode
): { basis: SelectableRateBasis; rate: number } | null {
  for (const basis of BASES) {
    const rate = rateFor(card, { format: serviceFormat(service), delivery, basis });
    if (rate !== null) return { basis, rate };
  }
  return null;
}

/**
 * Everything the Create class and Post job modals share: what is taught, the service, where and
 * when, and the reminders. Each modal adds its own instructor or hiring fields on top.
 */
export function useClassBuilder({ requireOpenRegistration }: { requireOpenRegistration: boolean }) {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const approved = useApprovedOfferings(organisationUuid);
  const taxonomy = useOfferingTaxonomy(approved.offerings);
  const schedule = useClassSchedule({ requireOpenRegistration });

  const [categoryUuid, setCategoryUuid] = useState('');
  const [subjectUuid, setSubjectUuid] = useState('');
  const [offering, setOffering] = useState('');
  const [service, setService] = useState<ServiceKey | null>(null);
  // Only a saved hybrid job keeps HYBRID; otherwise the service decides.
  const [savedDelivery, setSavedDelivery] = useState<DeliveryMode | null>(null);
  const [place, setPlace] = useState<Place>(EMPTY_PLACE);
  // A saved job's own seat count; otherwise the seats are prescribed, never defaulted.
  const [savedSeats, setSavedSeats] = useState<number | null>(null);
  const [allowWaitlist, setAllowWaitlist] = useState(true);
  const [savedSalePrice, setSavedSalePrice] = useState<number | null>(null);
  const [targetGroupUuids, setTargetGroupUuids] = useState<string[]>([]);
  const [reminder, setReminder] = useState<ReminderState>({
    window: '24h',
    sendStudents: true,
    sendInstructor: true,
    email: true,
    sms: false,
    push: true,
  });

  const selectedOffering = approved.offerings.find(item => item.value === offering);
  const delivery: DeliveryMode =
    savedDelivery && deliveryForService(service) !== 'ONLINE'
      ? savedDelivery
      : deliveryForService(service);
  const physical = isPhysicalDelivery(delivery);
  const pricing = service ? serviceRate(selectedOffering?.rateCard, service, delivery) : null;
  const salePrice = savedSalePrice ?? pricing?.rate ?? null;
  const currency = selectedOffering?.rateCard?.currency;

  const { branches, query: branchesQuery } = useOrganisationBranches(organisationUuid);
  const selectedBranch = branches.find(branch => branch.uuid === place.branchUuid);
  const { venues, equipment } = useBranchResources(organisationUuid, place.branchUuid);
  const selectedVenue = venues.find(venue => venue.uuid === place.venueUuid);
  const selectedEquipment = useMemo(
    () => equipment.filter(item => place.equipmentUuids.includes(item.uuid ?? '')),
    [equipment, place.equipmentUuids]
  );
  const selectedResources = useMemo(
    () => (physical ? [...(selectedVenue ? [selectedVenue] : []), ...selectedEquipment] : []),
    [physical, selectedVenue, selectedEquipment]
  );

  const subjects = categoryUuid ? taxonomy.subjectsFor(categoryUuid) : [];
  const courses = categoryUuid && subjectUuid ? taxonomy.offeringsFor(categoryUuid, subjectUuid) : [];
  const categoryName = categoryUuid ? taxonomy.nameOf(categoryUuid) : '';
  const subjectName = subjectUuid && subjectUuid !== GENERAL_SUBJECT ? taxonomy.nameOf(subjectUuid) : '';
  const title = [categoryName, subjectName].filter(Boolean).join(' — ') || selectedOffering?.label || 'New class';

  const changeCategory = (value: string) => {
    setCategoryUuid(value);
    const firstSubject = taxonomy.subjectsFor(value)[0]?.value ?? '';
    changeSubject(firstSubject, value);
  };
  const changeSubject = (value: string, inCategory = categoryUuid) => {
    setSubjectUuid(value);
    const first = value ? taxonomy.offeringsFor(inCategory, value)[0]?.value : '';
    changeOffering(first ?? '');
  };
  const changeOffering = (value: string) => {
    setOffering(value);
    setSavedSalePrice(null);
    setSavedSeats(null);
  };
  const changeService = (next: ServiceKey) => {
    setService(next);
    setSavedSalePrice(null);
    setSavedDelivery(null);
    setSavedSeats(null);
    if (getService(next)?.online) {
      setPlace(current => ({ ...current, venueUuid: '', equipmentUuids: [] }));
    }
  };

  // One-to-one services seat one learner; otherwise the course's limit, else the venue's seats.
  const individual = service ? serviceFormat(service) === 'INDIVIDUAL' : false;
  const prescribedSeats = individual
    ? 1
    : (selectedOffering?.classLimit ?? (physical ? selectedVenue?.seat_capacity : null) ?? undefined);
  const maxValue = individual ? 1 : (savedSeats ?? prescribedSeats ?? undefined);
  const seatsLabel = individual
    ? '1 seat, set by the service'
    : savedSeats != null
      ? `${savedSeats} seats, from the job`
      : selectedOffering?.classLimit != null
        ? `${selectedOffering.classLimit} seats, set by the course`
        : physical && selectedVenue?.seat_capacity != null
          ? `${selectedVenue.seat_capacity} seats, the venue's capacity`
          : 'No seat limit set by the course or venue';
  const whereValue: WhereItHappensValue = { ...place, delivery };
  const blockers = [
    !categoryUuid ? 'Category is required' : null,
    categoryUuid && !subjectUuid ? 'Subject is required' : null,
    categoryUuid && subjectUuid && courses.length === 0
      ? `No courses exist for ${title}. Pick a different subject.`
      : null,
    !selectedOffering ? 'Course is required' : null,
    !service ? 'Pick a service' : null,
    service && !pricing && savedSalePrice === null
      ? `Your rate card has no approved rate for a ${getService(service)?.title.toLowerCase()}. Add it to the course's rate card first.`
      : null,
    whereItHappensBlockers(whereValue, selectedBranch)[0] ??
      (place.branchUuid && branchesQuery.isLoading ? 'Checking the branch.' : null),
    schedule.blocker,
    physical && selectedVenue && venueTooSmall(selectedVenue, maxValue)
      ? `${selectedVenue.name} seats ${selectedVenue.seat_capacity}, fewer than ${maxValue} learners.`
      : null,
  ].filter((issue): issue is string => Boolean(issue));

  const hydrateSchedule = schedule.hydrate;
  /** Fills the form from a saved job: everything, or only its schedule. */
  const hydrateFromJob = useCallback(
    (job: ClassMarketplaceJob, scope: 'all' | 'schedule' = 'all') => {
      hydrateSchedule(job);
      if (scope === 'schedule') return;
      const value = job.course_uuid
        ? `course:${job.course_uuid}`
        : job.program_uuid
          ? `program:${job.program_uuid}`
          : '';
      const placement = taxonomy.placementOf(value);
      setCategoryUuid(placement?.categoryUuid ?? '');
      setSubjectUuid(placement?.subjectUuid ?? '');
      setOffering(value);

      const jobDelivery = (job.location_type as DeliveryMode | undefined) ?? 'IN_PERSON';
      setService(
        serviceForDelivery(jobDelivery, {
          serviceType: job.service_type,
          sessionFormat: job.session_format,
        })
      );
      setSavedDelivery(jobDelivery === 'HYBRID' ? 'HYBRID' : null);
      setSavedSalePrice(job.sale_price != null ? Number(job.sale_price) : null);

      const resources = job.resources ?? [];
      const ofType = (type: string) =>
        resources
          .filter(resource => resource.resource_type === type)
          .map(resource => resource.resource_uuid)
          .filter((uuid): uuid is string => Boolean(uuid));
      setPlace({
        branchUuid: job.branch_uuid ?? '',
        meetingLink: job.meeting_link ?? '',
        venueUuid: ofType(ResourceTypeEnum.VENUE)[0] ?? '',
        equipmentUuids: ofType(ResourceTypeEnum.EQUIPMENT_POOL),
      });
      setSavedSeats(job.max_participants != null ? Number(job.max_participants) : null);
      if (job.allow_waitlist != null) setAllowWaitlist(job.allow_waitlist);
      setTargetGroupUuids(job.target_group_uuids ?? []);

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
    },
    [hydrateSchedule, taxonomy]
  );

  /** Pre-picks a course, e.g. from a course page's "Create class". */
  const prefillOffering = useCallback(
    (value: string) => {
      const placement = taxonomy.placementOf(value);
      if (!placement) return false;
      setCategoryUuid(placement.categoryUuid);
      setSubjectUuid(placement.subjectUuid);
      setOffering(value);
      return true;
    },
    [taxonomy]
  );

  const resources = (): ClassMarketplaceJobResource[] =>
    selectedResources.map(resource => ({ resource_uuid: resource.uuid ?? '', quantity: 1 }));

  const common = () => {
    const sessionTemplates = schedule.buildSessionTemplates();
    const earliest =
      sessionTemplates.length > 0
        ? sessionTemplates.reduce((a, b) => (a.start_time <= b.start_time ? a : b))
        : { start_time: undefined as unknown as Date, end_time: undefined as unknown as Date };
    const [kind, uuid] = offering.split(':');
    const learningContext = kind === 'program' ? { program_uuid: uuid } : { course_uuid: uuid };
    return {
      sessionTemplates,
      earliest,
      learningContext,
      offeringFields:
        kind === 'program'
          ? {
              ...learningContext,
              category_uuid: categoryFor(categoryUuid, subjectUuid),
            }
          : learningContext,
    };
  };

  /** The job request; pay and hiring details come from the Post job modal. */
  const buildJobRequest = (instructorPay: number, hiring: Hiring): HiringJobRequest => {
    const { sessionTemplates, earliest, offeringFields } = common();
    const picked = resources();
    return {
      organisation_uuid: organisationUuid,
      branch_uuid: place.branchUuid,
      ...offeringFields,
      title,
      description: hiring.description.trim() || undefined,
      requirements: hiring.requirements.trim() || undefined,
      membership_preference: hiring.membership,
      class_visibility: 'PUBLIC',
      session_format: serviceFormat(service),
      service_type: service ? SERVICE_TYPE_ENUM[service] : undefined,
      default_start_time: earliest.start_time,
      default_end_time: earliest.end_time,
      location_type: delivery,
      meeting_link: physical && delivery === 'IN_PERSON' ? undefined : place.meetingLink.trim() || undefined,
      max_participants: maxValue,
      allow_waitlist: allowWaitlist,
      sale_price: salePrice ?? 0,
      instructor_pay: instructorPay,
      rate_basis: pricing?.basis ?? 'per_hour',
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
      ...(picked.length > 0 ? { resources: picked } : {}),
    } as HiringJobRequest;
  };

  /** A class taught by the picked instructor at their approved rate. */
  const buildClassRequest = (
    instructorUuid: string,
    instructorPay: number | null
  ): ClassCreateRequest => {
    const { sessionTemplates, earliest, learningContext } = common();
    const picked = resources();
    return {
      default_instructor_uuid: instructorUuid,
      organisation_uuid: organisationUuid,
      branch_uuid: place.branchUuid || undefined,
      ...learningContext,
      title,
      class_visibility: 'PUBLIC',
      session_format: serviceFormat(service),
      location_type: delivery,
      meeting_link: delivery === 'IN_PERSON' ? undefined : place.meetingLink.trim() || undefined,
      max_participants: maxValue,
      allow_waitlist: allowWaitlist,
      sale_price: salePrice ?? undefined,
      instructor_pay: instructorPay ?? undefined,
      rate_basis: pricing?.basis,
      class_reminder_minutes: REMINDER_MINUTES[reminder.window],
      registration_period_start_date: apiCalendarDay(schedule.regStart),
      registration_period_end_date: apiCalendarDay(schedule.regEnd),
      ...schedule.academicBounds(),
      default_start_time: earliest.start_time,
      default_end_time: earliest.end_time,
      session_templates: sessionTemplates,
      ...(picked.length > 0 ? { resources: picked } : {}),
    } as ClassCreateRequest;
  };

  return {
    organisationUuid,
    isOrgVerified: Boolean(organisation?.admin_verified),
    approved,
    taxonomy,
    schedule,
    categoryUuid,
    changeCategory,
    subjectUuid,
    changeSubject,
    subjects,
    courses,
    offering,
    changeOffering,
    selectedOffering,
    title,
    service,
    changeService,
    delivery,
    physical,
    pricing,
    salePrice,
    currency,
    place,
    setPlace,
    whereValue,
    selectedResources,
    maxValue,
    seatsLabel,
    allowWaitlist,
    targetGroupUuids,
    setTargetGroupUuids,
    reminder,
    setReminder,
    blockers,
    hydrateFromJob,
    prefillOffering,
    buildJobRequest,
    buildClassRequest,
  };
}

export type ClassBuilder = ReturnType<typeof useClassBuilder>;
