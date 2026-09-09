import assert from 'node:assert/strict';
import test from 'node:test';
import type { LessonContent } from '@/services/client/types.gen';
import { saveLessonMedia } from './save-lesson-media';

const details: LessonContent = {
  lesson_uuid: 'lesson',
  content_type_uuid: 'pdf',
  title: 'Updated handout',
  description: 'New edition',
  display_order: 3,
  is_required: true,
};
const original: LessonContent = { ...details, uuid: 'original', file_url: '/api/v1/files/old.pdf' };
const uploaded: LessonContent = { ...details, uuid: 'new', file_url: '/api/v1/files/new.pdf' };

function setup(failure?: 'upload' | 'update' | 'delete' | 'lost-response' | 'list' | 'cleanup') {
  const contents = new Map<string, LessonContent>([['original', original]]);
  const removed: string[] = [];
  const operations = {
    upload: async () => {
      if (failure === 'upload') throw new Error('Upload failed');
      contents.set('new', { ...uploaded, display_order: 99 });
      return uploaded;
    },
    update: async (uuid: string, body: LessonContent) => {
      if (failure === 'update') throw new Error('Update failed');
      contents.set(uuid, body);
    },
    remove: async (uuid: string) => {
      removed.push(uuid);
      if (uuid === 'original') {
        assert.equal(contents.get('new')?.display_order, 3);
        assert.equal(contents.get('new')?.is_required, true);
        if (failure === 'delete' || failure === 'list' || failure === 'cleanup') {
          throw new Error('Delete failed');
        }
      }
      if (uuid === 'new' && failure === 'cleanup') throw new Error('Cleanup failed');
      contents.delete(uuid);
      if (uuid === 'original' && failure === 'lost-response') throw new Error('Connection lost');
    },
    list: async () => {
      if (failure === 'list') throw new Error('Offline');
      return [...contents.values()];
    },
  };
  return {
    contents,
    removed,
    save: (originalUuid: string | undefined = 'original') =>
      saveLessonMedia({ originalUuid, details, operations }),
    create: () => saveLessonMedia({ details, operations }),
  };
}

test('replacement leaves one item with the new file and edited metadata', async () => {
  const fixture = setup();
  await fixture.save();
  assert.equal(fixture.contents.size, 1);
  assert.deepEqual(fixture.contents.get('new'), {
    ...details,
    uuid: 'new',
    file_url: uploaded.file_url,
    content_text: null,
  });
});

test('creating content does not delete an existing item', async () => {
  const fixture = setup();
  await fixture.create();
  assert.equal(fixture.contents.size, 2);
  assert.deepEqual(fixture.removed, []);
});

for (const failure of ['upload', 'update', 'delete'] as const) {
  test(`${failure} failure keeps the original without a duplicate`, async () => {
    const fixture = setup(failure);
    await assert.rejects(fixture.save());
    assert.deepEqual([...fixture.contents.values()], [original]);
  });
}

test('a lost successful delete response does not roll back the remaining copy', async () => {
  const fixture = setup('lost-response');
  await fixture.save();
  assert.deepEqual([...fixture.contents.keys()], ['new']);
  assert.deepEqual(fixture.removed, ['original']);
});

test('an unverifiable delete preserves the upload and reports the uncertainty', async () => {
  const fixture = setup('list');
  await assert.rejects(fixture.save(), /replacement could not be confirmed/);
  assert.equal(fixture.contents.size, 2);
  assert.deepEqual(fixture.removed, ['original']);
});

test('failed cleanup reports the extra upload while preserving the original', async () => {
  const fixture = setup('cleanup');
  await assert.rejects(fixture.save(), /extra upload could not be removed/);
  assert.equal(fixture.contents.size, 2);
});
