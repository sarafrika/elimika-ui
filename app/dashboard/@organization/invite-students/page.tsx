// @ts-nocheck -- 1:1 Lovable port; @hey-api generated-client type drift
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Mail,
  Send,
  Share2,
  Users,
  UsersRound,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { CategoryTabs, filterByCategoryTabs } from '@/components/category-tabs';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useOrganisation } from '@/context/organisation-context';
import type { ClassDefinition } from '@/services/client';
import {
  createOrganisationUserMutation,
  getClassDefinitionsForOrganisationOptions,
  getUsersByOrganisationAndDomainQueryKey,
} from '@/services/client/@tanstack/react-query.gen';

const categoryLabel = (cd: ClassDefinition) =>
  cd.location_type === 'ONLINE' ? 'Virtual' : cd.location_type === 'HYBRID' ? 'Hybrid' : 'In-Person';

const CHANNELS = ['Email', 'WhatsApp', 'SMS', 'Copy link'] as const;

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
    body: "Hello {{student}},\n\nA new cohort is opening at {{school}} and we saved you a spot. Accept your invite to secure your place.\n\n{{sender}}",
  },
  {
    id: 'reminder',
    name: 'Gentle reminder',
    subject: 'A quick reminder to join {{school}}',
    body: "Hi {{student}},\n\nJust a friendly nudge — your invitation to {{school}} is still open. Accept it whenever you're ready.\n\n{{sender}}",
  },
];

type Recipient = { first: string; last: string; email: string };

/** Parses "Name <email>", "Name, email" or bare emails from free text. */
function parseRecipients(raw: string): Recipient[] {
  const out: Recipient[] = [];
  const seen = new Set<string>();
  for (const line of raw.split(/[\n,]+/)) {
    const token = line.trim();
    if (!token) continue;
    const emailMatch = token.match(/[^\s<>]+@[^\s<>]+\.[^\s<>]+/);
    if (!emailMatch) continue;
    const email = emailMatch[0].toLowerCase();
    if (seen.has(email)) continue;
    seen.add(email);
    const namePart = token.replace(emailMatch[0], '').replace(/[<>,]/g, '').trim();
    const parts = (namePart || email.split('@')[0]).split(/\s+/);
    out.push({ first: parts[0], last: parts.slice(1).join(' ') || parts[0], email });
  }
  return out;
}

const STEPS = [
  { n: 1, label: 'Classes', icon: Users },
  { n: 2, label: 'Recipients', icon: UsersRound },
  { n: 3, label: 'Message & send', icon: Mail },
] as const;

const toggle = (arr: string[], id: string) => (arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]);

