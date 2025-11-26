'use client';

import { PublicTopNav } from '@/components/PublicTopNav';
import { HelpSection } from '@/components/PublicSections';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const faqs = [
  {
    question: 'How do I set up my Skills Wallet?',
    answer: 'Create an account, add your education and certifications, and upload any verified documents to get started.',
  },
  {
    question: 'Who can fund my wallet?',
    answer: 'Employers, donors, family members, or sponsors can contribute credits directly to your wallet.',
  },
  {
    question: 'How are courses verified?',
    answer: 'Courses listed in Elimika are vetted and mapped to accreditation requirements where applicable.',
  },
];

export default function HelpPage() {
  return (
    <div className='min-h-screen bg-background text-foreground'>
      <PublicTopNav />

      <main className='mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-12 lg:py-16'>
        <header className='space-y-6 rounded-[36px] border border-border bg-card/80 p-8 shadow-xl backdrop-blur-sm lg:p-12'>
          <Badge variant='outline' className='rounded-full border-primary/40 bg-primary/10 text-primary'>
            Help
          </Badge>
          <div className='space-y-4'>
            <h1 className='text-3xl font-semibold text-foreground sm:text-4xl'>
              Get support for Skills Wallet, funding, and opportunities
            </h1>
            <p className='max-w-3xl text-base text-muted-foreground'>
              Find answers to common questions and connect with our team to troubleshoot issues, request guidance, or
              learn how to maximise your profile.
            </p>
          </div>
        </header>

        <HelpSection />

        <Card className='rounded-[28px] border border-border/60 bg-card/80 shadow-md'>
          <CardHeader>
            <CardTitle className='text-xl font-semibold text-foreground'>Frequently asked questions</CardTitle>
            <CardDescription className='text-muted-foreground'>
              Quick answers to the most common topics.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {faqs.map(item => (
              <div key={item.question} className='space-y-2 rounded-2xl border border-border/50 bg-muted/30 p-4'>
                <p className='text-sm font-semibold text-foreground'>{item.question}</p>
                <p className='text-sm text-muted-foreground'>{item.answer}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Separator />

        <div className='rounded-[28px] border border-border/60 bg-muted/30 p-8 shadow-sm'>
          <p className='text-sm font-semibold uppercase tracking-[0.3em] text-primary'>Still stuck?</p>
          <p className='mt-2 text-base text-foreground'>
            Reach out with context on your account, the page you were on, and any error messages you saw.
          </p>
          <p className='mt-2 text-sm text-muted-foreground'>
            Our team responds during business hours and prioritises issues affecting access to courses and funding.
          </p>
        </div>
      </main>
    </div>
  );
}
