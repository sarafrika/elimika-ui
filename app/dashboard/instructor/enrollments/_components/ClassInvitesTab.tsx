'use client';

import { EmptyState } from '@/components/ui/empty-state';
import { Mail } from 'lucide-react';

export default function ClassInvitesTab() {
  return (
    <EmptyState
      icon={Mail}
      title='Class invite history is not available yet'
      description='Class invitations currently open in your email app. Sent invitations are not recorded here yet.'
    />
  );
}
