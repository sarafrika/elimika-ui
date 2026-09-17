/**
 * What each admin action actually does, taken from the backend code rather than from
 * what the button implies. Every confirmation modal is built from this map, so the
 * console can never promise an effect the API does not have.
 *
 * `warnings` are the honest caveats: things the API ignores, does not store, or cannot
 * undo. They render in the modal's amber strip.
 */
export type ConfirmTone = 'default' | 'danger';

export interface ConfirmContent {
  title: string;
  description?: string;
  confirmLabel: string;
  tone: ConfirmTone;
  /** What will change, in the order the admin cares about. */
  effects: string[];
  warnings?: string[];
  /** Destructive actions ask the admin to type this value first. */
  typeToConfirm?: string;
}

export interface ConfirmSubject {
  /** The record the action is about: a person, organisation, course, rule… */
  name: string;
  /** Optional second name (a document title, an amount, an organisation). */
  detail?: string;
  /** Value the admin must type for destructive actions. */
  confirmValue?: string;
}

type Builder = (subject: ConfirmSubject) => ConfirmContent;

export const confirmEffects = {
  verifyDocument: subject => ({
    title: `Verify ${subject.name}’s ${subject.detail ?? 'document'}?`,
    confirmLabel: 'Verify record',
    tone: 'default',
    effects: [
      'The document is marked APPROVED, with your name, the time and your note',
      `${subject.name} gets an in-app “Document verified” notification`,
      'The item leaves the review inbox and the pending count drops by one',
    ],
    warnings: ['There is no API to reject or un-verify a document afterwards.'],
  }),

  verifyInstructor: subject => ({
    title: `Verify ${subject.name} as an instructor?`,
    confirmLabel: 'Verify instructor',
    tone: 'default',
    effects: [
      'The instructor profile is marked admin-verified',
      `${subject.name} gets an in-app “Instructor profile approved” notification`,
      'Organisations reviewing job applications see the verified status',
    ],
    warnings: ['Your reason is sent with the request but is only written to the server log.'],
  }),

  revokeInstructor: subject => ({
    title: `Revoke ${subject.name}’s instructor verification?`,
    confirmLabel: 'Revoke verification',
    tone: 'danger',
    typeToConfirm: subject.confirmValue,
    effects: [
      'The profile stops being admin-verified',
      `${subject.name} gets an in-app “Instructor verification removed” notification`,
      'Existing classes and hires are left as they are',
    ],
    warnings: ['The reason is not stored on the record, only in the request log.'],
  }),

  approveOrganisation: subject => ({
    title: `Verify ${subject.name}?`,
    confirmLabel: 'Verify organisation',
    tone: 'default',
    effects: [
      'The organisation is marked verified',
      'Every active admin at the organisation is notified in-app',
    ],
    warnings: [
      'The reason is not stored. Verifying again after a revoke sends no second notification.',
    ],
  }),

  rejectOrganisation: subject => ({
    title: `Reject ${subject.name}’s registration?`,
    confirmLabel: 'Reject registration',
    tone: 'danger',
    effects: ['The request is recorded in the request log with your reason'],
    warnings: [
      'On an organisation that was never verified this changes nothing: no state, no notification, no stored reason. A real rejected state is still a backend change.',
    ],
  }),

  revokeOrganisation: subject => ({
    title: `Revoke ${subject.name}’s verification?`,
    confirmLabel: 'Revoke verification',
    tone: 'danger',
    typeToConfirm: subject.confirmValue,
    effects: [
      'The organisation stops being verified',
      'Every active admin at the organisation is notified in-app',
    ],
    warnings: ['Members, classes and branches are not changed.'],
  }),

  suspendOrganisation: subject => ({
    title: `Suspend ${subject.name}?`,
    confirmLabel: 'Suspend organisation',
    tone: 'danger',
    typeToConfirm: subject.confirmValue,
    effects: ['The organisation is set inactive'],
    warnings: [
      'Members, classes and branches keep working. Nobody is notified and no reason is stored.',
    ],
  }),

  approveCourse: subject => ({
    title: `Approve ${subject.name}?`,
    confirmLabel: 'Approve course',
    tone: 'default',
    effects: [
      'The course is marked admin-approved',
      'A moderation history row is written with your reason',
      `${subject.detail ?? 'The creator'} is notified in-app`,
    ],
  }),

  rejectCourse: subject => ({
    title: `Send ${subject.name} back for changes?`,
    confirmLabel: 'Send feedback',
    tone: 'default',
    effects: [
      'The course stops being admin-approved',
      'Your feedback is stored in the moderation history and sent to the creator',
    ],
    warnings: [
      'A second rejection of the same course is swallowed by the notification de-duplication, so the creator would not be told again.',
    ],
  }),

  approveCourseEdit: subject => ({
    title: `Publish the changes to ${subject.name}?`,
    confirmLabel: 'Approve changes',
    tone: 'default',
    effects: [
      'The draft replaces the live course: fields, categories, lessons, assessments and requirements',
      'A version snapshot is written and the draft is deleted',
      'Learners keep their progress',
    ],
    warnings: [
      'The creator is not notified of edit decisions yet.',
      'The revenue share is re-validated on save and can fail with a validation error.',
    ],
  }),

  rejectCourseEdit: subject => ({
    title: `Discard the changes to ${subject.name}?`,
    confirmLabel: 'Reject changes',
    tone: 'danger',
    effects: [
      'The draft is discarded and the live course stays exactly as it is',
      'Your reason is stored on the edit record',
    ],
    warnings: ['The creator is not notified of edit decisions yet.'],
  }),

  grantAdmin: subject => ({
    title: `Grant platform admin access to ${subject.name}?`,
    confirmLabel: 'Grant access',
    tone: 'default',
    effects: [
      `${subject.name} can reach every admin screen from their next request`,
      'The grant is recorded in the request log',
    ],
    warnings: [
      'No notification is sent, the reason is not stored, and the effective date is ignored.',
    ],
  }),

  removeAdmin: subject => ({
    title: `Remove platform admin access from ${subject.name}?`,
    confirmLabel: 'Remove access',
    tone: 'danger',
    typeToConfirm: subject.confirmValue,
    effects: [
      'Admin screens stop working for them from their next request',
      'Their other roles are untouched',
    ],
    warnings: ['No notification is sent and the reason is not stored.'],
  }),

  createAdmin: subject => ({
    title: `Create an administrator account for ${subject.name}?`,
    confirmLabel: 'Create account',
    tone: 'default',
    effects: [
      'An account is created and the platform admin role is assigned',
      'They get an email asking them to verify the address and set a password',
    ],
    warnings: ['The sign-in account is created in the background, so it may take a moment.'],
  }),

  saveIdentity: subject => ({
    title: `Save changes to ${subject.name}’s details?`,
    confirmLabel: 'Save changes',
    tone: 'default',
    effects: [
      'Name, email, username and contact details are replaced with what you entered',
      'The same details are updated on their sign-in account',
    ],
    warnings: ['If the sign-in service is unreachable the save is rolled back.'],
  }),

  deactivateAccount: subject => ({
    title: `Deactivate ${subject.name}’s account?`,
    confirmLabel: 'Deactivate account',
    tone: 'danger',
    typeToConfirm: subject.confirmValue,
    effects: ['New sign-ins are blocked', 'Their records, classes and history are kept'],
    warnings: [
      'Sessions that are already open keep working until their token expires. Forcing a sign-out is still a backend change.',
    ],
  }),

  reactivateAccount: subject => ({
    title: `Reactivate ${subject.name}’s account?`,
    confirmLabel: 'Reactivate account',
    tone: 'default',
    effects: ['They can sign in again straight away'],
  }),

  saveRule: subject => ({
    title: `Save the rule ${subject.name}?`,
    confirmLabel: 'Save rule',
    tone: 'default',
    effects: [
      'The rule applies to orders captured from its start date',
      'Who saved it and when is recorded on the rule',
    ],
    warnings: [
      'Saving replaces this rule; there is no history. To keep the old value, schedule a new rule instead.',
      'Only global fee rules are consulted today.',
    ],
  }),

  addCurrency: subject => ({
    title: `Add ${subject.name}?`,
    confirmLabel: 'Create currency',
    tone: 'default',
    effects: ['The currency becomes available to price in'],
    warnings: ['New currencies start inactive unless you set them as the default.'],
  }),

  makeDefaultCurrency: subject => ({
    title: `Make ${subject.name} the default currency?`,
    confirmLabel: 'Make default',
    tone: 'default',
    effects: [
      'The previous default stops being the default',
      `${subject.name} is activated and used wherever no currency is given`,
    ],
  }),

  deleteCategory: subject => ({
    title: `Delete the category ${subject.name}?`,
    confirmLabel: 'Delete category',
    tone: 'danger',
    typeToConfirm: subject.confirmValue,
    effects: [`It is removed from ${subject.detail ?? 'the courses that use it'}`],
    warnings: [
      'Courses lose the category silently. If it has subcategories, or a program uses it, the delete is refused.',
    ],
  }),

  settleObligation: subject => ({
    title: `Settle ${subject.detail ?? 'this amount'} owed to ${subject.name}?`,
    confirmLabel: 'Record settlement',
    tone: 'default',
    effects: [
      'The obligation is marked settled, with your reference and your name',
      'It leaves the outstanding list for the organisation',
    ],
    warnings: ['This records a payment made elsewhere; no money moves in Elimika.'],
  }),

  cancelObligation: subject => ({
    title: `Cancel the obligation for ${subject.name}?`,
    confirmLabel: 'Cancel obligation',
    tone: 'danger',
    effects: ['The obligation is cancelled with your reason'],
    warnings: ['An obligation that is already settled cannot be cancelled.'],
  }),
} satisfies Record<string, Builder>;

export type ConfirmAction = keyof typeof confirmEffects;

/** Build the modal content for an action. */
export function buildConfirm(action: ConfirmAction, subject: ConfirmSubject): ConfirmContent {
  return confirmEffects[action](subject);
}
