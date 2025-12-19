import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function SkillsFundSection() {
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

export function OpportunitiesSection() {
  return (
    <section id='opportunities' className='space-y-6'>
      <div className='space-y-2 text-center'>
        <p className='text-primary text-xs font-semibold tracking-[0.4em] uppercase'>
          Opportunities
        </p>
        <h2 className='text-3xl font-semibold sm:text-4xl'>Unlock jobs and learning offers</h2>
        <p className='text-muted-foreground mx-auto max-w-3xl text-base'>
          Access jobs and consultancy opportunities in your industry that match your verified skills
          profile. Supports global mobility—your skills are portable and recognized locally and
          abroad.
        </p>
      </div>
      <div className='grid gap-4 md:grid-cols-2'>
        <Card className='border-border/60 bg-card rounded-[24px] border shadow-sm'>
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
        <Card className='border-border/60 bg-card rounded-[24px] border shadow-sm'>
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

export function HelpSection() {
  return (
    <section id='help' className='border-border/60 bg-muted/30 rounded-[28px] border p-8 shadow-sm'>
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-2'>
          <p className='text-primary text-xs font-semibold tracking-[0.3em] uppercase'>Help</p>
          <h3 className='text-foreground text-2xl font-semibold'>Need support?</h3>
          <p className='text-muted-foreground text-sm'>
            Visit our help center or reach out for guidance on building your Skills Wallet, funding,
            or employer access.
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
