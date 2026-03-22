'use client';

import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

export type ProfileFormConfirmationOptions = {
  title?: ReactNode;
  description?: ReactNode;
  confirmLabel?: ReactNode;
  cancelLabel?: ReactNode;
  onConfirm?: () => Promise<void> | void;
};

type ProfileFormModeContextValue = {
  isEditing: boolean;
  toggleEditing: () => void;
  enableEditing: () => void;
  disableEditing: () => void;
  requestConfirmation: (options: ProfileFormConfirmationOptions) => void;
  isConfirming: boolean;
};

const noop = () => {};

const defaultValue: ProfileFormModeContextValue = {
  isEditing: true,
  toggleEditing: noop,
  enableEditing: noop,
  disableEditing: noop,
  requestConfirmation: options => {
    options?.onConfirm?.();
  },
  isConfirming: false,
};

export const ProfileFormModeContext = createContext<ProfileFormModeContextValue>(defaultValue);

export function useProfileFormMode() {
  return useContext(ProfileFormModeContext);
}
