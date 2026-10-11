'use client';

import { Search } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGlobalSearchShortcut } from '../hooks/use-global-search-shortcut';
import { LazyGlobalSearchSheet } from './global-search-sheet-lazy';
import { GlobalSearchTrigger } from './global-search-trigger';

/**
 * The search palette on the public pages, for signed-out visitors only: a signed-in
 * user searches from their dashboard. It searches what the API returns anonymously
 * (courses, programs, organisations and public classes); courses open the public course
 * page and everything else signs in first.
 */
export function PublicSearch() {
  const { status } = useSession();
  if (status !== 'unauthenticated') return null;
  return <PublicSearchPalette />;
}

function PublicSearchPalette() {
  const [open, setOpen] = useState(false);
  const openPalette = useCallback(() => setOpen(true), []);
  useGlobalSearchShortcut(openPalette);

  return (
    <>
      <GlobalSearchTrigger
        onOpen={openPalette}
        className='hidden max-w-xs md:flex'
        placeholder='Search courses, programs and classes…'
      />
      <Button
        type='button'
        variant='ghost'
        size='icon'
        className='md:hidden'
        onClick={openPalette}
        aria-label='Search'
      >
        <Search className='size-4' />
      </Button>
      <LazyGlobalSearchSheet open={open} onOpenChange={setOpen} domain='public' />
    </>
  );
}
