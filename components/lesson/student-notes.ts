import { richTextOrUndefined } from '@/lib/rich-text';
import type { Enrollment } from '@/services/client/types.gen';

export type StudentNotes = { condition?: string; comment?: string };

/** Compare values as they will be saved, including the editor's empty HTML. */
export function hasStudentNoteChanges(enrollment: Enrollment, draft?: StudentNotes) {
  if (!draft) return false;
  return (
    (draft.condition ?? enrollment.instrument_condition ?? '') !==
      (enrollment.instrument_condition ?? '') ||
    (richTextOrUndefined(draft.comment ?? enrollment.attendance_comment) ?? '') !==
      (richTextOrUndefined(enrollment.attendance_comment) ?? '')
  );
}
