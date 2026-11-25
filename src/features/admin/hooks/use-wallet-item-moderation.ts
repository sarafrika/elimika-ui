'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/error-utils';
import type { ProfileVerificationRequest } from '@/services/client';
import {
  certificationsQueryKey,
  competenciesQueryKey,
  getSummary1QueryKey,
  skillsQueryKey,
  verifyMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { requireApiSuccess } from '@/src/features/onboarding/lib/user-onboarding';

export type WalletModerationSection = 'skills' | 'certifications' | 'competencies';
export type WalletItemDecision = ProfileVerificationRequest['status'];

export function useWalletItemModeration(
  userUuid: string,
  section: WalletModerationSection,
  itemUuid: string | undefined
) {
  const queryClient = useQueryClient();
  const mutation = useMutation(verifyMutation());
  const [isSaving, setIsSaving] = useState(false);

  const save = async (status: WalletItemDecision, notes: string): Promise<boolean> => {
    if (!userUuid || !itemUuid || isSaving) return false;
    if (status === 'REJECTED' && !notes.trim()) {
      toast.error('Add a review note explaining why this item was rejected.');
      return false;
    }
    setIsSaving(true);
    try {
      const response = await mutation.mutateAsync({
        path: { userUuid, section, itemUuid },
        body: { status, notes: notes.trim() || undefined },
      });
      if (!response) throw new Error('No decision was returned. Please try again.');
      requireApiSuccess(response);
      const options = { path: { userUuid } };
      const queryKey =
        section === 'skills'
          ? skillsQueryKey(options)
          : section === 'certifications'
            ? certificationsQueryKey(options)
            : competenciesQueryKey(options);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey }),
        queryClient.invalidateQueries({ queryKey: getSummary1QueryKey(options) }),
      ]);
      toast.success(status === 'VERIFIED' ? 'Wallet item approved.' : 'Wallet item rejected.');
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to save the review decision. Please try again.'));
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return { save, isPending: isSaving || mutation.isPending };
}
