import assert from 'node:assert/strict';
import test from 'node:test';
import { programBody, defaultProgramValues } from './program-schema';
import {
  PROGRAM_MEDIA_FIELDS,
  saveProgramMedia,
  type PendingProgramMedia,
  type ProgramMediaKey,
} from './save-program-media';

const program = programBody(defaultProgramValues(), 'creator');

test('upload retries preserve completed media and retry only the remaining files', async () => {
  const pending: PendingProgramMedia = {
    thumbnail: new File(['image'], 'thumbnail.png', { type: 'image/png' }),
    banner: new File(['image'], 'banner.png', { type: 'image/png' }),
    intro_video: new File(['video'], 'intro.mp4', { type: 'video/mp4' }),
  };
  const uploaded: ProgramMediaKey[] = [];
  let failBanner = true;
  const upload = async (key: ProgramMediaKey, uuid: string, file: File) => {
    assert.equal(uuid, 'saved-program');
    assert.equal(file, pending[key]);
    uploaded.push(key);
    if (key === 'banner' && failBanner) throw new Error('Offline');
    return { success: true, data: { ...program, [PROGRAM_MEDIA_FIELDS[key]]: `/media/${key}` } };
  };
  const confirm = (key: ProgramMediaKey, file: File, url: string) => {
    assert.equal(file, pending[key]);
    assert.equal(url, `/media/${key}`);
    delete pending[key];
  };
  await assert.rejects(saveProgramMedia('saved-program', pending, upload, confirm), /Offline/);
  assert.equal(pending.thumbnail, undefined);
  assert.ok(pending.banner);
  assert.ok(pending.intro_video);
  failBanner = false;
  await saveProgramMedia('saved-program', pending, upload, confirm);
  assert.deepEqual(uploaded, ['thumbnail', 'banner', 'banner', 'intro_video']);
  assert.deepEqual(pending, {});
});

test('API errors are checked before accepting a returned media URL', async () => {
  const pending = { thumbnail: new File(['image'], 'thumbnail.png') };
  let confirmed = false;
  await assert.rejects(
    saveProgramMedia(
      'saved-program',
      pending,
      async () => ({
        success: false,
        message: 'Upload rejected',
        data: { ...program, thumbnail_url: '/media/thumbnail' },
      }),
      () => {
        confirmed = true;
      }
    ),
    /Upload rejected/
  );
  assert.equal(confirmed, false);
});

test('an upload without its URL remains pending and reports an error', async () => {
  const pending = { thumbnail: new File(['image'], 'thumbnail.png') };
  let confirmed = false;
  await assert.rejects(
    saveProgramMedia(
      'saved-program',
      pending,
      async () => ({ success: true, data: program }),
      () => {
        confirmed = true;
      }
    ),
    /returned no URL/
  );
  assert.equal(confirmed, false);
});
