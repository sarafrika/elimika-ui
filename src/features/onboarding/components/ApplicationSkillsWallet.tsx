'use client';

import { useRouter } from 'next/navigation';
import { awaitingApprovalPath } from '../lib/application-review';
import { RegistrationSkillsWallet } from './RegistrationSkillsWallet';

export function ApplicationSkillsWallet({ domain }: { domain?: string }) {
  const router = useRouter();
  const returnToApplication = () => router.push(awaitingApprovalPath(domain));

  return (
    <div className='w-full max-w-7xl'>
      <RegistrationSkillsWallet
        active
        editing
        onBack={returnToApplication}
        onContinue={returnToApplication}
      />
    </div>
  );
}
