'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getErrorMessage } from '@/lib/error-utils';
import type { User } from '@/services/client';
import { updateUserMutation } from '@/services/client/@tanstack/react-query.gen';
import { mergeUserBody } from '../lib/user-body';
import { invalidateAdminOverview } from '../lib/admin-queries';

/** The fields an admin may change on someone else's record. */
export type IdentityChanges = Pick<
  User,
  'first_name' | 'middle_name' | 'last_name' | 'email' | 'username' | 'dob' | 'phone_number' | 'gender'
>;

function updateErrorMessage(error: unknown, fallback: string) {
  const status =
    (error as { status?: number } | null)?.status ??
    (error as { response?: { status?: number } } | null)?.response?.status;

  if (status === 403) return 'You don’t have permission to change this account.';
  if (status === 404) return 'That account no longer exists.';
  if (status === 500) {
    return 'The sign-in service didn’t accept the change, so nothing was saved. Try again.';
  }
  return getErrorMessage(error, fallback);
}

/**
 * Saving a person replaces their whole record: PUT /users/{uuid} takes the full DTO.
 * `active` is a primitive boolean on the API, so leaving it out reads as false and
 * deactivates the account — it is always sent from the record that was loaded.
 */
export function useSavePerson(person: User | null) {
  const queryClient = useQueryClient();
  const mutation = useMutation(updateUserMutation());

  const save = (
    changes: Partial<IdentityChanges> & { active?: boolean },
    options?: { successMessage?: string; onDone?: () => void }
  ) => {
    if (!person?.uuid) {
      toast.error('That account is still loading.');
      return;
    }

    const body = mergeUserBody(person, changes);

    mutation.mutate(
      { path: { uuid: person.uuid }, body },
      {
        onSuccess: async () => {
          await invalidateAdminOverview(queryClient);
          toast.success(options?.successMessage ?? 'Changes saved');
          options?.onDone?.();
        },
        onError: error => {
          toast.error(updateErrorMessage(error, 'Couldn’t save those changes.'));
        },
      }
    );
  };

  return { save, isPending: mutation.isPending };
}
