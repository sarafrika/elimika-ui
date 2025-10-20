import LoginButton from '@/components/LoginButton';
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
];

export default function Home() {
  return (
    <div className='min-h-screen bg-white text-slate-900'>
      <div className='absolute inset-0 -z-10 bg-gradient-to-br from-blue-100 via-white to-blue-50'></div>

      <nav className='sticky top-0 z-40 border-b border-blue-100/60 bg-white/80 backdrop-blur'>
        <div className='mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5'>
          <Link href='/' className='flex items-center gap-4'>
            <Image
              alt='Elimika logo'
              src='/logos/elimika/Elimika Logo Design-02.svg'
              width={240}
              height={72}
              className='h-16 w-auto drop-shadow-sm'
              priority
            />
            <span className='hidden text-sm font-medium text-blue-700 sm:block'>
              A Sarafrika product
            </span>
          </Link>

          <div className='flex items-center gap-6 text-sm font-medium text-blue-900'>
            <Link className='transition hover:text-blue-600' href='#product'>
              Product
            </Link>
            <Link className='transition hover:text-blue-600' href='#domains'>
              Domains
            </Link>
            <Link className='transition hover:text-blue-600' href='#powered'>
              Powered by Sarafrika
            </Link>
            <LoginButton />
          </div>
        </div>
      </nav>

      <main>
        <section className='relative overflow-hidden border-b border-blue-100/60'>
          <div className='absolute inset-0 -z-10 bg-gradient-to-br from-blue-900/10 via-blue-500/10 to-blue-100/40'></div>
          <div className='absolute -left-24 top-32 h-64 w-64 rounded-full bg-blue-400/40 blur-3xl'></div>
          <div className='absolute -right-20 bottom-10 h-64 w-64 rounded-full bg-indigo-300/40 blur-3xl'></div>

          <div className='relative mx-auto flex w-full max-w-6xl flex-col items-center gap-10 px-6 pb-24 pt-24 text-center lg:pt-28'>
            <span className='inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-blue-700 shadow-sm'>
              Product experience
            </span>
            <h1 className='max-w-4xl text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl lg:text-[56px]'>
              Elimika is the home of orchestrated learning experiences for Africa&rsquo;s creators and institutions.
            </h1>
            <p className='max-w-3xl text-base text-slate-600 sm:text-lg'>
              A product suite born from the Elimika mark—layered gradients, confident geometry, and purposeful flows—designed to elevate every learning journey.
            </p>
            <div className='flex flex-col gap-4 sm:flex-row'>
              <LoginButton />
              <Link
                href='#product'
                className='inline-flex items-center justify-center gap-2 rounded-full border border-blue-200 bg-white px-7 py-3 text-sm font-medium text-blue-700 shadow hover:border-blue-400 hover:text-blue-900'
              >
                Explore the product <ArrowRight className='h-4 w-4' />
              </Link>
            </div>

            <div className='flex flex-col items-center gap-4 rounded-[36px] border border-white/80 bg-white/60 px-6 py-6 shadow-lg shadow-blue-200/50 backdrop-blur-sm sm:px-10 sm:py-8'>
              <p className='text-xs font-semibold uppercase tracking-[0.4em] text-blue-600'>Domains harmonised</p>
              <div className='grid gap-4 text-sm font-medium text-blue-900 sm:grid-cols-4'>
                {['Course creators', 'Instructors', 'Organisations', 'Learners'].map(item => (
                  <span key={item} className='rounded-full border border-blue-200 bg-blue-50 px-4 py-2'>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id='product' className='bg-white py-20'>
          <div className='mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 lg:flex-row lg:items-center'>
            <div className='flex-1 space-y-5'>
              <span className='inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-blue-700'>
                Crafted for Elimika
              </span>
              <h2 className='text-3xl font-semibold text-slate-900 sm:text-4xl'>
                A product language shaped by the Elimika blossom
              </h2>
              <p className='text-base text-slate-600'>
                Each surface reflects the petals of the Elimika emblem—layered gradients, confident shapes, and calm whitespaces—making complex learning journeys feel effortless.
              </p>
              <div className='grid gap-4 sm:grid-cols-2'>
                <FeatureBadge label='Guided course creation' />
                <FeatureBadge label='Real-time analytics narratives' />
                <FeatureBadge label='Institution-ready governance' />
                <FeatureBadge label='Immersive learner journeys' />
              </div>
            </div>

            <div className='flex-1 rounded-[32px] border border-blue-200/60 bg-gradient-to-br from-white via-blue-50 to-blue-100 p-8 shadow-xl shadow-blue-200/40'>
              <p className='text-sm font-semibold text-blue-800'>What our partners say</p>
              <blockquote className='mt-3 text-base text-slate-600'>
                “Elimika is where storytelling meets infrastructure. The product honours our brand while giving our teams the clarity they need to scale.”
              </blockquote>
              <div className='mt-6 flex items-center gap-3'>
                <div className='rounded-full bg-blue-200 p-2'>
                  <Sparkles className='h-4 w-4 text-blue-700' />
                </div>
                <div>
                  <p className='text-sm font-semibold text-slate-900'>Sarafrika Product Studio</p>
                  <p className='text-xs text-slate-500'>Design & engineering partner</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id='domains' className='border-y border-blue-100 bg-blue-50/60 py-20'>
          <div className='mx-auto w-full max-w-6xl px-6'>
            <div className='mb-12 text-center'>
              <p className='text-xs font-semibold uppercase tracking-[0.4em] text-blue-700'>Product pillars</p>
              <h2 className='mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl'>
                The Elimika platform at a glance
              </h2>
            </div>

            <div className='grid gap-6 md:grid-cols-3'>
              {productHighlights.map(feature => {
                const Icon = feature.icon;
                return (
                  <article
                    key={feature.title}
                    className='group rounded-[28px] border border-blue-200 bg-white/90 p-6 shadow-lg shadow-blue-200/30 transition hover:-translate-y-1 hover:border-blue-400/70'
                  >
                    <div className='mb-5 inline-flex items-center justify-center rounded-full bg-blue-500/15 p-3 text-blue-700'>
                      <Icon className='h-5 w-5' />
                    </div>
                    <h3 className='mb-3 text-lg font-semibold text-slate-900'>{feature.title}</h3>
                    <p className='text-sm leading-6 text-slate-600'>{feature.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id='powered' className='bg-white py-20'>
          <div className='mx-auto grid w-full max-w-6xl gap-10 px-6 md:grid-cols-[1.1fr_0.9fr] md:items-center'>
            <div className='space-y-5'>
              <p className='inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-blue-700'>
                Powered by Sarafrika
              </p>
              <h2 className='text-3xl font-semibold text-slate-900 sm:text-4xl'>
                Product craftsmanship by Sarafrika, inspired by the Elimika emblem
              </h2>
              <p className='text-base text-slate-600'>
                Sarafrika&rsquo;s product studios steward Elimika&rsquo;s vision—from interface language to enabling technology—embedding sustainable design and engineering across every release.
              </p>
              <ul className='space-y-3 text-sm text-slate-600'>
                {[
                  'Unified design tokens capture the gradient language of the Elimika bloom.',
                  'Inclusive typography and colour ensure accessibility without diluting brand character.',
                  'Scalable architecture supports institutions, educators, and lifelong learners alike.',
                ].map(point => (
                  <li key={point} className='flex items-start gap-3'>
                    <div className='mt-1 size-2 rounded-full bg-blue-500'></div>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className='flex flex-col items-center gap-6 rounded-[32px] border border-blue-200/60 bg-gradient-to-br from-white via-blue-50 to-blue-100 p-8 shadow-xl shadow-blue-200/40'>
              <Image
                alt='Sarafrika logo'
                src='/logos/sarafrika/Sarafrika Logo-02.svg'
                width={180}
                height={48}
                className='h-12 w-auto'
              />
              <p className='text-sm text-slate-600 text-center'>
                “Together, Elimika and Sarafrika celebrate African ingenuity—building a product ecosystem where talent thrives, organisations transform, and learners flourish.”
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className='border-t border-blue-100/80 bg-white/90 py-10'>
        <div className='mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-4'>
            <Image
              alt='Elimika mark'
              src='/logos/elimika/Elimika Logo Design-03.svg'
              width={192}
              height={60}
              className='h-12 w-auto'
            />
            <Image
              alt='Sarafrika mark'
              src='/logos/sarafrika/Sarafrika Logo-03.svg'
              width={192}
              height={60}
              className='h-12 w-auto'
            />
          </div>
          <div className='text-xs text-slate-500'>
            {'@copy;'} {currentYear} Sarafrika. Elimika is owned and copyrighted by Sarafrika.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureBadge({ label }: { label: string }) {
  return (
    <div className='rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-semibold text-blue-700'>
      {label}
    </div>
  );
}
