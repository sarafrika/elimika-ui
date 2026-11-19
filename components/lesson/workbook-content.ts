import type {
  GetCourseContentResponse,
  GetLessonContentResponse,
} from '@/services/client/types.gen';
import { hasApiError } from './workbook-data';

/** Read only the selected lesson from a successful, server-authorised response. */
export function resolveWorkbookLessonContent(
  courseResponse: GetCourseContentResponse | null | undefined,
  lessonResponse: GetLessonContentResponse | undefined,
  lessonId: string
) {
  const hasCourseContent =
    !hasApiError(courseResponse ?? undefined) && courseResponse?.data?.full_access === true;
  const lesson = hasCourseContent
    ? courseResponse?.data?.lessons?.find(item => item.uuid === lessonId)
    : undefined;
  const contents = hasCourseContent
    ? (lesson?.contents ?? [])
    : hasApiError(lessonResponse)
      ? []
      : (lessonResponse?.data ?? []);

  return {
    hasCourseContent,
    lessonFound: Boolean(lesson),
    contents: [...contents].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)),
  };
}
