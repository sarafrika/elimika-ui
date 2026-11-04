'use client';

import {
  CheckCircle2,
  Lock,
  MessageSquareText,
  PencilLine,
  RotateCcw,
  Ruler,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { type ReactNode, useMemo, useRef, useState } from 'react';

import {
  SectionCardSkeleton,
  StatCard,
  type StatusTone,
  statusToneClass,
  surfaceTheme,
} from '@/components/data-display';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { SectionBoundary } from '../components/section-boundary';
import {
  type SmsTemplate,
  useResetSmsTemplate,
  useSaveSmsTemplate,
  useSendSmsTest,
  useSmsTemplates,
} from '../hooks/use-sms-templates';
import {
  analyseSmsTemplate,
  insertPlaceholder,
  type SmsAnalysis,
  type SmsIssueTone,
} from '../lib/sms-template-checks';

const ISSUE_TONE: Record<SmsIssueTone, StatusTone> = {
  error: 'destructive',
  warning: 'warning',
  ok: 'success',
};

const editedAt = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Africa/Nairobi',
});

type Notice = { tone: StatusTone; text: string } | null;

const NOTICE_LABEL: Record<StatusTone, string> = {
  success: 'Done',
  info: 'Done',
  neutral: 'Done',
  warning: 'Note',
  destructive: 'Not saved',
};

