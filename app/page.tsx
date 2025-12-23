import LoginButton from '@/components/LoginButton';
import { PublicTopNav } from '@/components/PublicTopNav';
import { BrandPill } from '@/components/ui/brand-pill';
import { ArrowRight, BookOpenCheck, GraduationCap, LayoutDashboard, Sparkles, Briefcase, FolderOpen, DollarSign, BookOpen, Users, Building2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

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
    <div className='bg-background text-foreground relative min-h-screen overflow-hidden'>
      <PublicTopNav />

      <main>
        <section className='border-border/50 relative overflow-hidden border-b'>
          <div className='relative mx-auto flex w-full max-w-6xl flex-col items-center gap-10 px-6 pt-24 pb-24 text-center lg:pt-28'>
            <span className='border-border/60 bg-card/80 text-primary inline-flex items-center gap-2 rounded-full border px-4 py-1 text-xs font-semibold tracking-[0.4em] uppercase shadow-sm'>
              Product experience
            </span>
            <h1 className='text-foreground max-w-4xl text-4xl leading-tight font-semibold text-balance sm:text-5xl lg:text-[56px]'>
              Elimika is the home of orchestrated learning experiences for Africa&rsquo;s creators
              and institutions.
            </h1>
            <p className='text-muted-foreground max-w-3xl text-base sm:text-lg'>
              A product suite born from the Elimika mark—layered gradients, confident geometry, and
              purposeful flows—designed to elevate every learning journey.
            </p>
            <div className='flex flex-col items-center gap-4 sm:flex-row'>
              <LoginButton />
              <Link
                href='/courses'
                className='border-primary/50 bg-primary/10 text-primary hover:border-primary/70 inline-flex items-center justify-center gap-2 rounded-full border px-7 py-3 text-sm font-semibold shadow'
              >
                Browse courses <ArrowRight className='h-4 w-4' />
              </Link>
              <Link
                href='#product'
                className='border-border bg-card text-primary hover:border-primary/60 hover:text-primary inline-flex items-center justify-center gap-2 rounded-full border px-7 py-3 text-sm font-medium shadow'
              >
                Explore the product <ArrowRight className='h-4 w-4' />
              </Link>
            </div>

            <div className='border-border/60 bg-card/70 flex flex-col items-center gap-4 rounded-[36px] border px-6 py-6 shadow-lg shadow-black/5 backdrop-blur-sm sm:px-10 sm:py-8'>
              <p className='text-primary text-xs font-semibold tracking-[0.4em] uppercase'>
                Domains harmonised
              </p>
              <div className='text-muted-foreground grid gap-4 text-sm font-medium sm:grid-cols-4'>
                {domainLabels.map(label => (
                  <BrandPill
                    key={label}
                    className='justify-center text-xs font-semibold tracking-[0.2em] normal-case'
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
              <p className='text-primary text-sm font-semibold'>Crafted for orchestrators</p>
              <h2 className='text-foreground text-3xl font-semibold sm:text-4xl'>
                Purpose-built for creators, instructors, organisations, and learners
              </h2>
              <p className='text-muted-foreground text-base'>
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

            <div className='border-border/60 bg-card/80 flex-1 rounded-[32px] border p-8 shadow-xl shadow-black/10'>
              <p className='text-primary text-sm font-semibold'>What our partners say</p>
              <blockquote className='text-muted-foreground mt-3 text-base'>
                “Elimika is where storytelling meets infrastructure. The product honours our brand
                while giving our teams the clarity they need to scale.”
              </blockquote>
              <div className='mt-6 flex items-center gap-3'>
                <div className='bg-primary/15 rounded-full p-2'>
                  <Sparkles className='text-primary h-4 w-4' />
                </div>
                <div>
                  <p className='text-foreground text-sm font-semibold'>Sarafrika Product Studio</p>
                  <p className='text-muted-foreground text-xs'>Design & engineering partner</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id='domains' className='border-border/60 bg-background/70 border-y py-20'>
          <div className='mx-auto w-full max-w-6xl px-6'>
            <div className='mb-12 text-center'>
              <p className='text-primary text-xs font-semibold tracking-[0.4em] uppercase'>
                Product pillars
              </p>
              <h2 className='text-foreground mt-3 text-3xl font-semibold sm:text-4xl'>
                The Elimika platform at a glance
              </h2>
            </div>

            <div className='grid gap-6 md:grid-cols-3'>
              {productHighlights.map(feature => {
                const Icon = feature.icon;
                return (
                  <article
                    key={feature.title}
                    className='group border-border bg-card/90 hover:border-primary/60 rounded-[28px] border p-6 shadow-lg shadow-black/10 transition hover:-translate-y-1'
                  >
                    <div className='bg-primary/15 text-primary mb-5 inline-flex items-center justify-center rounded-full p-3'>
                      <Icon className='h-5 w-5' />
                    </div>
                    <h3 className='text-foreground mb-3 text-lg font-semibold'>{feature.title}</h3>
                    <p className='text-muted-foreground text-sm leading-6'>{feature.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id='skills-wallet' className='bg-background/80 py-20'>
          <div className='mx-auto grid w-full max-w-6xl gap-10 px-6 md:grid-cols-2 md:items-center'>
            <div className='space-y-5'>
              <h2 className='text-foreground text-3xl font-semibold sm:text-4xl'>
                What is Skills Wallet?
              </h2>
              <p className='text-muted-foreground text-base'>
                Skills Wallet is a secure digital platform that records and validates your skills, certificates, and experiences. Whether you&rsquo;re a student, professional, or employer, Skills Wallet makes learning and employment smarter and more connected.
              </p>
              <Link
                href='/skills-wallet'
                className='border-primary bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center gap-2 rounded-full border px-7 py-3 text-sm font-semibold shadow-lg'
              >
                Create Your Skills Wallet <ArrowRight className='h-4 w-4' />
              </Link>
            </div>

            <div className='border-border/60 bg-card/80 rounded-[32px] border p-8 shadow-xl shadow-black/10'>
              <div className='bg-primary/5 flex aspect-video items-center justify-center rounded-[24px]'>
                <FolderOpen className='text-primary/20 h-24 w-24' />
              </div>
            </div>
          </div>
        </section>

        <section id='key-features' className='border-border/60 bg-background/70 border-y py-20'>
          <div className='mx-auto w-full max-w-6xl px-6'>
            <div className='mb-12 text-center'>
              <h2 className='text-foreground text-3xl font-semibold sm:text-4xl'>
                Key Features
              </h2>
            </div>

            <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-2'>
              <article className='group border-border bg-card/90 hover:border-primary/60 rounded-[28px] border p-6 shadow-lg shadow-black/10 transition hover:-translate-y-1'>
                <div className='bg-primary/15 text-primary mb-5 inline-flex items-center justify-center rounded-full p-3'>
                  <FolderOpen className='h-5 w-5' />
                </div>
                <h3 className='text-foreground mb-3 text-lg font-semibold'>Skills Portfolio</h3>
                <p className='text-muted-foreground text-sm leading-6'>
                  Upload, verify, and showcase your skills in one place.
                </p>
              </article>

              <article className='group border-border bg-card/90 hover:border-primary/60 rounded-[28px] border p-6 shadow-lg shadow-black/10 transition hover:-translate-y-1'>
                <div className='bg-primary/15 text-primary mb-5 inline-flex items-center justify-center rounded-full p-3'>
                  <Briefcase className='h-5 w-5' />
                </div>
                <h3 className='text-foreground mb-3 text-lg font-semibold'>Employer Access</h3>
                <p className='text-muted-foreground text-sm leading-6'>
                  Share your verified skills with employers instantly
                </p>
              </article>

              <article className='group border-border bg-card/90 hover:border-primary/60 rounded-[28px] border p-6 shadow-lg shadow-black/10 transition hover:-translate-y-1'>
                <div className='bg-primary/15 text-primary mb-5 inline-flex items-center justify-center rounded-full p-3'>
                  <GraduationCap className='h-5 w-5' />
                </div>
                <h3 className='text-foreground mb-3 text-lg font-semibold'>Student Growth</h3>
                <p className='text-muted-foreground text-sm leading-6'>
                  Track learning progress from school to workplace
                </p>
              </article>

              <article className='group border-border bg-card/90 hover:border-primary/60 rounded-[28px] border p-6 shadow-lg shadow-black/10 transition hover:-translate-y-1'>
                <div className='bg-primary/15 text-primary mb-5 inline-flex items-center justify-center rounded-full p-3'>
                  <DollarSign className='h-5 w-5' />
                </div>
                <h3 className='text-foreground mb-3 text-lg font-semibold'>Skills Fund</h3>
                <p className='text-muted-foreground text-sm leading-6'>
                  Access scholarships, bursaries, and training support
                </p>
              </article>
            </div>
          </div>
        </section>

        <section id='skills-fund' className='bg-background py-20'>
          <div className='mx-auto w-full max-w-6xl px-6'>
            <div className='border-border/60 bg-card/80 rounded-[36px] border p-10 shadow-xl shadow-black/10 md:p-14'>
              <div className='mb-8 flex flex-wrap items-center justify-center gap-4'>
                <BrandPill className='text-xs font-semibold tracking-[0.2em]'>
                  Fund
                </BrandPill>
                <BrandPill className='text-xs font-semibold tracking-[0.2em]'>
                  Student
                </BrandPill>
                <BrandPill className='text-xs font-semibold tracking-[0.2em]'>
                  Courses
                </BrandPill>
                <BrandPill className='text-xs font-semibold tracking-[0.2em]'>
                  Opportunities
                </BrandPill>
              </div>

              <div className='space-y-6 text-center'>
                <h2 className='text-foreground text-3xl font-semibold sm:text-4xl'>
                  Invest in Your Future
                </h2>
                <p className='text-muted-foreground mx-auto max-w-3xl text-base'>
                  The Skills Fund empowers learners by connecting them with funding opportunities for training, workshops, and courses. Employers can also contribute to support skill development.
                </p>

                <div className='flex flex-col items-center gap-4 pt-4 sm:flex-row sm:justify-center'>
                  <Link
                    href='/skills-fund/apply'
                    className='border-border bg-card text-foreground hover:border-primary/60 hover:bg-card/80 inline-flex items-center justify-center gap-2 rounded-full border px-7 py-3 text-sm font-semibold shadow-lg'
                  >
                    Apply for Skills Fund
                  </Link>
                  <Link
                    href='/skills-fund/contribute'
                    className='border-border bg-card text-foreground hover:border-primary/60 hover:bg-card/80 inline-flex items-center justify-center gap-2 rounded-full border px-7 py-3 text-sm font-semibold shadow-lg'
                  >
                    Fund Student
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id='for-everyone' className='border-border/60 bg-background/70 border-y py-20'>
          <div className='mx-auto w-full max-w-6xl px-6'>
            <div className='grid gap-8 md:grid-cols-3'>
              <div className='border-border bg-card/90 rounded-[28px] border p-8 shadow-lg shadow-black/10'>
                <div className='bg-primary/15 text-primary mb-6 inline-flex items-center justify-center rounded-full p-4'>
                  <GraduationCap className='h-6 w-6' />
                </div>
                <h3 className='text-foreground mb-4 text-xl font-semibold'>For Students</h3>
                <p className='text-muted-foreground text-sm leading-6'>
                  Build a verified record of achievements, skills, and certificates to showcase your learning and work opportunities.
                </p>
              </div>

              <div className='border-border bg-card/90 rounded-[28px] border p-8 shadow-lg shadow-black/10'>
                <div className='bg-primary/15 text-primary mb-6 inline-flex items-center justify-center rounded-full p-4'>
                  <Briefcase className='h-6 w-6' />
                </div>
                <h3 className='text-foreground mb-4 text-xl font-semibold'>For Professionals</h3>
                <p className='text-muted-foreground text-sm leading-6'>
                  Showcase career milestones, skills development, and professional achievements to employers and peers.
                </p>
              </div>

              <div className='border-border bg-card/90 rounded-[28px] border p-8 shadow-lg shadow-black/10'>
                <div className='bg-primary/15 text-primary mb-6 inline-flex items-center justify-center rounded-full p-4'>
                  <Building2 className='h-6 w-6' />
                </div>
                <h3 className='text-foreground mb-4 text-xl font-semibold'>For Schools & Colleges</h3>
                <p className='text-muted-foreground text-sm leading-6'>
                  Manage student growth, track achievements, and provide verifiable credentials that follow learners throughout their careers.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id='powered' className='bg-background py-20'>
          <div className='mx-auto grid w-full max-w-6xl gap-10 px-6 md:grid-cols-[1.1fr_0.9fr] md:items-center'>
            <div className='space-y-5'>
              <p className='border-border bg-secondary/60 text-primary inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.4em] uppercase'>
                Powered by Sarafrika
              </p>
              <h2 className='text-foreground text-3xl font-semibold sm:text-4xl'>
                Product craftsmanship by Sarafrika, inspired by the Elimika emblem
              </h2>
              <p className='text-muted-foreground text-base'>
                Sarafrika&rsquo;s product studios steward Elimika&rsquo;s vision—from interface
                language to enabling technology—embedding sustainable design and engineering across
                every release.
              </p>
              <ul className='text-muted-foreground space-y-3 text-sm'>
                {sarafrikaPoints.map(point => (
                  <li key={point} className='flex items-start gap-3'>
                    <div className='bg-primary mt-1 size-2 rounded-full' />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className='border-border/60 bg-card/80 flex flex-col items-center gap-6 rounded-[32px] border p-8 shadow-xl shadow-black/10'>
              <div className='flex items-center justify-center gap-3'>
                <Image
                  alt='Sarafrika logo'
                  src='/logos/sarafrika/Sarafrika Logo-02.svg'
                  width={180}
                  height={48}
                  className='h-12 w-auto dark:hidden'
                />
                <Image
                  alt='Sarafrika logo in white'
                  src='/logos/sarafrika/Sarafrika Logo-05.svg'
                  width={180}
                  height={48}
                  className='hidden h-12 w-auto dark:block'
                />
              </div>
              <p className='text-muted-foreground text-center text-sm'>
                "Together, Elimika and Sarafrika celebrate African ingenuity—building a product
                ecosystem where talent thrives, organisations transform, and learners flourish."
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className='border-border/60 bg-card/80 border-t py-10'>
        <div className='mx-auto flex w-full max-w-6xl justify-center px-6'>
          <div className='text-muted-foreground text-xs'>
            {'\u00A9'} {currentYear} Sarafrika. Elimika is owned and copyrighted by Sarafrika.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureBadge({ label }: { label: string }) {
  return (
    <div className='border-border bg-card/80 text-primary rounded-full border px-4 py-2 text-xs font-semibold shadow-sm'>
      {label}
    </div>
  );
}
