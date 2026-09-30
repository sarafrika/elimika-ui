'use client';

import { useMemo, useState } from 'react';
import type { DistanceBandEnum } from '@/services/client/types.gen';

/** Radius choices offered by the near-me control; the API clamps to 2-100 km. */
export const NEAR_ME_RADII = [2, 5, 10, 25, 50, 100] as const;
export const DEFAULT_NEAR_ME_RADIUS_KM = 10;

export type NearMePoint = {
  latitude: number;
  longitude: number;
  /** What the user picked: "your location" or a town name. Never coordinates. */
  label: string;
};

export type NearMeState = {
  point: NearMePoint | null;
  radiusKm: number;
  setPoint: (point: NearMePoint | null) => void;
  setRadiusKm: (radiusKm: number) => void;
  clear: () => void;
  /** Spread into a listing's `query`: `{ near, radius_km }` while active, else `{}`. */
  params: { near?: string; radius_km?: string };
  active: boolean;
};

/** Two decimals is about 1 km: the precision the API keeps and all we ever send. */
export function roundCoordinate(value: number): number {
  return Math.round(value * 100) / 100;
}

export function toNearParam(point: Pick<NearMePoint, 'latitude' | 'longitude'>): string {
  return `${roundCoordinate(point.latitude).toFixed(2)},${roundCoordinate(point.longitude).toFixed(2)}`;
}

/**
 * Near-me search state. It lives in component state only: `near` is never written to
 * the URL, storage or logs, and it is dropped when the page unmounts.
 */
export function useNearMe(): NearMeState {
  const [point, setPoint] = useState<NearMePoint | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(DEFAULT_NEAR_ME_RADIUS_KM);

  return useMemo(() => {
    const params = point ? { near: toNearParam(point), radius_km: String(radiusKm) } : {};
    return {
      point,
      radiusKm,
      setPoint,
      setRadiusKm,
      clear: () => setPoint(null),
      params,
      active: point !== null,
    };
  }, [point, radiusKm]);
}

const BAND_LABELS: Record<string, string> = {
  '<2 km': 'Under 2 km away',
  '2-5 km': '2–5 km away',
  '5-10 km': '5–10 km away',
  '10-25 km': '10–25 km away',
  '>25 km': 'Over 25 km away',
};

/** Display text for a result's `distance_band`; the API only ever sends a coarse band. */
export function distanceBandLabel(band: DistanceBandEnum | string | null | undefined) {
  if (!band) return null;
  return BAND_LABELS[band] ?? band;
}
