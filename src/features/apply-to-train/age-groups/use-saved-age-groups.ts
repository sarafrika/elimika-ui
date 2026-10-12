'use client';

import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { isConflict } from '@/lib/api-errors';
import { getErrorMessage } from '@/lib/error-utils';
import { STALE_TIMES } from '@/lib/query-client';
import {
  createMyAgeGroupMutation,
  listMyAgeGroupPresetsOptions,
} from '@/services/client/@tanstack/react-query.gen';

/** A saved, reusable age band; owned by an instructor or an organisation. */
export type SavedAgeGroupView = {
  uuid?: string;
  name?: string;
  min_age?: number;
  max_age?: number;
  owner_type?: string;
  owner_uuid?: string;
  owner_name?: string;
};

export const MAX_SAVED_AGE_GROUPS = 50;

const SAVED_AGE_GROUP_QUERY_IDS = new Set([
  'listMyAgeGroups',
  'listMyAgeGroupPresets',
  'listOrganisationAgeGroups',
]);

/** Refreshes every saved age group list after a write. */
export function invalidateSavedAgeGroups(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    predicate: query => {
      const head = query.queryKey[0];
      return (
        typeof head === 'object' &&
        head !== null &&
        '_id' in head &&
        SAVED_AGE_GROUP_QUERY_IDS.has(String((head as { _id?: unknown })._id))
      );
    },
  });
}

/** The instructor's own saved groups plus their organisations', fetched once opened. */
export function useAgeGroupPresets(enabled: boolean) {
  const query = useQuery({
    ...listMyAgeGroupPresetsOptions(),
    enabled,
    staleTime: STALE_TIMES.entity,
  });
  const presets: SavedAgeGroupView[] = query.data?.data ?? [];
  return { presets, query };
}

/** "Save to my age groups": copies a band into the instructor's saved set. */
export function useSaveMyAgeGroup() {
  const queryClient = useQueryClient();
  const mutation = useMutation(createMyAgeGroupMutation());
  const save = (group: { name: string; min_age: number; max_age: number }) =>
    mutation.mutate(
      { body: group },
      {
        onSuccess: async () => {
          await invalidateSavedAgeGroups(queryClient);
          toast.success(`Saved “${group.name}” to your age groups`);
        },
        onError: error =>
          toast.error(
            isConflict(error)
              ? `You already have an age group called “${group.name}”.`
              : getErrorMessage(error, 'Could not save this age group.')
          ),
      }
    );
  return { save, saving: mutation.isPending };
}
