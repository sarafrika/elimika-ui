'use client';

import { AuditLogViewer } from './_components/AuditLogViewer';

export default function AdminSecuritySettingsPage() {
  return (
    <div className='space-y-6'>
      <header className='space-y-1'>
        <h1 className='text-2xl font-semibold tracking-tight'>Security & monitoring</h1>
        <p className='text-muted-foreground'>
          Review privileged activity and keep your tenant compliant with audit-ready records.
        </p>
      </header>
      <AuditLogViewer />
    </div>
  );
}
