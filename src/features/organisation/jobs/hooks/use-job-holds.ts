'use client';

import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { extractList, extractPage } from '@/lib/api-helpers';
import { localDate } from '@/lib/date';
import type {
  ClassMarketplaceJob,
  ClassMarketplaceJobResource,
  InstructorTimeHold,
  ResourceBooking,
} from '@/services/client';
import {
  getInstructorTimeHoldsOptions,
  listBookingsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { jobSessionWindows } from '../lib/job-stage';

const BOOKING_PAGE = { page: 0, size: 200 };

export type ResourceHolds = {
  resource: ClassMarketplaceJobResource;
  bookings: ResourceBooking[];
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
};

/** A booking belongs to the job while it recruits, and to its class once that exists. */
function belongsToJob(
  job: ClassMarketplaceJob,
  booking: { job_uuid?: string | null; class_definition_uuid?: string | null }
) {
  if (booking.job_uuid && booking.job_uuid === job.uuid) return true;
  const classUuid = job.assigned_class_definition_uuid;
  return Boolean(classUuid && booking.class_definition_uuid === classUuid);
}

// The venue, equipment and instructor-time holds a job placed, over its session range.
// One request per held resource plus one for the instructor, and only while `enabled`.
export function useJobHolds(
  job: ClassMarketplaceJob | null | undefined,
  { enabled = true, instructorUuid }: { enabled?: boolean; instructorUuid?: string | null } = {}
) {
  const range = useMemo(() => {
    const windows = job ? jobSessionWindows(job) : [];
    const first = windows[0];
    const last = windows[windows.length - 1];
    if (!first || !last) return null;
    return { start: localDate(first.start), end: localDate(last.end) };
  }, [job]);

  const organisationUuid = job?.organisation_uuid ?? '';
  const resources = job?.resources ?? [];
  const active = Boolean(enabled && job?.uuid && organisationUuid && range);

  const resourceQueries = useQueries({
    queries: resources.map(resource => ({
      ...listBookingsOptions({
        path: { organisationUuid, resourceUuid: resource.resource_uuid },
        query: {
          ...(range ? { start_date: range.start, end_date: range.end } : {}),
          pageable: BOOKING_PAGE,
        },
      }),
      enabled: active && Boolean(resource.resource_uuid),
      retry: false,
    })),
  });

  const holder = instructorUuid ?? job?.hired_instructor_uuid ?? job?.assigned_instructor_uuid;
  const instructorQuery = useQuery({
    ...getInstructorTimeHoldsOptions({
      path: { instructorUuid: holder ?? '' },
      query: {
        start: range?.start ?? localDate(new Date()),
        end: range?.end ?? localDate(new Date()),
      },
    }),
    enabled: active && Boolean(holder),
    retry: false,
  });

  const resourceHolds: ResourceHolds[] = resources.map((resource, index) => {
    const query = resourceQueries[index];
    return {
      resource,
      bookings: job
        ? extractPage<ResourceBooking>(query?.data).items.filter(booking =>
            belongsToJob(job, booking)
          )
        : [],
      isLoading: Boolean(query?.isLoading),
      error: query?.error,
      refetch: () => void query?.refetch(),
    };
  });

  const instructorHolds = job
    ? extractList<InstructorTimeHold>(instructorQuery.data).filter(hold => belongsToJob(job, hold))
    : [];

  return {
    range,
    resourceHolds,
    instructorHolds,
    instructorUuid: holder ?? null,
    instructorQuery,
  };
}

/** The most advanced state among a set of holds, so one badge can stand for all of them. */
export function dominantHoldStatus(statuses: Array<string | null | undefined>) {
  const set = new Set(statuses.filter(Boolean).map(status => String(status).toUpperCase()));
  for (const status of ['CONFIRMED', 'FIRM', 'HOLD', 'TENTATIVE', 'RELEASED', 'CANCELLED']) {
    if (set.has(status)) return status;
  }
  return null;
}
