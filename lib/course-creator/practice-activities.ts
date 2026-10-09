import type { LessonPracticeActivity } from '@/services/client/types.gen';

export function practiceActivityListRequest(
  courseUuid: string,
  lessonUuid: string,
  page: number,
  size: number
) {
  return {
    path: { courseUuid, lessonUuid },
    query: { pageable: { page, size } },
  };
}

export function sortPracticeActivities(activities: LessonPracticeActivity[]) {
  return [...activities].sort(
    (left, right) =>
      (left.display_order ?? Number.MAX_SAFE_INTEGER) -
      (right.display_order ?? Number.MAX_SAFE_INTEGER)
  );
}

/** Reuse this page's order slots so dragging never renumbers another page. */
export function reorderPracticeActivityPage(
  activities: LessonPracticeActivity[],
  from: number,
  to: number
) {
  const slots = activities.map(activity => activity.display_order);
  if (slots.some(slot => slot === undefined) || new Set(slots).size !== slots.length) return null;
  const reordered = [...activities];
  const [moved] = reordered.splice(from, 1);
  if (!moved) return null;
  reordered.splice(to, 0, moved);
  return reordered.map((activity, index) => ({ ...activity, display_order: slots[index] }));
}
