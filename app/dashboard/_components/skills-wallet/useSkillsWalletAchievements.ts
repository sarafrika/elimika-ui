'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { AchievementRecord } from '@/app/dashboard/student/skills-wallet/_components/SkillsWalletShared';
import { getErrorMessage } from '@/lib/error-utils';
import { STALE_TIMES } from '@/lib/query-client';
import { listAchievementsOptions } from '@/services/client/@tanstack/react-query.gen';
import type { ApiResponseListUserAchievement } from '@/services/client/types.gen';

function readAchievements(response: ApiResponseListUserAchievement) {
  if (response.error || response.success === false)
    throw new Error(getErrorMessage(response, 'Unable to load achievements.'));
  if (!response.data) throw new Error('No achievement information was returned.');
  return response.data;
}

function awardedDate(value?: Date | string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

export function useSkillsWalletAchievements(enabled: boolean) {
  const query = useQuery({
    ...listAchievementsOptions(),
    select: readAchievements,
    enabled,
    staleTime: STALE_TIMES.entity,
  });
  const achievements = useMemo<AchievementRecord[]>(
    () => query.isError ? [] : (query.data ?? []).map((item, index) => ({
      id: item.uuid ?? `achievement-${index}`,
      name: item.title,
      description: item.description ?? '',
      achievement_type: item.achievement_type,
      awarded_by: item.awarded_by,
      achieved_at: awardedDate(item.awarded_on),
    })),
    [query.data, query.isError]
  );
  return { ...query, achievements };
}
