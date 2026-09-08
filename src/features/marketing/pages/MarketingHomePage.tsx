import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { CatalogueStatusCard } from '@/src/features/catalogue/components/CatalogueStatusCard';
import {
  BRAND_TONE,
  TONE_FILL,
  TONE_INK,
  TONE_ON_FILL,
  TONE_PANEL,
  toneFor,
} from '@/src/features/marketing/components/discipline-tone';
import { DISPLAY } from '@/src/features/marketing/components/display-font';
import {
  HomeCatalogueFilterProvider,
  HomeCategoryChips,
  HomeCourseGrid,
} from '@/src/features/marketing/components/HomeCatalogueFilter';
import {
  getHomeCatalogue,
  getPlatformStats,
  HOME_GRID_SIZE,
} from '@/src/features/marketing/server';
import {
  ArrowRight,
  BookOpen,
  CircleAlert,
  GraduationCap,
  School,
  Search,
  Users,
} from 'lucide-react';
import { Bricolage_Grotesque } from 'next/font/google';
import Link from 'next/link';
import { Suspense } from 'react';

// Bricolage Grotesque for display, against the app's Plus Jakarta Sans for body
// copy. Declared here rather than in the layout so only this route pays for it.
const displayFont = Bricolage_Grotesque({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  display: 'swap',
});

const currentYear = new Date().getFullYear();

const CONTAINER = 'mx-auto w-full max-w-6xl px-5 sm:px-8';

const CREATE_ACCOUNT_HREF = '/auth/create-account';

// The three audiences the brief names, each linking to an entry point that
// exists today - the catalogue for learners, account creation for the supply
// side - rather than to a marketing page nobody has built.
const AUDIENCES = [
  {
    eyebrow: 'Learners',
    icon: GraduationCap,
    title: 'Learn something you can prove',
    body: 'Finish a course and the skill lands in your Skills Wallet - a record you can show an employer, not just a certificate in a drawer.',
    href: '/courses',
    cta: 'Browse the catalogue',
    tone: BRAND_TONE,
  },
  {
    eyebrow: 'Instructors & trainers',
    icon: Users,
    title: 'Apply to train. Get paid per session.',
    body: 'Set your rates for private, group, in-person or virtual delivery. You apply, the course creator approves, and Elimika handles enrolment and payment.',
    href: CREATE_ACCOUNT_HREF,
    cta: 'Create a trainer account',
    tone: toneFor('Instructors'),
  },
  {
    eyebrow: 'Schools',
    icon: School,
    title: 'Staff your co-curricular timetable',
    body: 'Post the class you need taught and let trainers apply, with their classrooms, equipment and rates declared up front.',
    href: CREATE_ACCOUNT_HREF,
    cta: 'Register your school',
    tone: toneFor('Schools'),
  },
] as const;

const ENROLMENT_STEPS = [
  {
    title: 'Find the course',
    body: 'Search the catalogue or filter by category, then open a course to read its lessons, its trainer and what it costs.',
  },
  {
    title: 'Enrol and pay in KES',
    body: 'Add the course to your cart and check out. Every fee on Elimika is listed in Kenyan shillings, per course or per session.',
  },
  {
    title: 'Attend and work through it',
    body: 'Join the sessions your trainer schedules, work through the lessons, and follow your progress from your dashboard.',
  },
  {
    title: 'Keep the credential',
    body: 'Finish, and the certificate and the skills behind it land in your Skills Wallet where an employer can verify them.',
  },
] as const;

