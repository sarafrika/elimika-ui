import { PageHeader } from '@/components/dashboard/page-header';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type WalletRole = 'student' | 'instructor' | 'course_creator';

const WALLET_HEADERS = {
  student: {
    title: 'Student Wallet',
    description: 'Personal funds, Skills Fund balances, rewards, refunds and marketplace credits',
  },
  instructor: {
    title: 'Instructor Wallet',
    description: 'Course class orders, delivery progress and wallet activity.',
  },
  course_creator: {
    title: 'Course Creator Wallet',
    description: 'Class orders for your courses, delivery progress and wallet activity.',
  },
};

function StudentDashboardSkeleton() {
  return (
    <div className='space-y-5'>
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {['available', 'balance', 'rewards', 'pending'].map(stat => (
          <Card key={stat} className='rounded-md'>
            <CardHeader className='gap-2 pb-0'>
              <Skeleton className='h-4 w-28' />
              <Skeleton className='h-8 w-36 max-w-full' />
            </CardHeader>
            <CardContent>
              <Skeleton className='h-3 w-32 max-w-full' />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className='grid gap-4 lg:grid-cols-2'>
        {['transactions', 'payments'].map(panel => (
          <Card key={panel}>
            <CardHeader className='flex flex-row items-center justify-between'>
              <Skeleton className='h-5 w-40' />
              <Skeleton className='h-4 w-14' />
            </CardHeader>
            <CardContent className='divide-y'>
              {['first', 'second', 'third'].map(row => (
                <div key={row} className='flex items-center gap-3 py-3'>
                  {panel === 'transactions' && (
                    <Skeleton className='size-8 shrink-0 rounded-full' />
                  )}
                  <div className='min-w-0 flex-1 space-y-2'>
                    <Skeleton className='h-4 w-3/4' />
                    <Skeleton className='h-3 w-1/2' />
                  </div>
                  <div className='shrink-0 space-y-2'>
                    <Skeleton className='h-4 w-20' />
                    <Skeleton className='ml-auto h-4 w-14 rounded-full' />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TrainingDashboardSkeleton() {
  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <Skeleton className='h-7 w-32' />
        <Skeleton className='h-5 w-full max-w-xl' />
      </div>
      <div className='space-y-2'>
        <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-5'>
          {['all', 'complete', 'cancelled', 'incomplete', 'refunds'].map(stat => (
            <Card key={stat} className='gap-2 p-4'>
              <Skeleton className='h-4 w-24 max-w-full' />
              <Skeleton className='h-8 w-28 max-w-full' />
            </Card>
          ))}
        </div>
        <Skeleton className='h-3 w-64 max-w-full' />
      </div>
      <div className='grid gap-3 sm:grid-cols-3'>
        {['classes', 'paid', 'lessons'].map(stat => (
          <Card key={stat} className='gap-2 p-4'>
            <Skeleton className='h-4 w-36 max-w-full' />
            <Skeleton className='h-8 w-28' />
          </Card>
        ))}
      </div>
      <Card className='gap-0 overflow-hidden py-0'>
        <div className='p-4'>
          <Skeleton className='h-9 w-full max-w-md' />
        </div>
        <div className='overflow-x-auto'>
          <div className='min-w-[1160px]'>
            <div className='bg-muted/40 grid grid-cols-7 gap-4 border-b px-4 py-3'>
              {['class', 'lessons', 'students', 'fee', 'rate', 'share', 'total'].map(column => (
                <Skeleton key={column} className='h-4 w-24' />
              ))}
            </div>
            {['first', 'second', 'third'].map(row => (
              <div key={row} className='grid grid-cols-7 gap-4 border-b p-4 last:border-b-0'>
                {['class', 'lessons', 'students', 'fee', 'rate', 'share', 'total'].map(column => (
                  <div key={column} className='space-y-2'>
                    <Skeleton className='h-4 w-full' />
                    <Skeleton className='h-3 w-3/4' />
                    <Skeleton className='h-3 w-1/2' />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </Card>
      <Skeleton className='h-3 w-full' />
      <div className='flex items-center justify-between gap-3'>
        <Skeleton className='h-4 w-48 max-w-full' />
        <div className='flex gap-2'>
          <Skeleton className='h-8 w-20' />
          <Skeleton className='h-8 w-16' />
        </div>
      </div>
    </div>
  );
}

export function WalletDashboardSkeleton({
  variant = 'student',
}: {
  variant?: 'student' | 'training';
}) {
  return (
    <div role='status' aria-label='Loading wallet dashboard' aria-busy='true'>
      <div aria-hidden='true'>
        {variant === 'training' ? <TrainingDashboardSkeleton /> : <StudentDashboardSkeleton />}
      </div>
    </div>
  );
}

export function WalletPageSkeleton({ role = 'student' }: { role?: WalletRole }) {
  const tabCount = role === 'student' ? 9 : role === 'instructor' ? 6 : 5;

  // Keep the full wallet shell visible while data resolves, with placeholders
  // matching the header, tabs and the role's dashboard cards or class orders.
  return (
    <div className='space-y-5 p-4' aria-busy='true'>
      <div aria-hidden='true'>
        <PageHeader
          {...WALLET_HEADERS[role]}
          eyebrow='Wallet'
          actions={
            <div className='flex flex-wrap items-end gap-4'>
              <dl className='flex flex-wrap gap-4'>
                {['Account balance', 'Available balance'].map(label => (
                  <div key={label}>
                    <dt className='text-muted-foreground text-xs'>{label}</dt>
                    <dd className='mt-1'>
                      <Skeleton className='h-6 w-28' />
                    </dd>
                  </div>
                ))}
              </dl>
              <Skeleton className='h-9 w-28' />
            </div>
          }
        />
      </div>
      <div aria-hidden='true' className='-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0'>
        <div className='flex min-w-max gap-2 pb-1'>
          {[
            'dashboard',
            'accounts',
            'payments',
            'top-up',
            'transactions',
            'refunds',
            'rewards',
            'statements',
            'audit',
          ]
            .slice(0, tabCount)
            .map(tab => (
              <Skeleton key={tab} className='h-8 w-28 rounded-full' />
            ))}
        </div>
      </div>
      <WalletDashboardSkeleton variant={role === 'student' ? 'student' : 'training'} />
    </div>
  );
}
