'use client';

import { Card } from '@/components/ui/card';
import { Check } from 'lucide-react';

type StudentOverviewHeroCardProps = {
  firstName: string;
};

const benefits = [
  'Gain new skills and certifications',
  'Track achievements and progress',
  'Unlock career opportunities',
];

export function StudentOverviewHeroCard({
  firstName,
}: StudentOverviewHeroCardProps) {
  return (
    <Card className='relative overflow-hidden rounded-[26px] border border-border bg-card p-4 shadow-xl sm:p-6'>
      {/* background accents */}
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute left-1/3 top-0 h-32 w-32 rounded-full bg-primary/10 blur-3xl' />
        <div className='absolute bottom-0 right-0 h-40 w-40 rounded-full bg-primary/5 blur-3xl' />
      </div>

      <div className='relative space-y-5'>
        {/* heading */}
        <div className='space-y-1'>
          <h1 className='text-[1.55rem] font-semibold tracking-tight text-foreground sm:text-[1.95rem]'>
            Welcome back, {firstName}!{' '}
            <span className='inline-block align-middle text-xl'>🚀</span>
          </h1>

          <p className='text-sm text-muted-foreground sm:text-base'>
            Keep building your future skills and achievements today.
          </p>
        </div>

        {/* illustration section */}
        <div className='relative overflow-hidden rounded-[24px] border border-border bg-muted/30 px-4 py-5 sm:px-6'>
          <div className='absolute inset-x-8 bottom-0 h-10 rounded-full bg-primary/10 blur-xl' />

          <div className='grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-end'>
            {/* abstract student illustration */}
            <div className='relative mx-auto flex h-[180px] w-[180px] items-end justify-center lg:mx-0'>
              <div className='absolute bottom-0 h-20 w-32 rounded-full bg-primary/15 blur-2xl' />

              {/* floating cards */}
              <div className='absolute bottom-8 left-1 h-12 w-12 rounded-[18px] bg-success/20 shadow-sm' />
              <div className='absolute bottom-12 right-2 h-16 w-20 rounded-[22px] bg-primary/20 blur-sm' />

              {/* avatar */}
              <div className='relative flex h-[150px] w-[112px] flex-col items-center'>
                <div className='absolute top-5 h-10 w-10 rounded-full bg-foreground' />
                <div className='absolute top-8 h-9 w-8 rounded-full bg-background' />

                <div className='absolute top-16 h-16 w-16 rounded-t-[28px] bg-primary' />

                <div className='absolute left-2 top-[72px] h-16 w-6 rotate-[16deg] rounded-full bg-primary' />

                <div className='absolute right-2 top-[78px] h-14 w-5 -rotate-[16deg] rounded-full bg-primary' />

                <div className='absolute bottom-3 h-9 w-[86px] rounded-[16px] bg-muted shadow-md' />
              </div>
            </div>

            {/* right content */}
            <div className='space-y-3'>
              {/* passport card */}
              <div className='mx-auto max-w-[360px] rounded-[20px] border border-border bg-card p-4 shadow-lg lg:mx-0'>
                <div className='mb-2 flex items-center gap-2 text-xs font-semibold text-foreground'>
                  <span className='inline-flex size-5 items-center justify-center rounded-md bg-primary/10 text-primary'>
                    ◈
                  </span>

                  SkillLS Passport
                </div>

                <div className='flex items-center gap-3'>
                  <div className='size-11 rounded-full bg-warning/20' />

                  <div className='min-w-0 flex-1'>
                    <div className='mb-1 h-2.5 w-20 rounded-full bg-muted' />

                    <div className='mb-2 h-2 w-28 rounded-full bg-muted/60' />

                    <div className='flex gap-1 text-[0.65rem] text-warning'>
                      <span>★</span>
                      <span>★</span>
                      <span>★</span>
                      <span>★</span>
                      <span>★</span>
                    </div>
                  </div>
                </div>

                {/* description */}
                <p className='mt-3 text-xs leading-relaxed text-muted-foreground'>
                  Your digital skills passport helps you track completed
                  courses, certifications, and achievements in one place.
                </p>
              </div>

              {/* mini feature cards */}
              <div className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
                {[
                  {
                    label: 'Profile',
                    description: 'Manage your learner profile and personal details.',
                  },
                  {
                    label: 'Courses',
                    description: 'Access approved learning programs and progress.',
                  },
                  {
                    label: 'Badges',
                    description: 'Earn achievement badges as you complete milestones.',
                  },
                ].map((item, index) => (
                  <div
                    key={item.label}
                    className={`rounded-[16px] border border-border bg-card p-3 shadow-md ${index === 2 ? 'hidden sm:block' : ''
                      }`}
                  >
                    <div className='mb-2 h-2.5 w-10 rounded-full bg-muted' />

                    <div className='h-8 rounded-xl bg-muted/60' />

                    <div className='mt-2 text-[0.72rem] font-medium text-foreground'>
                      {item.label}
                    </div>

                    <p className='mt-1 text-[0.68rem] leading-relaxed text-muted-foreground'>
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className='space-y-3 pt-1'>
          <h2 className='text-[1.32rem] font-semibold tracking-tight text-foreground sm:text-[1.65rem]'>
            Welcome to Skills Wallet!
          </h2>

          <p className='text-[0.9rem] text-muted-foreground sm:text-[0.96rem]'>
            Sign up to start building your future skills passport{' '}
            <span className='align-top'>🚀</span>
          </p>

          <div className='space-y-2.5'>
            {benefits.map(item => (
              <div
                key={item}
                className='flex items-center gap-2.5 text-[0.88rem] text-foreground sm:gap-3 sm:text-[0.96rem]'
              >
                <span className='inline-flex size-4.5 items-center justify-center rounded-full bg-primary/10 text-primary sm:size-5'>
                  <Check className='size-3.5 sm:size-4' />
                </span>

                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}