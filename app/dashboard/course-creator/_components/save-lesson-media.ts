import type { LessonContent } from '@/services/client/types.gen';

type MediaOperations = {
  upload: () => Promise<LessonContent>;
  update: (uuid: string, content: LessonContent) => Promise<void>;
  remove: (uuid: string) => Promise<void>;
  list: () => Promise<LessonContent[]>;
};

/** Upload first; only retire the original once the replacement is ready. */
export async function saveLessonMedia({
  originalUuid,
  details,
  operations,
}: {
  originalUuid?: string;
  details: LessonContent;
  operations: MediaOperations;
}) {
  const uploaded = await operations.upload();
  if (!uploaded.uuid || !uploaded.file_url) {
    throw new Error('The upload did not return a usable file. The original item was kept.');
  }

  let removingOriginal = false;
  try {
    await operations.update(uploaded.uuid, {
      ...details,
      uuid: uploaded.uuid,
      content_text: null,
      file_url: uploaded.file_url,
    });

    if (originalUuid && originalUuid !== uploaded.uuid) {
      removingOriginal = true;
      await operations.remove(originalUuid);
    }
    return uploaded;
  } catch (error) {
    if (uploaded.uuid === originalUuid) throw error;

    if (removingOriginal) {
      // A lost DELETE response can still mean success. Check before rolling
      // back so we never remove the only remaining copy of the material.
      let contents: LessonContent[];
      try {
        contents = await operations.list();
      } catch {
        throw new Error(
          'The new file was uploaded, but replacement could not be confirmed. Refresh the lesson before trying again.'
        );
      }
      if (!contents.some(content => content.uuid === originalUuid)) {
        if (contents.some(content => content.uuid === uploaded.uuid)) return uploaded;
        throw new Error('Could not confirm the saved material. Refresh the lesson before trying again.');
      }
    }

    try {
      await operations.remove(uploaded.uuid);
    } catch {
      throw new Error(
        'The original item was kept, but the extra upload could not be removed. Refresh the lesson to review both items.'
      );
    }
    throw error;
  }
}
