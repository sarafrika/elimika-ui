import { BadgeCheck } from 'lucide-react';

const PASSPORT_ROWS = [
  { title: 'School learning', detail: 'Verified transcripts & terms', status: 'Verified' },
  { title: 'Micro-credentials', detail: 'Short courses & certificates', status: 'Added' },
  { title: 'Work experience', detail: 'Attachments & real projects', status: 'Earned' },
] as const;

export function WhatIsIt() {
  return (
    <section className='skills-wallet-split site-container'>
      <div>
        <p className='eyebrow accent-text'>What is Elimika Skills Wallet?</p>
        <h2>A secure digital record for what every learner can do.</h2>
        <p>
          Skills Wallet records and validates your skills, certificates and experiences. Whether you
          are a student, professional or employer, it makes learning and employment smarter, more
          connected and easier to verify.
        </p>
      </div>

      <div className='skills-wallet-passport'>
        <div className='skills-wallet-passport__head'>
          <div>
            <strong>Skills Passport</strong>
            <small>Validated by schools, trainers and employers</small>
          </div>
          <span>
            <BadgeCheck aria-hidden='true' size={18} />
          </span>
        </div>

        <div className='skills-wallet-passport__rows'>
          {PASSPORT_ROWS.map((row, index) => (
            <div key={row.title}>
              <span>{index + 1}</span>
              <div>
                <strong>{row.title}</strong>
                <small>{row.detail}</small>
              </div>
              <em>{row.status}</em>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
