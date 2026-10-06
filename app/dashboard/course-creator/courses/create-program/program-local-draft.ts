import { z } from 'zod';
import { programDraftSchema, type ProgramFormValues } from './program-schema';

const localDraftSchema = z.object({
  programCode: z.string().optional(),
  categoryUuids: z.array(z.string().min(1)),
  draft: programDraftSchema,
});

function draftKey(creatorUuid: string, programUuid?: string) {
  return `elimika:program-draft:v1:${creatorUuid}:${programUuid ?? 'new'}`;
}

export function readProgramDraft(creatorUuid: string, programUuid?: string) {
  try {
    const stored = localStorage.getItem(draftKey(creatorUuid, programUuid));
    if (!stored) return undefined;
    const result = localDraftSchema.safeParse(JSON.parse(stored));
    return result.success ? result.data : undefined;
  } catch {
    return undefined;
  }
}

export function writeProgramDraft(
  creatorUuid: string,
  programUuid: string | undefined,
  values: ProgramFormValues
) {
  try {
    localStorage.setItem(
      draftKey(creatorUuid, programUuid),
      JSON.stringify({
        programCode: values.programCode,
        categoryUuids: values.categoryUuids,
        draft: values.draft,
      })
    );
    return true;
  } catch {
    return false;
  }
}

export function clearNewProgramDraft(creatorUuid: string) {
  try {
    localStorage.removeItem(draftKey(creatorUuid));
  } catch {
    // The saved program retains its draft even if the temporary copy cannot be removed.
  }
}
