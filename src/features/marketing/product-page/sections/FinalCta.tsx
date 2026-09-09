'use client';

import { ArrowRight, ShieldCheck } from 'lucide-react';
import { signIn } from 'next-auth/react';

const DASHBOARD_ENTRY_PATH = '/dashboard';

export function FinalCta() {
  // The source points "Sign Up Now" at elimika.sarafrika.com, which is this app — so it signs in.
  const startSignIn = () =>
    signIn('keycloak', { redirectTo: `${window.location.origin}${DASHBOARD_ENTRY_PATH}` });

  return (
    <section className='skills-wallet-final site-container'>
      <div>
        <ShieldCheck size={32} aria-hidden='true' />

        <h2>Join thousands building their future with Skills Wallet today.</h2>

        <p>Create one skills identity for learning, funding, credentials and work opportunities.</p>

        <button type='button' className='button button--accent' onClick={startSignIn}>
          Sign Up Now
          <ArrowRight size={16} aria-hidden='true' />
        </button>
      </div>
    </section>
  );
}
