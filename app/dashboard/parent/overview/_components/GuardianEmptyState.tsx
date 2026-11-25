'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Inbox } from 'lucide-react';
import Link from 'next/link';

export function GuardianEmptyState() {
  return (
    <Card className='border-border/70 border-dashed'>
      <CardHeader className='flex flex-col items-center text-center'>
        <div className='bg-muted text-muted-foreground mb-4 inline-flex size-12 items-center justify-center rounded-full'>
          <Inbox className='size-6' />
        </div>
        <CardTitle className='text-2xl'>No learners linked yet</CardTitle>
        <CardDescription className='text-sm'>
          Search for your child’s learner profile to connect your guardian account and follow their
          learning. You can also ask the learner or their organisation to send a guardian invitation.
        </CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col items-center gap-2'>
        <Button asChild variant='outline' size='sm'>
          <Link href='/onboarding/parent'>Add a learner</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
