'use client';

import { GraduationCap } from 'lucide-react';
import type { ReactNode } from 'react';
import { useId } from 'react';

import type { RequirementAnswer } from '@/app/dashboard/organisation/courses/apply/[courseId]/_components/apply-model';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cellKey, formatRateAmount, getTrainingMethod, parseRate } from '@/lib/rate-card';
import { cn } from '@/lib/utils';
import type { ProgramRequirement } from '@/services/client';
import { type AgeGroupDraft, formatHours, type PlanLesson, totalHours } from '../age-groups/model';
import { groupColour } from '../age-groups/step-age-groups';
import type { DeliveryDraft } from '../delivery-model';
import { type ApplyItem, type ApplyStepId, ageRangeLabel } from '../types';
import { ErrorList } from './error-list';

/** Step 5: every section once, each a click from its step, plus the note. */
export function StepReview({
  item,
  groups,
  lessons,
  delivery,
  answers,
  programRequirements,
  note,
  onNote,
  onEdit,
  blocked,
  creator,
}: {
  item: ApplyItem;
  groups: AgeGroupDraft[];
  lessons: PlanLesson[];
  delivery: DeliveryDraft;
  answers: RequirementAnswer[];
  programRequirements: ProgramRequirement[];
  note: string;
  onNote: (note: string) => void;
  onEdit: (step: ApplyStepId) => void;
  blocked: boolean;
  creator: string;
}) {
  const noteId = useId();
  const currency = delivery.card.currency;

  return (
    <div className='space-y-4'>
      {blocked ? <ErrorList messages={['Fix the steps marked in red before you submit.']} /> : null}

      <Section title={item.kind === 'program' ? 'Programme' : 'Course'} action='Change' onEdit={() => onEdit('course')}>
        <div className='flex items-center gap-3'>
          <span className='bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg'>
            <GraduationCap aria-hidden className='size-5' />
          </span>
          <div className='min-w-0'>
            <p className='text-foreground font-semibold'>{item.title}</p>
            <p className='text-muted-foreground text-xs'>
              {[item.code, item.category, item.creator ? `by ${item.creator}` : null, `ages ${ageRangeLabel(item.ageMin, item.ageMax)}`]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        </div>
      </Section>

      <Section title='Age groups' onEdit={() => onEdit('groups')}>
        <Rows
          empty='No age groups yet.'
          rows={groups.map((group, index) => ({
            key: group.id,
            label: (
              <span className='inline-flex items-center gap-2'>
                <span aria-hidden className={cn('size-2.5 rounded-[3px]', groupColour(index))} />
                {group.name.trim() || 'Untitled group'} · ages {group.minAge || '?'}–{group.maxAge || '?'}
              </span>
            ),
            value: `${formatHours(totalHours(group, lessons))} over ${lessons.length} lessons`,
          }))}
        />
      </Section>

      <Section title='Delivery & rates' onEdit={() => onEdit('delivery')}>
        <Rows
          empty='No delivery methods switched on.'
          rows={delivery.methods.map(prefix => {
            const hour = parseRate(delivery.card[cellKey(prefix, 'per_hour')]);
            const day = parseRate(delivery.card[cellKey(prefix, 'per_day')]);
            return {
              key: prefix,
              label: getTrainingMethod(prefix).label,
              value: `${formatRateAmount(hour, currency)} / hour · ${formatRateAmount(day, currency)} / day`,
            };
          })}
        />
      </Section>

      <Section title='Requirements' onEdit={() => onEdit('requirements')}>
        {item.kind === 'program' ? (
          <p className='text-muted-foreground text-sm'>
            {programRequirements.length
              ? `${programRequirements.length} published requirements reviewed.`
              : 'None for this programme.'}
          </p>
        ) : (
          <Rows
            empty='None for this course.'
            rows={answers.map(answer => ({
              key: answer.requirementUuid,
              label: answer.requirementName,
              value:
                answer.has === 'yes'
                  ? 'Has it'
                  : answer.has === 'no'
                    ? answer.acquisition
                      ? `Will ${answer.acquisition}`
                      : 'Not sorted yet'
                    : 'Not answered',
            }))}
          />
        )}
      </Section>

      <section className='bg-card space-y-2 rounded-2xl border p-5 shadow-sm'>
        <Label htmlFor={noteId} className='text-foreground text-sm font-semibold'>
          Note to {creator} <span className='text-muted-foreground font-normal'>(optional)</span>
        </Label>
        <Textarea
          id={noteId}
          rows={4}
          value={note}
          onChange={event => onNote(event.target.value)}
          placeholder='Anything that helps them decide, like where you’ve taught this before.'
        />
      </section>
    </div>
  );
}

function Section({
  title,
  action = 'Edit',
  onEdit,
  children,
}: {
  title: string;
  action?: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <section className='bg-card space-y-3 rounded-2xl border p-5 shadow-sm'>
      <div className='flex items-center justify-between gap-3'>
        <h2 className='text-foreground font-bold'>{title}</h2>
        <Button type='button' variant='ghost' size='sm' className='text-primary' onClick={onEdit}>
          {action}
        </Button>
      </div>
      {children}
    </section>
  );
}

function Rows({
  rows,
  empty,
}: {
  rows: { key: string; label: ReactNode; value: string }[];
  empty: string;
}) {
  if (rows.length === 0) return <p className='text-muted-foreground text-sm'>{empty}</p>;
  return (
    <ul className='text-sm'>
      {rows.map(row => (
        <li key={row.key} className='flex flex-wrap justify-between gap-3 border-t py-2'>
          <span>{row.label}</span>
          <span className='font-mono'>{row.value}</span>
        </li>
      ))}
    </ul>
  );
}
