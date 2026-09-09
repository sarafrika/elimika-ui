'use client';

import { ArrowRight, Circle, Play, Sparkles, Users, Wallet } from 'lucide-react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

const DASHBOARD_ENTRY_PATH = '/dashboard';

const BADGES = ['Verified certificates', 'Skills funding', 'Talent verifying'] as const;

const READINESS = [
  { skill: 'Graphic design', status: 'Verified' },
  { skill: 'Public speaking', status: 'Level 4' },
  { skill: 'AI fundamentals', status: 'In progress' },
] as const;

export function Hero() {
  return (
    <section className='skills-wallet-hero site-container'>
      <div>
        <span className='skills-wallet-eyebrow'>
          <Sparkles size={13} strokeWidth={2} aria-hidden />
          Verified learning, funding and work identity
        </span>

        <h1>
          Your Skills. <span className='accent-text'>Your Future.</span> Your Wallet.
        </h1>

        <p className='skills-wallet-lead'>
          Store, showcase and share your skills securely with the Elimika Skills Wallet — a digital
          passport for education, training and work opportunities.
        </p>

        <div className='button-row'>
          <button
            type='button'
            className='button button--dark'
            onClick={() =>
              signIn('keycloak', {
                redirectTo: `${window.location.origin}${DASHBOARD_ENTRY_PATH}`,
              })
            }
          >
            Create Your Skills Wallet
            <ArrowRight size={16} aria-hidden />
          </button>

          <Link className='button button--outline' href='/courses'>
            {/* The source's .product-demo-button play circle, rebuilt on the shared tokens. */}
            <span className='inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--sw-accent)] text-[color:white]'>
              <Play size={12} fill='currentColor' className='translate-x-px' aria-hidden />
            </span>
            Explore Courses
          </Link>
        </div>

        <div className='skills-wallet-badges'>
          {BADGES.map(badge => (
            <span key={badge}>
              <Circle size={13} strokeWidth={2} aria-hidden />
              {badge}
            </span>
          ))}
        </div>
      </div>

      <div className='skills-wallet-card'>
        <div className='skills-wallet-card__profile'>
          <span>
            <Users size={18} strokeWidth={2} aria-hidden />
          </span>
          <div>
            <strong>Mary Wanjiku</strong>
            <small>Student · Nairobi</small>
          </div>
        </div>

        <div className='skills-wallet-id-card'>
          <div>
            <p>Elimika Skills Network</p>
            <Wallet size={16} strokeWidth={2} aria-hidden />
          </div>
          <strong>Verified Learning ID</strong>
          <small>SW · 2048 · 8891 · 0042</small>
          <span>Active wallet</span>
        </div>

        <div className='skills-wallet-readiness'>
          <p>Employability readiness</p>
          {READINESS.map(row => (
            <div key={row.skill}>
              <span>{row.skill}</span>
              <strong>{row.status}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
