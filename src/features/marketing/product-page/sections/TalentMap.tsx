'use client';

import { Briefcase } from 'lucide-react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import type { MouseEvent } from 'react';

const DASHBOARD_ENTRY_PATH = '/dashboard';

const OPPORTUNITIES = [
  {
    title: 'Junior Digital Marketing Internship',
    detail: '92% skills match · Nairobi',
    action: 'Apply',
    href: DASHBOARD_ENTRY_PATH,
    requiresSignIn: true,
  },
  {
    title: 'Robotics Club Assistant Trainer',
    detail: 'AM skills match · Part-time',
    action: 'Apply',
    href: DASHBOARD_ENTRY_PATH,
    requiresSignIn: true,
  },
  {
    title: 'Portfolio Design Consultancy',
    detail: 'Remote · Contract',
    action: 'Apply',
    href: DASHBOARD_ENTRY_PATH,
    requiresSignIn: true,
  },
  {
    title: 'Approved AI Upskilling Course',
    detail: 'Fund-eligible · Self-paced',
    action: 'Enroll',
    href: '/courses',
    requiresSignIn: false,
  },
] as const;

export function TalentMap() {
  // The source points Apply at /careers; applying here needs an account, so it signs in instead.
  const startSignIn = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    void signIn('keycloak', {
      redirectTo: `${window.location.origin}${DASHBOARD_ENTRY_PATH}`,
    });
  };

  return (
    <section className='skills-wallet-section site-container'>
      <div className='skills-wallet-section__intro'>
        <p className='eyebrow accent-text'>Talent map</p>
        <h2>Match skills to jobs, consultancies and global mobility pathways.</h2>
        <p>
          Access opportunities in your industry that match your skills profile and carry portable
          skills recognition locally and across.
        </p>
      </div>

      <div className='skills-wallet-talent'>
        <div className='skills-wallet-benchmark'>
          <strong>Industry benchmark</strong>
          <p>You are ahead of peers in AI-cumulative skills and ready for your digital peers.</p>
          <span>60%</span>
          <small>ahead of matched peers</small>
        </div>

        <div className='skills-wallet-opportunities'>
          {OPPORTUNITIES.map(opportunity => (
            <div key={opportunity.title}>
              <span>
                <Briefcase size={17} strokeWidth={2} aria-hidden />
              </span>
              <div>
                <strong>{opportunity.title}</strong>
                <small>{opportunity.detail}</small>
              </div>
              <Link
                href={opportunity.href}
                onClick={opportunity.requiresSignIn ? startSignIn : undefined}
              >
                {opportunity.action}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
