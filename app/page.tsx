import LoginButton from '@/components/LoginButton';
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const currentYear = new Date().getFullYear();

const featureCards = [
  {
    title: 'Masterfully Curated Learning',
    description:
      'From foundational skills to emerging disciplines, every learning path is shaped with industry insight and academic rigor.',
    icon: BookOpen,
  },
  {
    title: 'Guided by Recognised Experts',
    description:
      'Elimika partners with seasoned practitioners and educators to deliver instruction that is both relevant and inspiring.',
    icon: GraduationCap,
  },
  {
    title: 'Progress with Confidence',
    description:
      'Structured milestones, verified assessments, and credentials that travel with you across careers and continents.',
    icon: ShieldCheck,
  },
];

export default function Home() {
  return (
    <div className='min-h-screen bg-slate-950 text-slate-50'>
      <div className='absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(112,57,228,0.25),_transparent_55%)]'></div>
      <nav className='sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur'>
        <div className='mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5'>
          <Link href='/' className='flex items-center gap-3'>
            <div className='relative'>
              <div className='absolute -inset-2 rounded-full bg-purple-500/40 blur'></div>
              <Image
                alt='Elimika'
                height={48}
                width={160}
                src='/Logo.svg'
                className='relative h-12 w-[160px]'
                priority
              />
            </div>
            <span className='hidden text-sm font-medium text-purple-200 sm:block'>
              Elevating learning experiences
            </span>
          </Link>
          <div className='flex items-center gap-6 text-sm text-slate-200'>
            <Link className='hover:text-purple-200 transition' href='#experience'>
              Experience
            </Link>
            <Link className='hover:text-purple-200 transition' href='#highlights'>
              Highlights
            </Link>
            <Link className='hover:text-purple-200 transition' href='#approach'>
              Approach
            </Link>
            <LoginButton />
          </div>
        </div>
      </nav>

      <main>
        <section className='relative overflow-hidden'>
          <div className='absolute inset-0 bg-gradient-to-br from-purple-900 via-purple-700/80 to-slate-900'></div>
          <div className='absolute -left-24 top-24 size-72 rounded-full bg-purple-400/30 blur-3xl'></div>
          <div className='absolute -right-20 bottom-0 size-80 rounded-full bg-indigo-500/40 blur-3xl'></div>

          <div className='relative mx-auto flex w-full max-w-6xl flex-col items-center gap-10 px-6 pb-28 pt-28 text-center sm:pb-40 sm:pt-36'>
            <span className='inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs tracking-[0.3em] uppercase text-purple-100 shadow-sm'>
              Discover Elimika
            </span>
            <h1 className='max-w-3xl bg-gradient-to-br from-white via-purple-100 to-purple-200 bg-clip-text text-4xl font-semibold leading-tight text-transparent sm:text-5xl lg:text-[56px]'>
              A refined ecosystem for ambitious learners and visionary educators
            </h1>
            <p className='max-w-2xl text-lg text-slate-200 sm:text-xl'>
              We weave together pedagogy, technology, and human insight so every learning journey
              feels considered, elevated, and unmistakably Elimika.
            </p>
            <div className='flex flex-col gap-4 sm:flex-row'>
              <LoginButton />
              <Link
                href='#approach'
                className='inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-7 py-3 text-sm font-medium text-purple-100 transition hover:border-white hover:text-white'
              >
                Explore our approach <ArrowRight className='h-4 w-4' />
              </Link>
            </div>

            <div className='mt-8 flex flex-wrap items-center justify-center gap-6 text-xs uppercase tracking-widest text-purple-200/80'>
              <span className='px-3 py-1'>Skill pathways</span>
              <span className='hidden h-4 w-px bg-white/20 sm:block'></span>
              <span className='px-3 py-1'>Institutional curation</span>
              <span className='hidden h-4 w-px bg-white/20 sm:block'></span>
              <span className='px-3 py-1'>Seamless onboarding</span>
            </div>
          </div>
        </section>

        <section id='experience' className='relative border-y border-white/5 bg-slate-950/60 py-20'>
          <div className='mx-auto grid w-full max-w-5xl gap-8 px-6 md:grid-cols-[1.3fr_1fr] md:items-center'>
            <div className='space-y-4'>
              <p className='inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-purple-200'>
                The Elimika experience
              </p>
              <h2 className='text-3xl font-semibold text-white sm:text-4xl'>
                Modular learning moments, timeless inspiration
              </h2>
              <p className='text-base leading-relaxed text-slate-300'>
                Designed around the contours of the Elimika mark, our learning surfaces blend soft
                gradients with purposeful geometry. Every pixel reflects our promise: crafted
                pathways that empower creators, instructors, organisations, and students alike.
              </p>
              <div className='grid gap-4 sm:grid-cols-2'>
                <FeaturePill label='Creator toolkits' />
                <FeaturePill label='Instructor excellence' />
                <FeaturePill label='Organisation readiness' />
                <FeaturePill label='Learner-first journeys' />
              </div>
            </div>
            <div className='relative rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-purple-900/30 backdrop-blur'>
              <div className='absolute -left-8 -top-8 size-16 rounded-full bg-purple-400/40 blur-2xl'></div>
              <div className='absolute -bottom-10 -right-6 size-28 rounded-full bg-indigo-500/20 blur-3xl'></div>
              <Sparkles className='text-purple-200 mb-6 h-8 w-8' />
              <p className='text-sm leading-relaxed text-slate-200'>
                &ldquo;Elimika feels bespoke. The interface, the guidance, the way the brand
                cradles our curriculum—it all speaks to a team that values craft.&rdquo;
              </p>
              <div className='mt-6'>
                <p className='text-sm font-medium text-white'>Academic Director, Sarafrika</p>
                <p className='text-xs text-slate-400'>Speaking on the Elimika design ethos</p>
              </div>
            </div>
          </div>
        </section>

        <section id='highlights' className='bg-slate-950 py-20'>
          <div className='mx-auto w-full max-w-5xl px-6'>
            <div className='mb-12 text-center'>
              <p className='text-xs uppercase tracking-[0.35em] text-purple-200/80'>
                Highlights
              </p>
              <h2 className='mt-3 text-3xl font-semibold text-white sm:text-4xl'>
                Crafted pillars that keep learning elevated
              </h2>
            </div>

            <div className='grid gap-6 md:grid-cols-3'>
              {featureCards.map(card => {
                const Icon = card.icon;
                return (
                  <article
                    key={card.title}
                    className='group rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition hover:-translate-y-1 hover:border-purple-300/40 hover:bg-white/[0.08]'
                  >
                    <div className='mb-5 inline-flex items-center justify-center rounded-full bg-purple-500/20 p-3 text-purple-100'>
                      <Icon className='h-5 w-5' />
                    </div>
                    <h3 className='mb-3 text-lg font-semibold text-white'>{card.title}</h3>
                    <p className='text-sm leading-6 text-slate-300'>{card.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id='approach' className='border-y border-white/5 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-20'>
          <div className='mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 lg:flex-row lg:items-center'>
            <div className='flex-1 space-y-5'>
              <p className='inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.45em] text-purple-200'>
                Powered by Sarafrika
              </p>
              <h2 className='text-3xl font-semibold text-white sm:text-4xl'>
                An alliance of design, technology, and pedagogy
              </h2>
              <p className='text-base leading-relaxed text-slate-300'>
                Sarafrika powers Elimika with a universal design language drawn directly from the
                Elimika emblem: softly intersecting arcs, gradient transitions, and precise lines
                that celebrate African innovation. Together, we shape learning experiences that are
                cultured, current, and deeply human.
              </p>
              <ul className='space-y-3 text-sm text-slate-200'>
                {[
                  'Dynamic dashboards honour each domain—course creators, instructors, organisations, and learners.',
                  'Accessibility-first typography and contrast ensures comfort across any device or environment.',
                  'Modular interfaces mirror the layered petals of the Elimika logo, signalling growth at every turn.',
                ].map(point => (
                  <li key={point} className='flex items-start gap-3'>
                    <div className='mt-1 size-2 rounded-full bg-purple-300'></div>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className='flex-1 rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-xl shadow-purple-900/20'>
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold text-white'>Learning, reimagined</h3>
                <p className='text-sm text-slate-300'>
                  From onboarding flows to analytics dashboards, Elimika&rsquo;s surfaces echo the
                  graceful bloom of its mark. Smooth gradients, thoughtful spacing, and crafted
                  motion reinforce a promise: when you’re here, you’re building a future that
                  matters.
                </p>
                <div className='rounded-2xl bg-gradient-to-br from-purple-900/70 via-purple-700/40 to-slate-900/60 p-6 shadow-inner'>
                  <p className='text-xs uppercase tracking-[0.3em] text-purple-100'>
                    Design motif
                  </p>
                  <p className='mt-3 text-sm text-slate-200'>
                    Inspired by the Elimika emblem, concentric layers ripple outward—each one
                    symbolising access, opportunity, and the amplification of African excellence.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className='border-t border-white/10 bg-slate-950/80 pb-12 pt-10'>
        <div className='mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex flex-col gap-1 text-slate-300'>
            <span>Elimika — learning without compromise.</span>
            <span className='text-xs text-slate-500'>
              Crafted with purpose, powered by Sarafrika.
            </span>
          </div>
          <div className='text-xs text-slate-500'>
            © {currentYear} Sarafrika. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeaturePill({ label }: { label: string }) {
  return (
    <div className='rounded-full border border-purple-400/30 bg-purple-500/10 px-4 py-2 text-xs font-medium text-purple-100'>
      {label}
    </div>
  );
}
