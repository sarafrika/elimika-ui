import { ShieldX } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

/**
 * Shown when someone without an organisation admin role opens the organisation portal.
 * Being a student, instructor or parent at an organisation does not grant it.
 */
export function OrganisationAccessDenied({ homeHref }: { homeHref: string }) {
  return (
    <main className='flex min-h-screen items-center justify-center p-6'>
      <div className='bg-card border-border w-full max-w-md rounded-lg border p-8 text-center'>
        <div className='bg-muted mx-auto flex h-12 w-12 items-center justify-center rounded-full'>
          <ShieldX className='text-muted-foreground h-5 w-5' aria-hidden />
        </div>
        <h1 className='text-foreground mt-5 text-lg font-semibold'>
          You don&apos;t have organisation access
        </h1>
        <p className='text-muted-foreground mt-2 text-sm'>
          The organisation dashboard is only for organisation admins. Ask an admin of your
          organisation if you need access.
        </p>
        <Button asChild className='mt-6'>
          <Link href={homeHref}>Go to my dashboard</Link>
        </Button>
      </div>
    </main>
  );
}
