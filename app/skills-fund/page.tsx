'use client';

import { PublicTopNav } from '@/components/PublicTopNav';
import { SkillsFundSection, HelpSection } from '@/components/PublicSections';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function SkillsFundPage() {
  return (
    <div className='min-h-screen bg-background text-foreground'>
      <PublicTopNav />

      <main className='mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-12 lg:py-16'>
        <header className='space-y-6 rounded-[36px] border border-border bg-card/80 p-8 shadow-xl backdrop-blur-sm lg:p-12'>
          <Badge variant='outline' className='rounded-full border-primary/40 bg-primary/10 text-primary'>
            Skills Fund
          </Badge>
          <div className='space-y-4'>
            <h1 className='text-3xl font-semibold text-foreground sm:text-4xl'>
              Fuel your learning with the Elimika Skills Fund
            </h1>
            <p className='max-w-3xl text-base text-muted-foreground'>
              Apply for scholarships, bursaries, or employer-backed credits and invest directly in courses that match
              your goals. Manage every allocation from one wallet.
            </p>
          </div>
          <div className='flex flex-wrap gap-3'>
            <Button size='lg' className='rounded-full px-6'>
              Start application
            </Button>
            <Button asChild variant='outline' size='lg' className='rounded-full px-6'>
              <Link href='/courses'>Browse eligible courses</Link>
            </Button>
          </div>
        </header>

        <SkillsFundSection />

        <Card className='rounded-[28px] border border-border/60 bg-card/80 shadow-md'>
          <CardHeader>
            <CardTitle className='text-xl font-semibold text-foreground'>How funding works</CardTitle>
            <CardDescription className='text-muted-foreground'>
              Transparent steps from application to spending your credits.
            </CardDescription>
          </CardHeader>
          <CardContent className='grid gap-4 md:grid-cols-3'>
            {[
              { title: 'Apply', copy: 'Submit your learning goals and supporting documents for review.' },
              { title: 'Get approved', copy: 'Receive credits from sponsors, employers, or family contributors.' },
              { title: 'Spend wisely', copy: 'Use credits on verified courses and track outcomes in your wallet.' },
            ].map(item => (
              <div key={item.title} className='space-y-2 rounded-2xl border border-border/50 bg-muted/30 p-4'>
                <p className='text-sm font-semibold text-foreground'>{item.title}</p>
                <p className='text-sm text-muted-foreground'>{item.copy}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <HelpSection />
      </main>
    </div>
  );
}
