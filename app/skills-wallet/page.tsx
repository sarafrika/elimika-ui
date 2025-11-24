'use client';

import { PublicTopNav } from '@/components/PublicTopNav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

const featureCards = [
  {
    title: 'Skills Card',
    description: 'Upload, verify, and showcase your skills in one place—portable, lifelong skills identity.',
  },
  {
    title: 'Employer Access',
    description: 'Share verified skills with employers instantly to reduce hiring risk and recruit faster.',
  },
  {
    title: 'Student Growth',
    description: 'Track learning progress from school to workplace with a continuous skills record.',
  },
  {
    title: 'Skills Fund',
    description: 'Access scholarships, bursaries, and training support directly from your wallet.',
  },
  {
    title: 'Courses',
    description: 'Spend on approved training or upskilling programs and switch careers as industries change.',
  },
];

const personas = [
  { label: 'Students', copy: 'Build a verified record of your learning from early years.' },
  { label: 'Professionals', copy: 'Showcase career milestones, certifications, and growth.' },
  { label: 'Schools & Colleges', copy: 'Manage student growth beyond the classroom.' },
  { label: 'Training providers', copy: 'Reliable funding, instant payments, and transparent accreditation.' },
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
    <div className='min-h-screen bg-background text-foreground'>
      <PublicTopNav />
      <main className='mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-12 lg:py-16'>
        <Hero />
        <WhatIs />
        <Features />
        <SkillsFund />
        <Employers />
        <Personas />
        <Opportunities />
        <Help />
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
        <Badge variant='outline' className='rounded-full border-primary/40 bg-primary/10 text-primary'>
          Universal Skills Wallet
        </Badge>
        <div className='space-y-4'>
          <h1 className='text-4xl font-semibold leading-tight sm:text-5xl lg:text-[52px]'>
            Your Skills. Your Future. Your Wallet.
          </h1>
          <p className='text-base text-muted-foreground sm:text-lg'>
            Store, showcase, and share your skills securely with Elimika Skills Wallet – a digital passport
            for education, training, and work opportunities.
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
      <div className='relative overflow-hidden rounded-[32px] border border-border/60 bg-card shadow-xl'>
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
        <p className='text-sm font-semibold text-primary'>What is Elimika Skills Wallet?</p>
        <h2 className='text-3xl font-semibold sm:text-4xl'>A secure, portable record of everything you know</h2>
        <p className='text-base text-muted-foreground'>
          Skills Wallet is a secure digital platform that records and validates your skills, certificates, and
          experiences. Whether you’re a student, professional, or employer, Skills Wallet makes learning and employment
          smarter and more connected.
        </p>
      </div>
      <div className='relative overflow-hidden rounded-[32px] border border-border/60 bg-muted/50 p-8 shadow-lg'>
        <div className='space-y-4 text-sm text-muted-foreground'>
          <div className='rounded-2xl border border-border/60 bg-background p-4 shadow-sm'>
            <p className='text-xs font-semibold uppercase tracking-[0.3em] text-primary'>Two parts</p>
            <p className='mt-2 text-sm text-foreground font-semibold'>Skills Card / Passport</p>
            <p className='mt-1'>
              Store formal education certificates, vocational training, micro-credentials, work experience, and informal learning
              achievements with verifiable credentials.
            </p>
          </div>
          <div className='rounded-2xl border border-border/60 bg-background p-4 shadow-sm'>
            <p className='text-sm text-foreground font-semibold'>Skills Funding / Credits</p>
            <p className='mt-1'>
              Hold learning credits from guardians, employers, or donors to spend on approved training or upskilling programs
              throughout life.
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
        <p className='text-xs font-semibold uppercase tracking-[0.4em] text-primary'>Key Features</p>
        <h2 className='text-3xl font-semibold sm:text-4xl'>Built for trust, mobility, and opportunity</h2>
      </div>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {featureCards.map(card => (
          <Card key={card.title} className='h-full rounded-[24px] border border-border/60 bg-card/90 shadow-sm'>
            <CardHeader className='space-y-2'>
              <CardTitle className='text-lg font-semibold'>{card.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-muted-foreground'>{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function SkillsFund() {
  return (
    <section id='skills-fund' className='rounded-[32px] border border-border/70 bg-primary/10 p-8 shadow-lg shadow-primary/10'>
      <div className='flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'>
        <div className='space-y-3'>
          <p className='text-xs font-semibold uppercase tracking-[0.3em] text-primary'>Skills Fund</p>
          <h2 className='text-3xl font-semibold text-foreground sm:text-4xl'>Invest in Your Future</h2>
          <p className='max-w-2xl text-base text-muted-foreground'>
            The Skills Fund connects learners with funding for training, apprenticeships, scholarships, workshops, and courses.
            Employers and families can contribute and track skills investment ROI.
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
      <div className='relative overflow-hidden rounded-[32px] border border-border/60 bg-card shadow-lg'>
        <div className='aspect-[16/9] w-full bg-gradient-to-br from-primary/10 via-muted to-primary/5' />
        <div className='absolute inset-0 flex items-center justify-center'>
          <div className='rounded-2xl border border-border/60 bg-background/80 px-6 py-4 text-sm text-muted-foreground shadow-sm backdrop-blur'>
            Employer dashboard preview
          </div>
        </div>
      </div>
      <div className='space-y-4'>
        <p className='text-sm font-semibold text-primary'>For Employers</p>
        <h2 className='text-3xl font-semibold sm:text-4xl'>Hire Smarter with Verified Skills</h2>
        <p className='text-base text-muted-foreground'>
          Skills Wallet gives employers instant access to authentic candidate skill profiles, reducing hiring risks and ensuring the right talent fit.
          Organisations can fund students and employees to spend on approved courses or upskilling programs.
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
        <p className='text-xs font-semibold uppercase tracking-[0.4em] text-primary'>For everyone</p>
        <h2 className='text-3xl font-semibold sm:text-4xl'>Students, professionals, and institutions</h2>
      </div>
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {personas.map(persona => (
          <Card key={persona.label} className='h-full rounded-[24px] border border-border/60 bg-card shadow-sm'>
            <CardHeader className='space-y-2'>
              <CardTitle className='text-lg font-semibold'>{persona.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-muted-foreground'>{persona.copy}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function Opportunities() {
  return (
    <section id='opportunities' className='space-y-6'>
      <div className='space-y-2 text-center'>
        <p className='text-xs font-semibold uppercase tracking-[0.4em] text-primary'>Opportunities</p>
        <h2 className='text-3xl font-semibold sm:text-4xl'>Unlock jobs and learning offers</h2>
        <p className='text-base text-muted-foreground max-w-3xl mx-auto'>
          Access jobs and consultancy opportunities that match your verified skills. Discover offers from employers and funders without
          talent maps—just direct, relevant matches based on your profile.
        </p>
      </div>
      <div className='grid gap-4 md:grid-cols-2'>
        <Card className='rounded-[24px] border border-border/60 bg-card shadow-sm'>
          <CardHeader>
            <CardTitle className='text-lg font-semibold'>Job matches</CardTitle>
            <CardDescription className='text-muted-foreground'>
              Get notified when roles align with your verified skills and credentials.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant='outline' className='rounded-full'>
              Search openings
            </Button>
          </CardContent>
        </Card>
        <Card className='rounded-[24px] border border-border/60 bg-card shadow-sm'>
          <CardHeader>
            <CardTitle className='text-lg font-semibold'>Learning offers</CardTitle>
            <CardDescription className='text-muted-foreground'>
              Explore scholarships, bursaries, and employer-funded upskilling programs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant='outline' className='rounded-full'>
              View offers
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function Help() {
  return (
    <section id='help' className='rounded-[28px] border border-border/60 bg-muted/30 p-8 shadow-sm'>
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-2'>
          <p className='text-xs font-semibold uppercase tracking-[0.3em] text-primary'>Help</p>
          <h3 className='text-2xl font-semibold text-foreground'>Need support?</h3>
          <p className='text-sm text-muted-foreground'>
            Visit our help center or reach out for guidance on building your Skills Wallet, funding, or employer access.
          </p>
        </div>
        <div className='flex flex-wrap gap-3'>
          <Button className='rounded-full px-6' variant='outline'>
            Help center
          </Button>
          <Button className='rounded-full px-6'>Contact support</Button>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className='space-y-6'>
      <div className='space-y-2 text-center'>
        <p className='text-xs font-semibold uppercase tracking-[0.4em] text-primary'>Testimonials</p>
        <h2 className='text-3xl font-semibold sm:text-4xl'>Stories from our learners</h2>
      </div>
      <div className='grid gap-4 md:grid-cols-2'>
        {testimonials.map(item => (
          <Card key={item.name} className='rounded-[24px] border border-border/60 bg-card shadow-sm'>
            <CardContent className='space-y-3 p-6'>
              <p className='text-base text-foreground'>&ldquo;{item.quote}&rdquo;</p>
              <p className='text-sm font-semibold text-primary'>{item.name}</p>
              <p className='text-xs text-muted-foreground'>{item.role}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className='rounded-[32px] border border-border/70 bg-primary/10 p-10 text-center shadow-lg shadow-primary/10'>
      <div className='space-y-4'>
        <h3 className='text-3xl font-semibold text-foreground sm:text-4xl'>
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
    'About',
    'Features',
    'Employers',
    'Students',
    'Talent map',
    'Contact',
  ];
  return (
    <footer className='mt-12 border-t border-border/60 bg-card/60'>
      <div className='mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 lg:flex-row lg:items-center lg:justify-between'>
        <div className='space-y-2'>
          <p className='text-base font-semibold text-foreground'>Elimika Skills Wallet</p>
          <p className='text-sm text-muted-foreground'>Universal skills passport for learning and work.</p>
        </div>
        <div className='flex flex-wrap gap-3'>
          {links.map(link => (
            <Button key={link} variant='ghost' size='sm' className='text-sm text-muted-foreground'>
              {link}
            </Button>
          ))}
        </div>
      </div>
      <Separator />
      <div className='mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 text-xs text-muted-foreground'>
        <span>Support</span>
        <span>© Skills Wallet</span>
      </div>
    </footer>
  );
}
