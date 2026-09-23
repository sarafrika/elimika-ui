'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useUserProfile } from '@/context/profile-context';
import { getErrorMessage } from '@/lib/error-utils';
import {
  verifyDocumentMutation,
  verifyInstructorMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { invalidateAfterVerification } from '../lib/admin-queries';

/** The API answers with its own status codes; these are what they mean to an admin. */
function verificationErrorMessage(error: unknown, fallback: string) {
  const status = (error as { status?: number; response?: { status?: number } } | null)?.status ??
    (error as { response?: { status?: number } } | null)?.response?.status;

  if (status === 403) return 'You can’t approve a profile you’re affiliated with.';
  if (status === 404) return 'That record no longer exists.';
  return getErrorMessage(error, fallback);
}

/**
 * Verify one uploaded document. `verifiedBy` is free text on the API, so the console
 * always sends the signed-in admin's email — it is the only trace of who decided.
 */
export function useVerifyDocument() {
  const queryClient = useQueryClient();
  const profile = useUserProfile();
  const mutation = useMutation(verifyDocumentMutation());

  const verify = (
    input: { instructorUuid: string; documentUuid: string; notes: string; documentTitle?: string },
    onDone?: () => void
  ) => {
    const verifiedBy = profile?.email;
    if (!verifiedBy) {
      toast.error('Your account has no email address, so the decision can’t be recorded.');
      return;
    }

    mutation.mutate(
      {
        path: { instructorUuid: input.instructorUuid, documentUuid: input.documentUuid },
        query: { verifiedBy, verificationNotes: input.notes },
      },
      {
        onSuccess: async () => {
          await invalidateAfterVerification(queryClient);
          toast.success(`${input.documentTitle ?? 'Document'} verified`);
          onDone?.();
        },
        onError: error => {
          toast.error(verificationErrorMessage(error, 'Couldn’t verify that document.'));
        },
      }
    );
  };

  return { verify, isPending: mutation.isPending };
}

/**
 * Verify the instructor profile itself. The reason travels with the request but the
 * backend only logs it, so the confirmation modal says as much.
 */
export function useVerifyInstructor() {
  const queryClient = useQueryClient();
  const mutation = useMutation(verifyInstructorMutation());

  const verify = (input: { instructorUuid: string; reason: string; name?: string }, onDone?: () => void) => {
    mutation.mutate(
      { path: { uuid: input.instructorUuid }, query: { reason: input.reason } },
      {
        onSuccess: async () => {
          await invalidateAfterVerification(queryClient);
          toast.success(`${input.name ?? 'Instructor'} is now verified`);
          onDone?.();
        },
        onError: error => {
          toast.error(verificationErrorMessage(error, 'Couldn’t verify that instructor.'));
        },
      }
    );
  };

  return { verify, isPending: mutation.isPending };
}
