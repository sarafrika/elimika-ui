'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, FileText } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function InstructorOverviewPage() {
  // TODO: Replace this with actual data from the backend
  const isProfileComplete = false;

  const { data: session } = useSession();

  return (
    <div className='mx-auto w-full max-w-4xl space-y-8 px-4 py-8'>
      <div className='space-y-1'>
        <h1 className='text-3xl font-bold tracking-tight'>
          Welcome, <span className='text-primary'>{session?.user?.name ?? 'Instructor'}</span>
        </h1>
        <p className='text-muted-foreground'>
          Here&apos;s a quick overview of your <span className='text-primary'>Instructor</span>{' '}
          journey with us.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Profile Status</CardTitle>
          <CardDescription>
            {isProfileComplete
              ? 'Your profile is up-to-date.'
              : 'Your first step is to complete your instructor profile.'}
          </CardDescription>
        </CardHeader>
        <CardContent className='pt-2'>
          {isProfileComplete ? (
            <div className='text-center'>
              <p>Welcome! Your profile is ready.</p>
            </div>
          ) : (
            <div className='bg-muted/40 flex flex-col items-center justify-center gap-4 rounded-lg p-8 text-center'>
              <div className='border-primary bg-primary/10 flex size-16 items-center justify-center rounded-full border-2 border-dashed'>
                <FileText className='text-primary h-8 w-8' />
              </div>
              <div className='space-y-1'>
                <h3 className='text-xl font-semibold'>Profile Update Required</h3>
                <p className='text-muted-foreground mx-auto max-w-sm'>
                  Your profile can&apos;t be reviewed until it is complete. Please add your
                  professional experience, qualifications, and other required information.
                </p>
              </div>
              <Button asChild className='mt-2'>
                <Link prefetch href='/dashboard/profile/general'>
                  Update Profile Now <ArrowRight className='ml-2 h-4 w-4' />
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
