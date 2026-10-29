import type { ApiResponseTrainingProgram } from '@/services/client/types.gen';
import { assertProgramResponse } from './program-schema';

export const PROGRAM_MEDIA_FIELDS = {
  thumbnail: 'thumbnail_url',
  banner: 'banner_url',
  intro_video: 'intro_video_url',
} as const;

export type ProgramMediaKey = keyof typeof PROGRAM_MEDIA_FIELDS;
export type PendingProgramMedia = Partial<Record<ProgramMediaKey, File>>;

export async function saveProgramMedia(
  uuid: string,
  media: PendingProgramMedia,
  upload: (key: ProgramMediaKey, uuid: string, file: File) => Promise<ApiResponseTrainingProgram>,
  onUploaded: (key: ProgramMediaKey, file: File, url: string) => void
) {
  for (const key of Object.keys(PROGRAM_MEDIA_FIELDS) as ProgramMediaKey[]) {
    const file = media[key];
    if (!file) continue;
    const response = await upload(key, uuid, file);
    assertProgramResponse(response, `Unable to upload program ${key.replace('_', ' ')}`);
    const url = response.data?.[PROGRAM_MEDIA_FIELDS[key]];
    if (!url)
      throw new Error(`The program ${key.replace('_', ' ')} upload returned no URL. Please retry.`);
    // Clear each confirmed file immediately; a later failure must not repeat successful uploads.
    onUploaded(key, file, url);
  }
}
