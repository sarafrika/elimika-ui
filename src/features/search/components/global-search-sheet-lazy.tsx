'use client';

import dynamic from 'next/dynamic';
import { type ComponentProps, useEffect, useState } from 'react';
import type { GlobalSearchSheet as GlobalSearchSheetType } from './global-search-sheet';

const GlobalSearchSheet = dynamic(
  () => import('./global-search-sheet').then(mod => mod.GlobalSearchSheet),
  { ssr: false }
);

// The palette (cmdk + search hooks) loads on first open and then stays mounted for its close animation.
export function LazyGlobalSearchSheet(props: ComponentProps<typeof GlobalSearchSheetType>) {
  const [requested, setRequested] = useState(props.open);
  useEffect(() => {
    if (props.open) setRequested(true);
  }, [props.open]);

  if (!requested && !props.open) return null;
  return <GlobalSearchSheet {...props} />;
}
