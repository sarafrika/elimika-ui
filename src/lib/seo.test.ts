import assert from 'node:assert/strict';
import test from 'node:test';
import { absoluteSiteUrl, createPageMetadata } from './seo';

const options = { title: 'Piano basics', description: 'Learn piano', path: '/courses/piano' };

test('course and class thumbnails use absolute public proxy URLs in both preview formats', () => {
  for (const key of ['course_thumbnails/piano.jpeg', 'class_thumbnails/piano.webp']) {
    const metadata = createPageMetadata({ ...options, image: ` ${key} ` });
    const expected = [{ url: absoluteSiteUrl(`/api/proxy/api/v1/files/${key}`), alt: options.title }];
    assert.deepEqual(metadata.openGraph?.images, expected);
    assert.deepEqual(metadata.twitter?.images, expected);
  }
});

test('API-hosted thumbnails use the same public proxy and retain query parameters', () => {
  const path = '/api/v1/files/course_thumbnails/piano.jpeg?version=2';
  const metadata = createPageMetadata({
    ...options,
    image: `https://api.elimika.staging.sarafrika.com${path}`,
  });
  assert.deepEqual(metadata.openGraph?.images, [
    { url: absoluteSiteUrl(`/api/proxy${path}`), alt: options.title },
  ]);
});

test('external thumbnails retain their URL without invented PNG dimensions or format', () => {
  const image = 'https://images.example.com/piano.jpg';
  const metadata = createPageMetadata({ ...options, image });
  assert.deepEqual(metadata.openGraph?.images, [{ url: image, alt: options.title }]);
});

test('generated fallback cards retain their actual dimensions and format', () => {
  const image = { url: '/courses/piano/opengraph-image', width: 1200, height: 630, type: 'image/png' };
  assert.deepEqual(createPageMetadata({ ...options, image }).openGraph?.images, [
    { ...image, url: absoluteSiteUrl(image.url), alt: options.title },
  ]);
});

test('missing or invalid thumbnail URLs fall back to the site card', () => {
  const expected = createPageMetadata(options).openGraph?.images;
  for (const image of ['', '  ', 'http://[invalid', 'data:image/png;base64,AA==']) {
    assert.deepEqual(createPageMetadata({ ...options, image }).openGraph?.images, expected);
  }
});
