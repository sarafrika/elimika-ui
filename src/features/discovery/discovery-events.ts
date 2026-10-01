'use client';

import { useCallback } from 'react';
import { recordDiscoveryEvent } from '@/services/client/sdk.gen';
import type { EventTypeEnum } from '@/services/client/types.gen';

type DiscoveryItemType = 'course' | 'job' | 'instructor';

type DiscoveryEvent = {
  /** The `recommendation_id` the list came back with. Nothing is sent without it. */
  recommendationId: string | null | undefined;
  itemUuid: string | null | undefined;
  itemType: DiscoveryItemType;
  eventType: EventTypeEnum;
  /** 0-based position the item was shown at. */
  position: number;
};

/**
 * `POST /api/v1/discovery/events`: tells the ranking which shown item was clicked or
 * dismissed. Impressions are recorded by the server. Fire-and-forget: a failure never
 * reaches the user and is never retried.
 */
export function sendDiscoveryEvent({
  recommendationId,
  itemUuid,
  itemType,
  eventType,
  position,
}: DiscoveryEvent): void {
  if (!recommendationId || !itemUuid) return;
  void recordDiscoveryEvent({
    body: {
      recommendation_id: recommendationId,
      item_uuid: itemUuid,
      item_type: itemType,
      event_type: eventType,
      position,
    },
  }).catch(() => undefined);
}

/** A stable `sendDiscoveryEvent` for handlers. */
export function useDiscoveryEvents() {
  return useCallback((event: DiscoveryEvent) => sendDiscoveryEvent(event), []);
}
