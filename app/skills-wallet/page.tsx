'use client';

import { PublicTopNav } from '@/components/PublicTopNav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { HelpSection, SkillsFundSection } from '@/components/PublicSections';
import Image from 'next/image';
import Link from 'next/link';

const featureCards = [
  {
    title: 'Skills Card',
    description:
      'Upload, verify, and showcase your skills in one place—portable, lifelong skills identity.',
  },
  {
    title: 'Employer Access',
    description:
      'Share verified skills with employers instantly to reduce hiring risk and recruit faster.',
  },
  {
    title: 'Student Growth',
    description:
      'Track learning progress from school to workplace with a continuous skills record.',
  },
  {
    title: 'Skills Fund',
    description: 'Access scholarships, bursaries, and training support directly from your wallet.',
  },
  {
    title: 'Courses',
    description:
      'Spend on approved training or upskilling programs and switch careers as industries change.',
  },
];

const personas = [
  { label: 'Students', copy: 'Build a verified record of your learning from early years.' },
  { label: 'Professionals', copy: 'Showcase career milestones, certifications, and growth.' },
  { label: 'Schools & Colleges', copy: 'Manage student growth beyond the classroom.' },
  {
    label: 'Training providers',
    copy: 'Reliable funding, instant payments, and transparent accreditation.',
  },
];

const testimonials = [
  {
    quote:
      'Elimika Skills Wallet helped me land my first internship because employers could instantly verify my coding certificates.',
    name: 'Mary',
    role: 'Student',
  },
];

export default function SkillsWalletPage() {
  return (
    <div className='bg-background text-foreground min-h-screen'>
      <PublicTopNav />
      <main className='mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-12 lg:py-16'>
        <Hero />
        <WhatIs />
        <Features />
        <SkillsFundSection />
        <Employers />
        <Personas />
        <HelpSection />
        <Testimonials />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className='grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center'>
      <div className='space-y-6'>
        <Badge
          variant='outline'
          className='border-primary/40 bg-primary/10 text-primary rounded-full'
        >
          Universal Skills Wallet
        </Badge>
        <div className='space-y-4'>
          <h1 className='text-4xl leading-tight font-semibold sm:text-5xl lg:text-[52px]'>
            Your Skills. Your Future. Your Wallet.
          </h1>
          <p className='text-muted-foreground text-base sm:text-lg'>
            Store, showcase, and share your skills securely with Elimika Skills Wallet – a digital
            passport for education, training, and work opportunities.
          </p>
        </div>
        <div className='flex flex-wrap gap-3'>
          <Button size='lg' className='rounded-full px-6'>
            Create Your Skills Wallet
          </Button>
          <Button variant='outline' size='lg' className='rounded-full px-6' asChild>
            <Link href='/courses'>Browse Courses</Link>
          </Button>
        </div>
      </div>
      <div className='border-border/60 bg-card relative overflow-hidden rounded-[32px] border shadow-xl'>
        <Image
          src='/assets/illustration.jpg'
          alt='Digital wallet illustration'
          width={800}
          height={600}
          className='h-full w-full object-cover'
        />
      </div>
    </section>
  );
}

