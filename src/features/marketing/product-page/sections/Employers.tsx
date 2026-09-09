'use client';

import { BadgeCheck } from 'lucide-react';
import { signIn } from 'next-auth/react';

const DASHBOARD_ENTRY_PATH = '/dashboard';

const CANDIDATES = [
  {
    initials: 'MW',
    name: 'Mary Wanjiku',
    detail: 'Caring care team · Public speaking · 4 badges',
  },
  {
    initials: 'KO',
    name: 'Kevin Otieno',
    detail: 'Robotics · AI fundamentals · Portfolio verified',
  },
  {
    initials: 'AN',
    name: 'Amina Noor',
    detail: 'Graph. design · Digital marketing · 3 months ready',
  },
] as const;

export function Employers() {
  // Talent search and student funding both live behind the dashboard, so both CTAs sign in.
  const startSignIn = () => {
    void signIn('keycloak', {
      redirectTo: `${window.location.origin}${DASHBOARD_ENTRY_PATH}`,
    });
  };

  return (
    <section className='skills-wallet-split skills-wallet-employer site-container'>
      <div>
        <p className='eyebrow accent-text'>For employers</p>
        <h2>Hire smarter with verified skills.</h2>
        <p>
          Elimika Skills Wallet gives employers instant access to authentic, candidate skills
          profiles — including hiring, risks and ensuring the right talent fit. Companies can also
          fund students and employee wallets for approved upskilling programs.
        </p>
        <div className='button-row'>
          <button type='button' className='button skills-wallet-button--navy' onClick={startSignIn}>
            Search Talent
          </button>
          <button type='button' className='button button--outline' onClick={startSignIn}>
            Fund Students
          </button>
        </div>
      </div>

      <div className='skills-wallet-candidates'>
        {CANDIDATES.map(candidate => (
          <div key={candidate.initials}>
            <span>{candidate.initials}</span>
            <div>
              <strong>{candidate.name}</strong>
              <small>{candidate.detail}</small>
            </div>
            <em>
              <BadgeCheck size={12} strokeWidth={2} aria-hidden='true' />
              Verified
            </em>
          </div>
        ))}
      </div>
    </section>
  );
}
