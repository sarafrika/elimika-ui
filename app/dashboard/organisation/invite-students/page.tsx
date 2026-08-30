'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  History,
  Loader2,
  Mail,
  MailCheck,
  RotateCw,
  Send,
  ShieldCheck,
  Users,
  UsersRound,
  X,
  XCircle,
} from 'lucide-react';
import type { ClipboardEvent, KeyboardEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { CategoryTabs, filterByCategoryTabs } from '@/components/category-tabs';
import { PageHeader } from '@/components/dashboard/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useOrganisation } from '@/context/organisation-context';
import { getErrorMessage } from '@/lib/error-utils';
import { formatCount, toNumber } from '@/lib/metrics';
import { cn } from '@/lib/utils';
import type { ClassDefinition, StudentGroup } from '@/services/client';
import {
  getClassDefinitionsForOrganisationOptions,
  getStudentSummariesQueryKey,
  getUsersByOrganisationAndDomainQueryKey,
  listGroupsOptions,
  listOrganisationInvitationsOptions,
  listOrganisationInvitationsQueryKey,
  listRosterQueryKey,
  resendOrganisationInvitationMutation,
  revokeOrganisationInvitationMutation,
  sendOrganisationInvitationsMutation,
} from '@/services/client/@tanstack/react-query.gen';

const categoryLabel = (cd: ClassDefinition) =>
  cd.location_type === 'ONLINE'
    ? 'Virtual'
    : cd.location_type === 'HYBRID'
      ? 'Hybrid'
      : 'In-Person';

/** Days an invitation stays open before it lapses. Mirrors the backend default. */
const EXPIRES_IN_DAYS = 14;

const TEMPLATES = [
  {
    id: 'warm-welcome',
    name: 'Warm welcome',
    subject: "You're invited to join {{className}} at {{schoolName}}",
    body: "Hi {{studentName}},\n\nYou're invited to join {{className}} at {{schoolName}}. We'd love to have you enroll. Use the secure link in this email to confirm your spot.\n\nSee you in class,\n{{senderName}}",
  },
  {
    id: 'cohort',
    name: 'New cohort',
    subject: 'Your seat in the new cohort is ready',
    body: 'Hello {{studentName}},\n\nA new cohort is opening at {{schoolName}} and we saved you a spot in {{className}}. Use the secure link in this email to confirm your place.\n\n{{senderName}}',
  },
  {
    id: 'reminder',
    name: 'Gentle reminder',
    subject: 'A quick reminder to join {{className}}',
    body: "Hi {{studentName}},\n\nJust a friendly nudge: your invitation to {{className}} at {{schoolName}} is still open. Use the secure link in this email whenever you're ready.\n\n{{senderName}}",
  },
] as const;

const DEFAULT_TEMPLATE = TEMPLATES[0];

type Recipient = { name: string; email: string };
type SendResult = { email: string; ok: boolean; message?: string };
type RecipientParse = { recipients: Recipient[]; invalid: string[] };

const LIVE_STATUSES = ['PENDING', 'AWAITING_GUARDIAN_CONSENT'];
const ACCEPTED_STATUSES = ['ACCEPTED'];
const EMAIL_SEPARATOR_PATTERN = /[,;\n\r]/;

/** Parses "Name <email>", "Name, email" or bare emails from free text. */
function parseRecipientInput(raw: string): RecipientParse {
  const recipients: Recipient[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();
  const emailPattern = /[^\s<>;,]+@[^\s<>;,]+\.[^\s<>;,]+/g;

  for (const line of raw.split(/[\n;]+/)) {
    const parts = line.includes('<') ? [line] : line.split(',');
    for (const part of parts) {
      const token = part.trim();
      if (!token) continue;
      const matches = Array.from(token.matchAll(emailPattern));
      if (matches.length === 0) {
        invalid.push(token);
        continue;
      }

      for (const match of matches) {
        const email = match[0].toLowerCase();
        if (seen.has(email)) continue;
        seen.add(email);
        const namePart =
          matches.length === 1 ? token.replace(match[0], '').replace(/[<>,]/g, '').trim() : '';
        recipients.push({ name: namePart, email });
      }
    }
  }

  return { recipients, invalid };
}

const STEPS = [
  { n: 1, label: 'Select classes', icon: Users },
  { n: 2, label: 'Select recipients', icon: UsersRound },
  { n: 3, label: 'Message & send', icon: Mail },
] as const;

const toggle = (arr: string[], id: string) =>
  arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id];

const uniqueStrings = (items: string[]) => Array.from(new Set(items.filter(Boolean)));

const mergeRecipients = (current: Recipient[], additions: Recipient[]) => {
  const seen = new Set(current.map(recipient => recipient.email));
  const next = [...current];

  for (const recipient of additions) {
    if (seen.has(recipient.email)) continue;
    seen.add(recipient.email);
    next.push(recipient);
  }

  return next;
};

export default function InviteStudentsPage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const queryClient = useQueryClient();
  const preselectKeyRef = useRef('');
  const emailInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [emailDraft, setEmailDraft] = useState('');
  const [emailRecipients, setEmailRecipients] = useState<Recipient[]>([]);
  const [invalidRecipients, setInvalidRecipients] = useState<string[]>([]);
  const [templateId, setTemplateId] = useState<string>(DEFAULT_TEMPLATE.id);
  const [message, setMessage] = useState<string>(DEFAULT_TEMPLATE.body);
  const [activeCategory, setActiveCategory] = useState('All');
  const [subjectByCategory, setSubjectByCategory] = useState<Record<string, string>>({});
  const [results, setResults] = useState<SendResult[] | null>(null);
  const [actingOnInvitation, setActingOnInvitation] = useState<string | null>(null);
  const [preselectKey, setPreselectKey] = useState('');

  const classesQuery = useQuery({
    ...getClassDefinitionsForOrganisationOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
  });
  const classes: ClassDefinition[] = useMemo(
    () =>
      (classesQuery.data?.data ?? [])
        .map(c => c.class_definition)
        .filter((c): c is ClassDefinition => Boolean(c?.uuid)),
    [classesQuery.data]
  );

  const classTabItems = useMemo(
    () =>
      classes.flatMap(c =>
        c.uuid
          ? [
              {
                id: c.uuid,
                category: categoryLabel(c),
                subject: null,
                programType: null,
                title: c.title,
              },
            ]
          : []
      ),
    [classes]
  );
  const filteredClasses = useMemo(
    () => filterByCategoryTabs(classTabItems, activeCategory, subjectByCategory, null),
    [classTabItems, activeCategory, subjectByCategory]
  );

  const groupsQuery = useQuery({
    ...listGroupsOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
  });
  const groups = useMemo(
    () =>
      (groupsQuery.data?.data ?? []).filter((g): g is StudentGroup & { uuid: string } =>
        Boolean(g?.uuid)
      ),
    [groupsQuery.data]
  );

  const invitationsQuery = useQuery({
    ...listOrganisationInvitationsOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
  });
  const invitations = invitationsQuery.data?.data ?? [];
  const recentInvitations = useMemo(() => invitations.slice(0, 8), [invitations]);
  const invitationCounts = useMemo(
    () => ({
      live: invitations.filter(i => LIVE_STATUSES.includes(String(i.status))).length,
      accepted: invitations.filter(i => ACCEPTED_STATUSES.includes(String(i.status))).length,
    }),
    [invitations]
  );
  const revokeInvitation = useMutation(revokeOrganisationInvitationMutation());
  const resendInvitation = useMutation(resendOrganisationInvitationMutation());

  const recipients = emailRecipients;
  const addRecipientsFromText = useCallback((raw: string) => {
    const parsed = parseRecipientInput(raw);

    if (parsed.recipients.length > 0) {
      setEmailRecipients(current => mergeRecipients(current, parsed.recipients));
    }

    if (parsed.invalid.length > 0) {
      setInvalidRecipients(current => uniqueStrings([...current, ...parsed.invalid]));
    }

    return parsed;
  }, []);
  const commitEmailDraft = useCallback(() => {
    const draft = emailDraft.trim();
    if (!draft) return;

    addRecipientsFromText(draft);
    setEmailDraft('');
  }, [addRecipientsFromText, emailDraft]);
  const handleEmailDraftChange = useCallback(
    (value: string) => {
      if (EMAIL_SEPARATOR_PATTERN.test(value)) {
        addRecipientsFromText(value);
        setEmailDraft('');
        return;
      }

      setEmailDraft(value);
    },
    [addRecipientsFromText]
  );
  const handleEmailKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      const hasDraft = emailDraft.trim().length > 0;
      const shouldCommit =
        event.key === 'Enter' ||
        event.key === 'Tab' ||
        event.key === ',' ||
        event.key === ';' ||
        (event.key === ' ' && parseRecipientInput(emailDraft).recipients.length > 0);

      if (hasDraft && shouldCommit) {
        event.preventDefault();
        commitEmailDraft();
        return;
      }

      if (!hasDraft && event.key === 'Backspace') {
        setEmailRecipients(current => current.slice(0, -1));
      }
    },
    [commitEmailDraft, emailDraft]
  );
  const handleEmailPaste = useCallback(
    (event: ClipboardEvent<HTMLInputElement>) => {
      const pasted = event.clipboardData.getData('text').trim();
      if (!pasted) return;

      event.preventDefault();
      addRecipientsFromText(`${emailDraft} ${pasted}`.trim());
      setEmailDraft('');
    },
    [addRecipientsFromText, emailDraft]
  );
  const removeEmailRecipient = useCallback((email: string) => {
    setEmailRecipients(current => current.filter(recipient => recipient.email !== email));
  }, []);

  /** Students reached via a group, on top of any addresses pasted in. */
  const groupReach = useMemo(
    () =>
      groups
        .filter(g => selectedGroups.includes(g.uuid))
        .reduce((total, g) => total + toNumber(g.member_count), 0),
    [groups, selectedGroups]
  );

  const sendInvitations = useMutation(sendOrganisationInvitationsMutation());
  const sending = sendInvitations.isPending;
  const canSend = recipients.length > 0 || selectedGroups.length > 0;
  const selectedClassTitles = useMemo(
    () =>
      selectedClasses
        .map(id => classes.find(klass => klass.uuid === id)?.title)
        .filter((title): title is string => Boolean(title)),
    [classes, selectedClasses]
  );
  const classNamesJoined = useMemo(() => {
    if (selectedClassTitles.length === 0) return 'your selected classes';
    if (selectedClassTitles.length === 1) return selectedClassTitles[0] ?? 'your selected classes';
    if (selectedClassTitles.length === 2) return selectedClassTitles.join(' and ');
    const lastTitle = selectedClassTitles.at(-1) ?? 'your selected classes';
    return `${selectedClassTitles.slice(0, -1).join(', ')}, and ${lastTitle}`;
  }, [selectedClassTitles]);
  const organisationName = organisation?.name ?? 'your organisation';
  const currentTemplate =
    TEMPLATES.find(template => template.id === templateId) ?? DEFAULT_TEMPLATE;
  const renderedMessage = useMemo(
    () =>
      message
        .replaceAll('{{studentName}}', 'Student')
        .replaceAll('{{schoolName}}', organisationName)
        .replaceAll('{{className}}', classNamesJoined)
        .replaceAll('{{senderName}}', organisationName),
    [classNamesJoined, message, organisationName]
  );
  const renderedSubject = useMemo(
    () =>
      currentTemplate.subject
        .replaceAll('{{schoolName}}', organisationName)
        .replaceAll('{{className}}', classNamesJoined)
        .trim(),
    [classNamesJoined, currentTemplate.subject, organisationName]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setPreselectKey(
      [
        params.get('classUuid') ?? params.get('class_uuid') ?? params.get('class') ?? '',
        params.get('courseUuid') ?? params.get('course_uuid') ?? params.get('course') ?? '',
        params.get('programUuid') ?? params.get('program_uuid') ?? params.get('program') ?? '',
      ].join('|')
    );
  }, []);

  useEffect(() => {
    if (!classes.length || !preselectKey || preselectKeyRef.current === preselectKey) return;

    const [classUuid, courseUuid, programUuid] = preselectKey.split('|');
    const ids =
      classUuid && classes.some(klass => klass.uuid === classUuid)
        ? [classUuid]
        : programUuid
          ? classes
              .filter(klass => klass.program_uuid === programUuid)
              .map(klass => klass.uuid)
              .filter((uuid): uuid is string => Boolean(uuid))
          : courseUuid
            ? classes
                .filter(klass => klass.course_uuid === courseUuid)
                .map(klass => klass.uuid)
                .filter((uuid): uuid is string => Boolean(uuid))
            : [];

    preselectKeyRef.current = preselectKey;
    if (ids.length === 0) return;

    setSelectedClasses(prev => uniqueStrings([...prev, ...ids]));
    setStep(2);
  }, [classes, preselectKey]);

  const rosterKeyPrefix = useMemo(() => {
    const [root] = listRosterQueryKey({
      path: { organisationUuid },
      query: { pageable: { page: 0, size: 100 } },
    });
    const { query, ...prefix } = root;
    return [prefix];
  }, [organisationUuid]);

  const refreshInviteCaches = useCallback(
    () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: listOrganisationInvitationsQueryKey({ path: { organisationUuid } }),
        }),
        queryClient.invalidateQueries({ queryKey: rosterKeyPrefix }),
        queryClient.invalidateQueries({
          queryKey: getStudentSummariesQueryKey({ path: { organisationUuid } }),
        }),
        queryClient.invalidateQueries({
          queryKey: getUsersByOrganisationAndDomainQueryKey({
            path: { uuid: organisationUuid, domainName: 'student' },
          }),
        }),
      ]),
    [organisationUuid, queryClient, rosterKeyPrefix]
  );

  const actOnInvitation = async (
    invitationUuid: string,
    kind: 'resend' | 'revoke',
    run: () => Promise<unknown>
  ) => {
    setActingOnInvitation(`${kind}:${invitationUuid}`);
    try {
      await run();
      toast.success(kind === 'resend' ? 'Invitation resent' : 'Invitation revoked');
      await refreshInviteCaches();
    } catch (err) {
      toast.error(
        kind === 'resend' ? 'Could not resend invitation' : 'Could not revoke invitation',
        {
          description: getErrorMessage(err, 'Please try again.'),
        }
      );
    } finally {
      setActingOnInvitation(null);
    }
  };

  /**
   * One request carries the whole batch: the server decides per recipient whether an
   * offer can be created, so a single bad address never costs the rest of the batch.
   */
  const send = async () => {
    if (selectedClasses.length === 0) {
      toast.error('Select at least one class to invite students to.');
      setStep(1);
      return;
    }

    if (!canSend) {
      toast.error('Add at least one recipient email, or pick a student group.');
      setStep(2);
      return;
    }

    try {
      const response = await sendInvitations.mutateAsync({
        path: { organisationUuid },
        body: {
          recipients: recipients.map(r => ({ email: r.email, name: r.name || null })),
          student_group_uuids: selectedGroups.length ? selectedGroups : null,
          domain_name: 'student',
          class_uuids: selectedClasses.length ? selectedClasses : null,
          message: renderedMessage.trim() || null,
          expires_in_days: EXPIRES_IN_DAYS,
        },
      });

      const result = response?.data ?? {};
      const out: SendResult[] = [
        ...(result.sent ?? []).map(i => ({ email: i.recipient_email ?? '', ok: true })),
        ...(result.failed ?? []).map(f => ({
          email: f.email ?? '',
          ok: false,
          message: f.reason ?? 'Could not be invited',
        })),
      ];
      setResults(out);

      const ok = result.sent?.length ?? 0;
      if (ok) {
        toast.success(`${ok} invitation${ok === 1 ? '' : 's'} sent`, {
          description: out.length - ok ? `${out.length - ok} could not be invited.` : undefined,
        });
        await refreshInviteCaches();
      } else {
        toast.error('No invitations could be sent', {
          description: out[0]?.message ?? 'Check the addresses and try again.',
        });
      }
    } catch (err) {
      toast.error('Could not send invitations', {
        description: getErrorMessage(err, 'Please try again.'),
      });
    }
  };

  const reset = () => {
    setResults(null);
    setEmailDraft('');
    setEmailRecipients([]);
    setInvalidRecipients([]);
    setStep(1);
    setSelectedClasses([]);
    setSelectedGroups([]);
  };

  const canNext = step === 1 ? selectedClasses.length > 0 : step === 2 ? canSend : true;

  return (
    <div className='mx-auto w-full max-w-3xl space-y-6 px-3 py-4 sm:px-5 lg:px-6'>
      <PageHeader
        title='Invite students'
        description="Follow the steps to invite students to enrol in your organisation's classes."
      />

      <div className='bg-card rounded-lg border p-3'>
        <ol className='flex items-center gap-2'>
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = step === s.n;
            const done = step > s.n;
            const clickable =
              s.n < step ||
              s.n === step ||
              (s.n === 2 && selectedClasses.length > 0) ||
              (s.n === 3 && selectedClasses.length > 0 && canSend);
            return (
              <li key={s.n} className='flex flex-1 items-center gap-2'>
                <button
                  type='button'
                  disabled={!clickable}
                  onClick={() => clickable && setStep(s.n as 1 | 2 | 3)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
                    active
                      ? 'border-primary bg-primary/5 text-foreground'
                      : done
                        ? 'border-primary/40 bg-primary/5 text-foreground hover:bg-primary/10'
                        : 'border-border text-muted-foreground',
                    !clickable && 'cursor-not-allowed'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium',
                      active || done
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground/40'
                    )}
                  >
                    {done ? <Check className='h-3.5 w-3.5' /> : s.n}
                  </span>
                  <span className='hidden truncate sm:inline'>{s.label}</span>
                  <Icon className='ml-auto h-4 w-4 sm:hidden' />
                </button>
                {i < STEPS.length - 1 && <span className='bg-border hidden h-px w-4 sm:block' />}
              </li>
            );
          })}
        </ol>
        <div className='text-muted-foreground mt-3 flex flex-wrap items-center gap-2 text-xs'>
          {selectedClasses.length > 0 && (
            <Badge variant='secondary' className='gap-1'>
              <Users className='h-3 w-3' /> {selectedClasses.length} class
              {selectedClasses.length === 1 ? '' : 'es'}
            </Badge>
          )}
          {recipients.length > 0 && (
            <Badge variant='secondary' className='gap-1'>
              <UsersRound className='h-3 w-3' /> {recipients.length} recipient
              {recipients.length === 1 ? '' : 's'}
            </Badge>
          )}
          {selectedGroups.length > 0 && (
            <Badge variant='secondary' className='gap-1'>
              <Users className='h-3 w-3' /> {selectedGroups.length} group
              {selectedGroups.length === 1 ? '' : 's'}
              {groupReach > 0 ? ` - ${formatCount(groupReach, '0')}` : ''}
            </Badge>
          )}
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='ml-auto h-7 px-2 text-xs'
            onClick={() => setShowHistory(value => !value)}
          >
            <History className='mr-1 h-3.5 w-3.5' />
            {showHistory ? 'Hide' : 'View'} history
          </Button>
        </div>
      </div>

      {/* Results panel */}
      {results ? (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base'>
              <CheckCircle2 className='text-success h-4 w-4' /> Invitations processed
            </CardTitle>
            <CardDescription>
              {results.filter(r => r.ok).length} of {results.length} invited successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-2'>
            {results.map(r => (
              <div
                key={r.email}
                className='flex items-center justify-between rounded-md border p-2.5 text-sm'
              >
                <span className='truncate'>{r.email}</span>
                {r.ok ? (
                  <Badge variant='secondary' className='bg-success/10 text-success gap-1'>
                    <CheckCircle2 className='h-3 w-3' /> Invited
                  </Badge>
                ) : (
                  <Badge variant='secondary' className='bg-destructive/10 text-destructive gap-1'>
                    <XCircle className='h-3 w-3' /> {r.message ?? 'Failed'}
                  </Badge>
                )}
              </div>
            ))}
            <div className='flex justify-end pt-2'>
              <Button onClick={reset}>Invite more</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Step 1 - Classes */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <Users className='h-4 w-4' /> Select classes
                </CardTitle>
                <CardDescription>
                  Pick the classes students will be invited to enrol in.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                {classes.length > 0 && (
                  <CategoryTabs
                    items={classTabItems}
                    activeCategory={activeCategory}
                    onCategoryChange={setActiveCategory}
                    subjectByCategory={subjectByCategory}
                    onSubjectChange={setSubjectByCategory}
                  />
                )}
                <ScrollArea className='h-[340px] pr-3'>
                  {classesQuery.isLoading ? (
                    <div className='grid gap-2 sm:grid-cols-2'>
                      {[...Array(8)].map((_, index) => (
                        <Skeleton key={index} className='h-[62px] rounded-md' />
                      ))}
                    </div>
                  ) : classesQuery.isError ? (
                    <EmptyState
                      variant='compact'
                      icon={Users}
                      title='Could not load classes'
                      description={getErrorMessage(classesQuery.error, 'Please try again.')}
                      action={
                        <Button variant='outline' size='sm' onClick={() => classesQuery.refetch()}>
                          Retry
                        </Button>
                      }
                    />
                  ) : filteredClasses.length === 0 ? (
                    <EmptyState
                      variant='compact'
                      icon={Users}
                      title='No classes to select'
                      description='Create a class first, then return here to invite students.'
                    />
                  ) : (
                    <div className='grid gap-2 sm:grid-cols-2'>
                      {filteredClasses.map(item => {
                        const checked = selectedClasses.includes(item.id);
                        return (
                          <label
                            key={item.id}
                            className={cn(
                              'flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors',
                              checked ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                            )}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => setSelectedClasses(s => toggle(s, item.id))}
                              className='mt-0.5'
                              aria-label={`Select ${item.title}`}
                            />
                            <div className='min-w-0 flex-1'>
                              <div className='truncate text-sm font-medium'>{item.title}</div>
                              <div className='text-muted-foreground truncate text-xs'>
                                {item.category}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
                <div className='text-muted-foreground flex items-center justify-between text-xs'>
                  <span>
                    {selectedClasses.length} of {filteredClasses.length} selected
                  </span>
                  <div className='flex gap-2'>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => setSelectedClasses(filteredClasses.map(item => item.id))}
                    >
                      Select all
                    </Button>
                    <Button variant='ghost' size='sm' onClick={() => setSelectedClasses([])}>
                      Clear
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2 - Recipients */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <UsersRound className='h-4 w-4' /> Select recipients
                </CardTitle>
                <CardDescription>
                  Send to student groups or paste specific emails. Everyone is invited individually.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <Label className='text-muted-foreground mb-2 block text-xs uppercase'>
                    Groups
                  </Label>
                  {groupsQuery.isLoading ? (
                    <div className='grid gap-2 sm:grid-cols-2'>
                      {[...Array(4)].map((_, index) => (
                        <Skeleton key={index} className='h-[62px] rounded-md' />
                      ))}
                    </div>
                  ) : groupsQuery.isError ? (
                    <EmptyState
                      variant='compact'
                      icon={UsersRound}
                      title='Could not load groups'
                      description={getErrorMessage(groupsQuery.error, 'Please try again.')}
                      action={
                        <Button variant='outline' size='sm' onClick={() => groupsQuery.refetch()}>
                          Retry
                        </Button>
                      }
                    />
                  ) : groups.length === 0 ? (
                    <EmptyState
                      variant='compact'
                      icon={UsersRound}
                      title='No groups yet'
                      description='Paste recipient emails below to invite students directly.'
                    />
                  ) : (
                    <div className='grid gap-2 sm:grid-cols-2'>
                      {groups.map(group => {
                        const checked = selectedGroups.includes(group.uuid);
                        const memberCount = toNumber(group.member_count);
                        return (
                          <label
                            key={group.uuid}
                            className={cn(
                              'flex cursor-pointer items-center justify-between gap-3 rounded-md border p-3 transition-colors',
                              checked ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                            )}
                          >
                            <div className='flex min-w-0 items-center gap-3'>
                              <Checkbox
                                checked={checked}
                                onCheckedChange={() =>
                                  setSelectedGroups(current => toggle(current, group.uuid))
                                }
                              />
                              <div className='min-w-0'>
                                <div className='truncate text-sm font-medium'>{group.name}</div>
                                {group.group_type && (
                                  <div className='text-muted-foreground truncate text-xs'>
                                    {group.group_type}
                                  </div>
                                )}
                              </div>
                            </div>
                            <Badge variant='secondary' className='shrink-0'>
                              {formatCount(memberCount, '0')}
                            </Badge>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor='recipient-email-input'
                    className='text-muted-foreground mb-2 block text-xs uppercase'
                  >
                    Recipient emails
                  </Label>
                  <div
                    className={cn(
                      'border-input bg-background focus-within:border-ring focus-within:ring-ring/50 flex min-h-11 cursor-text flex-wrap items-center gap-2 rounded-md border px-2 py-2 shadow-xs transition-[border-color,box-shadow] focus-within:ring-[3px]',
                      invalidRecipients.length > 0 &&
                        'border-destructive focus-within:ring-destructive/20'
                    )}
                    onClick={() => emailInputRef.current?.focus()}
                  >
                    {recipients.map(recipient => (
                      <span
                        key={recipient.email}
                        className='bg-primary/10 text-primary border-primary/20 inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium'
                      >
                        <span className='max-w-[220px] truncate'>{recipient.email}</span>
                        <button
                          type='button'
                          className='hover:bg-primary/10 focus-visible:ring-ring/50 -mr-1 inline-flex h-5 w-5 items-center justify-center rounded-full outline-none focus-visible:ring-[3px]'
                          aria-label={`Remove ${recipient.email}`}
                          onClick={event => {
                            event.stopPropagation();
                            removeEmailRecipient(recipient.email);
                          }}
                        >
                          <X className='h-3 w-3' />
                        </button>
                      </span>
                    ))}
                    <Input
                      ref={emailInputRef}
                      id='recipient-email-input'
                      type='text'
                      inputMode='email'
                      autoComplete='email'
                      placeholder={
                        recipients.length === 0
                          ? 'student1@example.com, student2@example.com'
                          : 'Add another email'
                      }
                      value={emailDraft}
                      onChange={event => handleEmailDraftChange(event.target.value)}
                      onKeyDown={handleEmailKeyDown}
                      onPaste={handleEmailPaste}
                      onBlur={commitEmailDraft}
                      aria-describedby='recipient-email-help recipient-email-errors'
                      aria-invalid={invalidRecipients.length > 0}
                      className='h-7 min-w-[14rem] flex-1 border-0 bg-transparent px-1 py-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 md:text-sm'
                    />
                  </div>
                  <div className='text-muted-foreground mt-2 flex flex-wrap items-center gap-2 text-xs'>
                    <Badge variant='outline'>{recipients.length} valid</Badge>
                    {invalidRecipients.length > 0 && (
                      <Badge variant='destructive'>{invalidRecipients.length} invalid</Badge>
                    )}
                    <span id='recipient-email-help' className='sm:ml-auto'>
                      Press Enter, Tab, comma, or paste a list to add people.
                    </span>
                  </div>
                  {invalidRecipients.length > 0 && (
                    <div
                      id='recipient-email-errors'
                      className='text-destructive mt-1 flex flex-wrap items-center gap-2 text-xs'
                    >
                      <span>
                        Ignored: {invalidRecipients.slice(0, 3).join(', ')}
                        {invalidRecipients.length > 3
                          ? `, +${invalidRecipients.length - 3} more`
                          : ''}
                      </span>
                      <Button
                        type='button'
                        variant='link'
                        size='sm'
                        className='text-destructive h-auto px-0 py-0 text-xs'
                        onClick={() => setInvalidRecipients([])}
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                </div>
                <div className='bg-muted/50 space-y-1.5 rounded-md p-3 text-sm'>
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground'>Estimated reach</span>
                    <span className='font-semibold tabular-nums'>
                      {formatCount(recipients.length + groupReach, '0')} student
                      {recipients.length + groupReach === 1 ? '' : 's'}
                    </span>
                  </div>
                  {selectedGroups.length > 0 && recipients.length > 0 && (
                    <p className='text-muted-foreground text-xs'>
                      Anyone appearing in both is invited once.
                    </p>
                  )}
                  {invalidRecipients.length > 0 && (
                    <p className='text-muted-foreground text-xs'>
                      Invalid entries stay out of the send batch until corrected.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3 - Message & send */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <Mail className='h-4 w-4' /> Message &amp; send
                </CardTitle>
                <CardDescription>Pick a template, review the audience, and send.</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <Label className='text-muted-foreground mb-2 block text-xs uppercase'>
                    Template
                  </Label>
                  <Select
                    value={templateId}
                    onValueChange={nextTemplateId => {
                      const nextTemplate =
                        TEMPLATES.find(template => template.id === nextTemplateId) ??
                        DEFAULT_TEMPLATE;
                      setTemplateId(nextTemplate.id);
                      setMessage(nextTemplate.body);
                    }}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPLATES.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className='mb-2 flex items-center justify-between gap-2'>
                    <Label htmlFor='message' className='text-muted-foreground text-xs uppercase'>
                      Message body
                    </Label>
                    <span className='text-muted-foreground text-[10px]'>
                      Variables: {'{{schoolName}} {{className}} {{studentName}} {{senderName}}'}
                    </span>
                  </div>
                  <Textarea
                    id='message'
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={6}
                    maxLength={2000}
                  />
                </div>

                <div className='space-y-3 rounded-md border p-3 text-sm'>
                  <div>
                    <div className='text-muted-foreground mb-1 text-xs uppercase'>
                      Subject preview
                    </div>
                    <div className='font-medium'>{renderedSubject}</div>
                  </div>
                  <div className='border-t pt-3'>
                    <div className='text-muted-foreground mb-1 text-xs uppercase'>
                      Message preview
                    </div>
                    <pre className='text-foreground font-sans text-sm break-words whitespace-pre-wrap'>
                      {renderedMessage}
                    </pre>
                  </div>
                </div>

                <div className='bg-muted/50 space-y-1.5 rounded-md p-3 text-sm'>
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground'>Recipients</span>
                    <span className='font-semibold tabular-nums'>
                      {formatCount(recipients.length + groupReach, '0')}
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground'>Classes</span>
                    <span className='font-semibold tabular-nums'>
                      {formatCount(selectedClasses.length, '0')}
                    </span>
                  </div>
                  {selectedGroups.length > 0 && (
                    <p className='text-muted-foreground mt-1 text-xs'>
                      Student groups currently reach about {formatCount(groupReach, '0')} member
                      {groupReach === 1 ? '' : 's'} before server-side de-duplication.
                    </p>
                  )}
                </div>

                <div className='border-primary/30 bg-primary/5 text-muted-foreground flex items-start gap-2 rounded-md border p-3 text-xs'>
                  <ShieldCheck className='text-primary mt-0.5 h-4 w-4 shrink-0' />
                  <p>
                    Each student gets their own private link and chooses whether to join. Nothing is
                    created for them until they accept, and invitations lapse after{' '}
                    {EXPIRES_IN_DAYS} days. Students under the age we can accept consent from will
                    be asked for a parent or guardian instead.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className='bg-background/95 sticky bottom-0 z-20 -mx-3 flex flex-col-reverse gap-2 border-t px-3 py-3 backdrop-blur sm:-mx-5 sm:flex-row sm:items-center sm:justify-between sm:px-5 lg:-mx-6 lg:px-6'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setStep(s => Math.max(1, s - 1) as 1 | 2 | 3)}
              disabled={step === 1}
            >
              <ArrowLeft className='mr-2 h-4 w-4' /> Back
            </Button>
            <div className='text-muted-foreground text-center text-xs'>Step {step} of 3</div>
            {step < 3 ? (
              <Button
                type='button'
                onClick={() => setStep(s => Math.min(3, s + 1) as 1 | 2 | 3)}
                disabled={!canNext}
              >
                Next <ArrowRight className='ml-2 h-4 w-4' />
              </Button>
            ) : (
              <Button
                type='button'
                onClick={send}
                disabled={sending || !canSend || selectedClasses.length === 0}
              >
                {sending ? (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                ) : (
                  <Send className='mr-2 h-4 w-4' />
                )}
                {sending
                  ? 'Sending...'
                  : `Send invitation${recipients.length + selectedGroups.length === 1 ? '' : 's'}`}
              </Button>
            )}
          </div>
        </>
      )}

      {showHistory && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base'>
              <MailCheck className='h-4 w-4' /> Invitation status
            </CardTitle>
            <CardDescription>
              Track recent invites and follow up while students decide whether to join.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex flex-wrap gap-2 text-xs'>
              <Badge variant='secondary' className='gap-1'>
                <Clock3 className='h-3 w-3' /> {invitationCounts.live} pending
              </Badge>
              <Badge variant='secondary' className='bg-success/10 text-success gap-1'>
                <CheckCircle2 className='h-3 w-3' /> {invitationCounts.accepted} accepted
              </Badge>
            </div>

            {invitationsQuery.isLoading && !invitationsQuery.data ? (
              <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                <Loader2 className='h-4 w-4 animate-spin' /> Loading invitations...
              </div>
            ) : recentInvitations.length === 0 ? (
              <div className='text-muted-foreground flex flex-col items-center justify-center gap-2 rounded-md border border-dashed p-6 text-center text-sm'>
                <Mail className='h-5 w-5' />
                No invitations sent yet.
              </div>
            ) : (
              <div className='space-y-2'>
                {recentInvitations.map(invite => {
                  const invitationUuid = invite.uuid;
                  const status = String(invite.status ?? '');
                  const live = LIVE_STATUSES.includes(status);
                  const accepted = ACCEPTED_STATUSES.includes(status);
                  const resendBusy =
                    invitationUuid && actingOnInvitation === `resend:${invitationUuid}`;
                  const revokeBusy =
                    invitationUuid && actingOnInvitation === `revoke:${invitationUuid}`;
                  return (
                    <div
                      key={invitationUuid ?? invite.recipient_email}
                      className='flex flex-wrap items-center justify-between gap-3 rounded-md border p-3 text-sm'
                      aria-busy={Boolean(resendBusy || revokeBusy)}
                    >
                      <div className='min-w-0 flex-1'>
                        <p className='truncate font-medium'>
                          {invite.recipient_name || invite.recipient_email}
                        </p>
                        <p className='text-muted-foreground truncate text-xs'>
                          {invite.recipient_email}
                          {invite.expires_at
                            ? ` - expires ${new Date(invite.expires_at).toLocaleDateString()}`
                            : ''}
                          {invite.accepted_at
                            ? ` - accepted ${new Date(invite.accepted_at).toLocaleDateString()}`
                            : ''}
                        </p>
                      </div>
                      <div className='flex flex-wrap items-center gap-2'>
                        <Badge
                          variant='secondary'
                          className={accepted ? 'bg-success/10 text-success' : undefined}
                        >
                          {status === 'AWAITING_GUARDIAN_CONSENT'
                            ? 'Awaiting guardian'
                            : accepted
                              ? 'Accepted'
                              : status || 'Pending'}
                        </Badge>
                        {live && invitationUuid && (
                          <>
                            <Button
                              type='button'
                              variant='ghost'
                              size='sm'
                              disabled={Boolean(resendBusy || revokeBusy)}
                              onClick={() =>
                                actOnInvitation(invitationUuid, 'resend', () =>
                                  resendInvitation.mutateAsync({
                                    path: { organisationUuid, invitationUuid },
                                  })
                                )
                              }
                            >
                              {resendBusy ? (
                                <Loader2 className='mr-1.5 h-3.5 w-3.5 animate-spin' />
                              ) : (
                                <RotateCw className='mr-1.5 h-3.5 w-3.5' />
                              )}
                              Resend
                            </Button>
                            <Button
                              type='button'
                              variant='ghost'
                              size='sm'
                              disabled={Boolean(resendBusy || revokeBusy)}
                              onClick={() =>
                                actOnInvitation(invitationUuid, 'revoke', () =>
                                  revokeInvitation.mutateAsync({
                                    path: { organisationUuid, invitationUuid },
                                  })
                                )
                              }
                            >
                              {revokeBusy ? (
                                <Loader2 className='mr-1.5 h-3.5 w-3.5 animate-spin' />
                              ) : (
                                <X className='mr-1.5 h-3.5 w-3.5' />
                              )}
                              Revoke
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
