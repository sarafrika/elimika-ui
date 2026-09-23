'use client';

import { useEffect, useMemo, useState } from 'react';

import { SectionCard, StatusBadge, surfaceTheme } from '@/components/data-display';
import HTMLTextPreview from '@/components/editors/html-text-preview';
import { PageHeader } from '@/components/page-header';
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
import { Skeleton } from '@/components/ui/skeleton';
import { absoluteDateTime, relativeTimeFromNow } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { NotificationDto, Organisation } from '@/services/client';
import { ConfirmDialog } from '../components/confirm-dialog';
import { FormSheet } from '../components/form-sheet';
import { NoteField, noteToPlainText } from '../components/note-field';
import { SectionBoundary } from '../components/section-boundary';
import {
  NOTIFICATIONS_PAGE_SIZE,
  useAdminNotifications,
  useMarkAllRead,
  useNotificationAction,
  useNotificationCounts,
  useSendAnnouncement,
  useSentAnnouncements,
  type NotificationTab,
} from '../hooks/use-admin-notifications';
import { useOrganisations } from '../hooks/use-organisations';
import { enumParam, numberParam, stringParam } from '../state/search-state';
import { useSearchState } from '../state/use-search-state';

const TABS: { id: NotificationTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'archived', label: 'Archived' },
];

const tabParam = enumParam<NotificationTab>(
  TABS.map(tab => tab.id),
  'all'
);
const pageParam = numberParam(0);
const typeParam = stringParam('');

/** The only types that reach an admin, because none is addressed to the admin domain. */
const ADMIN_VISIBLE_TYPES = [
  'ACCOUNT_CREATED',
  'SECURITY_ALERT',
  'PASSWORD_RESET_REQUEST',
  'ORDER_PAYMENT_RECEIPT',
  'PROFILE_DOCUMENT_VERIFIED',
  'ORGANISATION_ANNOUNCEMENT',
];

const AUDIENCES = [
  { value: 'all', label: 'Everyone' },
  { value: 'students', label: 'Students' },
  { value: 'instructors', label: 'Instructors' },
  { value: 'parents', label: 'Parents' },
  { value: 'staff', label: 'Staff' },
];

const MIN_MESSAGE = 10;

const priorityTone = (priority?: string) => {
  if (priority === 'CRITICAL' || priority === 'HIGH') return 'warning' as const;
  return 'neutral' as const;
};

