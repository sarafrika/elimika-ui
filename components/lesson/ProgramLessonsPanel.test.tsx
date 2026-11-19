import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Lesson } from '@/services/client/types.gen';
import { ProgramLessonsPanel } from './ProgramLessonsPanel';

test('All lessons keeps program course order and each lesson under its own course', () => {
  const lesson: Lesson = {
    uuid: 'lesson-a',
    course_uuid: 'course-a',
    lesson_number: 1,
    title: 'Keeping time',
    status: 'PUBLISHED',
    active: true,
  };
  const html = renderToStaticMarkup(
    createElement(ProgramLessonsPanel, {
      courses: [
        { uuid: 'course-a', name: 'Rhythm' },
        { uuid: 'course-b', name: 'Theory' },
        { uuid: 'course-c', name: 'Ensemble' },
      ],
      lessonsByCourse: new Map([
        ['course-a', [lesson]],
        [
          'course-b',
          [{ ...lesson, uuid: 'lesson-b', course_uuid: 'course-b', title: 'Reading notes' }],
        ],
      ]),
      onSelect: () => {},
    })
  );
  assert.match(
    html,
    /aria-label="Rhythm"[\s\S]*Keeping time[\s\S]*aria-label="Theory"[\s\S]*Reading notes/
  );
  assert.match(html, /aria-label="Ensemble"[\s\S]*No lessons available in this course/);
  assert.equal((html.match(/<section/g) ?? []).length, 3);
});
