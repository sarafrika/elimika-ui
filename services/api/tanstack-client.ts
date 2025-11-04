import { fetchClient } from './fetch-client';
import createClient from 'openapi-react-query';
import { queryOptions } from '@tanstack/react-query';
import { getDashboardStatisticsOptions } from '@/services/client/@tanstack/react-query.gen';
import { parseAdminDashboardStatistics } from './actions';

export const tanstackClient = createClient(fetchClient);

export const getAdminDashboardStatisticsOptions = () => {
  const base = getDashboardStatisticsOptions();

  return queryOptions({
    ...base,
    queryFn: async ctx => {
      const payload = await base.queryFn(ctx);
      return parseAdminDashboardStatistics(payload);
    },
  });
};
