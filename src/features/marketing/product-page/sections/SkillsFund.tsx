'use client';

import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { onboardingPath } from '@/src/features/onboarding/lib/user-onboarding';

const DASHBOARD_ENTRY_PATH = '/dashboard';

const FUND_ROWS = [
  { label: 'Approved wallet funds', value: 'KSh 15,000' },
  { label: 'Available for', value: 'Certified courses' },
  { label: 'Fund source', value: 'Guardian / Employer' },
  { label: 'Impact tracking', value: 'ROI dashboard' },
] as const;

export function SkillsFund() {
  // Applying starts a learner sign-up; funding a student still signs in to the dashboard.
  const startSignIn = () =>
    signIn('keycloak', { redirectTo: `${window.location.origin}${DASHBOARD_ENTRY_PATH}` });

  return (
    <section className='skills-wallet-fund site-container'>
      <div>
        <h2>Invest in Your Future</h2>

        <p>
          The Skills Fund connects learners with funding opportunities for learning,
          apprenticeships, scholarships, workshops and courses. Employers and guardians can fund
          wallets, support family plans and track a skills investment&apos;s ROI.
        </p>

        <div className='button-row'>
          <Link href={onboardingPath('student')} className='button button--accent'>
            Apply for Skills Fund
          </Link>

          <button
            type='button'
            className='button skills-wallet-button--glass'
            onClick={startSignIn}
          >
            Fund a Student
          </button>
        </div>
      </div>

      <div className='skills-wallet-fund__rows'>
        {FUND_ROWS.map(row => (
          <div key={row.label}>
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
