import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getAllDifficultyLevelsOptions } from '../services/client/@tanstack/react-query.gen';

function buildDifficultyMap(
  difficultyLevels: { uuid: string; name: string }[]
): Record<string, string> {
  return difficultyLevels.reduce(
    (map, level) => {
      map[level.uuid] = level.name;
      return map;
    },
    {} as Record<string, string>
  );
}

export function useDifficultyLevels() {
  const { data, isLoading, error } = useQuery(getAllDifficultyLevelsOptions());

  const difficultyMap = useMemo(() => {
    if (!data?.data) return {};
    // @ts-expect-error
    return buildDifficultyMap(data?.data);
  }, [data]);

  return {
    difficultyLevels: data?.data ?? [],
    difficultyMap,
    isLoading,
    error,
  };
}