/** Admin › Platform › SMS messages: every text the platform sends, editable within its checks. */
export function SmsMessagesPage() {
  const { templates, query } = useSmsTemplates();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<Notice>(null);

  const selectedKey = params.get('template');
  const current = templates.find(t => t.key === selectedKey) ?? templates[0];

  const groups = useMemo(() => {
    const byGroup = new Map<string, SmsTemplate[]>();
    for (const template of templates) {
      byGroup.set(template.group, [...(byGroup.get(template.group) ?? []), template]);
    }
    return [...byGroup.entries()];
  }, [templates]);

  const pick = (key: string) => {
    setNotice(null);
    const next = new URLSearchParams(params.toString());
    next.set('template', key);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const editedCount = templates.filter(t => t.edited).length;

  return (
    <div className={`${surfaceTheme.pageWide} py-4`}>
      <div className={surfaceTheme.pageStack}>
        <PageHeader
          eyebrow='Platform · Messages'
          title='SMS messages'
          description='Every text the platform sends, in one place. Edit the wording, keep the placeholders it needs, and check it still fits one SMS before you save.'
        />

        <div className={surfaceTheme.statGrid}>
          <StatCard
            label='Templates'
            value={query.isLoading ? '—' : templates.length}
            hint='Sent by the platform'
            icon={MessageSquareText}
            tone='info'
          />
          <StatCard
            label='Edited'
            value={query.isLoading ? '—' : editedCount}
            hint='Differ from the default'
            icon={PencilLine}
            tone={editedCount ? 'warning' : 'neutral'}
          />
          <StatCard
            label='Sender ID'
            value='Sarafrika'
            hint='Celcom, transactional'
            icon={ShieldCheck}
            tone='success'
          />
          <StatCard
            label='Segment rule'
            value='160'
            hint='GSM-7 characters, worst case'
            icon={Ruler}
            tone='neutral'
          />
        </div>

        <SectionBoundary
          label='the SMS messages'
          loading={query.isLoading}
          error={query.error}
          empty={!query.isLoading && templates.length === 0}
          onRetry={query.refetch}
          emptyTitle='No SMS messages yet'
          emptyDescription='The platform has not registered any SMS templates.'
          skeleton={<SmsMessagesSkeleton />}
        >
          {current ? (
            <>
              <TemplatePicker groups={groups} currentKey={current.key} drafts={drafts} onPick={pick} />
              <TemplateEditor
                key={current.key}
                template={current}
                draft={drafts[current.key] ?? current.body}
                notice={notice}
                setNotice={setNotice}
                onDraft={value => {
                  setNotice(null);
                  setDrafts(all => ({ ...all, [current.key]: value }));
                }}
                onSettled={body => setDrafts(all => ({ ...all, [current.key]: body }))}
              />
            </>
          ) : null}
        </SectionBoundary>
      </div>
    </div>
  );
}

function TemplatePicker({
  groups,
  currentKey,
  drafts,
  onPick,
}: {
  groups: [string, SmsTemplate[]][];
  currentKey: string;
  drafts: Record<string, string>;
  onPick: (key: string) => void;
}) {
  return (
    <div className={cn(surfaceTheme.card, 'flex flex-wrap items-center gap-x-6 gap-y-3 p-3')}>
      {groups.map(([group, items]) => (
        <div key={group} className='flex flex-wrap items-center gap-1.5'>
          <span className={cn(surfaceTheme.sectionLabel, 'mr-1.5')}>{group}</span>
          <div role='tablist' aria-label={group} className='flex flex-wrap gap-1'>
            {items.map(template => {
              const on = template.key === currentKey;
              const unsaved = drafts[template.key] !== undefined && drafts[template.key] !== template.body;
              const badge = !template.enabled
                ? { label: 'Off', tone: 'neutral' as const }
                : template.edited
                  ? { label: 'Edited', tone: 'warning' as const }
                  : { label: 'Default', tone: 'success' as const };
              return (
                <button
                  key={template.key}
                  type='button'
                  role='tab'
                  aria-selected={on}
                  onClick={() => onPick(template.key)}
                  className={cn(
                    'inline-flex min-h-10 items-center gap-2 rounded-md px-3.5 text-sm whitespace-nowrap transition-colors',
                    on
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground font-medium'
                  )}
                >
                  {template.name}
                  {unsaved ? (
                    <span className='bg-warning size-1.5 rounded-full' aria-label='Unsaved changes' />
                  ) : null}
                  <span
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                      statusToneClass[badge.tone]
                    )}
                  >
                    {badge.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function TemplateEditor({
  template,
  draft,
  notice,
  setNotice,
  onDraft,
  onSettled,
}: {
  template: SmsTemplate;
  draft: string;
  notice: Notice;
  setNotice: (notice: Notice) => void;
  onDraft: (value: string) => void;
  onSettled: (body: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const save = useSaveSmsTemplate();
  const reset = useResetSmsTemplate();
  const sendTest = useSendSmsTest();

  const analysis = useMemo(
    () => analyseSmsTemplate(draft, template.placeholders, template.security),
    [draft, template.placeholders, template.security]
  );
  const dirty = draft !== template.body;
  const busy = save.isPending || reset.isPending || sendTest.isPending;
  const canSave = dirty && !analysis.blocking && !busy;
  const fail = (error: unknown) =>
    setNotice({
      tone: 'destructive',
      text: error instanceof Error ? error.message : 'That did not go through. Try again.',
    });

  const onSave = () => {
    if (!canSave) return;
    save.mutate(
      { key: template.key, body: draft, enabled: template.enabled },
      {
        onSuccess: updated => {
          onSettled(updated.body);
          setNotice({
            tone: 'success',
            text: `Saved. The next ${updated.name.toLowerCase()} SMS uses this wording.`,
          });
        },
        onError: fail,
      }
    );
  };

  const onToggle = (enabled: boolean) => {
    save.mutate(
      { key: template.key, body: template.body, enabled },
      {
        onSuccess: () =>
          setNotice({
            tone: enabled ? 'success' : 'neutral',
            text: enabled ? 'Turned on.' : 'Turned off. This message will not be sent.',
          }),
        onError: fail,
      }
    );
  };

  const onReset = () => {
    if (!template.edited) {
      onDraft(template.default_body);
      return;
    }
    reset.mutate(template.key, {
      onSuccess: updated => {
        onSettled(updated.body);
        setNotice({ tone: 'success', text: 'Back to the default wording.' });
      },
      onError: fail,
    });
  };

  const onTest = () => {
    sendTest.mutate(template.key, {
      onSuccess: result =>
        setNotice(
          result.sent
            ? {
                tone: 'success',
                text: `Test sent${result.to_masked ? ` to ${result.to_masked}` : ''} with the sample values.`,
              }
            : { tone: 'warning', text: 'No test sent. Add a phone number to your profile first.' }
        ),
      onError: fail,
    });
  };

  const onInsert = (name: string) => {
    const caret = textareaRef.current?.selectionStart ?? draft.length;
    const next = insertPlaceholder(draft, name, caret);
    onDraft(next.text);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(next.caret, next.caret);
    });
  };

  const saveLabel = analysis.blocking
    ? 'Fix the checks to save'
    : save.isPending
      ? 'Saving…'
      : dirty
        ? 'Save message'
        : 'Saved';

  return (
    <div className='grid grid-cols-1 items-stretch gap-4 md:grid-cols-[minmax(0,1fr)_270px] min-[1360px]:grid-cols-[minmax(0,1.35fr)_minmax(250px,0.8fr)_280px]'>
      <section className={cn(surfaceTheme.cardPadded, 'flex min-w-0 flex-col gap-4')}>
        <CardHead title={template.name}>
          {template.security ? (
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                statusToneClass.info
              )}
            >
              <Lock className='size-3' />
              Security code · always on
            </span>
          ) : (
            <label className='flex items-center gap-2 text-sm font-semibold'>
              <span className={template.enabled ? 'text-success' : 'text-muted-foreground'}>
                {template.enabled ? 'Sending' : 'Not sent'}
              </span>
              <Switch
                checked={template.enabled}
                disabled={busy}
                onCheckedChange={onToggle}
                aria-label={`Send the ${template.name} SMS`}
              />
            </label>
          )}
        </CardHead>
        <p className='text-muted-foreground -mt-2 text-sm'>{template.trigger}</p>

        <div className='flex flex-col gap-2'>
          <span className={surfaceTheme.sectionLabel}>Message</span>
          <Textarea
            ref={textareaRef}
            value={draft}
            onChange={event => onDraft(event.target.value)}
            rows={5}
            spellCheck
            aria-label={`${template.name} wording`}
            className='min-h-[150px] resize-y text-[15px] leading-relaxed'
          />
          <div className='flex flex-wrap items-center justify-between gap-2 text-xs'>
            <span className='text-muted-foreground'>
              Placeholders are filled in when the message is sent.
            </span>
            <CountLabel analysis={analysis} />
          </div>
        </div>

        <div className='flex flex-col gap-2'>
          <span className={surfaceTheme.sectionLabel}>Checks</span>
          <ul className='flex flex-col gap-1.5'>
            {analysis.issues.map(issue => (
              <li
                key={`${issue.tag}-${issue.text}`}
                className={cn(
                  'flex items-start gap-2.5 rounded-md border px-3 py-2 text-sm',
                  statusToneClass[ISSUE_TONE[issue.tone]]
                )}
              >
                <span className='shrink-0 font-semibold'>{issue.tag}</span>
                <span className='text-foreground/80'>{issue.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className='mt-auto flex flex-col gap-3'>
          <div className='flex flex-wrap gap-2'>
            <Button className='rounded-md' disabled={!canSave} onClick={onSave}>
              {saveLabel}
            </Button>
            <Button
              variant='outline'
              className='rounded-md'
              disabled={busy || dirty}
              title={dirty ? 'Save first: the test uses the saved wording.' : undefined}
              onClick={onTest}
            >
              <Send className='mr-2 size-4' />
              {sendTest.isPending ? 'Sending…' : 'Send test to my phone'}
            </Button>
            <Button
              variant='ghost'
              className='text-primary rounded-md'
              disabled={busy || (!template.edited && draft === template.default_body)}
              onClick={onReset}
            >
              <RotateCcw className='mr-2 size-4' />
              Reset to default
            </Button>
          </div>
          <p className='text-muted-foreground text-xs'>
            {template.edited
              ? `Edited${template.updated_by_name ? ` by ${template.updated_by_name}` : ''}${
                  template.updated_at ? ` · ${editedAt.format(new Date(template.updated_at))}` : ''
                }`
              : 'Using the default wording'}
          </p>
          {notice ? (
            <div
              role='status'
              className={cn(
                'flex items-center gap-2 rounded-md border px-3 py-2 text-sm',
                statusToneClass[notice.tone]
              )}
            >
              <CheckCircle2 className='size-4 shrink-0' />
              <span className='font-semibold'>{NOTICE_LABEL[notice.tone]}</span>
              <span className='text-foreground/80'>{notice.text}</span>
            </div>
          ) : null}
        </div>
      </section>

      <section className={cn(surfaceTheme.cardPadded, 'flex min-w-0 flex-col gap-3')}>
        <CardHead title='Placeholders'>
          <span className='text-muted-foreground text-xs font-medium'>
            {template.placeholders.filter(p => analysis.used.includes(p.name)).length} of{' '}
            {template.placeholders.length} in use
          </span>
        </CardHead>
        <p className='text-muted-foreground text-sm'>
          Only these work in “{template.name}”. Click one to add it to the message.
        </p>
        <ul className='flex flex-col gap-2'>
          {template.placeholders.map(placeholder => {
            const used = analysis.used.includes(placeholder.name);
            return (
              <li key={placeholder.name}>
                <button
                  type='button'
                  onClick={() => onInsert(placeholder.name)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left transition-colors',
                    used
                      ? 'border-success/30 bg-success/5'
                      : 'border-border/70 bg-card hover:bg-muted/50'
                  )}
                >
                  <span
                    className={cn(
                      'w-[124px] shrink-0 truncate rounded-md px-2 py-1 font-mono text-xs font-semibold',
                      used ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'
                    )}
                  >
                    {`{${placeholder.name}}`}
                  </span>
                  <span className='min-w-0 flex-1'>
                    <span className='text-foreground block truncate text-sm font-medium'>
                      {placeholder.label}
                      {placeholder.required ? (
                        <span className='text-muted-foreground font-normal'> · required</span>
                      ) : null}
                    </span>
                    <span className='text-muted-foreground block truncate text-xs'>
                      e.g. {placeholder.sample} · ≤{placeholder.max_length}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'shrink-0 text-xs font-semibold',
                      used ? 'text-success' : 'text-primary'
                    )}
                  >
                    {used ? 'In use' : '+ Insert'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section
        className={cn(
          surfaceTheme.cardPadded,
          'flex min-w-0 flex-col gap-3 md:col-span-2 min-[1360px]:col-span-1'
        )}
      >
        <CardHead title='Preview'>
          <span className='text-muted-foreground text-xs font-medium'>Sender Sarafrika</span>
        </CardHead>
        <PhonePreview text={analysis.preview} />
        <p className='text-muted-foreground text-center text-xs'>
          Sample values · {analysis.preview.length} chars
        </p>
      </section>
    </div>
  );
}

function CardHead({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className='flex min-h-6 items-center justify-between gap-2'>
      <h2 className='text-foreground m-0 text-base leading-6 font-bold'>{title}</h2>
      {children}
    </div>
  );
}

function CountLabel({ analysis }: { analysis: SmsAnalysis }) {
  const over = analysis.worstLength > analysis.limit;
  return (
    <span className={cn('font-mono font-semibold', over ? 'text-destructive' : 'text-success')}>
      {analysis.worstLength} / {analysis.limit} worst case ·{' '}
      {analysis.segments === 1 ? '1 segment' : `${analysis.segments} segments`}
    </span>
  );
}

/** A phone thread showing the message as the sample values fill it. */
function PhonePreview({ text }: { text: string }) {
  return (
    <div className='mx-auto w-full max-w-[260px] flex-1 rounded-[30px] bg-[var(--el-neutral-950)] p-2.5'>
      <div className='flex h-full min-h-[300px] flex-col rounded-[22px] bg-[var(--el-neutral-100)]'>
        <div className='flex flex-col items-center gap-1 border-b border-[var(--el-neutral-200)] py-3'>
          <span className='flex size-9 items-center justify-center rounded-full bg-[var(--el-neutral-400)] text-sm font-bold text-[var(--el-neutral-0)]'>
            S
          </span>
          <span className='text-[11px] font-semibold text-[var(--el-neutral-900)]'>Sarafrika</span>
        </div>
        <div className='flex flex-1 flex-col gap-2 p-3'>
          <span className='text-center text-[10px] text-[var(--el-neutral-500)]'>Today 10:43</span>
          <p className='max-w-[92%] rounded-2xl rounded-bl-sm bg-[var(--el-neutral-0)] px-3 py-2 text-[12.5px] leading-snug break-words whitespace-pre-wrap text-[var(--el-neutral-900)] shadow-sm'>
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}

export function SmsMessagesSkeleton() {
  return (
    <div className='flex flex-col gap-4'>
      <Skeleton className='h-14 w-full rounded-md' />
      <div className='grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_270px] min-[1360px]:grid-cols-[minmax(0,1.35fr)_minmax(250px,0.8fr)_280px]'>
        <SectionCardSkeleton rows={6} />
        <SectionCardSkeleton rows={5} />
        <div className='md:col-span-2 min-[1360px]:col-span-1'>
          <SectionCardSkeleton rows={4} />
        </div>
      </div>
    </div>
  );
}
