'use client';

import { PageHeader } from '@/components/dashboard';

type SettingsPageHeaderProps = {
  title: string;
  subtitle: string;
  /** Kept for backward compatibility with existing call sites (no longer rendered). */
  profileName?: string;
  profileImage?: string;
  initials?: string;
  className?: string;
};

/**
 * Settings header — delegates to the shared Lovable {@link PageHeader} so the
 * settings page (rendered for every role) matches the rest of the dashboard.
 */
export function SettingsPageHeader({ title, subtitle, className }: SettingsPageHeaderProps) {
  return <PageHeader title={title} description={subtitle} className={className} />;
}
