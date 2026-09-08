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
  BadgeCheck,
  BookOpen,
  CalendarDays,
  CircleAlert,
  CreditCard,
  GraduationCap,
  Quote,
  School,
  Search,
  Users,
  Wallet,
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

// Steps up rather than stopping at 6xl: on a 2xl monitor a 1152px column
// left the page marooned in the middle of the screen. Gutters grow with it
// so the content never runs to the glass edge.
const CONTAINER =
  'mx-auto w-full max-w-6xl px-5 sm:px-8 xl:max-w-7xl 2xl:max-w-[88rem] 2xl:px-12';

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

// What the platform actually does, in one dark band. Every line here is a
// feature that exists - registration windows, rate cards, M-Pesa - rather than
// a capability we would like to claim.
//
// The tones are the light-on-dark end of the accent ramp deliberately: this
// band stays dark in both themes, so the `--tone` classes used elsewhere (which
// darken for light mode) would render dark-on-dark here.
const SERVICES = [
  {
    title: 'Course catalogue and enrolment',
    icon: BookOpen,
    tone: 'var(--el-brand-400)',
    body: 'Browse by discipline, see the classes actually running, and enrol against a live seat count and registration window.',
  },
  {
    title: 'Pay in KES, by M-Pesa',
    icon: CreditCard,
    tone: 'var(--el-accent-jade)',
    body: 'Local pricing and local payment. Orders, receipts and refunds handled on platform, not over WhatsApp.',
  },
  {
    title: 'Skills Wallet',
    icon: Wallet,
    tone: 'var(--el-accent-iris)',
    body: 'Every skill you finish is recorded against your name - a portable record for an employer, not a certificate in a drawer.',
  },
  {
    title: 'Trainer applications and rate cards',
    icon: Users,
    tone: 'var(--el-accent-amber)',
    body: 'Instructors and schools apply to deliver a course, declaring classrooms, equipment and their own rates. Your rates stay yours.',
  },
  {
    title: 'Classes, timetables and attendance',
    icon: CalendarDays,
    tone: 'var(--el-highlight-400)',
    body: 'Recurring sessions, registration windows and rosters - so a class has a real start date, not an open-ended waitlist.',
  },
  {
    title: 'Assessment and certification',
    icon: BadgeCheck,
    tone: 'var(--el-accent-blush)',
    body: 'Quizzes, assignments and rubrics with grading, and a certificate issued on completion once the work is actually done.',
  },
] as const;

// Placeholders, and deliberately obvious ones. Real quotes have to come from
// real people who agreed to be named; inventing them would be the one thing on
// this page a visitor could catch us out on.
const QUOTES = [
  {
    quote:
      '[QUOTE - a learner on finishing a course and what the Skills Wallet record changed for them]',
    name: '[LEARNER NAME]',
    role: '[COURSE] / [TOWN]',
    initials: 'LN',
  },
  {
    quote: '[QUOTE - a trainer on applying to deliver a course and being paid per session]',
    name: '[TRAINER NAME]',
    role: '[DISCIPLINE] / [TOWN]',
    initials: 'TN',
  },
  {
    quote: '[QUOTE - a school on staffing a co-curricular timetable through Elimika]',
    name: '[SCHOOL NAME]',
    role: '[ROLE] / [TOWN]',
    initials: 'SN',
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
                  'text-foreground max-w-[15ch] text-[2.25rem] leading-[1.03] font-extrabold tracking-[-0.035em] text-balance sm:text-5xl lg:text-6xl 2xl:text-[4.25rem]'
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
                className='mt-7 flex max-w-[620px] flex-col gap-2.5 sm:flex-row 2xl:max-w-[720px]'
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

        {/*
          The dark band. It stays dark in both themes on purpose - it is the one
          moment of contrast on an otherwise light page, and flipping it with the
          theme would lose that.
        */}
        <section className='bg-[var(--el-neutral-950)] text-[var(--el-neutral-0)]'>
          <div className={cn(CONTAINER, 'py-12 sm:py-16')}>
            <div className='max-w-2xl'>
              <p className='text-[11.5px] font-bold tracking-[0.09em] text-[var(--el-brand-300)] uppercase'>
                What Elimika runs
              </p>
              <h2
                className={cn(
                  DISPLAY,
                  'mt-2 text-2xl font-bold tracking-tight sm:text-3xl'
                )}
              >
                Everything between finding a course and getting paid for teaching one.
              </h2>
              <p className='mt-3 text-[15px] leading-relaxed text-[var(--el-neutral-300)]'>
                Not a video library. A working marketplace - enrolment, scheduling, assessment and
                payment, for learners, trainers and schools on the same platform.
              </p>
            </div>

            <ul className='mt-8 grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3'>
              {SERVICES.map(service => {
                const Icon = service.icon;

                return (
                  <li
                    key={service.title}
                    className='rounded-[18px] border border-white/12 bg-white/[0.035] p-5 sm:p-6'
                  >
                    <span
                      className='flex size-9 items-center justify-center rounded-[11px]'
                      style={{ backgroundColor: service.tone }}
                    >
                      <Icon className='size-[18px] text-[var(--el-neutral-950)]' aria-hidden />
                    </span>
                    <h3
                      className={cn(DISPLAY, 'mt-3.5 text-base font-bold tracking-tight')}
                    >
                      {service.title}
                    </h3>
                    <p className='mt-2 text-sm leading-relaxed text-[var(--el-neutral-300)]'>
                      {service.body}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section className={cn(CONTAINER, 'py-12 sm:py-16')}>
          <div className='flex flex-wrap items-end justify-between gap-4'>
            <div>
              <p className='text-primary text-[11.5px] font-bold tracking-[0.09em] uppercase'>
                In their words
              </p>
              <h2
                className={cn(
                  DISPLAY,
                  'text-foreground mt-2 text-2xl font-bold tracking-tight sm:text-3xl'
                )}
              >
                The people already using it
              </h2>
            </div>
            <p className='text-muted-foreground max-w-[34ch] text-xs leading-relaxed sm:text-right'>
              Bracketed text is a placeholder - drop in real quotes before this page goes live.
            </p>
          </div>

          <ul className='mt-8 grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3'>
            {QUOTES.map(entry => (
              <li
                key={entry.name}
                className={cn(
                  toneFor(entry.name),
                  'border-border bg-card flex flex-col gap-4 rounded-[18px] border p-5 sm:p-6'
                )}
              >
                <Quote className={cn(TONE_INK, 'size-[22px]')} aria-hidden />
                <p className='text-foreground grow text-sm leading-relaxed'>{entry.quote}</p>
                <div className='border-border/70 flex items-center gap-3 border-t pt-4'>
                  <span
                    className={cn(
                      TONE_INK,
                      'bg-[color-mix(in_oklch,var(--tone)_14%,var(--card))] flex size-9 items-center justify-center rounded-full text-[13px] font-bold'
                    )}
                  >
                    {entry.initials}
                  </span>
                  <span className='min-w-0'>
                    <span className='text-foreground block text-[13.5px] font-semibold'>
                      {entry.name}
                    </span>
                    <span className='text-muted-foreground mt-0.5 block text-xs'>{entry.role}</span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
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
