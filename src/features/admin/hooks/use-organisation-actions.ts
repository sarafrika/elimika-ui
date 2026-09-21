'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getErrorMessage } from '@/lib/error-utils';
import { moderateOrganisation, type SchemaEnum3Writable } from '@/services/client';
import { invalidateAfterVerification } from '../lib/admin-queries';

export type OrganisationDecision = SchemaEnum3Writable;

export interface ModerateOrganisationVariables {
  uuid: string;
  action: OrganisationDecision;
  reason: string;
  /** Used in the toast so the admin sees which record moved. */
  organisationName: string;
}

const DONE_MESSAGE: Record<string, string> = {
  approve: 'verified',
  reject: 'rejected',
  revoke: 'no longer verified',
};

/** Reads the status off a thrown response so the message matches what really failed. */
function statusOf(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const record = error as { status?: unknown; response?: { status?: unknown } };
  const status = record.status ?? record.response?.status;
  return typeof status === 'number' ? status : undefined;
}

/**
 * The one write on an organisation record. Approve, reject and revoke all go through
 * the consolidated moderate endpoint; the reason travels with the request even though
 * the backend only logs it today.
 */
export function useModerateOrganisation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uuid, action, reason }: ModerateOrganisationVariables) => {
      const { data } = await moderateOrganisation({
        path: { uuid },
        query: { action, reason: reason || undefined },
        throwOnError: true,
      });
      return data;
    },
    onSuccess: async (_data, variables) => {
      await invalidateAfterVerification(queryClient);
      toast.success(
        `${variables.organisationName} is ${DONE_MESSAGE[variables.action] ?? 'updated'}`
      );
    },
    onError: (error, variables) => {
      const status = statusOf(error);
      if (status === 403) {
        toast.error('You can’t approve an organisation you belong to');
        return;
      }
      toast.error(
        getErrorMessage(error, `Could not ${variables.action} ${variables.organisationName}`)
      );
    },
  });
}
