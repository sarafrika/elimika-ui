import Link from 'next/link';
import React from 'react';
import { ArrowLeft, Layers, ShieldCheck, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import AddProfileSelector from './_components/add-profile-selector';
import ManageProfileActions from './_components/manage-profile-actions';

const highlights = [
  {
    title: 'Single login, multiple roles',
    description:
      'Switch between student, instructor, and course creator dashboards without juggling accounts.',
  },
  {
    title: 'Shared identity & security',
    description:
      'Personal details and security preferences stay consistent across every profile you create.',
  },
];

const quickSteps = [
  {
    icon: Sparkles,
    title: 'Pick a profile',
    description: 'Choose the role you want to add and tell us a little more about your experience.',
  },
  {
    icon: Layers,
    title: 'Complete setup',
    description: 'Fill in any required information so we can tailor the dashboard to that role.',
  },
  {
    icon: ShieldCheck,
    title: 'Switch anytime',
    description:
      'Once saved, jump between dashboards from the top-bar switcher—no extra passwords needed.',
  },
];

export default function AddProfilePage() {
  return (
    <div className='relative min-h-screen overflow-hidden bg-background'>
      <div className='pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-br from-primary/10 via-background to-background' />
      <div className='pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-b from-primary/5 to-transparent lg:block' />

      <div className='relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-12 sm:px-6 lg:flex-row lg:gap-16 lg:py-16'>
        <section className='flex-1 space-y-10'>
          <header className='space-y-4'>
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <Badge variant='secondary' className='border-transparent bg-primary/10 text-primary'>
                Expand your access
              </Badge>
              <Button asChild variant='outline' size='sm'>
                <Link prefetch href='/dashboard/overview' className='gap-2'>
                  <ArrowLeft className='h-4 w-4' />
                  Back to dashboard
                </Link>
              </Button>
            </div>
            <div className='space-y-3'>
              <h1 className='text-3xl font-semibold text-foreground sm:text-4xl'>
                Add another profile
              </h1>
              <p className='text-muted-foreground max-w-2xl text-sm sm:text-base'>
                Extend your Elimika experience with role-specific dashboards. Select the profile you
                need today—switching back is always one click away.
              </p>
            </div>
            <div className='grid gap-4 sm:grid-cols-2'>
              {highlights.map(card => (
                <div
                  key={card.title}
                  className='rounded-xl border border-border/60 bg-background/80 p-5 shadow-sm backdrop-blur-sm'
                >
                  <h2 className='text-sm font-semibold text-foreground'>{card.title}</h2>
                  <p className='text-muted-foreground mt-1.5 text-sm leading-relaxed'>
                    {card.description}
                  </p>
                </div>
              ))}
            </div>
          </header>

          <div className='space-y-6 rounded-2xl border border-border/50 bg-background/95 p-6 shadow-sm backdrop-blur'>
            <AddProfileSelector />
            <div className='grid gap-3 md:grid-cols-3'>
              {quickSteps.map(step => (
                <div
                  key={step.title}
                  className='flex gap-3 rounded-xl border border-dashed border-border/60 bg-muted/10 p-4'
                >
                  <span className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                    <step.icon className='h-4 w-4' />
                  </span>
                  <div className='space-y-1'>
                    <p className='text-sm font-semibold text-foreground'>{step.title}</p>
                    <p className='text-muted-foreground text-xs leading-relaxed'>
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className='w-full space-y-6 lg:sticky lg:top-28 lg:w-80'>
          <div className='rounded-2xl border border-border/50 bg-background/90 p-6 shadow-sm backdrop-blur'>
            <h2 className='text-base font-semibold text-foreground'>Need to remove a role?</h2>
            <p className='text-muted-foreground mt-2 text-sm leading-relaxed'>
              Keep your workspace tidy by removing profiles you no longer need, or schedule account
              deletion if you plan to start fresh later.
            </p>
          </div>
          <ManageProfileActions className='lg:sticky lg:top-56' />
        </aside>
      </div>
    </div>
  );
}
