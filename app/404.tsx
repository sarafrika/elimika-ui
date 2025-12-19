import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <main className='bg-background dark:bg-background relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12'>
      <div className='relative z-10 flex max-w-2xl flex-col items-center gap-8 text-center'>
        <div className='border-primary/20 text-primary dark:text-primary/80 bg-card/80 dark:bg-card/40 rounded-full border px-4 py-2 text-xs font-medium tracking-[0.2em] uppercase'>
          Oops! Page Missing
        </div>

        <h1 className='text-foreground text-4xl font-semibold tracking-tight text-balance sm:text-5xl'>
          We couldn&apos;t find the page you were looking for.
        </h1>

        <p className='text-muted-foreground text-base text-balance sm:text-lg'>
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
