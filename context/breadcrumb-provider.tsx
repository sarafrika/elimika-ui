'use client';

import menu, { MenuItem } from '@/lib/menu';
import { usePathname } from 'next/navigation';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type BreadcrumbItem = {
  id: string;
  title: string;
  url: string | null;
  isLast?: boolean;
};

type BreadcrumbContextType = {
  breadcrumbs: BreadcrumbItem[];
  addBreadcrumb: (title: string, url?: string | null) => void;
  removeBreadcrumb: (id: string) => void;
  removeLastBreadcrumb: () => void;
  clearBreadcrumbs: () => void;
  replaceBreadcrumbs: (newBreadcrumbs: BreadcrumbItem[]) => void;
};

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

const STORAGE_KEY = 'app-breadcrumbs';

// --- 🧩 Utility helpers (make sure these are above your provider) ---
const generateId = () =>
  `breadcrumb-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

const findMenuPathByUrl = (
  menuItems: MenuItem[],
  url: string,
  path: MenuItem[] = []
): MenuItem[] | null => {
  for (const item of menuItems) {
    const currentPath = [...path, item];
    if (item.url === url) return currentPath;

    if (item.items && item.items.length > 0) {
      const foundPath = findMenuPathByUrl(item.items, url, currentPath);
      if (foundPath) return foundPath;
    }
  }
  return null;
};

const findMenuPathByUrlInSources = (
  sources: Record<string, MenuItem[]>,
  url: string
): MenuItem[] | null => {
  for (const key in sources) {
    const result = findMenuPathByUrl(sources[key] || [], url);
    if (result) return result;
  }
  return null;
};

const convertMenuToBreadcrumbs = (menuItems: MenuItem[]): BreadcrumbItem[] => {
  return menuItems.map((item, index) => ({
    id: generateId(),
    title: item.title,
    url: item.url || null,
    isLast: index === menuItems.length - 1,
  }));
};

// --- 🧠 Breadcrumb Provider ---
export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed: BreadcrumbItem[] = JSON.parse(stored);
        setBreadcrumbs(parsed);
      } catch (e) {
        console.error('Failed to parse breadcrumb storage', e);
      }
    }
  }, []);

  // Persist to localStorage whenever breadcrumbs change
  useEffect(() => {
    if (breadcrumbs.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(breadcrumbs));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [breadcrumbs]);

  const replaceBreadcrumbs = useCallback((newBreadcrumbs: BreadcrumbItem[]) => {
    setBreadcrumbs(newBreadcrumbs);
  }, []);

  // Auto-generate breadcrumbs based on menu + pathname
  useEffect(() => {
    if (pathname) {
      const menuPath = findMenuPathByUrlInSources(menu, pathname);
      if (menuPath && menuPath.length > 0) {
        const newBreadcrumbs = convertMenuToBreadcrumbs(menuPath);
        replaceBreadcrumbs(newBreadcrumbs);
      }
    }
  }, [pathname, replaceBreadcrumbs]);

  // --- CRUD functions ---
  const addBreadcrumb = useCallback((title: string, url?: string | null) => {
    setBreadcrumbs(prev => {
      const updatedBreadcrumbs = prev.map(b => ({ ...b, isLast: false }));
      return [
        ...updatedBreadcrumbs,
        { id: generateId(), title, url: url || null, isLast: true },
      ];
    });
  }, []);

  const removeBreadcrumb = useCallback((id: string) => {
    setBreadcrumbs(prev => {
      const filtered = prev.filter(b => b.id !== id);
      return filtered.map((b, i) => ({ ...b, isLast: i === filtered.length - 1 }));
    });
  }, []);

  const removeLastBreadcrumb = useCallback(() => {
    setBreadcrumbs(prev => prev.slice(0, -1));
  }, []);

  const clearBreadcrumbs = useCallback(() => {
    setBreadcrumbs([]);
  }, []);

  const value = useMemo(
    () => ({
      breadcrumbs,
      addBreadcrumb,
      removeBreadcrumb,
      removeLastBreadcrumb,
      clearBreadcrumbs,
      replaceBreadcrumbs,
    }),
    [breadcrumbs, addBreadcrumb, removeBreadcrumb, removeLastBreadcrumb, clearBreadcrumbs, replaceBreadcrumbs]
  );

  return <BreadcrumbContext.Provider value={value}>{children}</BreadcrumbContext.Provider>;
}

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error('useBreadcrumb must be used within a BreadcrumbProvider');
  }
  return context;
}
