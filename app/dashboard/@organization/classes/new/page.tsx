'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { CalendarClock, Coins, Loader2, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useOrganisation } from '@/context/organisation-context';
import { useCoursesByIds, useProgramsByIds } from '@/hooks/use-batched-lookups';
import { type ConflictItem, parseConflictError } from '@/components/resourcing/conflicts';
import { ResourceConflictAlert } from '@/components/resourcing/ResourceConflictAlert';
import { extractPage } from '@/lib/api-helpers';
import type {
  ClassMarketplaceJobRequest,
  ClassMarketplaceJobResource,
  ClassVisibilityEnum,
  LocationTypeEnum,
  OrganisationResource,
  SessionFormatEnum,
} from '@/services/client';
import { ResourceTypeEnum } from '@/services/client';
import {
  createJobMutation,
  listResourcesOptions,
  searchProgramTrainingApplicationsOptions,
  searchTrainingApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { AdminPageHeader, adminTheme, SectionCard } from '../../_components/ui';

const WEEK_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

type Repeat = 'NONE' | 'WEEKLY';

type FormState = {
  offering: string;
  title: string;
  description: string;
  classVisibility: ClassVisibilityEnum;
  sessionFormat: SessionFormatEnum;
  locationType: LocationTypeEnum;
  locationName: string;
  locationLatitude: string;
  locationLongitude: string;
  meetingLink: string;
  maxParticipants: string;
  allowWaitlist: boolean;
  trainingFee: string;
  startTime: string;
  endTime: string;
  repeat: Repeat;
  daysOfWeek: string[];
  occurrenceCount: string;
  venueResourceUuid: string;
  equipment: Array<{ resource_uuid: string; quantity: string }>;
};

const initialState: FormState = {
  offering: '',
  title: '',
  description: '',
  classVisibility: 'PUBLIC',
  sessionFormat: 'GROUP',
  locationType: 'ONLINE',
  locationName: '',
  locationLatitude: '',
  locationLongitude: '',
  meetingLink: '',
  maxParticipants: '20',
  allowWaitlist: true,
  trainingFee: '',
  startTime: '',
  endTime: '',
  repeat: 'NONE',
  daysOfWeek: [],
  occurrenceCount: '1',
  venueResourceUuid: '',
  equipment: [],
};

const num = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export default function OrganisationCreateClassPage() {
  const router = useRouter();
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';

  const [form, setForm] = useState<FormState>(initialState);
  const update = (patch: Partial<FormState>) => setForm(current => ({ ...current, ...patch }));

  // Offerings the organisation has been APPROVED to train (backend also enforces this on submit).
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

  const offerings = useMemo(
    () => [
      ...approvedCourseUuids.map(uuid => ({
        value: `course:${uuid}`,
        label: courseMap[uuid]?.name ?? `Course ${uuid.slice(0, 8)}`,
        kind: 'Course',
      })),
      ...approvedProgramUuids.map(uuid => ({
        value: `program:${uuid}`,
        label: programMap[uuid]?.title ?? `Program ${uuid.slice(0, 8)}`,
        kind: 'Program',
      })),
    ],
    [approvedCourseUuids, approvedProgramUuids, courseMap, programMap]
  );

  const approvedLoading = approvedCoursesQuery.isLoading || approvedProgramsQuery.isLoading;

  const [resourceConflicts, setResourceConflicts] = useState<ConflictItem[]>([]);
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
    () => orgResources.filter(resource => resource.resource_type === ResourceTypeEnum.VENUE),
    [orgResources]
  );
  const equipmentResources = useMemo(
    () =>
      orgResources.filter(resource => resource.resource_type === ResourceTypeEnum.EQUIPMENT_POOL),
    [orgResources]
  );

  const occurrences = form.repeat === 'WEEKLY' ? Math.max(1, num(form.occurrenceCount) ?? 1) : 1;
  const feePerSession = num(form.trainingFee);
  const totalFee = feePerSession !== undefined ? feePerSession * occurrences : undefined;

  const createClass = useMutation({
    ...createJobMutation(),
    onSuccess: () => {
      toast.success('Class posted. Instructors can now apply.');
      router.push('/dashboard/classes');
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

  const requiresPhysicalLocation =
    form.locationType === 'IN_PERSON' || form.locationType === 'HYBRID';
  const requiresMeetingLink = form.locationType === 'ONLINE' || form.locationType === 'HYBRID';

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!organisationUuid) {
      toast.error('No active organisation.');
      return;
    }
    if (!form.offering) {
      toast.error('Select an approved course or program.');
      return;
    }
    if (!form.title.trim()) {
      toast.error('Add a class title.');
      return;
    }
    if (!form.startTime || !form.endTime) {
      toast.error('Set the session start and end times.');
      return;
    }
    if (requiresPhysicalLocation && !form.locationName.trim()) {
      toast.error('Add a location name for in-person or hybrid classes.');
      return;
    }
    if (form.repeat === 'WEEKLY' && form.daysOfWeek.length === 0) {
      toast.error('Pick at least one day for a weekly class.');
      return;
    }

    setResourceConflicts([]);
    const start = new Date(form.startTime);
    const end = new Date(form.endTime);
    const [offeringKind, offeringUuid] = form.offering.split(':');

    const resources: ClassMarketplaceJobResource[] = [
      ...(form.venueResourceUuid ? [{ resource_uuid: form.venueResourceUuid, quantity: 1 }] : []),
      ...form.equipment
        .filter(entry => entry.resource_uuid)
        .map(entry => ({ resource_uuid: entry.resource_uuid, quantity: num(entry.quantity) ?? 1 })),
    ];

    const payload: ClassMarketplaceJobRequest = {
      organisation_uuid: organisationUuid,
      ...(offeringKind === 'program'
        ? { program_uuid: offeringUuid }
        : { course_uuid: offeringUuid }),
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      class_visibility: form.classVisibility,
      session_format: form.sessionFormat,
      default_start_time: start,
      default_end_time: end,
      location_type: form.locationType,
      location_name: form.locationName.trim() || undefined,
      location_latitude: requiresPhysicalLocation ? num(form.locationLatitude) : undefined,
      location_longitude: requiresPhysicalLocation ? num(form.locationLongitude) : undefined,
      meeting_link: requiresMeetingLink ? form.meetingLink.trim() || undefined : undefined,
      max_participants: num(form.maxParticipants),
      allow_waitlist: form.allowWaitlist,
      training_fee: feePerSession,
      session_templates: [
        {
          start_time: start,
          end_time: end,
          conflict_resolution: 'FAIL',
          ...(form.repeat === 'WEEKLY'
            ? {
                recurrence: {
                  recurrence_type: 'WEEKLY',
                  interval_value: 1,
                  days_of_week: form.daysOfWeek.join(','),
                  occurrence_count: occurrences,
                },
              }
            : {}),
        },
      ],
      ...(resources.length > 0 ? { resources } : {}),
    };

    createClass.mutate({ body: payload });
  };

  return (
    <div className={adminTheme.page}>
      <form onSubmit={handleSubmit} className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Create class'
          description='Build a class for a course or program your organisation is approved to offer, then post it so instructors can apply. The class belongs to your organisation.'
          actions={
            <div className='flex gap-2'>
              <Button type='button' variant='outline' onClick={() => router.push('/dashboard/classes')}>
                Cancel
              </Button>
              <Button type='submit' disabled={createClass.isPending}>
                {createClass.isPending ? (
                  <Loader2 className='mr-2 size-4 animate-spin' />
                ) : null}
                Post class
              </Button>
            </div>
          }
        />

        <SectionCard
          title='Course or program'
          description='Only courses and programs your organisation is approved to offer'
        >
          <div className='max-w-md space-y-2'>
            <Label>Approved offering</Label>
            <Select value={form.offering} onValueChange={value => update({ offering: value })}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    approvedLoading
                      ? 'Loading approved offerings…'
                      : offerings.length === 0
                        ? 'No approved offerings yet'
                        : 'Select a course or program'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {offerings.map(offering => (
                  <SelectItem key={offering.value} value={offering.value}>
                    {offering.label} · {offering.kind}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {offerings.length === 0 && !approvedLoading ? (
              <p className='text-xs text-muted-foreground'>
                Apply to train a course or program and get it approved before creating a class.
              </p>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard title='Details'>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2 sm:col-span-2'>
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={event => update({ title: event.target.value })}
                placeholder='e.g. Weekend Data Analysis Bootcamp'
              />
            </div>
            <div className='space-y-2 sm:col-span-2'>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={event => update({ description: event.target.value })}
                placeholder='What instructors and students should know about this class'
              />
            </div>
            <div className='space-y-2'>
              <Label>Visibility</Label>
              <Select
                value={form.classVisibility}
                onValueChange={value => update({ classVisibility: value as ClassVisibilityEnum })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='PUBLIC'>Public</SelectItem>
                  <SelectItem value='PRIVATE'>Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Session format</Label>
              <Select
                value={form.sessionFormat}
                onValueChange={value => update({ sessionFormat: value as SessionFormatEnum })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='GROUP'>Group</SelectItem>
                  <SelectItem value='INDIVIDUAL'>Individual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Max participants</Label>
              <Input
                type='number'
                min={1}
                value={form.maxParticipants}
                onChange={event => update({ maxParticipants: event.target.value })}
              />
            </div>
            <div className='flex items-center gap-2 pt-8'>
              <Checkbox
                id='allow-waitlist'
                checked={form.allowWaitlist}
                onCheckedChange={checked => update({ allowWaitlist: checked === true })}
              />
              <Label htmlFor='allow-waitlist' className='font-normal'>
                Allow waitlist
              </Label>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title={
            <span className='flex items-center gap-2'>
              <MapPin className='size-4' /> Location
            </span>
          }
        >
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label>Delivery</Label>
              <Select
                value={form.locationType}
                onValueChange={value => update({ locationType: value as LocationTypeEnum })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='ONLINE'>Online</SelectItem>
                  <SelectItem value='IN_PERSON'>In person</SelectItem>
                  <SelectItem value='HYBRID'>Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {requiresMeetingLink ? (
              <div className='space-y-2'>
                <Label>Meeting link</Label>
                <Input
                  value={form.meetingLink}
                  onChange={event => update({ meetingLink: event.target.value })}
                  placeholder='https://meet.…'
                />
              </div>
            ) : null}
            {requiresPhysicalLocation ? (
              <>
                <div className='space-y-2 sm:col-span-2'>
                  <Label>Location name</Label>
                  <Input
                    value={form.locationName}
                    onChange={event => update({ locationName: event.target.value })}
                    placeholder='e.g. Nairobi Campus – Lab 2'
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Latitude</Label>
                  <Input
                    value={form.locationLatitude}
                    onChange={event => update({ locationLatitude: event.target.value })}
                    placeholder='-1.2921'
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Longitude</Label>
                  <Input
                    value={form.locationLongitude}
                    onChange={event => update({ locationLongitude: event.target.value })}
                    placeholder='36.8219'
                  />
                </div>
              </>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard
          title={
            <span className='flex items-center gap-2'>
              <CalendarClock className='size-4' /> Schedule &amp; fee
            </span>
          }
        >
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label>First session start</Label>
              <Input
                type='datetime-local'
                value={form.startTime}
                onChange={event => update({ startTime: event.target.value })}
              />
            </div>
            <div className='space-y-2'>
              <Label>First session end</Label>
              <Input
                type='datetime-local'
                value={form.endTime}
                onChange={event => update({ endTime: event.target.value })}
              />
            </div>
            <div className='space-y-2'>
              <Label>Repeat</Label>
              <Select
                value={form.repeat}
                onValueChange={value => update({ repeat: value as Repeat })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='NONE'>Single session</SelectItem>
                  <SelectItem value='WEEKLY'>Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.repeat === 'WEEKLY' ? (
              <div className='space-y-2'>
                <Label>Number of sessions</Label>
                <Input
                  type='number'
                  min={1}
                  value={form.occurrenceCount}
                  onChange={event => update({ occurrenceCount: event.target.value })}
                />
              </div>
            ) : null}
            {form.repeat === 'WEEKLY' ? (
              <div className='space-y-2 sm:col-span-2'>
                <Label>Days of week</Label>
                <div className='flex flex-wrap gap-2'>
                  {WEEK_DAYS.map(day => {
                    const active = form.daysOfWeek.includes(day);
                    return (
                      <Button
                        key={day}
                        type='button'
                        size='sm'
                        variant={active ? 'default' : 'outline'}
                        onClick={() =>
                          update({
                            daysOfWeek: active
                              ? form.daysOfWeek.filter(d => d !== day)
                              : [...form.daysOfWeek, day],
                          })
                        }
                      >
                        {day.slice(0, 3)}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ) : null}
            <div className='space-y-2'>
              <Label className='flex items-center gap-1.5'>
                <Coins className='size-3.5' /> Fee per session
              </Label>
              <Input
                type='number'
                min={0}
                step='0.01'
                value={form.trainingFee}
                onChange={event => update({ trainingFee: event.target.value })}
                placeholder='0.00'
              />
            </div>
            <div className='flex items-end'>
              <p className='text-sm text-muted-foreground'>
                {totalFee !== undefined
                  ? `${occurrences} session${occurrences > 1 ? 's' : ''} × ${feePerSession?.toLocaleString()} = `
                  : `${occurrences} session${occurrences > 1 ? 's' : ''}`}
                {totalFee !== undefined ? (
                  <span className='font-semibold text-foreground'>{totalFee.toLocaleString()}</span>
                ) : null}
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title='Venue & equipment'
          description='Reserve your registered resources for every session. They stay blocked for other postings while you recruit; posting fails with a conflict report if a slot is taken.'
        >
          <div className='grid max-w-2xl gap-4'>
            <div className='space-y-2'>
              <Label>Venue</Label>
              <Select
                value={form.venueResourceUuid || 'none'}
                onValueChange={value =>
                  update({ venueResourceUuid: value === 'none' ? '' : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='No venue' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='none'>No venue</SelectItem>
                  {venueResources.map(venue => (
                    <SelectItem key={venue.uuid} value={venue.uuid ?? ''}>
                      {venue.name}
                      {venue.seat_capacity != null ? ` · ${venue.seat_capacity} seats` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label>Equipment</Label>
              {form.equipment.map((entry, index) => (
                <div key={`${entry.resource_uuid}-${index}`} className='flex items-center gap-2'>
                  <Select
                    value={entry.resource_uuid || undefined}
                    onValueChange={value => {
                      update({
                        equipment: form.equipment.map((item, i) =>
                          i === index ? { ...item, resource_uuid: value } : item
                        ),
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Choose equipment' />
                    </SelectTrigger>
                    <SelectContent>
                      {equipmentResources.map(pool => (
                        <SelectItem key={pool.uuid} value={pool.uuid ?? ''}>
                          {pool.name}
                          {pool.total_quantity != null ? ` · ${pool.total_quantity} units` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type='number'
                    min={1}
                    className='w-24'
                    value={entry.quantity}
                    onChange={event => {
                      update({
                        equipment: form.equipment.map((item, i) =>
                          i === index ? { ...item, quantity: event.target.value } : item
                        ),
                      });
                    }}
                  />
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() =>
                      update({ equipment: form.equipment.filter((_, i) => i !== index) })
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                type='button'
                variant='outline'
                size='sm'
                disabled={equipmentResources.length === 0}
                onClick={() =>
                  update({
                    equipment: [...form.equipment, { resource_uuid: '', quantity: '1' }],
                  })
                }
              >
                Add equipment
              </Button>
              {venueResources.length === 0 && equipmentResources.length === 0 ? (
                <p className='text-muted-foreground text-xs'>
                  No bookable resources registered yet. Add venues and equipment under Resources in
                  the sidebar.
                </p>
              ) : null}
            </div>
          </div>
        </SectionCard>

        <ResourceConflictAlert
          title='These sessions conflict with existing reservations'
          conflicts={resourceConflicts}
        />
      </form>
    </div>
  );
}
