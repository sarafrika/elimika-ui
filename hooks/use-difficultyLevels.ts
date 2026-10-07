import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { STALE_TIMES } from '@/lib/query-client';
import { getAllDifficultyLevelsOptions } from '../services/client/@tanstack/react-query.gen';

export function useDifficultyLevels() {
  const { data, isLoading, error, refetch } = useQuery({
    ...getAllDifficultyLevelsOptions(),
    staleTime: STALE_TIMES.reference,
  });
  const responseError =
    data?.error || data?.success === false
      ? new Error(data.message || 'Unable to load difficulty levels')
      : null;
  const difficultyLevels = useMemo(
    () =>
      data?.error || data?.success === false
        ? []
        : [...(data?.data ?? [])].sort((a, b) => a.level_order - b.level_order),
    [data]
  );

  const difficultyMap = useMemo(() => {
    return difficultyLevels.reduce<Record<string, string>>((map, level) => {
      if (level.uuid) map[level.uuid] = level.name;
      return map;
    }, {});
  }, [difficultyLevels]);

  return {
    difficultyLevels,
    difficultyMap,
    isLoading,
    error: error ?? responseError,
    refetch,
  };
}
