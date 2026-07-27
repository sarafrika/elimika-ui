'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOrganisation } from '@/context/organisation-context';
import { useCoursesByIds, useProgramsByIds } from '@/hooks/use-batched-lookups';
import type {
  ClassDefinition,
  ClassDefinitionUpdateRequest,
  LocationTypeEnum,
  SessionFormatEnum,
} from '@/services/client';
import {
  getClassDefinitionsForOrganisationOptions,
  getClassDefinitionsForOrganisationQueryKey,
  updateClassDefinitionMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { AdminPageHeader, adminTheme, SectionCard } from '../../_components/ui';

const SESSION_FORMATS: SessionFormatEnum[] = ['GROUP', 'INDIVIDUAL'];
const LOCATION_TYPES: LocationTypeEnum[] = ['ONLINE', 'IN_PERSON', 'HYBRID'];

const label = (value?: string) =>
  value ? value.replace(/_/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase()) : '—';

function buildUpdateBody(
  c: ClassDefinition,
  patch: Partial<ClassDefinitionUpdateRequest>
): ClassDefinitionUpdateRequest {
  return {
    title: c.title,
    description: c.description ?? undefined,
    default_instructor_uuid: c.default_instructor_uuid,
    organisation_uuid: c.organisation_uuid ?? undefined,
    course_uuid: c.course_uuid ?? undefined,
    program_uuid: c.program_uuid ?? undefined,
    training_fee: c.training_fee ?? undefined,
    class_visibility: c.class_visibility,
    session_format: c.session_format,
    default_start_time: c.default_start_time,
    default_end_time: c.default_end_time,
    location_type: c.location_type,
    location_name: c.location_name ?? undefined,
    location_latitude: c.location_latitude ?? undefined,
    location_longitude: c.location_longitude ?? undefined,
    meeting_link: c.meeting_link ?? undefined,
    max_participants: c.max_participants ?? undefined,
    allow_waitlist: c.allow_waitlist ?? undefined,
    is_active: c.is_active ?? undefined,
    class_color: c.class_color ?? undefined,
    class_reminder_minutes: c.class_reminder_minutes ?? undefined,
    ...patch,
  };
}

function FeeRow({
  classDefinition,
  offering,
  organisationUuid,
}: {
  classDefinition: ClassDefinition;
  offering: string;
  organisationUuid: string;
}) {
  const qc = useQueryClient();
  const [fee, setFee] = useState(
    classDefinition.training_fee != null ? String(classDefinition.training_fee) : ''
  );
  const [sessionFormat, setSessionFormat] = useState<SessionFormatEnum>(
    classDefinition.session_format
  );
  const [locationType, setLocationType] = useState<LocationTypeEnum>(classDefinition.location_type);

  const update = useMutation({
    ...updateClassDefinitionMutation(),
    onSuccess: () => {
      toast.success('Class fees updated');
      qc.invalidateQueries({
        queryKey: getClassDefinitionsForOrganisationQueryKey({ path: { organisationUuid } }),
      });
    },
    onError: error =>
      toast.error(error instanceof Error ? error.message : 'Unable to update class fees'),
  });

  const save = () => {
    if (!classDefinition.uuid) return;
    const trimmed = fee.trim();
    const parsed = trimmed ? Number(trimmed) : undefined;
    if (trimmed && Number.isNaN(parsed)) {
      toast.error('Enter a valid fee amount.');
      return;
    }
    update.mutate({
      path: { uuid: classDefinition.uuid },
      body: buildUpdateBody(classDefinition, {
        training_fee: parsed,
        session_format: sessionFormat,
        location_type: locationType,
      }),
    });
  };

  return (
    <div className='grid items-end gap-3 border-b border-border/40 py-4 last:border-b-0 md:grid-cols-[minmax(0,2fr)_1fr_1fr_1fr_auto]'>
      <div className='min-w-0'>
        <p className='truncate text-sm font-medium text-foreground'>{classDefinition.title}</p>
        <p className='truncate text-xs text-muted-foreground'>{offering}</p>
      </div>
      <div className='space-y-1'>
        <Label className='text-xs'>Class type</Label>
        <Select
          value={sessionFormat}
          onValueChange={value => setSessionFormat(value as SessionFormatEnum)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SESSION_FORMATS.map(v => (
              <SelectItem key={v} value={v}>
                {label(v)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className='space-y-1'>
        <Label className='text-xs'>Method</Label>
        <Select value={locationType} onValueChange={value => setLocationType(value as LocationTypeEnum)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LOCATION_TYPES.map(v => (
              <SelectItem key={v} value={v}>
                {label(v)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className='space-y-1'>
        <Label className='text-xs'>Fee / session</Label>
        <Input
          type='number'
          min={0}
          step='0.01'
          value={fee}
          onChange={e => setFee(e.target.value)}
          placeholder='0.00'
        />
      </div>
      <Button size='sm' onClick={save} disabled={update.isPending}>
        {update.isPending ? <Loader2 className='size-4 animate-spin' /> : 'Save'}
      </Button>
    </div>
  );
}

export default function OrganisationFeesSchedulingPage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const [courseFilter, setCourseFilter] = useState('all');

  const classesQuery = useQuery({
    ...getClassDefinitionsForOrganisationOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
  });

  const classes = useMemo(
    () =>
      (classesQuery.data?.data ?? [])
        .map(item => item.class_definition)
        .filter((c): c is ClassDefinition => Boolean(c?.uuid)),
    [classesQuery.data]
  );

  const courseIds = useMemo(() => classes.map(c => c.course_uuid ?? '').filter(Boolean), [classes]);
  const programIds = useMemo(
    () => classes.map(c => c.program_uuid ?? '').filter(Boolean),
    [classes]
  );
  const { courseMap } = useCoursesByIds(courseIds);
  const { programMap } = useProgramsByIds(programIds);

  const offeringLabel = (c: ClassDefinition) =>
    c.course_uuid
      ? (courseMap[c.course_uuid]?.name ?? 'Course')
      : c.program_uuid
        ? (programMap[c.program_uuid]?.title ?? 'Programme')
        : '—';

  const courseOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const c of classes) {
      if (c.course_uuid) seen.set(c.course_uuid, courseMap[c.course_uuid]?.name ?? 'Course');
    }
    return Array.from(seen.entries());
  }, [classes, courseMap]);

  const filtered = useMemo(
    () => (courseFilter === 'all' ? classes : classes.filter(c => c.course_uuid === courseFilter)),
    [classes, courseFilter]
  );

  return (
    <div className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Fees & scheduling'
          description='Set the per-session fee, class type and delivery method for each class.'
          actions={
            courseOptions.length > 0 ? (
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className='w-56'>
                  <SelectValue placeholder='All courses' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All courses</SelectItem>
                  {courseOptions.map(([uuid, name]) => (
                    <SelectItem key={uuid} value={uuid}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null
          }
        />

        <SectionCard title='Classes' description='Fees are charged per session'>
          {classesQuery.isLoading ? (
            <p className='text-sm text-muted-foreground'>Loading…</p>
          ) : filtered.length === 0 ? (
            <p className='text-sm text-muted-foreground'>
              No classes yet. Create a class to set its fees.
            </p>
          ) : (
            <div>
              {filtered.map(c => (
                <FeeRow
                  key={c.uuid}
                  classDefinition={c}
                  offering={offeringLabel(c)}
                  organisationUuid={organisationUuid}
                />
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
