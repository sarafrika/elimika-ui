import React from 'react';
import AddProfileSelector from './_components/add-profile-selector';
import ManageProfileActions from './_components/manage-profile-actions';

const insights = [
  {
    title: 'Why add another profile?',
    description:
      'Additional profiles unlock role-specific dashboards without needing a second account. Switch instantly when you need to teach, create, or learn.',
  },
  {
    title: 'What stays in sync?',
    description:
      'Your personal details, credentials, and security settings remain shared across every role so you can manage everything from one place.',
  },
];

export default function AddProfilePage() {
  return (
    <div className='bg-muted/20'>
      <div className='mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:flex-row lg:items-start lg:gap-12 lg:py-12'>
        <section className='flex-1 space-y-6'>
          <header className='space-y-2'>
            <p className='text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground'>
              Account roles
            </p>
            <h1 className='text-3xl font-semibold text-foreground sm:text-4xl'>Add a new profile</h1>
            <p className='text-muted-foreground text-sm sm:text-base'>
              Extend your Elimika access with specialised dashboards tailored to students,
              instructors, and course creators. Pick the profile you need—you can switch back at any
              time.
            </p>
          </header>

          <div className='rounded-xl border border-border/60 bg-background/90 p-6 shadow-sm backdrop-blur'>
            <AddProfileSelector />
          </div>

          <div className='grid gap-4 rounded-xl border border-border/60 bg-background/70 p-6 shadow-sm sm:grid-cols-2'>
            {insights.map(card => (
              <div key={card.title} className='space-y-1.5'>
                <h2 className='text-sm font-semibold text-foreground'>{card.title}</h2>
                <p className='text-muted-foreground text-sm leading-relaxed'>{card.description}</p>
              </div>
            ))}
          </div>
        </section>

        <aside className='w-full max-w-xl space-y-6 lg:w-80'>
          <div className='rounded-xl border border-border/60 bg-background/90 p-6 shadow-sm backdrop-blur'>
            <h2 className='text-base font-semibold text-foreground'>Need to remove a role?</h2>
            <p className='text-muted-foreground mt-2 text-sm leading-relaxed'>
              Keep your account tidy by removing profiles you no longer need, or close your account
              entirely when you are done.
            </p>
          </div>
          <ManageProfileActions className='mt-0' />
        </aside>
      </div>
    </div>
  );
}
