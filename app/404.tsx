import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <main className='relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-secondary via-background to-card px-6 py-12 dark:bg-background dark:bg-none'>
      <div className='pointer-events-none absolute inset-0 dark:hidden'>
        <div className='from-primary/10 absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] via-transparent to-transparent' />
      </div>

      <div className='relative z-10 flex max-w-2xl flex-col items-center gap-8 text-center'>
        <div className='border-primary/20 text-primary dark:text-primary/80 rounded-full border bg-card/80 px-4 py-2 text-xs font-medium tracking-[0.2em] uppercase dark:bg-card/40'>
          Oops! Page Missing
        </div>

        <h1 className='text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl'>
          We couldn&apos;t find the page you were looking for.
        </h1>

        <p className='text-base text-balance text-muted-foreground sm:text-lg'>
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
