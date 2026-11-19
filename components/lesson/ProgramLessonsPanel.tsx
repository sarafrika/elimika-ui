'use client';

import { useDeferredValue, useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import type { Course, Lesson } from '@/services/client/types.gen';

export function ProgramLessonsPanel({
  courses,
  lessonsByCourse,
  onSelect,
}: {
  courses: Pick<Course, 'uuid' | 'name'>[];
  lessonsByCourse: Map<string, Lesson[]>;
  onSelect: (courseId: string, lessonId: string) => void;
}) {
  const [search, setSearch] = useState('');
  const term = useDeferredValue(search).trim().toLowerCase();
  const groups = courses.flatMap(course => {
    if (!course.uuid) return [];
    const lessons = lessonsByCourse.get(course.uuid) ?? [];
    const matchesCourse = course.name.toLowerCase().includes(term);
    const filtered = matchesCourse
      ? lessons
      : lessons.filter(lesson =>
          `${lesson.lesson_number} ${lesson.title} ${lesson.description ?? ''}`
            .toLowerCase()
            .includes(term)
        );
    return !term || matchesCourse || filtered.length ? [{ course, lessons: filtered }] : [];
  });
  return (
    <div className='space-y-6'>
      <h2 className='text-lg font-semibold'>All programme lessons</h2>
      <Input
        aria-label='Search programme lessons'
        placeholder='Search courses and lessons…'
        value={search}
        onChange={event => setSearch(event.target.value)}
      />
      {groups.length === 0 && <EmptyState title='No matching courses or lessons' />}
      {groups.map(({ course, lessons }) => (
        <section key={course.uuid} className='space-y-3' aria-label={course.name}>
          <h3 className='text-base font-semibold'>{course.name}</h3>
          {lessons.length === 0 ? (
            <EmptyState variant='compact' title='No lessons available in this course' />
          ) : (
            <ul className='space-y-2'>
              {lessons.map(lesson => (
                <li key={lesson.uuid}>
                  <Button
                    variant='outline'
                    className='h-auto w-full justify-start p-4 text-left whitespace-normal'
                    onClick={() => {
                      if (course.uuid && lesson.uuid) onSelect(course.uuid, lesson.uuid);
                    }}
                  >
                    Lesson {lesson.lesson_number}: {lesson.title}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
