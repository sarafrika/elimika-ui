'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { toast } from 'sonner';

import { extractEntity } from '@/lib/api-helpers';
import { getErrorMessage } from '@/lib/error-utils';
import type { GenderEnum, User } from '@/services/client';
import {
  getCurrentUserOptions,
  updateUserMutation,
  uploadProfileImageMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { invalidateGeneratedQueryIds } from '@/src/features/dashboard/workflow-query-invalidation';
import { mergeUserBody } from '../lib/user-body';
import { listQuery } from '../lib/admin-queries';

/** Largest photo the console will send; the API itself only caps at the global limit. */
export const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024;

const OWN_ACCOUNT_QUERY_IDS = ['getCurrentUser', 'getUserByUuid'] as const;

export interface ProfileFormValues {
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  username: string;
  dob: string;
  phone_number: string;
  gender: string;
}

/** The signed-in admin's own account. */
export function useOwnAccount() {
  const query = useQuery({ ...getCurrentUserOptions(), ...listQuery });

  const account = useMemo(() => extractEntity<User>(query.data), [query.data]);

  return { account, query };
}

const asDateInput = (value: Date | string | undefined | null) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.valueOf()) ? '' : date.toISOString().slice(0, 10);
};

/** Fills the form from the loaded account so a save can send every field back. */
export function toProfileForm(account: User | null): ProfileFormValues {
  return {
    first_name: account?.first_name ?? '',
    middle_name: account?.middle_name ?? '',
    last_name: account?.last_name ?? '',
    email: account?.email ?? '',
    username: account?.username ?? '',
    dob: asDateInput(account?.dob),
    phone_number: account?.phone_number ?? '',
    gender: (account?.gender as string | undefined) ?? '',
  };
}

/**
 * Saves your own profile. The PUT replaces the whole record, and `active` is a plain
 * boolean: leaving it out would send `false` and deactivate your own account, so it is
 * always taken from the loaded record and sent back explicitly.
 */
export function useSaveOwnProfile() {
  const queryClient = useQueryClient();
  const mutation = useMutation(updateUserMutation());

  const save = (
    input: { account: User; values: ProfileFormValues },
    onDone?: () => void
  ) => {
    const { account, values } = input;
    if (!account.uuid) {
      toast.error('Your account could not be identified.');
      return;
    }

    // Merged onto the loaded record so a field the API adds later is never cleared,
    // and so `active` is always sent — an undefined flag would lock you out of your
    // own account.
    const body = mergeUserBody(account, {
      first_name: values.first_name.trim(),
      middle_name: values.middle_name.trim() || null,
      last_name: values.last_name.trim(),
      email: values.email.trim(),
      username: values.username.trim(),
      dob: new Date(values.dob),
      phone_number: values.phone_number.trim() || null,
      gender: (values.gender || undefined) as GenderEnum | undefined,
    });

    mutation.mutate(
      { path: { uuid: account.uuid }, body },
      {
        onSuccess: async () => {
          await invalidateGeneratedQueryIds(queryClient, OWN_ACCOUNT_QUERY_IDS);
          toast.success('Your details are saved');
          onDone?.();
        },
        onError: error => {
          toast.error(
            getErrorMessage(
              error,
              'Couldn’t save your details. If the sign-in service is unreachable the change is rolled back.'
            )
          );
        },
      }
    );
  };

  return { save, isPending: mutation.isPending };
}

/**
 * Photo upload. The response is a bare user object rather than the usual wrapper, and a
 * rejected file comes back as an empty 400, so the message has to be ours.
 */
export function useUploadOwnPhoto() {
  const queryClient = useQueryClient();
  const mutation = useMutation(uploadProfileImageMutation());

  const upload = (input: { userUuid: string; file: File }, onDone?: () => void) => {
    if (input.file.size > MAX_PROFILE_IMAGE_BYTES) {
      toast.error('That image is larger than 5 MB.');
      return;
    }

    mutation.mutate(
      { path: { userUuid: input.userUuid }, body: { profileImage: input.file } },
      {
        onSuccess: async () => {
          await invalidateGeneratedQueryIds(queryClient, OWN_ACCOUNT_QUERY_IDS);
          toast.success('Photo updated');
          onDone?.();
        },
        onError: () => {
          toast.error('That photo could not be uploaded. Try a JPEG or PNG under 5 MB.');
        },
      }
    );
  };

  return { upload, isPending: mutation.isPending };
}

/** Fields whose value changed, for the confirmation modal's before-and-after list. */
export function changedFields(before: ProfileFormValues, after: ProfileFormValues) {
  const labels: Record<keyof ProfileFormValues, string> = {
    first_name: 'First name',
    middle_name: 'Middle name',
    last_name: 'Last name',
    email: 'Email',
    username: 'Username',
    dob: 'Date of birth',
    phone_number: 'Phone number',
    gender: 'Gender',
  };

  return (Object.keys(labels) as Array<keyof ProfileFormValues>)
    .filter(key => (before[key] ?? '').trim() !== (after[key] ?? '').trim())
    .map(key => ({
      label: labels[key],
      from: before[key]?.trim() || '—',
      to: after[key]?.trim() || '—',
    }));
}
