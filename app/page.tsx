import LoginButton from '@/components/LoginButton';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { BrandPill } from '@/components/ui/brand-pill';
import { ArrowRight, BookOpenCheck, GraduationCap, LayoutDashboard, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const currentYear = new Date().getFullYear();

const productHighlights = [
  {
    title: 'Creator-first tooling',
    description:
      'Craft programs, lessons, and assessments with guided steps, structured analytics, and publishing controls built for scale.',
    icon: BookOpenCheck,
  },
  {
    title: 'Dynamic domain dashboards',
    description:
      'Switch effortlessly between course creator, instructor, organisation, and learner views—each with bespoke insights.',
    icon: LayoutDashboard,
  },
  {
    title: 'Instruction elevated',
    description:
      'Blended delivery, availability management, and training orchestration empower educators to focus on impact.',
    icon: GraduationCap,
  },
] as const;

const domainLabels = ['Course creators', 'Instructors', 'Organisations', 'Learners'] as const;
const sarafrikaPoints = [
  'Unified design tokens capture the gradient language of the Elimika bloom.',
  'Inclusive typography and colour ensure accessibility without diluting brand character.',
  'Scalable architecture supports institutions, educators, and lifelong learners alike.',
] as const;

export default function Home() {
  return (
    <div className='relative min-h-screen overflow-hidden bg-background text-foreground'>

      <nav className='sticky top-0 z-40 border-b border-border/60 bg-card/80 backdrop-blur'>
        <div className='mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5'>
          <Link href='/' className='flex items-center gap-4'>
            <Image
              alt='Elimika logo'
              src='/logos/elimika/Elimika Logo Design-02.svg'
              width={160}
              height={48}
              className='h-10 w-auto drop-shadow-sm dark:hidden'
              priority
            />
            <Image
              alt='Elimika logo in white'
              src='/logos/elimika/Elimika Logo Design-02-white.svg'
              width={160}
              height={48}
              className='hidden h-10 w-auto drop-shadow-sm dark:block'
              priority
            />
          </Link>

          <div className='flex items-center gap-4 text-sm font-medium text-muted-foreground'>
            <Link className='transition hover:text-primary focus-visible:text-primary' href='#product'>
              Product
            </Link>
            <Link className='transition hover:text-primary focus-visible:text-primary' href='#domains'>
              Domains
            </Link>
            <Link className='transition hover:text-primary focus-visible:text-primary' href='#powered'>
              Powered by Sarafrika
            </Link>
            <ThemeSwitcher size='icon' />
            <LoginButton />
          </div>
        </div>
      </nav>

      <main>
        <section className='relative overflow-hidden border-b border-border/50'>
          <div className='relative mx-auto flex w-full max-w-6xl flex-col items-center gap-10 px-6 pb-24 pt-24 text-center lg:pt-28'>
            <span className='inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-primary shadow-sm'>
              Product experience
            </span>
            <h1 className='max-w-4xl text-balance text-4xl font-semibold leading-tight text-foreground sm:text-5xl lg:text-[56px]'>
              Elimika is the home of orchestrated learning experiences for Africa&rsquo;s creators
              and institutions.
            </h1>
            <p className='max-w-3xl text-base text-muted-foreground sm:text-lg'>
              A product suite born from the Elimika mark—layered gradients, confident geometry, and
              purposeful flows—designed to elevate every learning journey.
            </p>
            <div className='flex flex-col items-center gap-4 sm:flex-row'>
              <LoginButton />
              <Link
                href='#product'
                className='inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-7 py-3 text-sm font-medium text-primary shadow hover:border-primary/60 hover:text-primary'
              >
                Explore the product <ArrowRight className='h-4 w-4' />
              </Link>
            </div>

            <div className='flex flex-col items-center gap-4 rounded-[36px] border border-border/60 bg-card/70 px-6 py-6 shadow-lg shadow-black/5 backdrop-blur-sm sm:px-10 sm:py-8'>
              <p className='text-xs font-semibold uppercase tracking-[0.4em] text-primary'>
                Domains harmonised
              </p>
              <div className='grid gap-4 text-sm font-medium text-muted-foreground sm:grid-cols-4'>
                {domainLabels.map(label => (
                  <BrandPill
                    key={label}
                    className='justify-center normal-case tracking-[0.2em] text-xs font-semibold'
                  >
                    {label}
                  </BrandPill>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id='product' className='bg-background/80 py-20'>
          <div className='mx-auto grid w-full max-w-6xl gap-10 px-6 md:grid-cols-[1.1fr_0.9fr] md:items-center'>
            <div className='space-y-5'>
              <p className='text-sm font-semibold text-primary'>Crafted for orchestrators</p>
              <h2 className='text-3xl font-semibold text-foreground sm:text-4xl'>
                Purpose-built for creators, instructors, organisations, and learners
              </h2>
              <p className='text-base text-muted-foreground'>
                Each role inherits an environment aligned with their workflow—no context-switching,
                just clarity, governance, and inspired execution.
              </p>
              <div className='grid gap-4 sm:grid-cols-2'>
                <FeatureBadge label='Guided course creation' />
                <FeatureBadge label='Real-time analytics narratives' />
                <FeatureBadge label='Institution-ready governance' />
                <FeatureBadge label='Immersive learner journeys' />
              </div>
            </div>

            <div className='flex-1 rounded-[32px] border border-border/60 bg-card/80 p-8 shadow-xl shadow-black/10'>
              <p className='text-sm font-semibold text-primary'>What our partners say</p>
              <blockquote className='mt-3 text-base text-muted-foreground'>
                “Elimika is where storytelling meets infrastructure. The product honours our brand
                while giving our teams the clarity they need to scale.”
              </blockquote>
              <div className='mt-6 flex items-center gap-3'>
                <div className='rounded-full bg-primary/15 p-2'>
                  <Sparkles className='h-4 w-4 text-primary' />
                </div>
                <div>
                  <p className='text-sm font-semibold text-foreground'>Sarafrika Product Studio</p>
                  <p className='text-xs text-muted-foreground'>Design & engineering partner</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id='domains' className='border-y border-border/60 bg-background/70 py-20'>
          <div className='mx-auto w-full max-w-6xl px-6'>
            <div className='mb-12 text-center'>
              <p className='text-xs font-semibold uppercase tracking-[0.4em] text-primary'>
                Product pillars
              </p>
              <h2 className='mt-3 text-3xl font-semibold text-foreground sm:text-4xl'>
                The Elimika platform at a glance
              </h2>
            </div>

            <div className='grid gap-6 md:grid-cols-3'>
              {productHighlights.map(feature => {
                const Icon = feature.icon;
                return (
                  <article
                    key={feature.title}
                    className='group rounded-[28px] border border-border bg-card/90 p-6 shadow-lg shadow-black/10 transition hover:-translate-y-1 hover:border-primary/60'
                  >
                    <div className='mb-5 inline-flex items-center justify-center rounded-full bg-primary/15 p-3 text-primary'>
                      <Icon className='h-5 w-5' />
                    </div>
                    <h3 className='mb-3 text-lg font-semibold text-foreground'>{feature.title}</h3>
                    <p className='text-sm leading-6 text-muted-foreground'>{feature.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id='powered' className='bg-background py-20'>
          <div className='mx-auto grid w-full max-w-6xl gap-10 px-6 md:grid-cols-[1.1fr_0.9fr] md:items-center'>
            <div className='space-y-5'>
              <p className='inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-primary'>
                Powered by Sarafrika
              </p>
              <h2 className='text-3xl font-semibold text-foreground sm:text-4xl'>
                Product craftsmanship by Sarafrika, inspired by the Elimika emblem
              </h2>
              <p className='text-base text-muted-foreground'>
                Sarafrika&rsquo;s product studios steward Elimika&rsquo;s vision—from interface
                language to enabling technology—embedding sustainable design and engineering across
                every release.
              </p>
              <ul className='space-y-3 text-sm text-muted-foreground'>
                {sarafrikaPoints.map(point => (
                  <li key={point} className='flex items-start gap-3'>
                    <div className='mt-1 size-2 rounded-full bg-primary' />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className='flex flex-col items-center gap-6 rounded-[32px] border border-border/60 bg-card/80 p-8 shadow-xl shadow-black/10'>
              <Image
                alt='Sarafrika logo'
                src='/logos/sarafrika/Sarafrika Logo-02.svg'
                width={180}
                height={48}
                className='h-12 w-auto'
              />
              <p className='text-center text-sm text-muted-foreground'>
                “Together, Elimika and Sarafrika celebrate African ingenuity—building a product
                ecosystem where talent thrives, organisations transform, and learners flourish.”
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className='border-t border-border/60 bg-card/80 py-10'>
        <div className='mx-auto flex w-full max-w-6xl justify-center px-6'>
          <div className='text-xs text-muted-foreground'>
            {'\u00A9'} {currentYear} Sarafrika. Elimika is owned and copyrighted by Sarafrika.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureBadge({ label }: { label: string }) {
  return (
    <div className='rounded-full border border-border bg-card/80 px-4 py-2 text-xs font-semibold text-primary shadow-sm'>
      {label}
    </div>
  );
}
