import Link from 'next/link';
import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  Layers,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

import AddProfileSelector from './_components/add-profile-selector';
import ManageProfileActions from './_components/manage-profile-actions';

const heroChips = [
  {
    label: 'Minutes to complete',
    value: '≈ 3',
  },
  {
    label: 'Roles per account',
    value: 'Up to 3',
  },
  {
    label: 'Instant switching',
    value: 'No re-login',
  },
];

const timeline = [
  {
    icon: Sparkles,
    title: 'Choose your next role',
    description: 'Select the dashboard you want to unlock—student, instructor, or course creator.',
  },
  {
    icon: Layers,
    title: 'Share the essentials',
    description: 'Fill in the role-specific details so we can tailor your workspace experience.',
  },
  {
    icon: ShieldCheck,
    title: 'Go live instantly',
    description: 'Save your changes and switch dashboards from the top bar whenever you like.',
  },
];

const reminders = [
  'You only need one Elimika login—profiles layer on top of your existing account.',
  'Verification (where required) happens after you submit your new role details.',
  'Removing a role later is just as simple and will not affect the others you keep.',
];

export default function AddProfilePage() {
  return (
    <div className='relative min-h-screen overflow-hidden bg-background'>
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_theme(colors.primary/20)_0%,_transparent_55%)]' />
      <div className='pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_center,_theme(colors.primary/10)_0%,_transparent_60%)] lg:block' />

      <main className='relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-12 sm:px-6 lg:gap-16 lg:py-16'>
        <header className='grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start'>
          <div className='space-y-6'>
            <div className='flex items-center gap-3'>
              <Badge variant='secondary' className='border-transparent bg-primary/10 text-primary'>
                Profile hub
              </Badge>
              <span className='inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground'>
                <UsersRound className='h-3 w-3' />
                Multi-role access
              </span>
            </div>
            <div className='space-y-3'>
              <h1 className='text-3xl font-semibold leading-tight text-foreground sm:text-4xl'>
                Expand your Elimika identity
              </h1>
              <p className='text-muted-foreground max-w-2xl text-sm sm:text-base'>
                Layer new roles on top of your existing account to teach, learn, or build—all without
                creating a second login. Pick the experience you need and we will handle the rest.
              </p>
            </div>
            <div className='flex flex-wrap gap-3 text-sm text-muted-foreground'>
              {heroChips.map(chip => (
                <span
                  key={chip.label}
                  className='inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/90 px-3 py-1.5 shadow-sm backdrop-blur'
                >
                  <strong className='text-foreground'>{chip.value}</strong>
                  <span>{chip.label}</span>
                </span>
              ))}
            </div>
          </div>

          <div className='flex items-start justify-end gap-3 lg:justify-end'>
            <Button asChild variant='outline' size='sm'>
              <Link prefetch href='/dashboard/overview' className='gap-2'>
                <ArrowLeft className='h-4 w-4' />
                Back to dashboard
              </Link>
            </Button>
          </div>
        </header>

        <section className='grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'>
          <div className='space-y-8'>
            <div className='rounded-3xl border border-border/50 bg-background/95 p-8 shadow-lg shadow-primary/5 backdrop-blur'>
              <div className='mb-6 flex items-center justify-between gap-4'>
                <div className='space-y-1'>
                  <h2 className='text-xl font-semibold text-foreground'>Choose a profile to add</h2>
                  <p className='text-muted-foreground text-sm'>
                    We will guide you through a quick setup tailored to your new role.
                  </p>
                </div>
                <ArrowRight className='hidden h-5 w-5 text-primary/70 lg:block' />
              </div>
              <AddProfileSelector />
            </div>

            <div className='rounded-3xl border border-border/50 bg-background/95 p-8 shadow-sm backdrop-blur'>
              <h2 className='text-lg font-semibold text-foreground'>How it works</h2>
              <p className='text-muted-foreground mt-2 text-sm'>
                Adding a profile is quick and keeps everything under one secure Elimika account.
              </p>
              <Separator className='my-6' />
              <div className='grid gap-5 md:grid-cols-3'>
                {timeline.map(step => (
                  <div key={step.title} className='flex h-full flex-col gap-3 rounded-2xl border border-dashed border-border/60 bg-muted/10 p-4'>
                    <span className='flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                      <step.icon className='h-4 w-4' />
                    </span>
                    <div className='space-y-1'>
                      <p className='text-sm font-semibold text-foreground'>{step.title}</p>
                      <p className='text-muted-foreground text-xs leading-relaxed'>{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className='space-y-6 lg:sticky lg:top-36'>
            <div className='rounded-3xl border border-border/50 bg-background/95 p-8 shadow-sm backdrop-blur'>
              <h2 className='text-lg font-semibold text-foreground'>Before you continue</h2>
              <p className='text-muted-foreground mt-2 text-sm leading-relaxed'>
                A few quick reminders to help you choose the right profile and keep your account tidy.
              </p>
              <Separator className='my-5' />
              <ul className='space-y-3 text-sm text-muted-foreground'>
                {reminders.map(item => (
                  <li key={item} className='flex items-start gap-2'>
                    <CalendarCheck className='mt-0.5 h-4 w-4 text-primary/70' />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <ManageProfileActions />
          </aside>
        </section>
      </main>
    </div>
  );
}
