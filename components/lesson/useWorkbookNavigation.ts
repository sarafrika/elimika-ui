'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export function useWorkbookNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const navigate = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };
  return { searchParams, navigate };
}
