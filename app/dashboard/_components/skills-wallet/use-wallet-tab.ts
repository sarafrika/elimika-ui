'use client';

import { useEffect, useState } from 'react';

export function useWalletTab<T extends string>(tabs: readonly [{ id: T }, ...{ id: T }[]]) {
  const [tab, setTab] = useState<T>(tabs[0].id);
  useEffect(() => {
    const readHash = () => {
      const id = window.location.hash.slice(1).split('/')[0];
      const match = tabs.find(item => item.id === id);
      if (match) setTab(match.id);
    };
    readHash();
    window.addEventListener('hashchange', readHash);
    return () => window.removeEventListener('hashchange', readHash);
  }, [tabs]);
  return [
    tab,
    (value: T) => {
      setTab(value);
      window.history.replaceState(null, '', `#${value}`);
    },
  ] as const;
}
