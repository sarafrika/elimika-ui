'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Check,
  CheckCircle2,
  Clock3,
  Layers3,
  ListChecks,
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
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { CategoryTabs, filterByCategoryTabs } from '@/components/category-tabs';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useOrganisation } from '@/context/organisation-context';
import { useCoursesByIds, useProgramsByIds } from '@/hooks/use-batched-lookups';
import type { ClassDefinition, StudentGroup } from '@/services/client';
import {
  getClassDefinitionsForOrganisationOptions,
  listGroupsOptions,
  listOrganisationInvitationsOptions,
  listOrganisationInvitationsQueryKey,
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
    id: 'welcome',
    name: 'Warm welcome',
    subject: "You're invited to join {{school}}",
    body: "Hi {{student}},\n\nYou've been invited to enroll with {{school}}. Click the link below to accept your invitation and get started.\n\nSee you in class,\n{{sender}}",
  },
  {
    id: 'cohort',
    name: 'New cohort',
    subject: 'Your seat in the new cohort is ready',
    body: 'Hello {{student}},\n\nA new cohort is opening at {{school}} and we saved you a spot. Accept your invite to secure your place.\n\n{{sender}}',
  },
  {
    id: 'reminder',
    name: 'Gentle reminder',
    subject: 'A quick reminder to join {{school}}',
    body: "Hi {{student}},\n\nJust a friendly nudge — your invitation to {{school}} is still open. Accept it whenever you're ready.\n\n{{sender}}",
  },
] as const;

const DEFAULT_TEMPLATE = TEMPLATES[0];

type Recipient = { name: string; email: string };
type SendResult = { email: string; ok: boolean; message?: string };
type RecipientParse = { recipients: Recipient[]; invalid: string[] };
type SelectionMode = 'offerings' | 'classes';
type OfferingGroup = {
  key: string;
  kind: 'course' | 'program' | 'standalone';
  title: string;
  subtitle: string;
  classIds: string[];
  classes: ClassDefinition[];
  deliveryLabels: string[];
};

const LIVE_STATUSES = ['PENDING', 'AWAITING_GUARDIAN_CONSENT'];
const ACCEPTED_STATUSES = ['ACCEPTED'];

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
  { n: 1, label: 'Classes', icon: Users },
  { n: 2, label: 'Recipients', icon: UsersRound },
  { n: 3, label: 'Message & send', icon: Mail },
] as const;

const toggle = (arr: string[], id: string) =>
  arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id];

const uniqueStrings = (items: string[]) => Array.from(new Set(items.filter(Boolean)));

const shortId = (uuid: string) => uuid.slice(0, 8);

