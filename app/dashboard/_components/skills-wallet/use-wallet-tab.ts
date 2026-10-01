'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useSectionTab } from '@/components/data-display';

import { legacyWalletHashTarget } from './wallet-tab-hash';

/**
 * The wallet's open tab, kept in `?tab=`. Old `#tab` links (and `#credentials/<id>` shares)
 * are forwarded to the matching `?tab=`, the way settings forwards `?tab=branches`.
 */
export function useWalletTab<const T extends string>(tabIds: readonly T[], fallback: T) {
  const section = useSectionTab(tabIds, fallback);
  const { value, hrefFor } = section;
  const router = useRouter();

  useEffect(() => {
    const forward = () => {
      const target = legacyWalletHashTarget(window.location.hash, tabIds);
      if (!target) return;
      if (target.tab === value && target.hash === window.location.hash) return;
      router.replace(`${hrefFor(target.tab)}${target.hash}`, { scroll: false });
    };
    forward();
    window.addEventListener('hashchange', forward);
    return () => window.removeEventListener('hashchange', forward);
  }, [tabIds, value, hrefFor, router]);

  return section;
}
