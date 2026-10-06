import assert from 'node:assert/strict';
import test from 'node:test';
import { passMarkSchema, toPassMark } from '@/lib/pass-mark';
import { defaultProgramValues, programBody, programFormSchema } from './program-schema';

test('program editing loads its code, pass mark, and all uploaded media', () => {
  const existing = {
    ...programBody(defaultProgramValues(), 'creator'),
    program_code: 'MUSIC-101',
    pass_mark: 0,
    thumbnail_url: '/api/v1/programs/id/thumbnail',
    banner_url: '/api/v1/programs/id/banner',
    intro_video_url: '/api/v1/programs/id/intro-video',
  };
  const values = defaultProgramValues(existing);
  assert.equal(values.programCode, 'MUSIC-101');
  assert.equal(values.passMark, 0);
  assert.equal(values.thumbnailUrl, existing.thumbnail_url);
  assert.equal(values.bannerUrl, existing.banner_url);
  assert.equal(values.videoUrl, existing.intro_video_url);
});

test('program save includes normalized code and pass mark and leaves uploaded media to upload endpoints', () => {
  const values = { ...defaultProgramValues(), programCode: ' music-101 ', passMark: 62.5 };
  const body = programBody(values, 'creator');
  assert.equal(body.program_code, 'MUSIC-101');
  assert.equal(body.pass_mark, 62.5);
  assert.equal('thumbnail_url' in body, false);
  assert.equal('banner_url' in body, false);
  assert.equal('intro_video_url' in body, false);
});

test('empty optional values clear codes and pass marks instead of becoming zero', () => {
  const body = programBody(defaultProgramValues(), 'creator');
  assert.equal(body.program_code, null);
  assert.equal(body.pass_mark, null);
  assert.equal(toPassMark(passMarkSchema.parse('')), null);
  assert.equal(toPassMark(passMarkSchema.parse(undefined)), null);
});

test('course and program pass marks accept boundaries and reject invalid percentages', () => {
  for (const value of [0, 100, 62.5, '50', ''])
    assert.equal(passMarkSchema.safeParse(value).success, true);
  for (const value of [-1, 101, Number.NaN, Number.POSITIVE_INFINITY, 'invalid']) {
    assert.equal(passMarkSchema.safeParse(value).success, false);
    const result = programFormSchema.safeParse({
      ...defaultProgramValues(),
      title: 'Program',
      description: 'Description',
      categoryUuids: ['category'],
      passMark: value,
    });
    assert.equal(result.success, false);
    if (!result.success) assert.ok(result.error.issues.some(issue => issue.path[0] === 'passMark'));
  }
});
