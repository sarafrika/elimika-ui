'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCourseCreator } from '@/context/course-creator-context';
import { Globe, Mail, MapPin, Pencil } from 'lucide-react';
import Link from 'next/link';

export default function CourseCreatorProfilePage() {
  const { profile, data } = useCourseCreator();

  if (!profile) {
    return (
      <div className='mx-auto flex h-full max-w-3xl flex-col items-center justify-center gap-4 px-4 py-20 text-center'>
        <h1 className='text-2xl font-semibold'>No creator profile found</h1>
        <p className='text-muted-foreground text-sm'>
          Create a course creator record during onboarding or contact support to restore access.
        </p>
        <Button asChild>
          <Link prefetch href='/dashboard/overview'>
            Return to overview
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className='mx-auto w-full max-w-4xl space-y-6 px-4 py-10'>
      <header className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <p className='text-sm uppercase tracking-widest text-purple-600 dark:text-purple-300'>
            Creator profile
          </p>
          <h1 className='mt-1 text-3xl font-semibold tracking-tight'>{profile.full_name}</h1>
          {profile.professional_headline && (
            <p className='text-muted-foreground mt-2 text-sm'>{profile.professional_headline}</p>
          )}
        </div>
        <Button variant='outline' asChild>
          <Link prefetch href='/dashboard/profile'>
            <Pencil className='mr-2 h-4 w-4' />
            Edit profile
          </Link>
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className='text-base font-semibold'>About</CardTitle>
          <CardDescription>
            Ensure potential learners and partners understand your expertise.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4 text-sm'>
          <div className='space-y-1'>
            <p className='text-xs uppercase tracking-wide text-muted-foreground'>Bio</p>
            <p>{profile.bio || 'A professional summary has not been added yet.'}</p>
          </div>
          <div className='flex flex-wrap gap-3 text-sm text-muted-foreground'>
            <Badge variant='outline'>{profile.admin_verified ? 'Verified' : 'Unverified'}</Badge>
            {profile.website && (
              <Link
                prefetch
                href={profile.website}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-1 hover:text-purple-600'
              >
                <Globe className='h-4 w-4' />
                Website
              </Link>
            )}
            {profile.user_uuid && (
              <span className='inline-flex items-center gap-1'>
                <Mail className='h-4 w-4' /> User UUID: {profile.user_uuid.slice(0, 8)}…
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='text-base font-semibold'>Assignments</CardTitle>
          <CardDescription>
            Track global publishing access and organisation-specific responsibilities.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-3 text-sm'>
          <div className='rounded-lg border border-dashed border-blue-200/40 bg-blue-50/60 p-3'>
            <p className='text-xs uppercase tracking-wide text-muted-foreground'>Marketplace</p>
            <p className='font-semibold'>
              {data.assignments.hasGlobalAccess
                ? 'Global publishing rights granted'
                : 'Marketplace access pending verification'}
            </p>
          </div>
          {data.assignments.organisations.length > 0 ? (
            <div className='space-y-2'>
              {data.assignments.organisations.map((assignment, index) => (
                <div
                  key={`${assignment.organisationUuid ?? index}-${assignment.branchUuid ?? 'branch'}`}
                  className='rounded-lg border border-border/50 p-3'
                >
                  <p className='font-semibold'>
                    {assignment.organisationName ?? 'Unnamed organisation'}
                  </p>
                  <p className='text-muted-foreground text-xs'>
                    {assignment.branchName ? (
                      <span className='inline-flex items-center gap-1'>
                        <MapPin className='h-3.5 w-3.5' />
                        {assignment.branchName}
                      </span>
                    ) : (
                      'No branch assignment'
                    )}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className='text-muted-foreground text-sm'>
              You are not currently mapped to any organisations as a content developer.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
