import type { ListRosterResponse, StudentGroupRosterEntry } from '@/services/client';
import { getErrorMessage } from '@/lib/error-utils';

export const GROUP_ROSTER_PAGE_SIZE = 100;
export const GROUP_ROSTER_CONCURRENCY = 3;

/** The roster endpoint accepts one group per request; bound concurrency without dropping groups. */
export async function loadInviteGroupStudents(
  groupUuids: string[],
  fetchPage: (groupUuid: string, page: number) => Promise<ListRosterResponse | undefined>,
  cancelled: () => boolean
): Promise<StudentGroupRosterEntry[]> {
  const rows: StudentGroupRosterEntry[] = [];
  let cursor = 0;
  const worker = async () => {
    while (!cancelled()) {
      const groupUuid = groupUuids[cursor++];
      if (!groupUuid) return;
      let page = 0;
      let hasNext = true;
      while (hasNext && !cancelled()) {
        const response = await fetchPage(groupUuid, page);
        if (cancelled()) return;
        if (!response || response.error || response.success === false) {
          throw new Error(getErrorMessage(response, 'Could not load group students.'));
        }
        rows.push(...(response.data?.content ?? []).filter(row => row.group_uuid === groupUuid));
        const metadata = response.data?.metadata;
        const totalPages =
          metadata?.totalPages ??
          Math.ceil(Number(metadata?.totalElements ?? 0) / GROUP_ROSTER_PAGE_SIZE);
        page += 1;
        hasNext = metadata?.hasNext ?? page < totalPages;
      }
    }
  };
  const results = await Promise.allSettled(
    Array.from({ length: Math.min(GROUP_ROSTER_CONCURRENCY, groupUuids.length) }, worker)
  );
  for (const result of results) {
    if (result.status === 'rejected') throw result.reason;
  }
  return rows;
}
