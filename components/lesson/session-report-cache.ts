import type { QueryClient } from '@tanstack/react-query';
import {
  getClassReportQueryKey,
  getMySessionReportsQueryKey,
  getSessionReportQueryKey,
} from '@/services/client/@tanstack/react-query.gen';

export function invalidateSessionReportData(
  client: QueryClient,
  instanceUuid: string,
  classId?: string
) {
  return Promise.all([
    client.invalidateQueries({
      queryKey: getSessionReportQueryKey({ path: { instanceUuid } }),
    }),
    client.invalidateQueries({
      queryKey: getMySessionReportsQueryKey({ query: { pageable: {} } }),
    }),
    ...(classId
      ? [
          client.invalidateQueries({
            queryKey: getClassReportQueryKey({ path: { classDefinitionUuid: classId } }),
          }),
        ]
      : []),
  ]);
}
