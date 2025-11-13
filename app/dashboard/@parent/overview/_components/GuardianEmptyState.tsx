'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Inbox } from 'lucide-react';

export function GuardianEmptyState() {
  return (
    <Card className='border-dashed border-border/70'>
      <CardHeader className='flex flex-col items-center text-center'>
        <div className='bg-muted text-muted-foreground mb-4 inline-flex size-12 items-center justify-center rounded-full'>
          <Inbox className='size-6' />
        </div>
        <CardTitle className='text-2xl'>No learners linked yet</CardTitle>
        <CardDescription className='text-sm'>
          Ask an instructor or administrator to link your guardian profile to a learner so you can
          monitor their progress from here.
        </CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col items-center gap-2'>
        <Button variant='outline' size='sm'>
          Contact support
        </Button>
      </CardContent>
    </Card>
  );
}