export async function MarketingHomePage() {
  const { courses, categories, hasError } = await getHomeCatalogue();

  return (
    <div className={displayFont.variable}>
      <main>
        <HomeCatalogueFilterProvider categories={categories}>
          <section className='bg-secondary relative overflow-hidden'>
            <span
              aria-hidden='true'
              className='pointer-events-none absolute -top-32 -right-24 size-[520px] rounded-full bg-[radial-gradient(circle_at_30%_30%,color-mix(in_oklch,var(--el-brand-600)_16%,transparent),transparent_70%)]'
            />
            <span
              aria-hidden='true'
              className='pointer-events-none absolute -bottom-44 left-8 size-[420px] rounded-full bg-[radial-gradient(circle_at_50%_50%,color-mix(in_oklch,var(--el-accent-amber)_18%,transparent),transparent_70%)]'
            />

            <div className={cn(CONTAINER, 'relative py-12 sm:py-16')}>
              <p className='border-border bg-card text-foreground/80 mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold'>
                <span className='bg-success size-1.5 shrink-0 rounded-full' aria-hidden='true' />
                Learn a trade. Prove it. Get paid for it.
              </p>

              <h1
                className={cn(
                  DISPLAY,
                  'text-foreground max-w-[15ch] text-[2.25rem] leading-[1.03] font-extrabold tracking-[-0.035em] text-balance sm:text-5xl lg:text-6xl'
                )}
              >
                Find a course. Meet the trainer.{' '}
                <span className='text-primary'>Start this week.</span>
              </h1>

              <p className='text-muted-foreground mt-4 max-w-[56ch] text-base leading-relaxed'>
                Live classes and self-paced courses from instructors and training providers across
                Kenya. Enrol, pay in KES, and every skill you finish lands in your Skills Wallet.
              </p>

              <form
                action='/courses'
                method='get'
                role='search'
                className='mt-7 flex max-w-[620px] flex-col gap-2.5 sm:flex-row'
              >
                <div className='relative flex-1'>
                  <Search
                    className='text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2'
                    aria-hidden='true'
                  />
                  <Input
                    type='search'
                    name='q'
                    aria-label='Search courses, skills or trainers'
                    placeholder='Search courses, skills or trainers'
                    className='bg-card h-13 rounded-xl pr-4 pl-11 text-[15px] shadow-sm'
                  />
                </div>
                <Button type='submit' className='h-13 rounded-xl px-7 text-[15px] font-semibold'>
                  Search
                </Button>
              </form>

              <div className='mt-6'>
                <HomeCategoryChips />
              </div>
            </div>
          </section>

          <Suspense fallback={null}>
            <PlatformProofStrip />
          </Suspense>

          <section className={cn(CONTAINER, 'py-11 sm:py-12')}>
            {hasError ? (
              <CatalogueStatusCard
                title='Unable to load courses right now'
                description='The catalogue is temporarily unavailable. Please refresh, or head straight to the full course list.'
                icon={CircleAlert}
                tone='error'
              />
            ) : courses.length === 0 ? (
              <CatalogueStatusCard
                title='No published courses yet'
                description='The catalogue is being prepared. Check back soon, or get in touch to talk about custom training.'
                icon={BookOpen}
              />
            ) : (
              <HomeCourseGrid courses={courses} gridSize={HOME_GRID_SIZE} />
            )}
          </section>
        </HomeCatalogueFilterProvider>

        <section className={cn(CONTAINER, 'pb-14 sm:pb-16')}>
          <h2 className='sr-only'>Three ways into Elimika</h2>
          <div className='grid gap-[18px] md:grid-cols-3'>
            {AUDIENCES.map(audience => {
              const Icon = audience.icon;

              return (
                <article
                  key={audience.eyebrow}
                  className={cn(audience.tone, TONE_PANEL, 'rounded-[18px] border p-6 sm:p-7')}
                >
                  <span
                    className={cn(
                      TONE_FILL,
                      TONE_ON_FILL,
                      'mb-4 inline-flex size-9.5 items-center justify-center rounded-xl'
                    )}
                  >
                    <Icon className='size-[19px]' aria-hidden='true' />
                  </span>
                  <p
                    className={cn(TONE_INK, 'text-[11.5px] font-bold tracking-[0.09em] uppercase')}
                  >
                    {audience.eyebrow}
                  </p>
                  <h3
                    className={cn(
                      DISPLAY,
                      'text-foreground mt-1.5 text-xl leading-tight font-bold tracking-tight'
                    )}
                  >
                    {audience.title}
                  </h3>
                  <p className='text-muted-foreground mt-2 text-sm leading-relaxed'>
                    {audience.body}
                  </p>
                  <Link
                    href={audience.href}
                    className={cn(
                      TONE_INK,
                      'mt-4 inline-flex items-center gap-1.5 text-[13.5px] font-semibold hover:underline'
                    )}
                  >
                    {audience.cta}
                    <ArrowRight className='size-3.5' aria-hidden='true' />
                  </Link>
                </article>
              );
            })}
          </div>
        </section>

        <section className='bg-secondary border-border border-y'>
          <div className={cn(CONTAINER, 'py-12 sm:py-16')}>
            <div className='max-w-2xl'>
              <p className='text-primary text-[11.5px] font-bold tracking-[0.09em] uppercase'>
                How enrolling works
              </p>
              <h2
                className={cn(
                  DISPLAY,
                  'text-foreground mt-2 text-2xl font-bold tracking-tight sm:text-3xl'
                )}
              >
                Four steps from browsing to a credential you own
              </h2>
            </div>

            <ol className='mt-8 grid gap-[18px] sm:grid-cols-2 lg:grid-cols-4'>
              {ENROLMENT_STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className='border-border bg-card rounded-[18px] border p-5 sm:p-6'
                >
                  <span
                    className={cn(
                      DISPLAY,
                      'bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg text-sm font-bold'
                    )}
                  >
                    {index + 1}
                  </span>
                  <h3
                    className={cn(
                      DISPLAY,
                      'text-foreground mt-3 text-base font-bold tracking-tight'
                    )}
                  >
                    {step.title}
                  </h3>
                  <p className='text-muted-foreground mt-2 text-sm leading-relaxed'>{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          className={cn(CONTAINER, 'grid gap-8 py-12 sm:py-16 lg:grid-cols-[1.05fr_0.95fr]')}
        >
          <div>
            <p className='text-primary text-[11.5px] font-bold tracking-[0.09em] uppercase'>
              Skills Wallet
            </p>
            <h2
              className={cn(
                DISPLAY,
                'text-foreground mt-2 text-2xl font-bold tracking-tight sm:text-3xl'
              )}
            >
              What you keep after the course ends
            </h2>
            <p className='text-muted-foreground mt-4 max-w-xl text-base leading-relaxed'>
              Skills Wallet is the record of what you have actually done: certificates, verified
              skills and the learning behind them, held in one place and shareable with an employer
              without a stack of scanned paper.
            </p>
            <Link
              href='/skills-wallet'
              className={cn(buttonVariants({ size: 'lg' }), 'mt-6 rounded-xl px-6 font-semibold')}
            >
              See how Skills Wallet works
              <ArrowRight className='size-4' aria-hidden='true' />
            </Link>
          </div>

          <div className='border-border bg-card rounded-[18px] border p-6 sm:p-7'>
            <p className='text-primary text-[11.5px] font-bold tracking-[0.09em] uppercase'>
              Skills Fund
            </p>
            <h3
              className={cn(
                DISPLAY,
                'text-foreground mt-2 text-xl leading-tight font-bold tracking-tight'
              )}
            >
              When the fee is the thing standing in the way
            </h3>
            <p className='text-muted-foreground mt-3 text-sm leading-relaxed'>
              The Skills Fund connects learners with scholarships, bursaries and employer-funded
              training so a course fee does not decide who gets to train.
            </p>
            <Link
              href='/skills-wallet#skills-fund'
              className='text-primary mt-4 inline-flex items-center gap-1.5 text-[13.5px] font-semibold hover:underline'
            >
              Read about the Skills Fund
              <ArrowRight className='size-3.5' aria-hidden='true' />
            </Link>
          </div>
        </section>

        <section className={cn(CONTAINER, 'pb-14 sm:pb-20')}>
          <div className='border-border bg-card rounded-[18px] border p-8 text-center sm:p-12'>
            <h2
              className={cn(
                DISPLAY,
                'text-foreground text-2xl font-bold tracking-tight text-balance sm:text-3xl'
              )}
            >
              Everything on this page starts in the catalogue
            </h2>
            <p className='text-muted-foreground mx-auto mt-3 max-w-xl text-base leading-relaxed'>
              Find the course, meet the trainer who runs it, and enrol. Trainers and schools start
              in the same place - with an account.
            </p>
            <div className='mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center'>
              <Link
                href='/courses'
                className={cn(buttonVariants({ size: 'lg' }), 'rounded-xl px-7 font-semibold')}
              >
                Browse the catalogue
                <ArrowRight className='size-4' aria-hidden='true' />
              </Link>
              <Link
                href={CREATE_ACCOUNT_HREF}
                className={cn(
                  buttonVariants({ size: 'lg', variant: 'outline' }),
                  'rounded-xl px-7 font-semibold'
                )}
              >
                Create an account
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className='border-border bg-card border-t py-8'>
        <div className={cn(CONTAINER, 'text-muted-foreground text-center text-xs')}>
          {'©'} {currentYear} Sarafrika. Elimika is owned and copyrighted by Sarafrika.
        </div>
      </footer>
    </div>
  );
}

// The hero's proof strip, streamed separately so counts from unrelated services
// can never hold up the headline. The band renders nothing at all when none can
// be read: an absent figure beats an invented one.
async function PlatformProofStrip() {
  const stats = await getPlatformStats();

  if (stats.length === 0) {
    return null;
  }

  return (
    <section className='border-border bg-background border-b'>
      <div className={cn(CONTAINER, 'grid gap-6 py-6 sm:grid-cols-2 lg:grid-cols-3')}>
        {stats.map((stat, index) => (
          <p key={stat.key} className={cn(toneFor(stat.key + index), 'flex items-baseline gap-3')}>
            <span
              className={cn(
                DISPLAY,
                TONE_INK,
                'text-[26px] font-extrabold tracking-tight sm:text-3xl'
              )}
            >
              {stat.value.toLocaleString('en-US')}
              {stat.atLeast ? '+' : ''}
            </span>
            <span className='text-muted-foreground text-[13.5px] leading-snug'>{stat.label}</span>
          </p>
        ))}
      </div>
    </section>
  );
}
