'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getErrorMessage } from '@/lib/error-utils';
import { normaliseRateCard, type RateCardInput } from '@/lib/rate-card';
import {
  decideOnProgramTrainingRateUpdate,
  decideOnTrainingRateUpdate,
  submitProgramTrainingRateUpdate,
  submitTrainingRateUpdate,
  type TrainingRateUpdate,
  withdrawProgramTrainingRateUpdate,
  withdrawTrainingRateUpdate,
} from '@/services/client';
import { invalidateRateUpdateWorkflowQueries } from '@/src/features/dashboard/workflow-query-invalidation';
import type { RateUpdateDecision, TrainingApplicationKind } from '../types';

/** Runs an SDK call and rethrows failures as an Error carrying the backend's message. */
async function withBackendMessage<T>(call: () => Promise<T>, fallback: string): Promise<T> {
  try {
    return await call();
  } catch (error) {
    throw new Error(getErrorMessage(error, fallback));
  }
}

export type SubmitRateUpdateVariables = { rateCard: RateCardInput; note?: string | null };

/** Applicant proposes a full replacement card; the card is normalised before sending. */
export function useSubmitRateUpdate(
  kind: TrainingApplicationKind,
  parentUuid: string,
  applicationUuid: string
) {
  const queryClient = useQueryClient();
  return useMutation<TrainingRateUpdate | null, Error, SubmitRateUpdateVariables>({
    mutationFn: ({ rateCard, note }) =>
      withBackendMessage(async () => {
        const body = { rate_card: normaliseRateCard(rateCard), note: note?.trim() || null };
        const { data } =
          kind === 'course'
            ? await submitTrainingRateUpdate({
                path: { courseUuid: parentUuid, applicationUuid },
                body,
                throwOnError: true,
              })
            : await submitProgramTrainingRateUpdate({
                path: { programUuid: parentUuid, applicationUuid },
                body,
                throwOnError: true,
              });
        return data?.data ?? null;
      }, 'Could not send your rate update.'),
    onSuccess: () => invalidateRateUpdateWorkflowQueries(queryClient),
  });
}

/** Applicant withdraws their pending update; the variable is the update uuid. */
export function useWithdrawRateUpdate(
  kind: TrainingApplicationKind,
  parentUuid: string,
  applicationUuid: string
) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: updateUuid =>
      withBackendMessage(async () => {
        if (kind === 'course')
          await withdrawTrainingRateUpdate({
            path: { courseUuid: parentUuid, applicationUuid, updateUuid },
            throwOnError: true,
          });
        else
          await withdrawProgramTrainingRateUpdate({
            path: { programUuid: parentUuid, applicationUuid, updateUuid },
            throwOnError: true,
          });
      }, 'Could not withdraw your rate update.'),
    onSuccess: () => invalidateRateUpdateWorkflowQueries(queryClient),
  });
}

export type DecideRateUpdateVariables = {
  applicationUuid: string;
  updateUuid: string;
  action: RateUpdateDecision;
  reviewNotes?: string | null;
};

/** Course or program owner approves or rejects a pending update. */
export function useDecideRateUpdate(kind: TrainingApplicationKind, parentUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<TrainingRateUpdate | null, Error, DecideRateUpdateVariables>({
    mutationFn: ({ applicationUuid, updateUuid, action, reviewNotes }) =>
      withBackendMessage(async () => {
        const body = { review_notes: reviewNotes?.trim() || null };
        const query = { action };
        const { data } =
          kind === 'course'
            ? await decideOnTrainingRateUpdate({
                path: { courseUuid: parentUuid, applicationUuid, updateUuid },
                query,
                body,
                throwOnError: true,
              })
            : await decideOnProgramTrainingRateUpdate({
                path: { programUuid: parentUuid, applicationUuid, updateUuid },
                query,
                body,
                throwOnError: true,
              });
        return data?.data ?? null;
      }, `Could not ${action} this rate update.`),
    onSuccess: () => invalidateRateUpdateWorkflowQueries(queryClient),
  });
}
