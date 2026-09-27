import type { Lesson } from '@/services/client/types.gen';

/** Move occupied numbers aside before assigning contiguous lesson positions. */
export function planLessonOrder(lessons: Array<Lesson & { uuid: string }>) {
  const numbers = new Map(lessons.map(lesson => [lesson.uuid, lesson.lesson_number]));
  let spare = Math.max(0, ...numbers.values()) + 1;
  const changes: Array<{ uuid: string; number: number }> = [];
  lessons.forEach((lesson, index) => {
    const number = index + 1;
    if (numbers.get(lesson.uuid) === number) return;
    const occupant = [...numbers].find(([uuid, value]) => uuid !== lesson.uuid && value === number);
    if (occupant) {
      changes.push({ uuid: occupant[0], number: spare });
      numbers.set(occupant[0], spare++);
    }
    changes.push({ uuid: lesson.uuid, number });
    numbers.set(lesson.uuid, number);
  });
  return changes;
}
