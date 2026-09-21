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

  reactivateOrganisation: subject => ({
    title: `Reactivate ${subject.name}?`,
    confirmLabel: 'Reactivate organisation',
    tone: 'default',
    effects: ['The organisation is set active again', 'Its verification state is unchanged'],
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

  createBranch: subject => ({
    title: `Add ${subject.name} to ${subject.detail ?? 'this organisation'}?`,
    confirmLabel: 'Create branch',
    tone: 'default',
    effects: [
      'The branch can be chosen for classes, jobs and member assignments',
      'Its contact details are shown to instructors and students',
    ],
    warnings: ['Without both coordinates the branch has no map pin.'],
  }),

  updateBranch: subject => ({
    title: `Save changes to ${subject.name}?`,
    confirmLabel: 'Save branch',
    tone: 'default',
    effects: [
      'The name, address, contact and pin are replaced with what you entered',
      'Classes and jobs already pointing at this branch follow the new details',
    ],
    warnings: ['Clearing both coordinates removes the map pin.'],
  }),

  deleteBranch: subject => ({
    title: `Remove ${subject.name}?`,
    confirmLabel: 'Remove branch',
    tone: 'danger',
    typeToConfirm: subject.confirmValue,
    effects: [
      'The branch is set inactive rather than deleted',
      'Members lose this branch from their membership',
    ],
    warnings: [
      'Classes, jobs and resources that point at this branch keep pointing at it. Move them first if they are still running.',
    ],
  }),

  setMemberRole: subject => ({
    title: `Change ${subject.name}’s role to ${subject.detail ?? 'this role'}?`,
    confirmLabel: 'Change role',
    tone: 'default',
    effects: [
      'Their role in this organisation changes from their next request',
      'They keep the umbrella organisation membership either way',
    ],
    warnings: ['Leaving the branch empty clears the branch they were assigned to.'],
  }),

  addOrganisationStaff: subject => ({
    title: `Add ${subject.name} to ${subject.detail ?? 'this organisation'}?`,
    confirmLabel: 'Add member',
    tone: 'default',
    effects: [
      'An account is created and attached to this organisation',
      'They receive an email to activate the account',
    ],
    warnings: ['Students cannot be added this way — they are invited instead.'],
  }),

  revokeInvitation: subject => ({
    title: `Withdraw the invitation to ${subject.name}?`,
    confirmLabel: 'Withdraw invitation',
    tone: 'danger',
    effects: ['The link in their email stops working', 'The invitation shows as revoked'],
  }),

  resendInvitation: subject => ({
    title: `Send ${subject.name}’s invitation again?`,
    confirmLabel: 'Resend invitation',
    tone: 'default',
    effects: [
      'A fresh link and expiry are issued',
      'The previous link stops working once the new one is sent',
    ],
  }),

  cancelSession: subject => ({
    title: `Cancel ${subject.name} on ${subject.detail ?? 'this date'}?`,
    confirmLabel: 'Cancel session',
    tone: 'danger',
    effects: [
      `The session for ${subject.name} is marked cancelled, with your reason on the record`,
      'Everyone enrolled in that session has their enrolment cancelled',
      'Any room or equipment held for it is released',
    ],
    warnings: ['Only a scheduled or ongoing session can be cancelled; a finished one cannot.'],
  }),

  deactivateClass: subject => ({
    title: `Stop running ${subject.name}?`,
    confirmLabel: 'Deactivate class',
    tone: 'danger',
    typeToConfirm: subject.confirmValue,
    effects: [
      'The class is set inactive',
      'Sessions scheduled in the next year are cancelled, and their enrolments with them',
      'The catalogue entry follows the class, so it stops being purchasable',
    ],
    warnings: ['Sessions that already happened, and their attendance, are kept.'],
  }),

  markAttendance: subject => ({
    title: `Mark ${subject.name} ${subject.detail ?? 'present'}?`,
    confirmLabel: 'Record attendance',
    tone: 'default',
    effects: [
      'The enrolment records the attendance, with the time it was marked',
      'The gradebook for the course picks it up',
    ],
    warnings: ['Attendance can only be marked once — the API refuses a second attempt.'],
  }),

  createCatalogueItem: subject => ({
    title: `List ${subject.name} in the catalogue?`,
    confirmLabel: 'Create entry',
    tone: 'default',
    effects: [
      'The entry becomes purchasable under the product and variant code you set',
      'Anonymous visitors see it only while it is publicly visible',
    ],
    warnings: ['Price lives on the variant, so it cannot be set here.'],
  }),

  updateCatalogueItem: subject => ({
    title: `Save the catalogue entry for ${subject.name}?`,
    confirmLabel: 'Save entry',
    tone: 'default',
    effects: ['Every field on the entry is replaced with what you set here'],
    warnings: ['A save replaces the whole entry; fields you leave empty are cleared.'],
  }),

  hideCatalogueItem: subject => ({
    title: `Hide ${subject.name} from the public catalogue?`,
    confirmLabel: 'Hide entry',
    tone: 'danger',
    effects: ['Visitors who are not signed in stop seeing it'],
    warnings: [
      'Signed-in users still see it, and anyone who already bought it keeps their access.',
    ],
  }),

  approveProgram: subject => ({
    title: `Approve ${subject.name}?`,
    confirmLabel: 'Approve program',
    tone: 'default',
    effects: [
      'The program is marked admin-approved',
      'A moderation history row is written with your reason',
      `${subject.detail ?? 'The creator'} is notified in-app (PROGRAM_CONTENT_APPROVED)`,
    ],
  }),

  rejectProgram: subject => ({
    title: `Send ${subject.name} back for changes?`,
    confirmLabel: 'Send feedback',
    tone: 'default',
    effects: [
      'The program stops being admin-approved',
      'Your feedback is stored in the moderation history',
      `${subject.detail ?? 'The creator'} is notified in-app (PROGRAM_CONTENT_REJECTED)`,
    ],
    warnings: [
      'A second rejection of the same program is swallowed by the notification de-duplication, so the creator would not be told again.',
    ],
  }),

  revokeProgram: subject => ({
    title: `Revoke approval for ${subject.name}?`,
    confirmLabel: 'Revoke approval',
    tone: 'danger',
    typeToConfirm: subject.confirmValue,
    effects: [
      'The program stops being admin-approved',
      'A moderation history row is written with your reason',
    ],
    warnings: [
      'The status and active flag are not changed, and the creator is told through the rejection notification.',
    ],
  }),

  approveTrainingApplication: subject => ({
    title: `Approve ${subject.name} to train ${subject.detail ?? 'this program'}?`,
    confirmLabel: 'Approve application',
    tone: 'default',
    effects: [
      'The application is approved with your notes and your name',
      'The applicant is notified in-app (PROGRAM_TRAINING_APPLICATION_APPROVED)',
      'Their approved rate card becomes the one used for this program',
    ],
    warnings: ['An application that was already decided comes back as a conflict.'],
  }),

  rejectTrainingApplication: subject => ({
    title: `Reject ${subject.name}’s application?`,
    confirmLabel: 'Reject application',
    tone: 'danger',
    effects: [
      'The application is rejected with your notes',
      'The applicant is notified in-app and by email (PROGRAM_TRAINING_APPLICATION_REJECTED)',
      'Any rate update still waiting on it is closed',
    ],
    warnings: ['An application that was already decided comes back as a conflict.'],
  }),

  revokeTrainingApplication: subject => ({
    title: `Revoke ${subject.name}’s approval to train?`,
    confirmLabel: 'Revoke approval',
    tone: 'danger',
    typeToConfirm: subject.confirmValue,
    effects: [
      'The approval is withdrawn with your notes',
      'The applicant is notified in-app (PROGRAM_TRAINING_APPLICATION_REVOKED)',
      'Any rate update still waiting on it is closed',
    ],
    warnings: [
      'Classes they already run are not deactivated — end those separately if they should stop.',
      'Only an approved application can be revoked.',
    ],
  }),

  archiveRubric: subject => ({
    title: `Archive the rubric ${subject.name}?`,
    confirmLabel: 'Archive rubric',
    tone: 'danger',
    effects: [
      'The rubric moves to Archived and stops being offered for new assessments',
      'Courses already using it keep the association',
    ],
    warnings: [
      'The creator is not notified and no reason is stored — the change shows only in the request log.',
      'Any instructor or course creator can still edit this rubric, so an archive can be undone by them.',
    ],
  }),

  setRubricVisibility: subject => ({
    title: `Make ${subject.name} ${subject.detail ?? 'private'}?`,
    confirmLabel: 'Change visibility',
    tone: 'default',
    effects: [
      `Other course creators ${subject.detail === 'public' ? 'can' : 'can no longer'} discover and reuse it`,
      'Courses already using it are unaffected',
    ],
    warnings: [
      'The creator is not notified and no reason is stored.',
      'Any instructor or course creator can change this back, because rubric edits have no ownership check yet.',
    ],
  }),
  scheduleRule: subject => ({
    title: `Schedule ${subject.name} from ${subject.detail ?? 'the chosen date'}?`,
    confirmLabel: 'Schedule rule',
    tone: 'default',
    effects: [
      'A new rule is written; the one in force today stays exactly as it is',
      'From the start date the new rule wins on priority, scope and start time',
      'Orders captured before then keep the old value on their record',
    ],
    warnings: [
      'Only global fee rules are consulted today, so a tenant or region scope will not be applied.',
    ],
  }),

  saveCategory: subject => ({
    title: `Save the category ${subject.name}?`,
    confirmLabel: 'Save category',
    tone: 'default',
    effects: [
      'Creators can pick it when they tag a course',
      'The name is what course searches filter on',
    ],
    warnings: [
      'A parent cannot be cleared once set: the API skips a null parent, so moving a category back to the top needs a backend change.',
    ],
  }),

  saveContentType: subject => ({
    title: `Save the content type ${subject.name}?`,
    confirmLabel: 'Save content type',
    tone: 'default',
    effects: [
      'Lesson uploads accept the MIME types listed here',
      'The size limit applies to every new upload of this type',
    ],
  }),

  deleteContentType: subject => ({
    title: `Delete the content type ${subject.name}?`,
    confirmLabel: 'Delete content type',
    tone: 'danger',
    typeToConfirm: subject.confirmValue,
    effects: ['Lessons can no longer be uploaded as this type'],
    warnings: ['The delete is refused while any lesson content still uses it.'],
  }),

  saveDifficultyLevel: subject => ({
    title: `Save the difficulty level ${subject.name}?`,
    confirmLabel: 'Save level',
    tone: 'default',
    effects: ['Courses can be set to this level', 'The order decides where it sits in the ladder'],
    warnings: ['Both the name and the order must be unique, or the save is refused.'],
  }),

  deleteDifficultyLevel: subject => ({
    title: `Delete the difficulty level ${subject.name}?`,
    confirmLabel: 'Delete level',
    tone: 'danger',
    typeToConfirm: subject.confirmValue,
    effects: ['It stops being offered on new courses'],
    warnings: ['The delete is refused while a course still uses it.'],
  }),

  saveGradingLevel: subject => ({
    title: `Save the grading level ${subject.name}?`,
    confirmLabel: 'Save level',
    tone: 'default',
    effects: ['Graders can award it', 'Its points feed the score calculations'],
    warnings: ['Both the name and the order must be unique, or the save is refused.'],
  }),

  deleteGradingLevel: subject => ({
    title: `Delete the grading level ${subject.name}?`,
    confirmLabel: 'Delete level',
    tone: 'danger',
    typeToConfirm: subject.confirmValue,
    effects: ['It stops being offered when work is graded'],
    warnings: ['Certificates that already reference it keep their stored grade.'],
  }),

  saveCertificateTemplate: subject => ({
    title: `Save the certificate template ${subject.name}?`,
    confirmLabel: 'Save template',
    tone: 'default',
    effects: ['Certificates issued from now on use this layout'],
    warnings: [
      'Certificates already issued keep the layout they were made with, and there is no preview endpoint to check this one first.',
    ],
  }),

  deleteCertificateTemplate: subject => ({
    title: `Delete the certificate template ${subject.name}?`,
    confirmLabel: 'Delete template',
    tone: 'danger',
    typeToConfirm: subject.confirmValue,
    effects: ['It can no longer be chosen for new certificates'],
    warnings: ['Certificates already issued are unaffected.'],
  }),

  activateCurrency: subject => ({
    title: `Activate ${subject.name}?`,
    confirmLabel: 'Activate currency',
    tone: 'default',
    effects: ['Prices can be set in this currency again'],
  }),

  deactivateCurrency: subject => ({
    title: `Deactivate ${subject.name}?`,
    confirmLabel: 'Deactivate currency',
    tone: 'danger',
    effects: ['New prices can no longer be set in this currency'],
    warnings: [
      'Orders already placed in it keep their amounts. The platform default cannot be deactivated at all — set a new default first.',
    ],
  }),

  updateCurrency: subject => ({
    title: `Save changes to ${subject.name}?`,
    confirmLabel: 'Save currency',
    tone: 'default',
    effects: ['The name, symbol, numeric code and decimal places are replaced with what you entered'],
    warnings: [
      'Whether the currency is active is not changed here — that has its own action, so the default currency cannot be switched off by accident.',
    ],
  }),

  exportSales: subject => ({
    title: `Export ${subject.name} to CSV?`,
    confirmLabel: 'Export CSV',
    tone: 'default',
    effects: [
      `The console reads ${subject.detail ?? 'the current filter'} and builds the file in your browser`,
      'The file downloads to this device; nothing is written to Elimika',
    ],
    warnings: ['A wide range means many requests, so give it a moment on large exports.'],
  }),

  markNotificationRead: subject => ({
    title: `Mark ${subject.name} as read?`,
    confirmLabel: 'Mark read',
    tone: 'default',
    effects: ['It stops counting towards your unread badge', 'It stays in your inbox'],
  }),

  archiveNotification: subject => ({
    title: `Archive ${subject.name}?`,
    confirmLabel: 'Archive',
    tone: 'danger',
    effects: ['It leaves your inbox and moves to the Archived tab'],
    warnings: ['There is no way to unarchive or delete a notification through the API.'],
  }),

  markAllNotificationsRead: subject => ({
    title: `Mark everything in ${subject.name} as read?`,
    confirmLabel: 'Mark all read',
    tone: 'default',
    effects: [
      `Every unread notification in ${subject.name} is marked read`,
      'Nothing is archived or removed',
    ],
    warnings: ['This is the only bulk action the API accepts, and it cannot be undone.'],
  }),

  sendOrganisationAnnouncement: subject => ({
    title: `Send this announcement to ${subject.name}?`,
    confirmLabel: 'Send announcement',
    tone: 'default',
    effects: [
      `It reaches the ${subject.detail ?? 'chosen audience'} at ${subject.name}`,
      'It lands in each recipient’s in-app inbox, and by email too when you chose email',
      'It appears in this organisation’s sent history',
    ],
    warnings: [
      'How many people it reached is only known once it has been sent.',
      'It sends immediately — a scheduled time is stored but not acted on.',
      'The audience and channel are not checked by the API, so an unrecognised audience quietly reaches nobody.',
      'There is no platform-wide broadcast; announcements are always per organisation.',
    ],
  }),
} satisfies Record<string, Builder>;

export type ConfirmAction = keyof typeof confirmEffects;

/** Build the modal content for an action. */
export function buildConfirm(action: ConfirmAction, subject: ConfirmSubject): ConfirmContent {
  return confirmEffects[action](subject);
}