function WhatIs() {
  return (
    <section className='grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center'>
      <div className='space-y-4'>
        <p className='text-primary text-sm font-semibold'>What is Elimika Skills Wallet?</p>
        <h2 className='text-3xl font-semibold sm:text-4xl'>
          A secure, portable record of everything you know
        </h2>
        <p className='text-muted-foreground text-base'>
          Skills Wallet is a secure digital platform that records and validates your skills,
          certificates, and experiences. Whether you’re a student, professional, or employer, Skills
          Wallet makes learning and employment smarter and more connected.
        </p>
      </div>
      <div className='border-border/60 bg-muted/50 relative overflow-hidden rounded-[32px] border p-8 shadow-lg'>
        <div className='text-muted-foreground space-y-4 text-sm'>
          <div className='border-border/60 bg-background rounded-2xl border p-4 shadow-sm'>
            <p className='text-primary text-xs font-semibold tracking-[0.3em] uppercase'>
              Two parts
            </p>
            <p className='text-foreground mt-2 text-sm font-semibold'>Skills Card / Passport</p>
            <p className='mt-1'>
              Store formal education certificates, vocational training, micro-credentials, work
              experience, and informal learning achievements with verifiable credentials.
            </p>
          </div>
          <div className='border-border/60 bg-background rounded-2xl border p-4 shadow-sm'>
            <p className='text-foreground text-sm font-semibold'>Skills Funding / Credits</p>
            <p className='mt-1'>
              Hold learning credits from guardians, employers, or donors to spend on approved
              training or upskilling programs throughout life.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className='space-y-6'>
      <div className='space-y-2 text-center'>
        <p className='text-primary text-xs font-semibold tracking-[0.4em] uppercase'>
          Key Features
        </p>
        <h2 className='text-3xl font-semibold sm:text-4xl'>
          Built for trust, mobility, and opportunity
        </h2>
      </div>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {featureCards.map(card => (
          <Card
            key={card.title}
            className='border-border/60 bg-card/90 h-full rounded-[24px] border shadow-sm'
          >
            <CardHeader className='space-y-2'>
              <CardTitle className='text-lg font-semibold'>{card.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground text-sm'>{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function SkillsFund() {
  return (
    <section
      id='skills-fund'
      className='border-border/70 bg-primary/10 shadow-primary/10 rounded-[32px] border p-8 shadow-lg'
    >
      <div className='flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'>
        <div className='space-y-3'>
          <p className='text-primary text-xs font-semibold tracking-[0.3em] uppercase'>
            Skills Fund
          </p>
          <h2 className='text-foreground text-3xl font-semibold sm:text-4xl'>
            Invest in Your Future
          </h2>
          <p className='text-muted-foreground max-w-2xl text-base'>
            The Skills Fund connects learners with funding for training, apprenticeships,
            scholarships, workshops, and courses. Employers and families can contribute and track
            skills investment ROI.
          </p>
        </div>
        <div className='flex flex-wrap gap-3'>
          <Button size='lg' className='rounded-full px-6'>
            Apply for Skills Fund
          </Button>
          <Button size='lg' variant='outline' className='rounded-full px-6'>
            Fund Student
          </Button>
        </div>
      </div>
    </section>
  );
}

function Employers() {
  return (
    <section id='employers' className='grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center'>
      <div className='border-border/60 bg-card relative overflow-hidden rounded-[32px] border shadow-lg'>
        <div className='from-primary/10 via-muted to-primary/5 aspect-[16/9] w-full bg-gradient-to-br' />
        <div className='absolute inset-0 flex items-center justify-center'>
          <div className='border-border/60 bg-background/80 text-muted-foreground rounded-2xl border px-6 py-4 text-sm shadow-sm backdrop-blur'>
            Employer dashboard preview
          </div>
        </div>
      </div>
      <div className='space-y-4'>
        <p className='text-primary text-sm font-semibold'>For Employers</p>
        <h2 className='text-3xl font-semibold sm:text-4xl'>Hire Smarter with Verified Skills</h2>
        <p className='text-muted-foreground text-base'>
          Skills Wallet gives employers instant access to authentic candidate skill profiles,
          reducing hiring risks and ensuring the right talent fit. Organisations can fund students
          and employees to spend on approved courses or upskilling programs.
        </p>
        <div className='flex flex-wrap gap-3'>
          <Button size='lg' className='rounded-full px-6'>
            Search Talent
          </Button>
          <Button size='lg' variant='outline' className='rounded-full px-6'>
            Fund Students
          </Button>
        </div>
      </div>
    </section>
  );
}

function Personas() {
  return (
    <section className='space-y-6'>
      <div className='space-y-2 text-center'>
        <p className='text-primary text-xs font-semibold tracking-[0.4em] uppercase'>
          For everyone
        </p>
        <h2 className='text-3xl font-semibold sm:text-4xl'>
          Students, professionals, and institutions
        </h2>
      </div>
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {personas.map(persona => (
          <Card
            key={persona.label}
            className='border-border/60 bg-card h-full rounded-[24px] border shadow-sm'
          >
            <CardHeader className='space-y-2'>
              <CardTitle className='text-lg font-semibold'>{persona.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground text-sm'>{persona.copy}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className='space-y-6'>
      <div className='space-y-2 text-center'>
        <p className='text-primary text-xs font-semibold tracking-[0.4em] uppercase'>
          Testimonials
        </p>
        <h2 className='text-3xl font-semibold sm:text-4xl'>Stories from our learners</h2>
      </div>
      <div className='grid gap-4 md:grid-cols-2'>
        {testimonials.map(item => (
          <Card
            key={item.name}
            className='border-border/60 bg-card rounded-[24px] border shadow-sm'
          >
            <CardContent className='space-y-3 p-6'>
              <p className='text-foreground text-base'>&ldquo;{item.quote}&rdquo;</p>
              <p className='text-primary text-sm font-semibold'>{item.name}</p>
              <p className='text-muted-foreground text-xs'>{item.role}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className='border-border/70 bg-primary/10 shadow-primary/10 rounded-[32px] border p-10 text-center shadow-lg'>
      <div className='space-y-4'>
        <h3 className='text-foreground text-3xl font-semibold sm:text-4xl'>
          Join thousands building their future with Skills Wallet today.
        </h3>
        <Button size='lg' className='rounded-full px-8'>
          Sign Up Now
        </Button>
      </div>
    </section>
  );
}

function Footer() {
  const links = [
    'Home',
    'Courses',
    'Skills Fund',
    'Opportunities',
    'Instructors',
    'Help',
    'Contact',
  ];
  return (
    <footer className='border-border/60 bg-card/60 mt-12 border-t'>
      <div className='mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 lg:flex-row lg:items-center lg:justify-between'>
        <div className='space-y-2'>
          <p className='text-foreground text-base font-semibold'>Elimika Skills Wallet</p>
          <p className='text-muted-foreground text-sm'>
            Universal skills passport for learning and work.
          </p>
        </div>
        <div className='flex flex-wrap gap-3'>
          {links.map(link => (
            <Button key={link} variant='ghost' size='sm' className='text-muted-foreground text-sm'>
              {link}
            </Button>
          ))}
        </div>
      </div>
      <Separator />
      <div className='text-muted-foreground mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 text-xs'>
        <span>Support</span>
        <span>© Skills Wallet</span>
      </div>
    </footer>
  );
}
