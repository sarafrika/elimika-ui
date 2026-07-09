'use client';

import type { ReactNode } from 'react';
import InstructorProvider from '@/context/instructor-context';

/**
 * The Training Hub is reused from the instructor slot; wrap it in
 * InstructorProvider so its data hooks resolve the current user's instructor
 * profile (empty state when the user has no instructor identity).
 */
export default function OrganisationTrainingHubLayout({ children }: { children: ReactNode }) {
  return <InstructorProvider>{children}</InstructorProvider>;
}
