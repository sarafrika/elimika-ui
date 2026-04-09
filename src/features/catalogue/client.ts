import type { PublicCatalogueListResult, PublicCourseDetail } from '@/src/features/catalogue/types';
import { BrowserApiError, getJson } from '@/src/lib/api/client';

type PublicCatalogueQuery = {
  page?: number;
  size?: number;
};

const DEFAULT_PAGE = 0;
const DEFAULT_PAGE_SIZE = 50;

export const publicCatalogueQueryKeys = {
  all: ['catalogue', 'courses'] as const,
  list: ({ page = DEFAULT_PAGE, size = DEFAULT_PAGE_SIZE }: PublicCatalogueQuery = {}) =>
    [...publicCatalogueQueryKeys.all, 'list', page, size] as const,
  detail: (courseId: string) => [...publicCatalogueQueryKeys.all, 'detail', courseId] as const,
};

export const fetchPublicCatalogueCourses = async ({
  page = DEFAULT_PAGE,
  size = DEFAULT_PAGE_SIZE,
}: PublicCatalogueQuery = {}): Promise<PublicCatalogueListResult> =>
  getJson<PublicCatalogueListResult>(`/api/catalogue/courses?page=${page}&size=${size}`);

export const fetchPublicCourseDetail = async (
  courseId: string
): Promise<PublicCourseDetail | null> => {
  try {
    return await getJson<PublicCourseDetail>(
      `/api/catalogue/courses/${encodeURIComponent(courseId)}`
    );
  } catch (error) {
    if (error instanceof BrowserApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
};
