/**
 * The admin "Your account" form's rules, the same ones that gate its Save button, as one
 * message per failing field so the page can mark the field and badge its tab.
 */
export interface AccountFieldValues {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  dob: string;
}

export type AccountFieldErrors = Partial<Record<keyof AccountFieldValues, string>>;

export function accountFieldErrors(values: AccountFieldValues): AccountFieldErrors {
  const errors: AccountFieldErrors = {};
  if (!values.first_name.trim()) errors.first_name = 'First name is required.';
  if (!values.last_name.trim()) errors.last_name = 'Last name is required.';
  if (!/.+@.+\..+/.test(values.email.trim())) errors.email = 'Enter a valid email address.';
  if (!values.username.trim()) errors.username = 'Username is required.';
  if (!values.dob) errors.dob = 'Date of birth is required.';
  return errors;
}
