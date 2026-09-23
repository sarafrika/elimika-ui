import type { User } from '@/services/client';

/** Fields an admin can edit on a person. Everything else is carried over untouched. */
export type EditableUserFields = Pick<
  User,
  | 'first_name'
  | 'middle_name'
  | 'last_name'
  | 'email'
  | 'username'
  | 'dob'
  | 'phone_number'
  | 'gender'
  | 'active'
>;

/**
 * PUT /users/{uuid} replaces the whole record, so the body is the record that was
 * loaded with the edits merged on top. Building it field by field would silently clear
 * anything the API adds later, and `active` is a primitive boolean: leaving it out
 * reads as false and deactivates the account.
 */
export function mergeUserBody(loaded: User, changes: Partial<EditableUserFields>): User {
  const merged: User = { ...loaded };

  for (const [key, value] of Object.entries(changes) as [keyof EditableUserFields, unknown][]) {
    if (value !== undefined) {
      (merged as Record<string, unknown>)[key] = value;
    }
  }

  merged.active = changes.active ?? loaded.active ?? true;
  return merged;
}
