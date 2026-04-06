'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, ArrowLeft, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StudentDefault() {
  const router = useRouter();

  return (
    <div className='flex min-h-[calc(100vh-4rem)] items-center justify-center p-4'>
      <Card className='w-full max-w-md border-border/50'>
        <CardContent className='flex flex-col items-center gap-6 p-8 text-center'>
          {/* Icon */}
          <div className='bg-destructive/10 rounded-full p-4'>
            <AlertCircle className='text-destructive h-12 w-12' />
          </div>

          {/* Content */}
          <div className='space-y-2'>
            <h1 className='text-foreground text-2xl font-bold'>Student Dashboard Page Not Found</h1>
            <p className='text-muted-foreground text-sm'>
              The page you're looking for doesn't exist or you don't have permission to access it.
            </p>
          </div>

          {/* Actions */}
          <div className='flex w-full flex-col gap-3 sm:flex-row'>
            <Button
              variant='outline'
              className='flex-1'
              onClick={() => router.back()}
            >
              <ArrowLeft className='mr-2 h-4 w-4' />
              Go Back
            </Button>
            <Button
              className='flex-1'
              onClick={() => router.push('/dashboard/overview')}
            >
              <Home className='mr-2 h-4 w-4' />
              Dashboard
            </Button>
          </div>

          {/* Helper text */}
          <p className='text-muted-foreground text-xs'>
            If you believe this is an error, please contact support.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}