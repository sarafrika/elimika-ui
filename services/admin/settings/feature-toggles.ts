import { client } from '@/services/client/client.gen';

import { FeatureToggle, FeatureToggleListSchema } from './schemas';

const unwrapTogglePayload = (payload: unknown): FeatureToggle[] => {
  const parsed = FeatureToggleListSchema.safeParse(payload);
  if (parsed.success) {
    return parsed.data;
  }

  if (typeof payload === 'object' && payload !== null && 'data' in (payload as Record<string, unknown>)) {
    const nested = FeatureToggleListSchema.safeParse((payload as { data: unknown }).data);
    if (nested.success) {
      return nested.data;
    }
  }

  return [];
};

export async function listFeatureToggles(): Promise<FeatureToggle[]> {
  const response = await client.get<{ data?: unknown }, unknown, true>({
    url: '/api/v1/admin/features',
    throwOnError: true,
  });

  return unwrapTogglePayload(response.data);
}

export async function updateFeatureToggle(
  featureName: string,
  enabled: boolean
): Promise<FeatureToggle> {
  const response = await client.put<{ data?: unknown }, unknown, true>({
    url: `/api/v1/admin/features/${encodeURIComponent(featureName)}`,
    body: { enabled },
    headers: {
      'Content-Type': 'application/json',
    },
    throwOnError: true,
  });

  const toggles = unwrapTogglePayload(response.data);
  const updated = toggles.find(toggle => toggle.name === featureName);
  return (
    updated ?? {
      name: featureName,
      enabled,
    }
  );
}
