import { z } from 'zod';
import { asRecord, getErrorMessage } from '@/lib/error-utils';

const childLinkSchema = z.object({
  uuid: z.string().min(1),
  student_uuid: z.string().min(1),
});

/** The API wraps the link in data, although the generated type describes a bare link. */
export function readAddedChild(response: unknown) {
  const envelope = asRecord(response);
  const link = asRecord(envelope?.data) ?? envelope;
  for (const record of [envelope, link]) {
    if (record?.success === false || record?.error) {
      throw new Error(
        getErrorMessage(
          {
            error: record.error,
            errors: record.errors,
            message: record.message,
            detail: record.detail,
          },
          'Unable to add your child. Please try again.'
        )
      );
    }
  }
  const parsed = childLinkSchema.safeParse(link);
  if (!parsed.success) {
    throw new Error(
      'The child’s creation was not confirmed. Please refresh Family Hub before trying again.'
    );
  }
  return {
    link: parsed.data,
    message:
      typeof envelope?.message === 'string' && envelope.message.trim()
        ? envelope.message.trim()
        : 'Child added to your account',
  };
}
