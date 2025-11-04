import { fetchClient } from './fetch-client';
import { paths } from './schema';
import { z } from 'zod';
import { getDashboardStatistics } from '@/services/client/sdk.gen';
import {
  zAdminDashboardStats,
  zApiResponseAdminDashboardStats,
} from '@/services/client/zod.gen';

const activityEventInputSchema = z
  .object({
    id: z.string().optional(),
    category: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    status: z.string().optional(),
    occurred_at: z
      .string()
      .datetime({
        offset: true,
      })
      .optional(),
  })
  .passthrough();

const adminDashboardResponseSchema = zApiResponseAdminDashboardStats.extend({
  data: z
    .union([
      zAdminDashboardStats.extend({
        activity_events: z.array(activityEventInputSchema).optional(),
      }),
      z.undefined(),
    ])
    .optional(),
});

const adminDashboardStatsSchema = zAdminDashboardStats
  .omit({ timestamp: true })
  .merge(
    z.object({
      timestamp: z.coerce.date().optional(),
    })
  );

export type ActivityEventStatus = 'success' | 'pending' | 'warning' | 'critical' | 'info';

const activityEventSchema = activityEventInputSchema.transform(event => ({
  id:
    event.id ||
    [event.category, event.title, event.occurred_at]
      .filter(Boolean)
      .join(':') ||
    `event-${Math.random().toString(36).slice(2, 10)}`,
  category: (event.category || 'general').toLowerCase(),
  title: event.title || event.description || 'Platform activity',
  description: event.description || 'Snapshot update recorded on the dashboard.',
  status: normalizeEventStatus(event.status),
  occurredAt: event.occurred_at ? new Date(event.occurred_at) : undefined,
}));

const normalizeEventStatus = (status?: string): ActivityEventStatus => {
  switch (status?.toLowerCase()) {
    case 'success':
    case 'completed':
      return 'success';
    case 'pending':
    case 'queued':
    case 'in_progress':
      return 'pending';
    case 'warning':
    case 'alert':
      return 'warning';
    case 'critical':
    case 'failed':
    case 'error':
      return 'critical';
    default:
      return 'info';
  }
};

