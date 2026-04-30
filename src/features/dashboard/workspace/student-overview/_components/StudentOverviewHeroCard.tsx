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

export function StudentOverviewHeroCard({ firstName }: StudentOverviewHeroCardProps) {
  return (
    <Card className='relative overflow-hidden rounded-[26px] border-border/70 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--card)_96%,white),color-mix(in_srgb,var(--muted)_28%,var(--card)))] p-4 shadow-[0_30px_80px_-48px_rgba(37,99,235,0.25)] sm:p-6'>
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute top-0 left-1/3 h-32 w-32 rounded-full bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] blur-3xl' />
        <div className='absolute right-0 bottom-0 h-40 w-40 rounded-full bg-[color-mix(in_srgb,var(--primary)_8%,transparent)] blur-3xl' />
      </div>

      <div className='relative space-y-5'>
        <div className='space-y-1'>
          <h1 className='text-[1.55rem] font-semibold tracking-tight text-foreground sm:text-[1.95rem]'>
            Welcome back, {firstName}! <span className='inline-block align-top text-xl'>🚀</span>
          </h1>
          <p className='text-sm text-muted-foreground sm:text-base'>
            Keep building your future skills today.
          </p>
        </div>

        <div className='relative overflow-hidden rounded-[24px] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--muted)_50%,var(--card)),color-mix(in_srgb,var(--card)_94%,white))] px-4 py-5 sm:px-6'>
          <div className='absolute inset-x-8 bottom-0 h-10 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--primary)_14%,transparent),transparent_72%)] blur-xl' />
          <div className='grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-end'>
            <div className='relative mx-auto flex h-[180px] w-[180px] items-end justify-center lg:mx-0'>
              <div className='absolute bottom-0 h-20 w-32 rounded-full bg-[color-mix(in_srgb,var(--primary)_16%,transparent)] blur-2xl' />
              <div className='absolute bottom-8 left-1 h-12 w-12 rounded-[18px] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--success)_86%,white),color-mix(in_srgb,var(--success)_66%,black_4%))] opacity-90 shadow-sm' />
              <div className='absolute bottom-12 right-2 h-16 w-20 rounded-[22px] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_86%,white),color-mix(in_srgb,var(--primary)_70%,black_6%))] opacity-25 blur-sm' />
              <div className='relative flex h-[150px] w-[112px] flex-col items-center'>
                <div className='absolute top-5 h-10 w-10 rounded-full bg-[color-mix(in_srgb,var(--foreground)_85%,var(--background))]' />
                <div className='absolute top-8 h-9 w-8 rounded-full bg-[color-mix(in_srgb,var(--card)_78%,var(--background))]' />
                <div className='absolute top-16 h-16 w-16 rounded-t-[28px] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_76%,white),color-mix(in_srgb,var(--primary)_62%,black_4%))]' />
                <div className='absolute top-[72px] left-2 h-16 w-6 rotate-[16deg] rounded-full bg-[color-mix(in_srgb,var(--primary)_76%,white)]' />
                <div className='absolute top-[78px] right-2 h-14 w-5 -rotate-[16deg] rounded-full bg-[color-mix(in_srgb,var(--primary)_76%,white)]' />
                <div className='absolute bottom-3 h-9 w-[86px] rounded-[16px] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--muted)_62%,var(--card)),color-mix(in_srgb,var(--muted)_86%,var(--foreground)_4%))] shadow-md' />
              </div>
            </div>

            <div className='space-y-3'>
              <div className='mx-auto max-w-[360px] rounded-[20px] border border-border/70 bg-card/90 p-3 shadow-[0_18px_35px_-26px_rgba(59,130,246,0.25)] lg:mx-0'>
                <div className='mb-2 flex items-center gap-2 text-xs font-semibold text-foreground'>
                  <span className='inline-flex size-5 items-center justify-center rounded-md bg-primary/10 text-primary'>
                    ◈
                  </span>
                  SkillLS Passport
                </div>
                <div className='flex items-center gap-3'>
                  <div className='size-11 rounded-full bg-[linear-gradient(180deg,color-mix(in_srgb,var(--warning)_34%,white),color-mix(in_srgb,var(--warning)_22%,white))]' />
                  <div className='min-w-0 flex-1'>
                    <div className='mb-1 h-2.5 w-20 rounded-full bg-muted' />
                    <div className='mb-2 h-2 w-28 rounded-full bg-muted/60' />
                    <div className='flex gap-1 text-[0.65rem] text-warning dark:text-amber-300'>
                      <span>★</span>
                      <span>★</span>
                      <span>★</span>
                      <span>★</span>
                      <span>★</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
                {['Profile', 'Courses', 'Badges'].map((label, index) => (
                  <div
                    key={label}
                    className={`rounded-[16px] border border-border/70 bg-card/85 p-3 shadow-[0_18px_30px_-26px_rgba(59,130,246,0.45)] ${index === 2 ? 'hidden sm:block' : ''
                      }`}
                  >
                    <div className='mb-2 h-2.5 w-10 rounded-full bg-muted' />
                    <div className='h-8 rounded-xl bg-[linear-gradient(180deg,color-mix(in_srgb,var(--muted)_70%,var(--card)),color-mix(in_srgb,var(--card)_96%,white))]' />
                    <div className='mt-2 text-[0.72rem] font-medium text-muted-foreground'>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className='space-y-3 pt-1'>
          <h2 className='text-[1.9rem] font-semibold tracking-tight text-foreground'>
            Welcome to Skills Wallet!
          </h2>
          <p className='text-base text-muted-foreground'>
            Sign up to start building your future skills passport <span className='align-top'>🚀</span>
          </p>
          <div className='space-y-2.5'>
            {benefits.map(item => (
              <div key={item} className='flex items-center gap-3 text-[1.04rem] text-foreground'>
                <span className='inline-flex size-5 items-center justify-center rounded-full bg-success/10 text-success'>
                  <Check className='size-4' />
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
