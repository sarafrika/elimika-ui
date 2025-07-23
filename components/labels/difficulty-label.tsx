import { tanstackClient } from '@/services/api/tanstack-client';
import React from 'react';

type DifficultyLabelProps = {
  difficultyUuid: string;
  fallback?: React.ReactNode;
};

export function DifficultyLabel({ difficultyUuid, fallback = 'Unknown' }: DifficultyLabelProps) {
  const { data: difficultyLevels } = tanstackClient.useQuery(
    'get',
    '/api/v1/config/difficulty-levels',
    {
      // @ts-ignore
      params: {},
    }
  );

  const difficulty = difficultyLevels?.data?.find((d: any) => d.uuid === difficultyUuid);

  return <>{difficulty ? difficulty.name : fallback}</>;
}
