import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Compass, Home } from 'lucide-react';
import Link from 'next/link';

export default function DashboardNotFound() {
  return (
    <div className='bg-background flex min-h-[60vh] w-full items-center justify-center p-6'>
      <EmptyState
        icon={Compass}
        title='Dashboard page not found'
        description='The dashboard link may be old or unavailable for this profile. Return to your dashboard entry point and Elimika will open the right workspace.'
        action={
          <div className='flex flex-wrap items-center justify-center gap-2'>
            <Button asChild>
              <Link href='/dashboard'>Go to dashboard</Link>
            </Button>
            <Button asChild variant='outline'>
              <Link href='/'>
                <Home className='h-4 w-4' />
                Go home
              </Link>
            </Button>
          </div>
        }
      />
    </div>
  );
}
