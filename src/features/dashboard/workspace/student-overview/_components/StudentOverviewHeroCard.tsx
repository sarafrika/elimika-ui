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
    <Card className='relative overflow-hidden rounded-[26px] border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(244,248,255,0.96))] p-4 shadow-[0_30px_80px_-48px_rgba(37,99,235,0.45)] sm:p-6'>
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute top-0 left-1/3 h-32 w-32 rounded-full bg-[color-mix(in_srgb,var(--primary)_10%,white)] blur-3xl' />
        <div className='absolute right-0 bottom-0 h-40 w-40 rounded-full bg-[color-mix(in_srgb,var(--el-accent-azure)_24%,white)] blur-3xl' />
      </div>

      <div className='relative space-y-5'>
        <div className='space-y-1'>
          <h1 className='text-[1.55rem] font-semibold tracking-tight text-slate-900 sm:text-[1.95rem]'>
            Welcome back, {firstName}! <span className='inline-block align-top text-xl'>🚀</span>
          </h1>
          <p className='text-sm text-slate-600 sm:text-base'>Keep building your future skills today.</p>
        </div>

        <div className='relative overflow-hidden rounded-[24px] bg-[linear-gradient(180deg,rgba(233,241,255,0.92),rgba(245,248,255,0.95))] px-4 py-5 sm:px-6'>
          <div className='absolute inset-x-8 bottom-0 h-10 rounded-full bg-[radial-gradient(circle,rgba(96,165,250,0.18),transparent_72%)] blur-xl' />
          <div className='grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-end'>
            <div className='relative mx-auto flex h-[180px] w-[180px] items-end justify-center lg:mx-0'>
              <div className='absolute bottom-0 h-20 w-32 rounded-full bg-[color-mix(in_srgb,var(--el-accent-azure)_22%,white)] blur-2xl' />
              <div className='absolute bottom-8 left-1 h-12 w-12 rounded-[18px] bg-[linear-gradient(180deg,#8ed0b7,#5cb48f)] opacity-90 shadow-sm' />
              <div className='absolute bottom-12 right-2 h-16 w-20 rounded-[22px] bg-[linear-gradient(180deg,#96bbff,#628cf3)] opacity-25 blur-sm' />
              <div className='relative flex h-[150px] w-[112px] flex-col items-center'>
                <div className='absolute top-5 h-10 w-10 rounded-full bg-[#2c3448]' />
                <div className='absolute top-8 h-9 w-8 rounded-full bg-[#f6d1b8]' />
                <div className='absolute top-16 h-16 w-16 rounded-t-[28px] bg-[linear-gradient(180deg,#7db3ff,#4e7ddd)]' />
                <div className='absolute top-[72px] left-2 h-16 w-6 rotate-[16deg] rounded-full bg-[#7db3ff]' />
                <div className='absolute top-[78px] right-2 h-14 w-5 -rotate-[16deg] rounded-full bg-[#7db3ff]' />
                <div className='absolute bottom-3 h-9 w-[86px] rounded-[16px] bg-[linear-gradient(180deg,#92aee3,#5d78bb)] shadow-md' />
              </div>
            </div>

            <div className='space-y-3'>
              <div className='mx-auto max-w-[360px] rounded-[20px] border border-white/70 bg-white/90 p-3 shadow-[0_18px_35px_-26px_rgba(59,130,246,0.55)] lg:mx-0'>
                <div className='mb-2 flex items-center gap-2 text-xs font-semibold text-slate-700'>
                  <span className='inline-flex size-5 items-center justify-center rounded-md bg-[color-mix(in_srgb,var(--primary)_12%,white)] text-primary'>
                    ◈
                  </span>
                  SkillLS Passport
                </div>
                <div className='flex items-center gap-3'>
                  <div className='size-11 rounded-full bg-[linear-gradient(180deg,#f8dcc5,#efc3a2)]' />
                  <div className='min-w-0 flex-1'>
                    <div className='mb-1 h-2.5 w-20 rounded-full bg-slate-200' />
                    <div className='mb-2 h-2 w-28 rounded-full bg-slate-100' />
                    <div className='flex gap-1 text-[0.65rem] text-amber-400'>
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
                    className={`rounded-[16px] border border-white/70 bg-white/85 p-3 shadow-[0_18px_30px_-26px_rgba(59,130,246,0.45)] ${index === 2 ? 'hidden sm:block' : ''
                      }`}
                  >
                    <div className='mb-2 h-2.5 w-10 rounded-full bg-slate-200' />
                    <div className='h-8 rounded-xl bg-[linear-gradient(180deg,#eaf1ff,#f8fbff)]' />
                    <div className='mt-2 text-[0.72rem] font-medium text-slate-500'>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className='space-y-3 pt-1'>
          <h2 className='text-[1.9rem] font-semibold tracking-tight text-slate-900'>
            Welcome to Skills Wallet!
          </h2>
          <p className='text-base text-slate-600'>
            Sign up to start building your future skills passport <span className='align-top'>🚀</span>
          </p>
          <div className='space-y-2.5'>
            {benefits.map(item => (
              <div key={item} className='flex items-center gap-3 text-[1.04rem] text-slate-700'>
                <span className='inline-flex size-5 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--success)_14%,white)] text-[var(--success)]'>
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