export default function InviteStudentsPage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const queryClient = useQueryClient();
  const preselectKeyRef = useRef('');

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('offerings');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [emails, setEmails] = useState('');
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
  const courseIds = useMemo(() => uniqueStrings(classes.map(c => c.course_uuid ?? '')), [classes]);
  const programIds = useMemo(
    () => uniqueStrings(classes.map(c => c.program_uuid ?? '')),
    [classes]
  );
  const { courseMap } = useCoursesByIds(courseIds);
  const { programMap } = useProgramsByIds(programIds);
  const offeringGroups: OfferingGroup[] = useMemo(() => {
    const grouped = new Map<
      string,
      {
        kind: OfferingGroup['kind'];
        uuid: string;
        classes: ClassDefinition[];
      }
    >();

    for (const klass of classes) {
      const classUuid = klass.uuid;
      if (!classUuid) continue;
      const kind: OfferingGroup['kind'] = klass.program_uuid
        ? 'program'
        : klass.course_uuid
          ? 'course'
          : 'standalone';
      const uuid = klass.program_uuid ?? klass.course_uuid ?? classUuid;
      const key = `${kind}:${uuid}`;
      const current = grouped.get(key);
      if (current) {
        current.classes.push(klass);
      } else {
        grouped.set(key, { kind, uuid, classes: [klass] });
      }
    }

    return Array.from(grouped.entries())
      .map(([key, group]) => {
        const sortedClasses = [...group.classes].sort((a, b) => a.title.localeCompare(b.title));
        const classIds = sortedClasses
          .map(klass => klass.uuid)
          .filter((uuid): uuid is string => Boolean(uuid));
        const deliveryLabels = uniqueStrings(sortedClasses.map(categoryLabel));
        const fallbackTitle = sortedClasses[0]?.title ?? 'Class';
        const title =
          group.kind === 'program'
            ? (programMap[group.uuid]?.title ?? `Program ${shortId(group.uuid)}`)
            : group.kind === 'course'
              ? (courseMap[group.uuid]?.name ?? `Course ${shortId(group.uuid)}`)
              : fallbackTitle;
        const offeringLabel =
          group.kind === 'program'
            ? 'Program bundle'
            : group.kind === 'course'
              ? 'Course'
              : 'Standalone class';
        const classLabel = `${classIds.length} class${classIds.length === 1 ? '' : 'es'}`;
        return {
          key,
          kind: group.kind,
          title,
          subtitle: `${offeringLabel} · ${classLabel}`,
          classIds,
          classes: sortedClasses,
          deliveryLabels,
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [classes, courseMap, programMap]);

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

  const recipientInput = useMemo(() => parseRecipientInput(emails), [emails]);
  const recipients = recipientInput.recipients;
  const invalidRecipients = recipientInput.invalid;

  /** Students reached via a group, on top of any addresses pasted in. */
  const groupReach = useMemo(
    () =>
      groups
        .filter(g => selectedGroups.includes(g.uuid))
        .reduce((total, g) => total + Number(g.member_count ?? 0), 0),
    [groups, selectedGroups]
  );

  const sendInvitations = useMutation(sendOrganisationInvitationsMutation());
  const sending = sendInvitations.isPending;
  const canSend = recipients.length > 0 || selectedGroups.length > 0;

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

  const toggleClassSet = (classIds: string[]) => {
    setSelectedClasses(prev => {
      const selected = new Set(prev);
      const everySelected = classIds.every(id => selected.has(id));
      for (const id of classIds) {
        if (everySelected) {
          selected.delete(id);
        } else {
          selected.add(id);
        }
      }
      return Array.from(selected);
    });
  };

  const refreshInvitations = () =>
    queryClient.invalidateQueries({
      queryKey: listOrganisationInvitationsQueryKey({ path: { organisationUuid } }),
    });

  const actOnInvitation = async (
    invitationUuid: string,
    kind: 'resend' | 'revoke',
    run: () => Promise<unknown>
  ) => {
    setActingOnInvitation(`${kind}:${invitationUuid}`);
    try {
      await run();
      toast.success(kind === 'resend' ? 'Invitation resent' : 'Invitation revoked');
      await refreshInvitations();
    } catch (err) {
      toast.error(
        kind === 'resend' ? 'Could not resend invitation' : 'Could not revoke invitation',
        {
          description: err instanceof Error ? err.message : 'Please try again.',
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
    if (!canSend) {
      toast.error('Add at least one recipient email, or pick a student group.');
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
          message: message.trim() || null,
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
        await queryClient.invalidateQueries({
          queryKey: listOrganisationInvitationsQueryKey({ path: { organisationUuid } }),
        });
      } else {
        toast.error('No invitations could be sent', {
          description: out[0]?.message ?? 'Check the addresses and try again.',
        });
      }
    } catch (err) {
      toast.error('Could not send invitations', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  const reset = () => {
    setResults(null);
    setEmails('');
    setStep(1);
    setSelectedClasses([]);
    setSelectedGroups([]);
  };

  const canNext = step === 1 ? true : step === 2 ? canSend : true;

  return (
    <div className='mx-auto w-full max-w-[1600px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]'>
      <PageHeader
        title='Invite Students'
        description='Invite new students to your organisation and classes.'
      />

      {/* Stepper */}
      <div>
        <ol className='flex items-center gap-2'>
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = step === s.n;
            const done = step > s.n;
            const clickable = s.n <= step || done;
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
              {groupReach > 0 ? ` · ${groupReach}` : ''}
            </Badge>
          )}
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
          {/* Step 1 — Classes */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <BookOpenCheck className='h-4 w-4' /> Select what to share
                </CardTitle>
                <CardDescription>
                  Share a single course, a program bundle, or the exact classes students should see
                  after accepting.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <Tabs
                  value={selectionMode}
                  onValueChange={value => setSelectionMode(value as SelectionMode)}
                  className='gap-4'
                >
                  <TabsList className='w-full sm:w-fit'>
                    <TabsTrigger value='offerings' className='flex-1 sm:flex-none'>
                      <Layers3 className='h-4 w-4' /> Courses &amp; bundles
                    </TabsTrigger>
                    <TabsTrigger value='classes' className='flex-1 sm:flex-none'>
                      <ListChecks className='h-4 w-4' /> Class list
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value='offerings' className='space-y-4'>
                    <ScrollArea className='h-[360px] pr-3'>
                      {offeringGroups.length === 0 ? (
                        <p className='text-muted-foreground py-12 text-center text-sm'>
                          No classes to share yet.
                        </p>
                      ) : (
                        <div className='grid gap-2 lg:grid-cols-2'>
                          {offeringGroups.map(group => {
                            const selectedCount = group.classIds.filter(id =>
                              selectedClasses.includes(id)
                            ).length;
                            const checked =
                              selectedCount === group.classIds.length
                                ? true
                                : selectedCount > 0
                                  ? 'indeterminate'
                                  : false;
                            return (
                              <label
                                key={group.key}
                                className={cn(
                                  'flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors',
                                  selectedCount > 0
                                    ? 'border-primary bg-primary/5'
                                    : 'hover:bg-muted/50'
                                )}
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={() => toggleClassSet(group.classIds)}
                                  className='mt-0.5'
                                  aria-label={`Select ${group.title}`}
                                />
                                <div className='min-w-0 flex-1 space-y-2'>
                                  <div className='flex flex-wrap items-center gap-2'>
                                    <span className='min-w-0 flex-1 truncate text-sm font-medium'>
                                      {group.title}
                                    </span>
                                    <Badge variant='secondary' className='capitalize'>
                                      {group.kind === 'program'
                                        ? 'Bundle'
                                        : group.kind === 'course'
                                          ? 'Course'
                                          : 'Class'}
                                    </Badge>
                                  </div>
                                  <p className='text-muted-foreground text-xs'>{group.subtitle}</p>
                                  <div className='text-muted-foreground flex flex-wrap gap-1.5 text-xs'>
                                    {group.deliveryLabels.map(label => (
                                      <Badge key={label} variant='outline'>
                                        {label}
                                      </Badge>
                                    ))}
                                  </div>
                                  <div className='text-muted-foreground flex flex-wrap gap-1.5 text-xs'>
                                    {group.classes.slice(0, 3).map(klass => (
                                      <span
                                        key={klass.uuid}
                                        className='bg-muted rounded px-1.5 py-0.5'
                                      >
                                        {klass.title}
                                      </span>
                                    ))}
                                    {group.classes.length > 3 && (
                                      <span className='bg-muted rounded px-1.5 py-0.5'>
                                        +{group.classes.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                    <div className='text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-xs'>
                      <span>
                        {selectedClasses.length} of {classes.length} class
                        {classes.length === 1 ? '' : 'es'} selected
                      </span>
                      <div className='flex gap-2'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() =>
                            setSelectedClasses(classes.flatMap(c => (c.uuid ? [c.uuid] : [])))
                          }
                        >
                          Select all
                        </Button>
                        <Button variant='ghost' size='sm' onClick={() => setSelectedClasses([])}>
                          Clear
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value='classes' className='space-y-4'>
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
                      {filteredClasses.length === 0 ? (
                        <p className='text-muted-foreground py-12 text-center text-sm'>
                          No classes to select.
                        </p>
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
                                  onCheckedChange={() =>
                                    setSelectedClasses(s => toggle(s, item.id))
                                  }
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
                          onClick={() => setSelectedClasses(filteredClasses.map(c => c.id))}
                        >
                          Select all
                        </Button>
                        <Button variant='ghost' size='sm' onClick={() => setSelectedClasses([])}>
                          Clear
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                <div className='text-muted-foreground flex items-center justify-between text-xs'>
                  <span>
                    Leaving this empty sends an organisation invite without surfacing a class.
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2 — Recipients */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <UsersRound className='h-4 w-4' /> Add recipients
                </CardTitle>
                <CardDescription>
                  Pick a student group, paste addresses, or both. Everyone is invited individually
                  and decides for themselves.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                {groups.length > 0 && (
                  <div>
                    <Label className='text-muted-foreground mb-2 block text-xs uppercase'>
                      Student groups
                    </Label>
                    <div className='grid gap-2 sm:grid-cols-2'>
                      {groups.map(group => {
                        const checked = selectedGroups.includes(group.uuid);
                        return (
                          <label
                            key={group.uuid}
                            className={cn(
                              'flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors',
                              checked ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                            )}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => setSelectedGroups(g => toggle(g, group.uuid))}
                              className='mt-0.5'
                            />
                            <div className='min-w-0 flex-1'>
                              <div className='truncate text-sm font-medium'>{group.name}</div>
                              <div className='text-muted-foreground truncate text-xs'>
                                {Number(group.member_count ?? 0)} member
                                {Number(group.member_count ?? 0) === 1 ? '' : 's'}
                                {group.group_type ? ` · ${group.group_type}` : ''}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <Label
                    htmlFor='emails'
                    className='text-muted-foreground mb-2 block text-xs uppercase'
                  >
                    Recipient emails
                  </Label>
                  <Textarea
                    id='emails'
                    placeholder='Jane Doe <jane@example.com>, sam@example.com'
                    value={emails}
                    onChange={e => setEmails(e.target.value)}
                    rows={6}
                  />
                  <div className='text-muted-foreground mt-2 flex flex-wrap items-center gap-2 text-xs'>
                    <Badge variant='outline'>{recipients.length} valid</Badge>
                    {invalidRecipients.length > 0 && (
                      <Badge variant='destructive'>{invalidRecipients.length} invalid</Badge>
                    )}
                    <span className='sm:ml-auto'>
                      Separate with commas, semicolons, spaces, or new lines.
                    </span>
                  </div>
                  {invalidRecipients.length > 0 && (
                    <p className='text-destructive mt-1 text-xs'>
                      Ignored: {invalidRecipients.slice(0, 3).join(', ')}
                      {invalidRecipients.length > 3
                        ? `, +${invalidRecipients.length - 3} more`
                        : ''}
                    </p>
                  )}
                </div>
                <div className='bg-muted/50 space-y-1.5 rounded-md p-3 text-sm'>
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground'>Valid addresses parsed</span>
                    <span className='font-semibold tabular-nums'>
                      {recipients.length} student{recipients.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  {selectedGroups.length > 0 && (
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground'>
                        From {selectedGroups.length} group{selectedGroups.length === 1 ? '' : 's'}
                      </span>
                      <span className='font-semibold tabular-nums'>
                        {groupReach} student{groupReach === 1 ? '' : 's'}
                      </span>
                    </div>
                  )}
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

          {/* Step 3 — Message & send */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <Mail className='h-4 w-4' /> Message &amp; send
                </CardTitle>
                <CardDescription>
                  Pick a template, review the audience, and send the invitations.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <Label className='text-muted-foreground mb-2 block text-xs uppercase'>
                    Template
                  </Label>
                  <div className='flex flex-wrap gap-2'>
                    {TEMPLATES.map(t => (
                      <Button
                        key={t.id}
                        type='button'
                        size='sm'
                        variant={templateId === t.id ? 'default' : 'outline'}
                        onClick={() => {
                          setTemplateId(t.id);
                          setMessage(t.body);
                        }}
                      >
                        {t.name}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor='message'
                    className='text-muted-foreground mb-2 block text-xs uppercase'
                  >
                    Message
                  </Label>
                  <Textarea
                    id='message'
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={7}
                  />
                  <p className='text-muted-foreground mt-1 text-xs'>
                    Placeholders <code>{'{{student}}'}</code>, <code>{'{{school}}'}</code>,{' '}
                    <code>{'{{sender}}'}</code> are filled per recipient.
                  </p>
                </div>

                <div className='bg-muted/30 rounded-md border p-3 text-sm'>
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground'>Ready to invite</span>
                    <span className='font-semibold'>
                      {recipients.length} address{recipients.length === 1 ? '' : 'es'}
                      {selectedGroups.length > 0
                        ? ` + ${selectedGroups.length} group${selectedGroups.length === 1 ? '' : 's'}`
                        : ''}
                    </span>
                  </div>
                  {selectedGroups.length > 0 && (
                    <p className='text-muted-foreground mt-1 text-xs'>
                      Student groups currently reach about {groupReach} member
                      {groupReach === 1 ? '' : 's'} before server-side de-duplication.
                    </p>
                  )}
                  {selectedClasses.length > 0 && (
                    <p className='text-muted-foreground mt-1 text-xs'>
                      {selectedClasses.length} class{selectedClasses.length === 1 ? '' : 'es'} will
                      be shown to each student once they accept — they still enrol themselves.
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

          {/* Nav */}
          <div className='flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-between'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setStep(s => Math.max(1, s - 1) as 1 | 2 | 3)}
              disabled={step === 1}
            >
              <ArrowLeft className='mr-2 h-4 w-4' /> Back
            </Button>
            {step < 3 ? (
              <Button
                type='button'
                onClick={() => setStep(s => Math.min(3, s + 1) as 1 | 2 | 3)}
                disabled={!canNext}
              >
                Next <ArrowRight className='ml-2 h-4 w-4' />
              </Button>
            ) : (
              <Button type='button' onClick={send} disabled={sending || !canSend}>
                <Send className='mr-2 h-4 w-4' />{' '}
                {sending
                  ? 'Sending…'
                  : `Send invitation${recipients.length + selectedGroups.length === 1 ? '' : 's'}`}
              </Button>
            )}
          </div>
        </>
      )}

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
              <Loader2 className='h-4 w-4 animate-spin' /> Loading invitations…
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
                          ? ` · expires ${new Date(invite.expires_at).toLocaleDateString()}`
                          : ''}
                        {invite.accepted_at
                          ? ` · accepted ${new Date(invite.accepted_at).toLocaleDateString()}`
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
    </div>
  );
}
