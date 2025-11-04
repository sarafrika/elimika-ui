'use client';

import { FeatureToggleList } from './_components/FeatureToggleList';

export default function AdminAdvancedSettingsPage() {
  return (
    <div className='space-y-6'>
      <header className='space-y-1'>
        <h1 className='text-2xl font-semibold tracking-tight'>Advanced controls</h1>
        <p className='text-muted-foreground'>
          Manage experimental functionality and rollout strategies across the platform.
        </p>
      </header>
      <FeatureToggleList />
    </div>
  );
}
