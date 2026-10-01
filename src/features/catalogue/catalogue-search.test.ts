import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  activeFilterCount,
  type CatalogueFilters,
  type CatalogueItem,
  isCatalogueItem,
  isCatalogueSearchUnavailable,
  itemLinks,
  itemStats,
  resultNoun,
  toCatalogueSearchPage,
  toCatalogueSearchQuery,
} from './catalogue-search';

const NONE: CatalogueFilters = {
  show: 'all',
  category: '',
  level: 'any',
  price: 'any',
  sort: 'relevance',
  page: 0,
};

const course: CatalogueItem = {
  type: 'course',
  uuid: 'c1',
  title: 'SQL Essentials',
  lesson_count: 2,
  learner_count: 7,
  class_count: 1,
};

const programme: CatalogueItem = {
  type: 'programme',
  uuid: 'p1',
  title: 'Full-Stack JavaScript Path',
  course_count: 3,
  lesson_count: 6,
};

test('an unfiltered query carries only paging', () => {
  assert.deepEqual(toCatalogueSearchQuery(NONE), { page: 0, size: 24 });
});

test('q is sent only at two or more characters', () => {
  assert.equal(toCatalogueSearchQuery({ ...NONE, q: 'j' }).q, undefined);
  assert.equal(toCatalogueSearchQuery({ ...NONE, q: ' java ' }).q, 'java');
});

test('filters map onto the contract parameters', () => {
  assert.deepEqual(
    toCatalogueSearchQuery({
      ...NONE,
      show: 'programmes',
      category: 'cat-1',
      level: 'beginner',
      price: 'free',
      sort: 'newest',
      page: 2,
    }),
    {
      show: 'programmes',
      category_uuid: ['cat-1'],
      level: 'beginner',
      price: 'free',
      sort: 'newest',
      page: 2,
      size: 24,
    }
  );
});

test('the filter badge counts narrowed groups', () => {
  assert.equal(activeFilterCount(NONE), 0);
  assert.equal(activeFilterCount({ ...NONE, show: 'courses', price: 'paid' }), 2);
});

test('the type guard accepts courses and programmes only', () => {
  assert.equal(isCatalogueItem(course), true);
  assert.equal(isCatalogueItem(programme), true);
  assert.equal(isCatalogueItem({ type: 'class', uuid: 'x', title: 'X' }), false);
  assert.equal(isCatalogueItem({ type: 'course', uuid: '', title: 'X' }), false);
  assert.equal(isCatalogueItem(null), false);
});

test('the page is read out of the ApiResponse envelope', () => {
  const page = toCatalogueSearchPage({
    success: true,
    data: {
      content: [course, { type: 'nope' }],
      metadata: { totalElements: 1, totalPages: 1 },
      facets: { show: { all: 1, courses: 1, programmes: 0 } },
    },
  });
  assert.equal(page?.content.length, 1);
  assert.equal(page?.facets?.show?.courses, 1);
  assert.equal(toCatalogueSearchPage({ data: {} }), null);
  assert.equal(toCatalogueSearchPage('nope'), null);
});

test('503, 401 and 404 fall back to the plain list; other errors do not', () => {
  assert.equal(isCatalogueSearchUnavailable({ status: 503 }), true);
  assert.equal(isCatalogueSearchUnavailable({ status: 404 }), true);
  assert.equal(isCatalogueSearchUnavailable({ status: 401 }), true);
  assert.equal(isCatalogueSearchUnavailable({ status: 500 }), false);
  assert.equal(isCatalogueSearchUnavailable(null), false);
});

test('result nouns follow the show filter', () => {
  assert.equal(resultNoun('all', 3), 'results');
  assert.equal(resultNoun('courses', 1), 'course');
  assert.equal(resultNoun('programmes', 2), 'programmes');
});

test('a programme counts its courses and lessons', () => {
  assert.deepEqual(itemStats(programme), ['3 courses', '6 lessons']);
  assert.deepEqual(itemStats(course), ['2 lessons', '7 learners', '1 class']);
});

test('a course opens its public page; a programme signs a visitor in first', () => {
  const courseLinks = itemLinks(course, false);
  assert.equal(courseLinks.primary.href, '/courses/c1');
  assert.equal(courseLinks.secondary.href, '/dashboard/student/find-classes?course=c1');
  assert.equal(courseLinks.secondary.label, 'See classes');

  const visitor = itemLinks(programme, false);
  assert.equal(visitor.primary.label, 'View programme');
  assert.equal(visitor.primary.signIn, true);
  assert.equal(visitor.primary.href, '/dashboard/student/courses/available-programs/p1');
  assert.equal(visitor.secondary.label, 'See its courses');

  assert.equal(itemLinks(programme, true).primary.signIn, false);
});
