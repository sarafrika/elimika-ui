'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface ErrorPageProps {
  message: string;
  details?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function ErrorPage({
  message,
  details,
  actionLabel = 'Go Home',
  onAction,
}: ErrorPageProps) {
  const router = useRouter();
  const handleAction = () => {
    if (onAction) {
      onAction();
    } else {
      router.push('/');
    }
  };

  return (
    <main
      className='bg-secondary/60 dark:bg-background flex h-full w-full flex-1 items-center justify-center'
      aria-label='Error page'
    >
      <section className='bg-card shadow-primary/10 dark:bg-card/90 flex w-full max-w-md flex-col items-center rounded-xl p-8 shadow-lg'>
        <div className='mb-4 animate-bounce text-5xl' aria-hidden='true'>
          <span role='img' aria-label='Error'>
            ❌
          </span>
        </div>
        <h2 className='text-foreground mb-2 text-2xl font-extrabold'>An Error Occurred</h2>
        <p className='text-muted-foreground mb-2 text-center'>{message}</p>
        {details && (
          <pre
            className='bg-destructive/10 text-destructive dark:bg-background mb-2 w-full overflow-x-auto rounded p-2 text-xs'
            aria-label='Error details'
          >
            {details}
          </pre>
        )}
        <Button onClick={handleAction} variant='destructive' size='lg' className='mt-4'>
          {actionLabel}
        </Button>
      </section>
    </main>
  );
}