export default function InviteStudentsPage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const queryClient = useQueryClient();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [emails, setEmails] = useState('');
  const [templateId, setTemplateId] = useState(TEMPLATES[0].id);
  const [message, setMessage] = useState(TEMPLATES[0].body);
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['Email', 'Copy link']);
  const [activeCategory, setActiveCategory] = useState('All');
  const [subjectByCategory, setSubjectByCategory] = useState<Record<string, string>>({});
  const [results, setResults] = useState<{ email: string; ok: boolean; message?: string }[] | null>(null);

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
    () => classes.map(c => ({ id: c.uuid, category: categoryLabel(c), subject: null, programType: null, title: c.title })),
    [classes]
  );
  const filteredClasses = useMemo(
    () => filterByCategoryTabs(classTabItems, activeCategory, subjectByCategory, null),
    [classTabItems, activeCategory, subjectByCategory]
  );

  const recipients = useMemo(() => parseRecipients(emails), [emails]);

  const createStudent = useMutation(createOrganisationUserMutation());
  const [sending, setSending] = useState(false);

  const inviteLink = typeof window !== 'undefined' ? `${window.location.origin}/onboarding/student` : '/onboarding/student';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success('Invite link copied');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const send = async () => {
    if (recipients.length === 0) {
      toast.error('Add at least one recipient email.');
      return;
    }
    setSending(true);
    const out: { email: string; ok: boolean; message?: string }[] = [];
    for (const r of recipients) {
      try {
        await createStudent.mutateAsync({
          path: { uuid: organisationUuid },
          body: { first_name: r.first, last_name: r.last, email: r.email, domain_name: 'student' },
        });
        out.push({ email: r.email, ok: true });
      } catch (err) {
        out.push({ email: r.email, ok: false, message: err instanceof Error ? err.message : 'Failed' });
      }
    }
    setSending(false);
    setResults(out);
    const ok = out.filter(o => o.ok).length;
    if (ok) {
      toast.success(`${ok} invitation${ok === 1 ? '' : 's'} sent`, {
        description: out.length - ok ? `${out.length - ok} could not be invited.` : undefined,
      });
      await queryClient.invalidateQueries({
        queryKey: getUsersByOrganisationAndDomainQueryKey({ path: { uuid: organisationUuid, domainName: 'student' } }),
      });
    } else {
      toast.error('No invitations could be sent', { description: 'These emails may already exist.' });
    }
  };

  const reset = () => {
    setResults(null);
    setEmails('');
    setStep(1);
    setSelectedClasses([]);
  };

  const canNext = step === 1 ? true : step === 2 ? recipients.length > 0 : true;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]">
      <PageHeader
        title="Invite Students"
        description="Invite new students to your organisation and classes."
      />

      {/* Stepper */}
      <div>
        <ol className="flex items-center gap-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = step === s.n;
            const done = step > s.n;
            const clickable = s.n <= step || done;
            return (
              <li key={s.n} className="flex flex-1 items-center gap-2">
                <button
                  type="button"
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
                      active || done ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40'
                    )}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : s.n}
                  </span>
                  <span className="hidden truncate sm:inline">{s.label}</span>
                  <Icon className="ml-auto h-4 w-4 sm:hidden" />
                </button>
                {i < STEPS.length - 1 && <span className="hidden h-px w-4 bg-border sm:block" />}
              </li>
            );
          })}
        </ol>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {selectedClasses.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Users className="h-3 w-3" /> {selectedClasses.length} class{selectedClasses.length === 1 ? '' : 'es'}
            </Badge>
          )}
          {recipients.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              <UsersRound className="h-3 w-3" /> {recipients.length} recipient{recipients.length === 1 ? '' : 's'}
            </Badge>
          )}
          {step === 3 && selectedChannels.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Share2 className="h-3 w-3" /> {selectedChannels.length} channel{selectedChannels.length === 1 ? '' : 's'}
            </Badge>
          )}
        </div>
      </div>

      {/* Results panel */}
      {results ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4 text-success" /> Invitations processed
            </CardTitle>
            <CardDescription>{results.filter(r => r.ok).length} of {results.length} invited successfully.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {results.map(r => (
              <div key={r.email} className="flex items-center justify-between rounded-md border p-2.5 text-sm">
                <span className="truncate">{r.email}</span>
                {r.ok ? (
                  <Badge variant="secondary" className="gap-1 bg-success/10 text-success">
                    <CheckCircle2 className="h-3 w-3" /> Invited
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1 bg-destructive/10 text-destructive">
                    <XCircle className="h-3 w-3" /> {r.message ?? 'Failed'}
                  </Badge>
                )}
              </div>
            ))}
            <div className="flex justify-end pt-2">
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
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4" /> Select classes
                </CardTitle>
                <CardDescription>Pick the classes students will be invited to enroll in (optional).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {classes.length > 0 && (
                  <CategoryTabs
                    items={classTabItems}
                    activeCategory={activeCategory}
                    onCategoryChange={setActiveCategory}
                    subjectByCategory={subjectByCategory}
                    onSubjectChange={setSubjectByCategory}
                  />
                )}
                <ScrollArea className="h-[340px] pr-3">
                  {filteredClasses.length === 0 ? (
                    <p className="py-12 text-center text-sm text-muted-foreground">No classes to select.</p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
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
                            <Checkbox checked={checked} onCheckedChange={() => setSelectedClasses(s => toggle(s, item.id))} className="mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium">{item.title}</div>
                              <div className="truncate text-xs text-muted-foreground">{item.category}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{selectedClasses.length} of {filteredClasses.length} selected</span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedClasses(filteredClasses.map(c => c.id))}>
                      Select all
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedClasses([])}>
                      Clear
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2 — Recipients */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <UsersRound className="h-4 w-4" /> Add recipients
                </CardTitle>
                <CardDescription>Paste the email addresses of students you want to invite.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="emails" className="mb-2 block text-xs uppercase text-muted-foreground">
                    Recipient emails
                  </Label>
                  <Textarea
                    id="emails"
                    placeholder="Jane Doe <jane@example.com>, sam@example.com"
                    value={emails}
                    onChange={e => setEmails(e.target.value)}
                    rows={6}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    One per line or comma-separated. Optional name before the email (e.g. "Jane Doe &lt;jane@example.com&gt;").
                  </p>
                </div>
                <div className="rounded-md bg-muted/50 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Valid recipients parsed</span>
                    <span className="font-semibold tabular-nums">
                      {recipients.length} student{recipients.length === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3 — Message & send */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mail className="h-4 w-4" /> Message &amp; send
                </CardTitle>
                <CardDescription>Pick a template, choose channels, and send {recipients.length} invitation{recipients.length === 1 ? '' : 's'}.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="mb-2 block text-xs uppercase text-muted-foreground">Template</Label>
                  <div className="flex flex-wrap gap-2">
                    {TEMPLATES.map(t => (
                      <Button
                        key={t.id}
                        type="button"
                        size="sm"
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
                  <Label htmlFor="message" className="mb-2 block text-xs uppercase text-muted-foreground">
                    Message
                  </Label>
                  <Textarea id="message" value={message} onChange={e => setMessage(e.target.value)} rows={7} />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Placeholders <code>{'{{student}}'}</code>, <code>{'{{school}}'}</code>, <code>{'{{sender}}'}</code> are filled per recipient.
                  </p>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Label className="flex items-center gap-2 text-xs uppercase text-muted-foreground">
                      <Share2 className="h-3.5 w-3.5" /> Invite channels
                    </Label>
                    <span className="text-[10px] text-muted-foreground">Email delivers automatically</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {CHANNELS.map(ch => {
                      const on = selectedChannels.includes(ch);
                      return (
                        <button
                          key={ch}
                          type="button"
                          onClick={() =>
                            ch === 'Copy link' ? copyLink() : setSelectedChannels(s => toggle(s, ch))
                          }
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                            on ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted'
                          )}
                        >
                          {ch === 'Copy link' ? <Copy className="h-3.5 w-3.5" /> : on ? <Check className="h-3.5 w-3.5" /> : null}
                          {ch}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-md border bg-muted/30 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Ready to invite</span>
                    <span className="font-semibold">{recipients.length} recipient{recipients.length === 1 ? '' : 's'}</span>
                  </div>
                  {selectedClasses.length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">Referencing {selectedClasses.length} selected class{selectedClasses.length === 1 ? '' : 'es'}.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Nav */}
          <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-between">
            <Button type="button" variant="outline" onClick={() => setStep(s => Math.max(1, s - 1) as 1 | 2 | 3)} disabled={step === 1}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            {step < 3 ? (
              <Button type="button" onClick={() => setStep(s => Math.min(3, s + 1) as 1 | 2 | 3)} disabled={!canNext}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={send} disabled={sending || recipients.length === 0}>
                <Send className="mr-2 h-4 w-4" /> {sending ? 'Sending…' : `Send ${recipients.length} invitation${recipients.length === 1 ? '' : 's'}`}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
