'use client';

import { BookOpen } from 'lucide-react';
import type { ReactNode } from 'react';

import {
  getService,
  ReminderOptions,
  type ServiceKey,
  TargetGroupPicker,
  UpcomingSessions,
  WhereItHappens,
} from '@/components/class-form';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatRate } from '@/lib/rate-card';
import { cn } from '@/lib/utils';
import { ScheduleSection } from './schedule-section';
import { type ClassBuilder, deliveryForService, serviceRate } from './use-class-builder';

const SERVICE_ORDER: ServiceKey[] = ['1on1', 'group', 'online', 'private-online'];

export function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className='flex flex-col gap-3'>
      <div>
        <h3 className='text-foreground text-sm font-semibold'>{title}</h3>
        {hint ? <p className='text-muted-foreground text-xs'>{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Picker({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  badge,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  disabled?: boolean;
  badge?: string;
}) {
  return (
    <div className='flex min-w-0 flex-col gap-1.5'>
      <Label htmlFor={id} className='flex items-center gap-2'>
        {label} *{badge ? <Badge variant='outline'>{badge}</Badge> : null}
      </Label>
      <Select value={value} onValueChange={next => {
          // Radix reports '' when its options change under it; that is not a pick.
          if (next) onChange(next);
        }} disabled={disabled || options.length === 0}>
        <SelectTrigger id={id} className='w-full'>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Category → Subject → title preview → Course, with an optional slot beside the course. */
export function OfferingSection({ builder, aside }: { builder: ClassBuilder; aside?: ReactNode }) {
  const { taxonomy, subjects, courses } = builder;
  const loading = builder.approved.loading || taxonomy.loading;

  return (
    <div className='flex flex-col gap-4'>
      <div className='grid gap-4 sm:grid-cols-2'>
        <Picker
          id='class-category'
          label='Select Category'
          value={builder.categoryUuid}
          onChange={builder.changeCategory}
          options={taxonomy.categories}
          placeholder={loading ? 'Loading…' : 'Select category'}
        />
        <Picker
          id='class-subject'
          label='Select Subject'
          value={builder.subjectUuid}
          onChange={value => builder.changeSubject(value)}
          options={subjects}
          placeholder={builder.categoryUuid ? 'Select subject' : 'Pick a category first'}
        />
      </div>

      <div className='border-border/60 bg-muted/20 rounded-md border px-3 py-2.5'>
        <p className='text-muted-foreground text-xs font-medium'>Class title</p>
        <p className='text-foreground text-sm font-semibold'>{builder.title}</p>
        <p className='text-muted-foreground text-xs'>
          Auto-generated from Category and Subject. This is what will appear on the classes list.
        </p>
      </div>

      <div className={cn('grid gap-4', aside ? 'sm:grid-cols-2' : '')}>
        <Picker
          id='class-course'
          label='Select Course'
          badge='Course'
          value={builder.offering}
          onChange={builder.changeOffering}
          options={courses.map(course => ({ value: course.value, label: course.label }))}
          placeholder={
            builder.subjectUuid && courses.length === 0
              ? `No courses for ${builder.title}`
              : 'Select course'
          }
        />
        {aside}
      </div>
    </div>
  );
}

/** The four services, each priced at the organisation's approved rate for it. */
export function ServiceSection({ builder }: { builder: ClassBuilder }) {
  const card = builder.selectedOffering?.rateCard;
  return (
    <Section title='Select Service'>
      <div role='radiogroup' className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
        {SERVICE_ORDER.map(key => {
          const service = getService(key)!;
          const priced = serviceRate(card, key, deliveryForService(key));
          const selected = builder.service === key;
          return (
            <button
              key={key}
              type='button'
              role='radio'
              aria-checked={selected}
              onClick={() => builder.changeService(key)}
              className={cn(
                'flex flex-col items-start gap-1 rounded-md border p-3 text-left transition-colors',
                selected ? 'border-primary bg-primary/5 ring-primary/30 ring-2' : 'border-border hover:bg-muted/40'
              )}
            >
              <span className='text-foreground flex items-center gap-2 text-sm font-semibold'>
                <BookOpen className='text-primary size-4' aria-hidden />
                {service.title}
              </span>
              <span className='text-muted-foreground text-xs'>({service.subtitle})</span>
              <span className='text-foreground text-sm font-medium'>
                {priced
                  ? formatRate(priced.rate, priced.basis, card?.currency)
                  : builder.selectedOffering
                    ? 'No approved rate'
                    : 'Pick a course to see the price'}
              </span>
            </button>
          );
        })}
      </div>
      {builder.service ? (
        <p className='text-muted-foreground text-xs'>Seats: {builder.seatsLabel}</p>
      ) : null}
    </Section>
  );
}

/** Location, classroom, equipment, target group, schedule, reminders and upcoming sessions. */
export function LogisticsSections({
  builder,
  excludeJobUuid,
}: {
  builder: ClassBuilder;
  excludeJobUuid?: string;
}) {
  const { schedule } = builder;
  return (
    <>
      <Section title='Location & Classroom'>
        <WhereItHappens
          organisationUuid={builder.organisationUuid}
          value={builder.whereValue}
          onChange={patch => builder.setPlace(current => ({ ...current, ...patch }))}
          maxParticipants={builder.maxValue}
        />
      </Section>

      <Section
        title='Target Group'
        hint='Pick one or more groups (e.g. Grade 1, Grade 2). Manage groups in the Groups tab.'
      >
        <TargetGroupPicker
          organisationUuid={builder.organisationUuid}
          targetGroupUuids={builder.targetGroupUuids}
          onTargetGroupsChange={builder.setTargetGroupUuids}
        />
      </Section>

      <Section title='Schedule Options'>
        <ScheduleSection
          schedule={schedule}
          organisationUuid={builder.organisationUuid}
          resources={builder.selectedResources}
          excludeJobUuid={excludeJobUuid}
        />
      </Section>

      <Section title='Reminder Options'>
        <ReminderOptions
          value={builder.reminder}
          onChange={patch => builder.setReminder(current => ({ ...current, ...patch }))}
        />
      </Section>

      <Section title={`Upcoming Sessions (${schedule.sessions.length})`}>
        <UpcomingSessions sessions={schedule.sessions} />
      </Section>
    </>
  );
}

/** The red "Resolve before publishing" box. */
export function IssuesPanel({ issues, checking }: { issues: string[]; checking?: boolean }) {
  if (issues.length === 0) return null;
  return (
    <div role='alert' className='border-destructive/50 bg-destructive/5 rounded-md border p-3 text-sm'>
      <p className='text-destructive font-semibold'>
        Resolve before publishing:{checking ? <span className='text-muted-foreground font-normal'> checking…</span> : null}
      </p>
      <ul className='text-foreground mt-1 list-disc space-y-0.5 pl-5'>
        {issues.map(issue => (
          <li key={issue}>{issue}</li>
        ))}
      </ul>
    </div>
  );
}
