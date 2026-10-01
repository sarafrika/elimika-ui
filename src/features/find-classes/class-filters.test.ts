import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  hasClassFilters,
  matchesClassFilters,
  parseClassFilters,
  toClassSearchParams,
} from './class-filters';

const fromUrl = (search: string) => {
  const params = new URLSearchParams(search);
  return parseClassFilters(key => params.get(key));
};

test('reads only valid filters from the URL', () => {
  assert.deepEqual(fromUrl('location=HYBRID&format=GROUP&from=2026-10-01&course=c1'), {
    course: 'c1',
    location: 'HYBRID',
    format: 'GROUP',
    from: '2026-10-01',
    organisation: undefined,
  });
  const junk = fromUrl('location=moon&format=x&from=tomorrow');
  assert.equal(junk.location, undefined);
  assert.equal(junk.format, undefined);
  assert.equal(junk.from, undefined);
  assert.equal(hasClassFilters(junk), false);
});

test('sends filters in the field_op vocabulary', () => {
  assert.deepEqual(
    toClassSearchParams({ course: 'c1', location: 'IN_PERSON', from: '2026-10-01', organisation: 'o1' }),
    {
      is_active: 'true',
      course_uuid: 'c1',
      location_type: 'IN_PERSON',
      starts_at_gte: '2026-10-01',
      organisation_uuid: 'o1',
    }
  );
  assert.deepEqual(toClassSearchParams({}), { is_active: 'true' });
});

test('narrows loaded rows the same way', () => {
  const row = {
    course_uuid: 'c1',
    location_type: 'ONLINE' as const,
    session_format: 'GROUP' as const,
    default_start_time: new Date('2026-10-05T07:00:00Z'),
    organisation_uuid: 'o1',
    is_active: true,
  };
  assert.equal(matchesClassFilters(row, {}), true);
  assert.equal(matchesClassFilters(row, { course: 'c2' }), false);
  assert.equal(matchesClassFilters(row, { location: 'IN_PERSON' }), false);
  assert.equal(matchesClassFilters(row, { format: 'GROUP', from: '2026-10-01' }), true);
  assert.equal(matchesClassFilters(row, { from: '2026-10-06' }), false);
  assert.equal(matchesClassFilters({ ...row, is_active: false }, {}), false);
});
