'use client';

import { Briefcase } from 'lucide-react';
import Link from 'next/link';
import { onboardingPath } from '@/src/features/onboarding/lib/user-onboarding';

// Applying needs an account, so every opportunity starts a learner sign-up.
const APPLY_PATH = onboardingPath('student');

const OPPORTUNITIES = [
  {
    title: 'Junior Digital Marketing Internship',
    detail: '92% skills match · Nairobi',
    action: 'Apply',
    href: APPLY_PATH,
  },
  {
    title: 'Robotics Club Assistant Trainer',
    detail: 'AM skills match · Part-time',
    action: 'Apply',
    href: APPLY_PATH,
  },
  {
    title: 'Portfolio Design Consultancy',
    detail: 'Remote · Contract',
    action: 'Apply',
    href: APPLY_PATH,
  },
  {
    title: 'Approved AI Upskilling Course',
    detail: 'Fund-eligible · Self-paced',
    action: 'Enroll',
    href: APPLY_PATH,
  },
] as const;

export function TalentMap() {
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
              <Link href={opportunity.href}>{opportunity.action}</Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
