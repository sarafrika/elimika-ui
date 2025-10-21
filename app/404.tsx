import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <main className='bg-grid-slate-100/[0.6] dark:bg-grid-slate-800/[0.6] relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#EEF2FF] via-white to-[#E0E7FF] px-6 py-12 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900'>
      <div className='absolute inset-0 pointer-events-none'>
        <div className='from-primary/10 via-transparent to-transparent absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))]' />
      </div>

      <div className='relative z-10 flex max-w-2xl flex-col items-center gap-8 text-center'>
        <div className='rounded-full border border-primary/20 bg-white/60 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-primary dark:bg-slate-900/60 dark:text-primary/80'>
          Oops! Page Missing
        </div>

        <h1 className='text-balance text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl'>
          We couldn&apos;t find the page you were looking for.
        </h1>

        <p className='text-balance text-base text-slate-600 dark:text-slate-300 sm:text-lg'>
          The link may be broken or the page may have been removed. Let&apos;s take you back to the
          Elimika home page so you can continue exploring learning opportunities.
        </p>

        <div className='flex flex-col items-center gap-3 sm:flex-row'>
          <Button asChild>
            <Link href='/' prefetch>
              Return home
            </Link>
          </Button>
          <Button asChild variant='ghost'>
            <Link href='/dashboard/overview' prefetch>
              Go to dashboard
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
