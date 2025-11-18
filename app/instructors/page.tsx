'use client';

import { PublicTopNav } from '@/components/PublicTopNav';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { searchInstructorsOptions } from '@/services/client/@tanstack/react-query.gen';
import type { Instructor } from '@/services/client';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Globe, MapPin, Sparkles } from 'lucide-react';
import Link from 'next/link';

const PAGE_SIZE = 12;

function InstructorCard({ instructor }: { instructor: Instructor }) {
  const headline = instructor?.professional_headline ?? 'Instructor';
  const location = instructor?.formatted_location ?? 'Location TBA';
  const bio =
    instructor?.bio ||
    'This instructor profile will be updated soon with expertise, availability, and highlights.';

  return (
    <Card className='h-full border-border/70 bg-card/80 shadow-sm'>
      <CardHeader className='space-y-2'>
        <div className='flex items-center gap-2'>
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary'>
            <Sparkles className='h-5 w-5' />
          </div>
          <div className='space-y-1'>
            <CardTitle className='text-base font-semibold text-foreground'>
              {instructor?.full_name || 'Instructor'}
            </CardTitle>
            <CardDescription className='text-sm text-muted-foreground'>{headline}</CardDescription>
          </div>
        </div>
        <div className='flex flex-wrap gap-2 text-xs text-muted-foreground'>
          {instructor?.admin_verified ? (
            <Badge variant='outline' className='gap-1'>
              <CheckCircle2 className='h-3.5 w-3.5 text-primary' />
              Verified instructor
            </Badge>
          ) : null}
          <Badge variant='outline' className='gap-1'>
            <MapPin className='h-3.5 w-3.5' />
            {location}
          </Badge>
          {instructor?.website ? (
            <Badge variant='outline' className='gap-1'>
              <Globe className='h-3.5 w-3.5' />
              <Link className='hover:text-primary' href={instructor.website} target='_blank'>
                Portfolio
              </Link>
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className='space-y-3 text-sm text-muted-foreground'>
        <p className='leading-6'>{bio}</p>
      </CardContent>
    </Card>
  );
}

function InstructorGridSkeleton() {
  return (
    <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
      {Array.from({ length: 6 }).map((_, idx) => (
        <Card key={idx} className='border-border/60 bg-card/60'>
          <CardHeader className='space-y-3'>
            <div className='flex items-center gap-3'>
              <Skeleton className='h-10 w-10 rounded-full' />
              <div className='space-y-2'>
                <Skeleton className='h-4 w-40' />
                <Skeleton className='h-3 w-28' />
              </div>
            </div>
            <Skeleton className='h-3 w-24' />
          </CardHeader>
          <CardContent className='space-y-2'>
            <Skeleton className='h-3 w-full' />
            <Skeleton className='h-3 w-3/4' />
            <Skeleton className='h-3 w-2/3' />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function PublicInstructorsPage() {
  const instructorsQuery = useQuery(
    searchInstructorsOptions({
      query: {
        pageable: { page: 0, size: PAGE_SIZE },
        searchParams: {
          admin_verified: true,
          is_profile_complete: true,
        },
      },
    })
  );

  const instructors = (instructorsQuery.data?.data?.content as Instructor[] | undefined) ?? [];
  const total = instructorsQuery.data?.data?.totalElements ?? instructors.length;

  return (
    <div className='min-h-screen bg-background text-foreground'>
      <PublicTopNav />

      <main className='mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 lg:py-16'>
        <header className='space-y-6 rounded-[36px] border border-blue-200/40 bg-white/80 p-8 shadow-xl shadow-blue-200/30 backdrop-blur-sm dark:border-blue-500/25 dark:bg-blue-950/40 dark:shadow-blue-900/20 lg:p-12'>
          <div className='inline-flex items-center gap-2 rounded-full border border-blue-400/40 bg-blue-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-blue-600 dark:border-blue-500/40 dark:bg-blue-900/40 dark:text-blue-100'>
            Instructors
          </div>
          <div className='space-y-4'>
            <h1 className='text-3xl font-semibold text-slate-900 dark:text-blue-50 sm:text-4xl'>
              Available instructors
            </h1>
            <p className='max-w-3xl text-base text-slate-600 dark:text-slate-200'>
              Browse instructors verified on Elimika and reach out to partner on classes and training
              programs.
            </p>
          </div>
        </header>

        {instructorsQuery.isLoading ? (
          <InstructorGridSkeleton />
        ) : instructorsQuery.error ? (
          <Card className='border-destructive/40 bg-destructive/5'>
            <CardHeader>
              <CardTitle className='text-foreground'>Unable to load instructors</CardTitle>
              <CardDescription className='text-muted-foreground'>
                Please refresh the page or try again later.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : instructors.length === 0 ? (
          <Card className='border-border/60 bg-card/80'>
            <CardHeader>
              <CardTitle className='text-foreground'>No instructors available yet</CardTitle>
              <CardDescription className='text-muted-foreground'>
                We’re onboarding instructors now. Check back soon for a curated list of verified
                instructors.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className='space-y-4'>
            <div className='flex items-center gap-3 text-sm text-muted-foreground'>
              <span className='font-medium text-foreground'>Showing {instructors.length}</span>
              <span>of {total || instructors.length} instructors</span>
            </div>
            <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
              {instructors.map(instructor => (
                <InstructorCard key={instructor.uuid ?? instructor.user_uuid} instructor={instructor} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
