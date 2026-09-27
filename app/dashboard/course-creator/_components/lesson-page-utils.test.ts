import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ContentType, LessonContent } from '@/services/client/types.gen';
import {
  pageContentBody,
  pageText,
  resolvePageAttachment,
  sortLessonPages,
} from './lesson-page-utils';

const types: [ContentType, ContentType, ContentType, ContentType, ContentType] = [
  { uuid: 'text', name: 'TEXT', mime_types: ['text/html'] },
  { uuid: 'image', name: 'IMAGE', mime_types: ['image/*'], max_file_size_mb: 2 },
  { uuid: 'pdf', name: 'PDF', mime_types: ['application/pdf'] },
  { uuid: 'video', name: 'VIDEO', mime_types: ['video/mp4'] },
  { uuid: 'audio', name: 'AUDIO', mime_types: ['audio/*'] },
];
const content: LessonContent = {
  uuid: 'page',
  lesson_uuid: 'lesson',
  content_type_uuid: 'text',
  title: 'Intro',
  is_required: false,
};

test('detects supported attachment types from MIME metadata', () => {
  for (const [mime, expected] of [
    ['image/png', 'image'],
    ['application/pdf', 'pdf'],
    ['video/mp4', 'video'],
    ['audio/mpeg', 'audio'],
  ] as const) {
    assert.equal(
      resolvePageAttachment({ name: 'file', type: mime, size: 100 }, types).type.uuid,
      expected
    );
  }
});
test('uses case-insensitive extensions when the browser omits MIME metadata', () => {
  assert.equal(
    resolvePageAttachment({ name: 'PHOTO.PNG', type: '', size: 100 }, types).mime,
    'image/png'
  );
  assert.equal(
    resolvePageAttachment({ name: 'guide.pdf', type: 'application/octet-stream', size: 100 }, types)
      .type.uuid,
    'pdf'
  );
});
test('rejects unsupported files, missing server formats, and files above the server limit', () => {
  assert.throws(
    () => resolvePageAttachment({ name: 'app.exe', type: '', size: 1 }, types),
    /Choose an image/
  );
  assert.throws(
    () => resolvePageAttachment({ name: 'clip.webm', type: 'video/webm', size: 1 }, types),
    /not supported/
  );
  assert.throws(
    () => resolvePageAttachment({ name: 'file.pdf', type: '', size: 1 }, []),
    /not available/
  );
  assert.throws(
    () => resolvePageAttachment({ name: 'big.png', type: '', size: 3 * 1024 * 1024 }, types),
    /smaller than 2 MB/
  );
});
test('preserves rich page text when adding or removing an attachment', () => {
  const text = '<h2>Key concepts</h2><p>A <strong>detailed</strong> explanation.</p>';
  const base = { content, lessonUuid: 'lesson', title: ' Introduction ', text, order: 2 };
  const image = pageContentBody({ ...base, type: types[1], fileUrl: '/image.png' });
  assert.equal(image.description, text);
  assert.equal(image.content_text, null);
  assert.equal(image.content_type_uuid, 'image');
  assert.equal(image.is_required, false);
  assert.equal(image.title, 'Introduction');
  assert.equal(pageText(image), text);
  const plain = pageContentBody({ ...base, type: types[0], fileUrl: '' });
  assert.equal(plain.content_text, text);
  assert.equal(plain.file_url, null);
  assert.equal(pageText(plain), text);
});
test('sorts existing pages by saved order without changing API data', () => {
  const input = [
    { ...content, display_order: 3 },
    { ...content, display_order: 1 },
    { ...content, display_order: 2 },
  ];
  assert.deepEqual(
    sortLessonPages(input).map(page => page.display_order),
    [1, 2, 3]
  );
  assert.deepEqual(
    input.map(page => page.display_order),
    [3, 1, 2]
  );
});
