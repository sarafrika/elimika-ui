'use client';

import { ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { onboardingPath } from '@/src/features/onboarding/lib/user-onboarding';

export function FinalCta() {
  return (
    <section className='skills-wallet-final site-container'>
      <div>
        <ShieldCheck size={32} aria-hidden='true' />

        <h2>Join thousands building their future with Skills Wallet today.</h2>

        <p>Create one skills identity for learning, funding, credentials and work opportunities.</p>

        <Link href={onboardingPath()} className='button button--accent'>
          Sign Up Now
          <ArrowRight size={16} aria-hidden='true' />
        </Link>
      </div>
    </section>
  );
}