const toNumber = (value?: bigint | number | string | null) => {
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

export type ActivityEventDTO = z.infer<typeof activityEventSchema>;

export type AdminDashboardStatsDTO = z.infer<typeof adminDashboardStatsSchema>;

const createDerivedEvent = ({
  category,
  title,
  description,
  status,
  occurredAt,
}: {
  category: ActivityEventDTO['category'];
  title: string;
  description: string;
  status: ActivityEventStatus;
  occurredAt?: Date;
}) =>
  activityEventSchema.parse({
    id: `${category}-${title}`.toLowerCase().replace(/\s+/g, '-'),
    category,
    title,
    description,
    status,
    occurred_at: occurredAt?.toISOString(),
  });

const deriveActivityEvents = (statistics?: AdminDashboardStatsDTO): ActivityEventDTO[] => {
  if (!statistics) {
    return [];
  }

  const snapshotTime = statistics.timestamp ?? new Date();
  const events: ActivityEventDTO[] = [];

  const userMetrics = statistics.user_metrics;
  if (userMetrics) {
    const newRegistrations = toNumber(userMetrics.new_registrations_7d);
    events.push(
      createDerivedEvent({
        category: 'user',
        title: 'New user registrations',
        description: `${newRegistrations.toLocaleString()} new user registrations in the last 7 days`,
        status: newRegistrations > 0 ? 'success' : 'pending',
        occurredAt: snapshotTime,
      })
    );
    const suspendedAccounts = toNumber(userMetrics.suspended_accounts);
    if (suspendedAccounts > 0) {
      events.push(
        createDerivedEvent({
          category: 'user',
          title: 'Suspended accounts',
          description: `${suspendedAccounts.toLocaleString()} accounts currently suspended`,
          status: 'warning',
          occurredAt: snapshotTime,
        })
      );
    }
  }

  const organizationMetrics = statistics.organization_metrics;
  if (organizationMetrics) {
    const pending = toNumber(organizationMetrics.pending_approvals);
    events.push(
      createDerivedEvent({
        category: 'organization',
        title: 'Organisation approvals',
        description: `${pending.toLocaleString()} organisations pending review`,
        status: pending > 0 ? 'pending' : 'success',
        occurredAt: snapshotTime,
      })
    );
  }

  const complianceMetrics = statistics.compliance_metrics;
  if (complianceMetrics) {
    const pendingInstructors = toNumber(complianceMetrics.pending_instructor_verifications);
    if (pendingInstructors >= 0) {
      events.push(
        createDerivedEvent({
          category: 'compliance',
          title: 'Instructor verifications',
          description: `${pendingInstructors.toLocaleString()} instructor verifications awaiting review`,
          status: pendingInstructors > 0 ? 'pending' : 'success',
          occurredAt: snapshotTime,
        })
      );
    }

    const pendingCourseCreators = toNumber(
      complianceMetrics.pending_course_creator_verifications
    );
    if (pendingCourseCreators >= 0) {
      events.push(
        createDerivedEvent({
          category: 'compliance',
          title: 'Course creator applications',
          description: `${pendingCourseCreators.toLocaleString()} course creator applications pending review`,
          status: pendingCourseCreators > 0 ? 'pending' : 'success',
          occurredAt: snapshotTime,
        })
      );
    }
  }

  const learningMetrics = statistics.learning_metrics;
  if (learningMetrics) {
    const publishedCourses = toNumber(learningMetrics.published_courses);
    events.push(
      createDerivedEvent({
        category: 'learning',
        title: 'Published courses',
        description: `${publishedCourses.toLocaleString()} courses currently published`,
        status: publishedCourses > 0 ? 'success' : 'pending',
        occurredAt: snapshotTime,
      })
    );
  }

  const adminMetrics = statistics.admin_metrics;
  if (adminMetrics) {
    const adminActions = toNumber(adminMetrics.admin_actions_today);
    events.push(
      createDerivedEvent({
        category: 'admin',
        title: 'Admin actions today',
        description: `${adminActions.toLocaleString()} administrative actions recorded today`,
        status: adminActions > 0 ? 'success' : 'info',
        occurredAt: snapshotTime,
      })
    );
  }

  const communicationMetrics = statistics.communication_metrics;
  if (communicationMetrics) {
    const pendingNotifications = toNumber(communicationMetrics.pending_notifications);
    events.push(
      createDerivedEvent({
        category: 'notifications',
        title: 'Pending notifications',
        description: `${pendingNotifications.toLocaleString()} notifications pending delivery`,
        status: pendingNotifications > 0 ? 'warning' : 'success',
        occurredAt: snapshotTime,
      })
    );
  }

  return events;
};

export interface AdminDashboardStatisticsResult {
  statistics?: AdminDashboardStatsDTO;
  activityEvents: ActivityEventDTO[];
}

export const parseAdminDashboardStatistics = (
  payload: unknown
): AdminDashboardStatisticsResult => {
  const parsed = adminDashboardResponseSchema.parse(payload);
  if (!parsed.data) {
    return { statistics: undefined, activityEvents: [] };
  }

  const { activity_events: rawEvents = [], ...rest } = parsed.data as z.infer<
    typeof zAdminDashboardStats
  > & {
    activity_events?: z.infer<typeof activityEventInputSchema>[];
  };

  const statistics = adminDashboardStatsSchema.parse(rest);

  const parsedEvents = z.array(activityEventSchema).safeParse(rawEvents);

  const activityEvents = parsedEvents.success
    ? parsedEvents.data.length > 0
      ? parsedEvents.data
      : deriveActivityEvents(statistics)
    : deriveActivityEvents(statistics);

  return { statistics, activityEvents };
};

export async function getAdminDashboardStatistics({
  signal,
}: {
  signal?: AbortSignal;
} = {}): Promise<AdminDashboardStatisticsResult> {
  const { data } = await getDashboardStatistics({ signal, throwOnError: true });
  return parseAdminDashboardStatistics(data);
}

/**
 * Generic Search function defination
 */
type SearchEndpoints = {
  [K in keyof paths]: paths[K] extends { get: any } ? K : never;
}[keyof paths];

export async function search<P extends SearchEndpoints>(endpoint: P, searchParams: any) {
  const init: any = {};
  //console.log(searchParams);
  if (searchParams) {
    init.params = {
      pageable: {
        page: 0,
        size: 10,
      },
      query: { ...searchParams },
    };
  }
  const resp = await fetchClient.GET(endpoint, init);

  if (resp.error) {
    throw new Error(typeof resp.error === 'string' ? resp.error : JSON.stringify(resp.error));
  }

  if (resp.data.data?.content?.length === 0) {
    throw new Error('Not found');
  }

  return resp.data.data?.content!;
}

/** End of generic search function */
