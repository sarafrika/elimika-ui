import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FormProvider, useForm } from 'react-hook-form';
import { searchCoursesQueryKey } from '@/services/client/@tanstack/react-query.gen';
import { defaultProgramValues, type ProgramFormValues } from '../program-schema';
import ProgramCourses from './ProgramCourses';

function renderCourses(courseIds: string[], lookupResponse?: unknown) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  if (lookupResponse) {
    client.setQueryData(
      searchCoursesQueryKey({
        query: {
          searchParams: { uuid_in: courseIds.join(',') },
          pageable: { page: 0, size: courseIds.length },
        },
      }),
      lookupResponse
    );
  }
  function Harness() {
    const form = useForm<ProgramFormValues>({
      defaultValues: {
        ...defaultProgramValues(),
        courses: courseIds.map(courseUuid => ({
          courseUuid,
          isRequired: true,
          prerequisiteCourseUuid: '',
        })),
      },
    });
    return createElement(FormProvider<ProgramFormValues>, {
      ...form,
      children: createElement(ProgramCourses, { creatorUuid: 'creator-id' }),
    });
  }
  try {
    return renderToStaticMarkup(
      createElement(QueryClientProvider, { client }, createElement(Harness))
    );
  } finally {
    client.clear();
  }
}

test('renders a new program with no selected courses while the catalogue loads', () => {
  assert.match(renderCourses([]), /0 selected/);
});

test('resolves saved course names outside the current catalogue page', () => {
  const html = renderCourses(['saved-course'], {
    success: true,
    data: { content: [{ uuid: 'saved-course', name: 'Saved music course' }] },
  });
  assert.match(html, /Saved music course/);
  assert.match(html, /1 selected/);
});

test('keeps an unresolved course visible without crashing', () => {
  assert.match(renderCourses(['missing-course']), /Course missing-course/);
});

test('shows a retry action and ignores course data from a failed lookup', () => {
  const html = renderCourses(['saved-course'], {
    success: false,
    error: { message: 'Unavailable' },
    data: { content: [{ uuid: 'saved-course', name: 'Invalid response course' }] },
  });
  assert.match(html, /Some selected courses could not be loaded/);
  assert.match(html, /Try again/);
  assert.doesNotMatch(html, /Invalid response course/);
});
