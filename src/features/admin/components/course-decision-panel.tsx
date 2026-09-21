'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { SectionCard, surfaceTheme } from '@/components/data-display';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { getErrorMessage } from '@/lib/error-utils';
import { moderateCourse } from '@/services/client';
import { invalidateAfterModeration } from '../lib/admin-queries';
import type { ConfirmAction } from '../lib/confirm-effects';
import { ConfirmDialog } from './confirm-dialog';
import { NoteField, noteToPlainText } from './note-field';

/** What the admin can do, in the wording the screen uses. */
type Decision = 'approve' | 'changes' | 'reject' | 'revoke';

const decisionSchema = z.object({
  note: z
    .string()
    .refine(
      value => noteToPlainText(value).length >= 10,
      'Say what you decided and why — at least a sentence.'
    ),
});

type DecisionValues = z.infer<typeof decisionSchema>;

/** Request changes and Reject are the same API action; only the wording differs. */
const API_ACTION: Record<Decision, 'approved' | 'rejected' | 'revoked'> = {
  approve: 'approved',
  changes: 'rejected',
  reject: 'rejected',
  revoke: 'revoked',
};

const DONE_MESSAGE: Record<Decision, string> = {
  approve: 'approved',
  changes: 'sent back for changes',
  reject: 'rejected',
  revoke: 'no longer approved',
};

function statusOf(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const record = error as { status?: unknown; response?: { status?: unknown } };
  const status = record.status ?? record.response?.status;
  return typeof status === 'number' ? status : undefined;
}

interface CourseDecisionPanelProps {
  uuid: string;
  courseName: string;
  creatorName?: string;
  isApproved: boolean;
  /** True when a draft edit is waiting — the decision then applies to the edit. */
  hasPendingEdit: boolean;
}

/**
 * The one write on a course record. Approve, request changes, reject and revoke all go
 * through the consolidated moderate endpoint; a pending edit makes the same call apply
 * to the draft instead of the course's approval.
 */
export function CourseDecisionPanel({
  uuid,
  courseName,
  creatorName,
  isApproved,
  hasPendingEdit,
}: CourseDecisionPanelProps) {
  const queryClient = useQueryClient();
  const [decision, setDecision] = useState<Decision>(hasPendingEdit ? 'approve' : 'approve');
  const [pending, setPending] = useState<Decision | null>(null);

  const form = useForm<DecisionValues>({
    resolver: zodResolver(decisionSchema),
    defaultValues: { note: '' },
    mode: 'onSubmit',
  });

  const moderate = useMutation({
    mutationFn: async ({ action, reason }: { action: Decision; reason: string }) => {
      const { data } = await moderateCourse({
        path: { uuid },
        body: { action: API_ACTION[action], reason: reason || undefined },
        throwOnError: true,
      });
      return data;
    },
    onSuccess: async (_data, variables) => {
      await invalidateAfterModeration(queryClient);
      toast.success(`${courseName} is ${DONE_MESSAGE[variables.action]}`);
      setPending(null);
      form.reset({ note: '' });
    },
    onError: error => {
      const status = statusOf(error);
      if (status === 400) {
        toast.error('The decision was rejected as incomplete — pick an action and try again');
        return;
      }
      if (status === 404) {
        toast.error('That course no longer exists');
        return;
      }
      toast.error(getErrorMessage(error, `Could not update ${courseName}`));
    },
  });

  const confirmAction: ConfirmAction = hasPendingEdit
    ? decision === 'approve'
      ? 'approveCourseEdit'
      : 'rejectCourseEdit'
    : decision === 'approve'
      ? 'approveCourse'
      : 'rejectCourse';

  const options: { id: Decision; label: string; description: string }[] = hasPendingEdit
    ? [
        {
          id: 'approve',
          label: 'Approve changes',
          description: 'The draft replaces the live course.',
        },
        {
          id: 'reject',
          label: 'Reject changes',
          description: 'The draft is discarded and the live course stays as it is.',
        },
      ]
    : [
        { id: 'approve', label: 'Approve course', description: 'Learners and instructors can use it.' },
        {
          id: 'changes',
          label: 'Request changes',
          description: 'Sends your feedback to the creator.',
        },
        { id: 'reject', label: 'Reject', description: 'Turns the course down with your reason.' },
        ...(isApproved
          ? [
              {
                id: 'revoke' as Decision,
                label: 'Revoke approval',
                description: 'Takes an approved course back out of use.',
              },
            ]
          : []),
      ];

  return (
    <SectionCard
      title='Decision'
      description={
        hasPendingEdit
          ? 'This decides the waiting edit, not the live course’s approval.'
          : 'Your reason is stored in the moderation history and sent to the creator.'
      }
      className='h-fit'
    >
      <form
        className='flex flex-col gap-4'
        onSubmit={form.handleSubmit(() => setPending(decision))}
      >
        <RadioGroup
          value={decision}
          onValueChange={value => setDecision(value as Decision)}
          className='gap-2'
        >
          {options.map(option => (
            <Label
              key={option.id}
              htmlFor={`decision-${option.id}`}
              className='border-border/60 hover:bg-muted/40 flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5'
            >
              <RadioGroupItem id={`decision-${option.id}`} value={option.id} className='mt-0.5' />
              <span className='space-y-0.5'>
                <span className='text-foreground block text-sm font-medium'>{option.label}</span>
                <span className='text-muted-foreground block text-xs'>{option.description}</span>
              </span>
            </Label>
          ))}
        </RadioGroup>

        <Controller
          control={form.control}
          name='note'
          render={({ field }) => (
            <NoteField
              id='course-decision-note'
              label={decision === 'approve' ? 'Reason' : 'Feedback to the creator'}
              required
              value={field.value}
              onChange={field.onChange}
              error={form.formState.errors.note?.message}
              helper='Kept in the moderation history with your name.'
            />
          )}
        />

        <Button type='submit' className='rounded-md' disabled={moderate.isPending}>
          {options.find(option => option.id === decision)?.label ?? 'Submit decision'}
        </Button>

        <p className={surfaceTheme.sectionLabel}>
          Editing a course is the creator’s job — the admin API has no course edit route.
        </p>
      </form>

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={open => {
          if (!open) setPending(null);
        }}
        action={confirmAction}
        subject={{ name: courseName, detail: creatorName }}
        note={noteToPlainText(form.getValues('note'))}
        isPending={moderate.isPending}
        onConfirm={() => {
          if (!pending) return;
          moderate.mutate({ action: pending, reason: form.getValues('note') });
        }}
      />
    </SectionCard>
  );
}