export function AdminNotificationsPage() {
  const [tab, setTab] = useSearchState<NotificationTab>('tab', tabParam);
  const [page, setPage] = useSearchState<number>('page', pageParam);
  const [type, setType] = useSearchState<string>('type', typeParam);
  const [announceOpen, setAnnounceOpen] = useState(false);

  const { notifications, totalRows, pageCount, query } = useAdminNotifications(tab, page, type);
  const { counts } = useNotificationCounts();
  const { apply, isPending: isActing } = useNotificationAction();
  const { markAllRead, isPending: isMarkingAll } = useMarkAllRead();

  const [pendingAction, setPendingAction] = useState<{
    notification: NotificationDto;
    action: 'read' | 'archive';
  } | null>(null);
  const [markAllOpen, setMarkAllOpen] = useState(false);

  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <PageHeader
          eyebrow='Notifications'
          title='Your inbox'
          description={`${counts.unread} unread. Announcements you send to an organisation are below.`}
          actions={
            <div className='flex flex-wrap gap-2'>
              <Button
                variant='outline'
                className='rounded-md'
                disabled={counts.unread === 0}
                onClick={() => setMarkAllOpen(true)}
              >
                Mark all read
              </Button>
              <Button className='rounded-md' onClick={() => setAnnounceOpen(true)}>
                Send an announcement
              </Button>
            </div>
          }
        />

        <div className='flex flex-wrap items-center gap-3'>
          <div className='border-border/70 flex gap-6 overflow-x-auto border-b'>
            {TABS.map(entry => {
              const isActive = entry.id === tab;
              return (
                <button
                  key={entry.id}
                  type='button'
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => {
                    setTab(entry.id);
                    setPage(0);
                  }}
                  className={cn(
                    '-mb-px flex h-11 shrink-0 items-center gap-2 border-b-2 text-sm whitespace-nowrap transition-colors',
                    isActive
                      ? 'border-primary text-primary font-semibold'
                      : 'text-muted-foreground hover:text-foreground border-transparent font-medium'
                  )}
                >
                  {entry.label}
                  {entry.id === 'unread' && counts.unread > 0 ? (
                    <span className='bg-primary text-primary-foreground flex h-5 min-w-5 items-center justify-center rounded-sm px-1.5 font-mono text-[11px]'>
                      {counts.unread}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <Select
            value={type || 'any'}
            onValueChange={value => {
              setType(value === 'any' ? '' : value);
              setPage(0);
            }}
          >
            <SelectTrigger className='border-border/70 ml-auto h-9 w-auto min-w-[220px] rounded-md'>
              <SelectValue placeholder='Type' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='any'>Type: any</SelectItem>
              {ADMIN_VISIBLE_TYPES.map(entry => (
                <SelectItem key={entry} value={entry}>
                  {entry.replace(/_/g, ' ').toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <SectionCard bodyClassName='p-0'>
          <SectionBoundary
            label='your notifications'
            loading={query.isLoading && !query.data}
            error={query.error}
            empty={!query.isLoading && notifications.length === 0}
            onRetry={query.refetch}
            emptyTitle={tab === 'unread' ? 'Nothing unread' : 'Nothing here'}
            emptyDescription='New notifications appear here within a minute.'
            skeleton={
              <div className='space-y-2 p-4'>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className='h-16 w-full' />
                ))}
              </div>
            }
          >
            <ul className='divide-border/60 divide-y'>
              {notifications.map(notification => (
                <li key={notification.uuid} className='flex flex-wrap items-start gap-3 p-4'>
                  <div className='min-w-0 flex-1 space-y-1'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <p className='text-foreground text-sm font-semibold'>
                        {notification.title ?? 'Notification'}
                      </p>
                      {notification.status === 'UNREAD' ? (
                        <StatusBadge tone='info' label='Unread' />
                      ) : null}
                      {notification.category ? (
                        <StatusBadge
                          tone='neutral'
                          label={String(notification.category).replace(/_/g, ' ').toLowerCase()}
                        />
                      ) : null}
                      {notification.priority && notification.priority !== 'NORMAL' ? (
                        <StatusBadge
                          tone={priorityTone(notification.priority)}
                          label={String(notification.priority).toLowerCase()}
                        />
                      ) : null}
                    </div>
                    {notification.body ? (
                      <p className='text-muted-foreground text-sm'>{notification.body}</p>
                    ) : null}
                    {notification.action_url ? (
                      <a
                        href={notification.action_url}
                        className='text-primary inline-block text-xs font-medium hover:underline'
                      >
                        Open what this is about
                      </a>
                    ) : null}
                  </div>

                  <span
                    className='text-muted-foreground font-mono text-xs whitespace-nowrap'
                    title={absoluteDateTime(notification.occurred_at, '')}
                  >
                    {relativeTimeFromNow(notification.occurred_at, '—')}
                  </span>

                  <div className='flex gap-2'>
                    {notification.status === 'UNREAD' ? (
                      <Button
                        variant='outline'
                        size='sm'
                        className='rounded-md'
                        onClick={() => setPendingAction({ notification, action: 'read' })}
                      >
                        Mark read
                      </Button>
                    ) : null}
                    {notification.status !== 'ARCHIVED' ? (
                      <Button
                        variant='outline'
                        size='sm'
                        className='rounded-md'
                        onClick={() => setPendingAction({ notification, action: 'archive' })}
                      >
                        Archive
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </SectionBoundary>

          <div className='border-border/60 text-muted-foreground flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-sm'>
            <span>
              Page {page + 1} of {Math.max(pageCount, 1)} · {totalRows} in total
            </span>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                className='rounded-md'
                disabled={page <= 0}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant='outline'
                size='sm'
                className='rounded-md'
                disabled={page + 1 >= pageCount || notifications.length < NOTIFICATIONS_PAGE_SIZE}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </SectionCard>

        <SectionCard title='What reaches you here'>
          <ul className='text-muted-foreground space-y-2 text-sm'>
            <li>
              No notification type is addressed to admins, so only the ones with no recipient
              domain arrive: account created, security alerts, password resets, order receipts,
              verified documents and organisation announcements.
            </li>
            <li>
              Nothing announces the review queues — another admin clearing an item is not sent to
              you. That is a backend gap, not a setting.
            </li>
            <li>Archiving is one-way: there is no unarchive and no delete in the API.</li>
          </ul>
        </SectionCard>
      </div>

      <AnnouncementSheet open={announceOpen} onOpenChange={setAnnounceOpen} />

      {pendingAction ? (
        <ConfirmDialog
          open
          onOpenChange={value => {
            if (!value) setPendingAction(null);
          }}
          action={
            pendingAction.action === 'archive' ? 'archiveNotification' : 'markNotificationRead'
          }
          subject={{ name: pendingAction.notification.title ?? 'this notification' }}
          isPending={isActing}
          onConfirm={() =>
            apply(
              {
                uuid: pendingAction.notification.uuid ?? '',
                action: pendingAction.action,
                title: pendingAction.notification.title,
              },
              () => setPendingAction(null)
            )
          }
        />
      ) : null}

      {markAllOpen ? (
        <ConfirmDialog
          open
          onOpenChange={value => {
            if (!value) setMarkAllOpen(false);
          }}
          action='markAllNotificationsRead'
          subject={{ name: 'your inbox' }}
          isPending={isMarkingAll}
          onConfirm={() => markAllRead(() => setMarkAllOpen(false))}
        />
      ) : null}
    </div>
  );
}

function AnnouncementSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [organisation, setOrganisation] = useState<Organisation | null>(null);
  const [audience, setAudience] = useState('all');
  const [channel, setChannel] = useState('in-app');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [confirming, setConfirming] = useState(false);

  const { organisations, query } = useOrganisations({ q: debounced, page: 0 });
  const { send, isPending } = useSendAnnouncement();
  const sent = useSentAnnouncements(organisation?.uuid);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (open) return;
    setSearch('');
    setDebounced('');
    setOrganisation(null);
    setAudience('all');
    setChannel('in-app');
    setTitle('');
    setMessage('');
    setConfirming(false);
  }, [open]);

  const enoughMessage = noteToPlainText(message).length >= MIN_MESSAGE;
  const canSubmit = Boolean(organisation?.uuid) && title.trim().length > 0 && enoughMessage;
  const audienceLabel = useMemo(
    () => AUDIENCES.find(entry => entry.value === audience)?.label.toLowerCase() ?? audience,
    [audience]
  );

  return (
    <>
      <FormSheet
        open={open}
        onOpenChange={onOpenChange}
        title='Send an organisation announcement'
        description='The API sends per organisation; there is no platform-wide broadcast.'
        isDirty={Boolean(organisation || title || message)}
        isPending={isPending}
        submitLabel='Review and send'
        width='wide'
        onSubmit={() => {
          if (canSubmit) setConfirming(true);
        }}
      >
        <div className='space-y-1.5'>
          <Label htmlFor='announce-org' className='text-sm font-semibold'>
            Organisation<span className='text-destructive ml-0.5'>*</span>
          </Label>
          <Input
            id='announce-org'
            value={search}
            onChange={event => {
              setSearch(event.target.value);
              setOrganisation(null);
            }}
            placeholder='Search organisations…'
            className='rounded-md'
            autoComplete='off'
          />
          {organisation ? (
            <p className='text-muted-foreground text-xs'>
              Selected:{' '}
              <span className='text-foreground font-medium'>{organisation.name}</span>
            </p>
          ) : null}
        </div>

        {!organisation ? (
          <div className='border-border/70 max-h-56 overflow-y-auto rounded-md border'>
            <SectionBoundary
              label='organisations'
              loading={query.isLoading && !query.data}
              error={query.error}
              empty={!query.isLoading && organisations.length === 0}
              emptyTitle='Nothing matches'
              emptyDescription='Try another name.'
              skeleton={
                <div className='space-y-2 p-3'>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className='h-10 w-full' />
                  ))}
                </div>
              }
            >
              <ul className='divide-border/60 divide-y'>
                {organisations.map(entry => (
                  <li key={entry.uuid}>
                    <button
                      type='button'
                      onClick={() => setOrganisation(entry)}
                      className='hover:bg-muted/40 w-full px-3 py-2 text-left transition-colors'
                    >
                      <p className='text-foreground text-sm font-medium'>{entry.name}</p>
                      <p className='text-muted-foreground font-mono text-xs'>{entry.slug}</p>
                    </button>
                  </li>
                ))}
              </ul>
            </SectionBoundary>
          </div>
        ) : null}

        <div className='grid gap-3 sm:grid-cols-2'>
          <div className='space-y-1.5'>
            <Label htmlFor='announce-audience' className='text-sm font-semibold'>
              Audience
            </Label>
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger id='announce-audience' className='h-9 rounded-md'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUDIENCES.map(entry => (
                  <SelectItem key={entry.value} value={entry.value}>
                    {entry.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='announce-channel' className='text-sm font-semibold'>
              Channel
            </Label>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger id='announce-channel' className='h-9 rounded-md'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='in-app'>In-app only</SelectItem>
                <SelectItem value='email'>Email and in-app</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className='space-y-1.5'>
          <Label htmlFor='announce-title' className='text-sm font-semibold'>
            Title<span className='text-destructive ml-0.5'>*</span>
          </Label>
          <Input
            id='announce-title'
            value={title}
            maxLength={200}
            onChange={event => setTitle(event.target.value)}
            className='rounded-md'
          />
        </div>

        <NoteField
          id='announce-message'
          label='Message'
          required
          value={message}
          onChange={setMessage}
          helper='Reaches each recipient’s inbox, and their email when you chose email.'
          error={
            message && !enoughMessage
              ? `Say a little more — at least ${MIN_MESSAGE} characters.`
              : undefined
          }
        />

        {sent.enabled ? (
          <div className='space-y-2'>
            <p className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
              Already sent to this organisation
            </p>
            <SectionBoundary
              label='sent history'
              loading={sent.query.isLoading && !sent.query.data}
              error={sent.query.error}
              empty={!sent.query.isLoading && sent.dispatches.length === 0}
              emptyTitle='Nothing sent yet'
              emptyDescription='Announcements you send appear here.'
              skeleton={<Skeleton className='h-16 w-full' />}
            >
              <ul className='divide-border/60 divide-y text-sm'>
                {sent.dispatches.map(dispatch => (
                  <li key={dispatch.uuid} className='flex items-start justify-between gap-3 py-2'>
                    <div className='min-w-0'>
                      <p className='text-foreground truncate font-medium'>{dispatch.title}</p>
                      <p className='text-muted-foreground text-xs'>
                        {dispatch.audience} · {dispatch.channel} · reached{' '}
                        {dispatch.recipient_count ?? 0}
                      </p>
                    </div>
                    <span className='text-muted-foreground font-mono text-xs whitespace-nowrap'>
                      {relativeTimeFromNow(dispatch.created_date, '—')}
                    </span>
                  </li>
                ))}
              </ul>
            </SectionBoundary>
          </div>
        ) : null}
      </FormSheet>

      {confirming && organisation ? (
        <ConfirmDialog
          open
          onOpenChange={value => {
            if (!value) setConfirming(false);
          }}
          action='sendOrganisationAnnouncement'
          subject={{ name: organisation.name ?? 'this organisation', detail: audienceLabel }}
          isPending={isPending}
          onConfirm={() =>
            send(
              {
                organisationUuid: organisation.uuid ?? '',
                organisationName: organisation.name ?? 'the organisation',
                audience,
                channel,
                title: title.trim(),
                message,
              },
              () => {
                setConfirming(false);
                onOpenChange(false);
              }
            )
          }
        >
          <div className='border-border/60 space-y-2 rounded-md border p-3'>
            <p className='text-foreground text-sm font-semibold'>{title}</p>
            <HTMLTextPreview htmlContent={message} className='text-muted-foreground text-sm' />
          </div>
        </ConfirmDialog>
      ) : null}
    </>
  );
}
