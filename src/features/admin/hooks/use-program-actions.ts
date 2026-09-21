'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getErrorMessage } from '@/lib/error-utils';
import {
  type ActionEnum,
  decideOnProgramTrainingApplication,
  moderateProgram,
} from '@/services/client';
import { invalidateAfterModeration } from '../lib/admin-queries';

/** approved | rejected | revoked — what the moderate endpoint accepts. */
export type ProgramDecision = ActionEnum;

/** approve | reject | revoke — what the training-application endpoint accepts. */
export type ApplicationDecision = 'approve' | 'reject' | 'revoke';

const PROGRAM_DONE: Record<string, string> = {
  approved: 'approved',
  rejected: 'sent back for changes',
  revoked: 'no longer approved',
};

const APPLICATION_DONE: Record<ApplicationDecision, string> = {
  approve: 'approved',
  reject: 'rejected',
  revoke: 'revoked',
};

/** Reads the status off a thrown response so the message matches what really failed. */
function statusOf(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const record = error as { status?: unknown; response?: { status?: unknown } };
  const status = record.status ?? record.response?.status;
  return typeof status === 'number' ? status : undefined;
}

/**
 * Approve, send back or revoke a program. The reason is stored in the moderation
 * history and travels to the creator in the notification.
 */
export function useModerateProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      uuid,
      action,
      reason,
    }: {
      uuid: string;
      action: ProgramDecision;
      reason: string;
      programTitle: string;
    }) => {
      const { data } = await moderateProgram({
        path: { uuid },
        body: { action, reason: reason || undefined },
        throwOnError: true,
      });
      return data;
    },
    onSuccess: async (_data, variables) => {
      await invalidateAfterModeration(queryClient);
      toast.success(`${variables.programTitle} is ${PROGRAM_DONE[variables.action] ?? 'updated'}`);
    },
    onError: (error, variables) =>
      toast.error(getErrorMessage(error, `Could not update ${variables.programTitle}`)),
  });
}

/**
 * Decide on an application to deliver this program. Unlike courses, a platform admin
 * may decide these — the course equivalent is owner-only.
 */
export function useDecideProgramApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      programUuid,
      applicationUuid,
      action,
      reviewNotes,
    }: {
      programUuid: string;
      applicationUuid: string;
      action: ApplicationDecision;
      reviewNotes: string;
      applicantName: string;
    }) => {
      const { data } = await decideOnProgramTrainingApplication({
        path: { programUuid, applicationUuid },
        query: { action },
        body: { review_notes: reviewNotes || undefined },
        throwOnError: true,
      });
      return data;
    },
    onSuccess: async (_data, variables) => {
      await invalidateAfterModeration(queryClient);
      toast.success(`${variables.applicantName} ${APPLICATION_DONE[variables.action]}`);
    },
    onError: (error, variables) => {
      if (statusOf(error) === 409) {
        toast.error(getErrorMessage(error, 'This application has already been decided'));
        return;
      }
      toast.error(getErrorMessage(error, `Could not ${variables.action} this application`));
    },
  });
}
