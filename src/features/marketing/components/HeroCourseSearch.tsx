'use client';

import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toSearchTerm } from '@/lib/search/query';

/**
 * The hero's course search: opens the public catalogue searched for the term
 * (`/courses?q=`), which runs the anonymous course search. Without script the form
 * still submits to the same URL.
 */
export function HeroCourseSearch({ className }: { className?: string }) {
  const router = useRouter();
  const [term, setTerm] = useState('');

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = toSearchTerm(term);
    router.push(q ? `/courses?${new URLSearchParams({ q }).toString()}` : '/courses');
  };

  return (
    <form action='/courses' method='get' role='search' onSubmit={onSubmit} className={className}>
      <div className='relative flex-1'>
        <Search
          className='text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2'
          aria-hidden='true'
        />
        <Input
          type='search'
          name='q'
          value={term}
          onChange={event => setTerm(event.target.value)}
          aria-label='Search courses, skills or trainers'
          placeholder='Search courses, skills or trainers'
          className='bg-card h-13 rounded-xl pr-4 pl-11 text-[15px] shadow-sm'
        />
      </div>
      <Button type='submit' className='h-13 rounded-xl px-7 text-[15px] font-semibold'>
        Search
      </Button>
    </form>
  );
}
