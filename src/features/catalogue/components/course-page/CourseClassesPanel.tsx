'use client';

import { CalendarDays, CalendarX, MapPin, MonitorPlay } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  availabilityChip,
  CLASS_FILTER_LABELS,
  CLASS_FILTERS,
  type ClassFilter,
  classDatesLabel,
  classFeeLabel,
  classFilterCounts,
  classPlace,
  filterOpenClasses,
  formatDay,
  LOCATION_TYPE_LABELS,
  SESSION_FORMAT_LABELS,
} from '@/src/features/catalogue/course-page';
import type { CourseOpenClasses, OpenClassSummary } from '@/src/features/catalogue/open-classes';
import { classEnrolHref, SeeClassesAction, SignInOrLink } from './course-actions';

const CLASS_GRID =
  'grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,380px),1fr))]';

type ClassesPanelProps = {
  courseUuid: string;
  courseTitle: string;
  signedIn: boolean;
  offer: CourseOpenClasses | undefined;
  loading: boolean;
  error: boolean;
  retry: () => void;
};

/** The open classes of the course, cheapest first, with the in-person / online split. */
export function CourseClassesPanel({
  courseUuid,
  courseTitle,
  signedIn,
  offer,
  loading,
  error,
  retry,
}: ClassesPanelProps) {
  const [filter, setFilter] = useState<ClassFilter>('all');
  const [openUuid, setOpenUuid] = useState<string | null>(null);
  const classes = offer?.classes ?? [];
  const counts = useMemo(() => classFilterCounts(classes), [classes]);
  const listed = useMemo(() => filterOpenClasses(classes, filter), [classes, filter]);
  const openListed = listed.filter(item => item.availability !== 'FULL').length;
  const opened = classes.find(item => item.uuid === openUuid) ?? null;

  if (loading) {
    return (
      <div className={CLASS_GRID} aria-busy='true'>
        {[0, 1, 2].map(cell => (
          <Skeleton key={cell} className='h-[230px] w-full rounded-2xl' />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        variant='card'
        title='The open classes could not be loaded'
        description='This does not affect the course itself.'
        action={
          <Button variant='outline' onClick={retry}>
            Try again
          </Button>
        }
      />
    );
  }

  if (classes.length === 0) {
    return (
      <EmptyState
        variant='card'
        icon={CalendarX}
        title='No open classes yet'
        description='Training providers schedule classes for this course, each with its own fee, place and dates. None is taking enrolments right now.'
        action={
          <SeeClassesAction
            courseUuid={courseUuid}
            title={courseTitle}
            signedIn={signedIn}
            variant='outline'
          />
        }
      />
    );
  }

  return (
    <div className='flex flex-col gap-3.5'>
      <div className='flex flex-wrap items-center gap-2.5'>
        <span className='text-muted-foreground grow text-sm' aria-live='polite'>
          <b className='text-foreground'>{openListed}</b>{' '}
          {openListed === 1 ? 'open class' : 'open classes'}, cheapest first
          {listed.length > openListed ? `; ${listed.length - openListed} full` : ''}
        </span>
        <div role='group' aria-label='Class format' className='flex flex-wrap gap-2'>
          {CLASS_FILTERS.map(option => {
            const active = option === filter;
            return (
              <Button
                key={option}
                type='button'
                variant='outline'
                size='sm'
                aria-pressed={active}
                onClick={() => setFilter(option)}
                className={cn(
                  'h-[34px] rounded-full px-3 text-[13px] shadow-none',
                  active &&
                    'border-primary/30 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary font-semibold'
                )}
              >
                {CLASS_FILTER_LABELS[option]} · {counts[option]}
              </Button>
            );
          })}
        </div>
      </div>

      {listed.length === 0 ? (
        <EmptyState
          variant='card'
          title={`No ${CLASS_FILTER_LABELS[filter].toLowerCase()} classes`}
          description='Try another format.'
          action={
            <Button variant='outline' onClick={() => setFilter('all')}>
              Show all classes
            </Button>
          }
        />
      ) : (
        <ul className={CLASS_GRID}>
          {listed.map(item => (
            <li key={item.uuid} className='min-w-0'>
              <ClassCard
                item={item}
                courseUuid={courseUuid}
                signedIn={signedIn}
                onDetails={() => setOpenUuid(item.uuid)}
              />
            </li>
          ))}
        </ul>
      )}

      <ClassDetailsSheet
        item={opened}
        courseUuid={courseUuid}
        signedIn={signedIn}
        onClose={() => setOpenUuid(null)}
      />
    </div>
  );
}

const AVAILABILITY_TONE = {
  neutral: 'bg-muted text-foreground',
  warning: 'bg-warning/10 text-warning',
  muted: 'bg-muted text-muted-foreground',
} as const;

function FormatChips({ item }: { item: OpenClassSummary }) {
  const formats: string[] = [];
  if (item.location_type) formats.push(LOCATION_TYPE_LABELS[item.location_type]);
  if (item.session_format) formats.push(SESSION_FORMAT_LABELS[item.session_format]);
  const availability = availabilityChip(item);
  if (formats.length === 0 && !availability) return null;
  return (
    <ul className='flex flex-wrap gap-1.5' aria-label='Format and availability'>
      {formats.map(chip => (
        <li
          key={chip}
          className='bg-muted inline-flex h-6 items-center rounded-md px-2 text-xs font-medium'
        >
          {chip}
        </li>
      ))}
      {availability ? (
        <li
          className={cn(
            'inline-flex h-6 items-center rounded-md px-2 text-xs font-medium',
            AVAILABILITY_TONE[availability.tone]
          )}
        >
          {availability.label}
        </li>
      ) : null}
    </ul>
  );
}

function EnrolAction({
  item,
  courseUuid,
  signedIn,
  className,
}: {
  item: OpenClassSummary;
  courseUuid: string;
  signedIn: boolean;
  className?: string;
}) {
  if (item.availability === 'FULL') {
    return (
      <Button disabled className={className}>
        Class full
      </Button>
    );
  }
  return (
    <SignInOrLink
      href={classEnrolHref(courseUuid, item.uuid)}
      signIn={!signedIn}
      label={signedIn ? `Enrol in ${classPlace(item)}` : `Sign in to enrol in ${classPlace(item)}`}
      className={className}
    >
      Enrol
    </SignInOrLink>
  );
}

function ClassCard({
  item,
  courseUuid,
  signedIn,
  onDetails,
}: {
  item: OpenClassSummary;
  courseUuid: string;
  signedIn: boolean;
  onDetails: () => void;
}) {
  const place = classPlace(item);
  const area = [item.area, item.branch_name && item.branch_name !== place ? item.branch_name : null]
    .filter(Boolean)
    .join(' · ');
  const fee = classFeeLabel(item);
  const Icon = item.location_type === 'ONLINE' ? MonitorPlay : MapPin;

  return (
    <article className='bg-card flex h-full flex-col gap-3 rounded-2xl border p-[18px]'>
      <div className='flex items-start gap-3'>
        <span className='bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-[10px]'>
          <Icon className='size-[18px]' aria-hidden />
        </span>
        <div className='flex min-w-0 grow flex-col gap-0.5'>
          <h3 className='text-base font-semibold break-words'>{place}</h3>
          {area ? <span className='text-muted-foreground text-[13px]'>{area}</span> : null}
        </div>
        {fee ? (
          <span className='font-mono text-[17px] font-semibold whitespace-nowrap'>{fee}</span>
        ) : null}
      </div>
      <FormatChips item={item} />
      <span className='text-muted-foreground mt-auto flex items-center gap-2 border-t pt-2.5 text-[13px]'>
        <CalendarDays className='size-3.5 shrink-0' aria-hidden />
        {classDatesLabel(item)}
      </span>
      <div className='grid grid-cols-2 gap-2'>
        <EnrolAction
          item={item}
          courseUuid={courseUuid}
          signedIn={signedIn}
          className='h-10 rounded-[10px] font-semibold'
        />
        <Button variant='outline' className='h-10 rounded-[10px]' onClick={onDetails}>
          Class details
        </Button>
      </div>
    </article>
  );
}

function ClassDetailsSheet({
  item,
  courseUuid,
  signedIn,
  onClose,
}: {
  item: OpenClassSummary | null;
  courseUuid: string;
  signedIn: boolean;
  onClose: () => void;
}) {
  const rows: { label: string; value: string | null }[] = item
    ? [
        { label: 'Class', value: item.title ?? null },
        { label: 'Where', value: [classPlace(item), item.area].filter(Boolean).join(', ') },
        { label: 'Branch', value: item.branch_name ?? null },
        {
          label: 'Format',
          value: item.location_type ? LOCATION_TYPE_LABELS[item.location_type] : null,
        },
        {
          label: 'Sessions',
          value: item.session_format ? SESSION_FORMAT_LABELS[item.session_format] : null,
        },
        { label: 'Fee', value: classFeeLabel(item) },
        { label: 'Availability', value: availabilityChip(item)?.label ?? null },
        { label: 'Dates', value: classDatesLabel(item) },
        { label: 'Registration closes', value: formatDay(item.registration_closes_on) },
      ]
    : [];

  return (
    <Sheet open={Boolean(item)} onOpenChange={open => (open ? null : onClose())}>
      <SheetContent side='right' className='w-full gap-0 sm:max-w-md'>
        {item ? (
          <>
            <SheetHeader className='border-b px-6 py-4 pr-12'>
              <SheetTitle className='text-lg'>{classPlace(item)}</SheetTitle>
              <SheetDescription>Each class sets its own fee, place and schedule.</SheetDescription>
            </SheetHeader>
            <dl className='flex flex-col gap-3 overflow-y-auto px-6 py-5 text-sm'>
              {rows
                .filter(row => row.value)
                .map(row => (
                  <div key={row.label} className='flex items-start justify-between gap-4'>
                    <dt className='text-muted-foreground'>{row.label}</dt>
                    <dd className='text-right font-medium'>{row.value}</dd>
                  </div>
                ))}
            </dl>
            <SheetFooter className='border-t px-6 py-4'>
              <EnrolAction
                item={item}
                courseUuid={courseUuid}
                signedIn={signedIn}
                className='h-11 w-full rounded-[10px] font-semibold'
              />
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
