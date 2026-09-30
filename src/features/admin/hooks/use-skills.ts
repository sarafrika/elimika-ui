'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { toast } from 'sonner';

import { isConflict } from '@/lib/api-errors';
import { getErrorMessage } from '@/lib/error-utils';
import { adminListSkillsOptions } from '@/services/client/@tanstack/react-query.gen';
import { adminCreateSkill, adminDeleteSkill, adminUpdateSkill } from '@/services/client/sdk.gen';
import type { Skill, SkillRequest } from '@/services/client/types.gen';
import { invalidateGeneratedQueryIds } from '@/src/features/dashboard/workflow-query-invalidation';
import { configQuery } from '../lib/admin-queries';

/** Every read that shows a skill, refreshed after one is saved or deleted. */
const SKILL_QUERY_IDS = ['adminListSkills', 'adminGetSkill', 'listSkills'] as const;

/**
 * The whole taxonomy, retired skills included. It is small and returned in one list, so
 * it doubles as the parent lookup and the parent picker's options.
 */
export function useAllSkills() {
  const query = useQuery({ ...adminListSkillsOptions(), ...configQuery });
  const skills = useMemo(() => query.data?.data ?? [], [query.data]);
  const byUuid = useMemo(() => {
    const map = new Map<string, Skill>();
    for (const skill of skills) if (skill.uuid) map.set(skill.uuid, skill);
    return map;
  }, [skills]);
  return { skills, byUuid, query };
}

/**
 * The list the table shows. `q` matches names, slugs and aliases on the server;
 * without a term or status filter the unfiltered taxonomy is reused.
 */
export function useSkillList(q: string, active: string) {
  const term = q.trim();
  const filtered = term.length > 0 || active !== 'any';
  const query = useQuery({
    ...adminListSkillsOptions({
      query: {
        ...(term ? { q: term } : {}),
        ...(active === 'active' ? { active: true } : active === 'inactive' ? { active: false } : {}),
      },
    }),
    ...configQuery,
    enabled: filtered,
  });
  return { filtered, query, skills: query.data?.data ?? [] };
}

/** The skill and everything under it: none of them may become its parent. */
export function descendantsOf(uuid: string | undefined, skills: readonly Skill[]): Set<string> {
  const blocked = new Set<string>();
  if (!uuid) return blocked;
  blocked.add(uuid);
  let grew = true;
  while (grew) {
    grew = false;
    for (const skill of skills) {
      if (skill.uuid && skill.parent_uuid && blocked.has(skill.parent_uuid) && !blocked.has(skill.uuid)) {
        blocked.add(skill.uuid);
        grew = true;
      }
    }
  }
  return blocked;
}

export interface SkillFormValues {
  name: string;
  slug: string;
  parent_uuid: string;
  /** Comma-separated as typed; split on save. */
  aliases: string;
  active: boolean;
}

export function parseAliases(text: string): string[] {
  const seen = new Set<string>();
  return text
    .split(',')
    .map(alias => alias.trim())
    .filter(alias => {
      const key = alias.toLowerCase();
      if (!alias || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export const SKILL_CONFLICT_MESSAGE =
  'That slug, or one of the aliases, already names another skill. Pick a different one.';

/**
 * Create or replace a skill. Every field is replaced on update. A 409 is left to the
 * form to show inline (the slug or an alias is taken); anything else is a toast.
 */
export function useSaveSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uuid, values }: { uuid?: string; values: SkillFormValues }) => {
      const body: SkillRequest = {
        name: values.name.trim(),
        ...(values.slug.trim() ? { slug: values.slug.trim() } : {}),
        ...(values.parent_uuid ? { parent_uuid: values.parent_uuid } : {}),
        aliases: parseAliases(values.aliases),
        active: values.active,
      };
      if (uuid) {
        const { data } = await adminUpdateSkill({ path: { uuid }, body, throwOnError: true });
        return data;
      }
      const { data } = await adminCreateSkill({ body, throwOnError: true });
      return data;
    },
    onSuccess: async (_data, variables) => {
      await invalidateGeneratedQueryIds(queryClient, SKILL_QUERY_IDS);
      toast.success(`${variables.values.name.trim()} saved`);
    },
    onError: (error, variables) => {
      if (isConflict(error)) return;
      toast.error(getErrorMessage(error, `Could not save ${variables.values.name.trim()}`));
    },
  });
}

/** Delete a skill: it leaves every course and job tag list; instructor skills are unlinked. */
export function useDeleteSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uuid }: { uuid: string; name: string }) => {
      await adminDeleteSkill({ path: { uuid }, throwOnError: true });
    },
    onSuccess: async (_data, variables) => {
      await invalidateGeneratedQueryIds(queryClient, SKILL_QUERY_IDS);
      toast.success(`${variables.name} deleted`);
    },
    onError: (error, variables) =>
      toast.error(getErrorMessage(error, `Could not delete ${variables.name}`)),
  });
}
