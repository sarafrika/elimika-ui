export type WorkbookRole = 'instructor' | 'student';

/** Keep API failure envelopes distinct from legitimately empty lists. */
export function hasApiError(response?: { error?: unknown; success?: boolean }) {
  return Boolean(response?.error) || response?.success === false;
}

export const WORKBOOK_PAGE_SIZE = 50;

export function nextWorkbookPage(
  lastPage: {
    data?: { metadata?: { totalPages?: number }; content?: unknown[] };
    error?: unknown;
    success?: boolean;
  },
  pages: unknown[]
) {
  if (hasApiError(lastPage)) return undefined;
  const total = lastPage.data?.metadata?.totalPages;
  if (typeof total === 'number') return pages.length < total ? pages.length : undefined;
  return lastPage.data?.content?.length === WORKBOOK_PAGE_SIZE ? pages.length : undefined;
}
