import { asRecord, getErrorMessage } from '@/lib/error-utils';

/** The update endpoint can return either a student or an API response envelope. */
export function assertGuardianInvitationSaved(response: unknown, studentUuid: string): void {
  const envelope = asRecord(response);
  if (envelope?.error || envelope?.success === false) {
    throw new Error(
      getErrorMessage(
        {
          error: envelope.error,
          errors: envelope.errors,
          message: envelope.message,
          detail: envelope.detail,
        },
        'Unable to invite your guardian. Please try again.'
      )
    );
  }

  const student = asRecord(envelope?.data) ?? envelope;
  if (student?.error || student?.success === false) {
    throw new Error(
      getErrorMessage(
        {
          error: student.error,
          errors: student.errors,
          message: student.message,
          detail: student.detail,
        },
        'Unable to invite your guardian. Please try again.'
      )
    );
  }
  if (student?.uuid !== studentUuid) {
    throw new Error(
      'The invitation request was not confirmed. Check the refreshed guardian list before trying again.'
    );
  }
}
