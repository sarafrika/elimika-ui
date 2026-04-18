import { ChevronDown, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';

function InstructorAvatar() {
  return (
    <div
      aria-hidden='true'
      className='bg-primary/15 relative size-11 shrink-0 overflow-hidden rounded-full'
    >
      <div className='bg-primary/45 absolute top-2 left-1/2 size-5 -translate-x-1/2 rounded-full' />
      <div className='bg-primary/25 absolute inset-x-1 bottom-0 h-6 rounded-t-full' />
    </div>
  );
}

export function FeedbackPanel() {
  return (
    <section className='border-border bg-card rounded-md border p-4 shadow-xs'>
      <h3 className='text-foreground text-lg font-semibold'>Feedback Panel</h3>

      <article className='border-border bg-background mt-3 rounded-md border p-3'>
        <div className='flex items-center gap-3'>
          <InstructorAvatar />
          <div>
            <p className='text-foreground text-sm font-semibold'>Sarah Johnson</p>
            <p className='text-muted-foreground text-xs'>Instructor</p>
          </div>
        </div>
        <p className='text-muted-foreground mt-4 text-sm leading-6'>
          Great concept! Your design has potential, but there's room for improvement in coding and
          responsive elements. Let's focus on refining these areas.
        </p>
      </article>

      <label className='border-border bg-background mt-3 block rounded-md border p-3'>
        <span className='text-muted-foreground flex items-center justify-between text-sm'>
          Leave a Comment...
          <span className='text-xs'>500</span>
        </span>
        <textarea
          aria-label='Leave a comment'
          className='placeholder:text-muted-foreground mt-2 min-h-14 w-full resize-none bg-transparent text-sm outline-none'
        />
        <button
          className='text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-2 text-sm transition focus-visible:ring-2 focus-visible:outline-none'
          type='button'
        >
          <Paperclip className='size-4' />
          Attach File
        </button>
      </label>

      <button
        className='border-border bg-background text-foreground hover:bg-accent focus-visible:ring-ring mt-3 flex h-10 w-full items-center justify-between rounded-md border px-3 text-sm transition focus-visible:ring-2 focus-visible:outline-none'
        type='button'
      >
        Select Competency Tags
        <ChevronDown className='size-4' />
      </button>

      <Button className='mt-3 w-full' type='button'>
        Send Feedback
      </Button>
    </section>
  );
}
