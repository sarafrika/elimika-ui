'use client';
// admin-boundary: foundation

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command';
import { adminRoutes } from '../lib/admin-routes';
import { useAdminUiStore } from '../state/admin-ui-store';

interface PaletteEntry {
  id: string;
  label: string;
  hint?: string;
  shortcut?: string;
  href: string;
}

/** Sections that exist today. Each one is added here as its screen lands. */
const NAVIGATION: PaletteEntry[] = [
  { id: 'home', label: 'Go to Home', href: adminRoutes.overview(), shortcut: 'G H' },
];

/**
 * ⌘K anywhere in the console. Navigation first; people, organisations and actions join
 * it as their screens and endpoints land.
 */
export function CommandPalette() {
  const router = useRouter();
  const open = useAdminUiStore(state => state.paletteOpen);
  const setOpen = useAdminUiStore(state => state.setPaletteOpen);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      setOpen(!open);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, setOpen]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder='Search people, organisations, courses, settings…' />
      <CommandList>
        <CommandEmpty>Nothing matches yet.</CommandEmpty>
        <CommandGroup heading='Navigation'>
          {NAVIGATION.map(entry => (
            <CommandItem key={entry.id} value={entry.label} onSelect={() => go(entry.href)}>
              {entry.label}
              {entry.shortcut ? <CommandShortcut>{entry.shortcut}</CommandShortcut> : null}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
