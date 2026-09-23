'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getErrorMessage } from '@/lib/error-utils';
import {
  assignAdminDomainMutation,
  createAdminUserMutation,
  removeAdminDomainMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { invalidateGeneratedQueryIds } from '@/src/features/dashboard/workflow-query-invalidation';
import { invalidateAdminOverview } from '../lib/admin-queries';

/** The three lists this screen shows; all of them move when access changes. */
const ACCESS_LIST_QUERY_IDS = [
  'getAdminUsers',
  'getSystemAdminUsers',
  'getOrganizationAdminUsers',
  'getAdminEligibleUsers',
  'isUserAdmin',
  'isUserSystemAdmin',
] as const;

function statusOf(error: unknown) {
  const candidate = error as { status?: number; response?: { status?: number } } | null;
  return candidate?.status ?? candidate?.response?.status;
}

/** The API's own words are the most useful thing to show for a conflict. */
function accessErrorMessage(error: unknown, fallback: string) {
  const status = statusOf(error);
  if (status === 409 || status === 400) return getErrorMessage(error, fallback);
  if (status === 404) return 'That user no longer exists.';
  return getErrorMessage(error, fallback);
}

function useAccessInvalidation() {
  const queryClient = useQueryClient();

  return async () => {
    await Promise.all([
      invalidateAdminOverview(queryClient),
      invalidateGeneratedQueryIds(queryClient, ACCESS_LIST_QUERY_IDS),
    ]);
  };
}

/**
 * Grant global platform admin. `assignment_type` is required by the request but the
 * service ignores it, and there is no organisation field — org roles are set on the
 * organisation's own record.
 */
export function useGrantAdmin() {
  const invalidate = useAccessInvalidation();
  const mutation = useMutation(assignAdminDomainMutation());

  const grant = (input: { userUuid: string; reason: string; name?: string }, onDone?: () => void) => {
    mutation.mutate(
      {
        path: { uuid: input.userUuid },
        body: { domain_name: 'admin', assignment_type: 'global', reason: input.reason },
      },
      {
        onSuccess: async () => {
          await invalidate();
          toast.success(`${input.name ?? 'They'} can now reach the admin console`);
          onDone?.();
        },
        onError: error => {
          toast.error(accessErrorMessage(error, 'Couldn’t grant that access.'));
        },
      }
    );
  };

  return { grant, isPending: mutation.isPending };
}

/** Remove platform admin access. The reason travels with the request but is only logged. */
export function useRemoveAdmin() {
  const invalidate = useAccessInvalidation();
  const mutation = useMutation(removeAdminDomainMutation());

  const remove = (input: { userUuid: string; reason: string; name?: string }, onDone?: () => void) => {
    mutation.mutate(
      { path: { uuid: input.userUuid, domain: 'admin' }, query: { reason: input.reason } },
      {
        onSuccess: async () => {
          await invalidate();
          toast.success(`${input.name ?? 'They'} no longer have admin access`);
          onDone?.();
        },
        onError: error => {
          toast.error(accessErrorMessage(error, 'Couldn’t remove that access.'));
        },
      }
    );
  };

  return { remove, isPending: mutation.isPending };
}

export interface CreateAdminInput {
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  phone_number?: string;
}

/** Create a brand-new administrator. The sign-in account is created asynchronously. */
export function useCreateAdmin() {
  const invalidate = useAccessInvalidation();
  const mutation = useMutation(createAdminUserMutation());

  const create = (input: CreateAdminInput, onDone?: () => void) => {
    mutation.mutate(
      { body: input },
      {
        onSuccess: async () => {
          await invalidate();
          toast.success(`Invitation sent to ${input.email}`);
          onDone?.();
        },
        onError: error => {
          toast.error(accessErrorMessage(error, 'Couldn’t create that administrator.'));
        },
      }
    );
  };

  return { create, isPending: mutation.isPending };
}
