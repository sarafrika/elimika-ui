'use client';

import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { type CSSProperties, type MouseEvent, type ReactNode, useCallback, useMemo } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchState } from '@/hooks/use-search-state';
import { enumParam } from '@/lib/search-state';
import { cn } from '@/lib/utils';

/* URL state -------------------------------------------------------------------------- */

/**
 * The open section of a page, kept in the URL (`?tab=` by default) so a reload or a shared
 * link reopens it. Writes go through `router.replace` with `scroll: false`, and the default
 * section is left out of the URL, so the plain address stays the plain page.
 */
export function useSectionTab<const T extends string>(
  values: readonly T[],
  fallback: T,
  key = 'tab'
) {
  // Pass a module-level `values` array so the spec stays stable between renders.
  const spec = useMemo(() => enumParam(values, fallback), [values, fallback]);
  const [value, setValue] = useSearchState(key, spec);
  const pathname = usePathname();
  const params = useSearchParams();

  /** The address of one section, for a real link (middle-click, copy link, crawlers). */
  const hrefFor = useCallback(
    (next: T) => {
      const search = new URLSearchParams(params.toString());
      const serialised = spec.serialise(next);
      if (serialised === undefined) search.delete(key);
      else search.set(key, serialised);
      const query = search.toString();
      return query ? `${pathname}?${query}` : pathname;
    },
    [params, pathname, spec, key]
  );

  return { value, setValue, hrefFor } as const;
}

/* Tabs ------------------------------------------------------------------------------- */

export interface SectionTab<T extends string = string> {
  id: T;
  label: string;
  /** Shown as a count chip. Omit, or pass null, for a section without a count. */
  count?: number | null;
  icon?: LucideIcon;
}

type SectionTabsProps<T extends string> = {
  tabs: readonly SectionTab<T>[];
  value: T;
  onValueChange: (value: T) => void;
  /** Accessible name of the tab list, e.g. "Course sections". */
  label: string;
  /**
   * Gives each tab a real link as well as tab semantics, so a modified click opens the
   * section in a new tab and a crawler can follow it. A plain click stays in-page.
   */
  hrefFor?: (value: T) => string;
  /**
   * `underline`: the dashboard 360 strip. `pill`: a card of pill tabs, as on the public
   * course page. Both scroll sideways on phones instead of wrapping.
   */
  variant?: 'underline' | 'pill';
  /**
   * Pin the strip while the page scrolls. `top` clears whatever is already pinned above:
   * the public nav on public pages; on a dashboard page the scroll container sits under the
   * top bar, so the default `0` is right there.
   */
  sticky?: boolean | { top?: number | string };
  /** The panels: `SectionTabPanel`s. */
  children: ReactNode;
  className?: string;
  listClassName?: string;
};

const LIST = {
  underline:
    'border-border/70 h-auto w-full justify-start gap-6 overflow-x-auto rounded-none border-b bg-transparent p-0',
  pill: 'bg-card h-auto w-full justify-start gap-1 overflow-x-auto rounded-2xl border p-1.5 shadow-sm',
} as const;

const TRIGGER = {
  underline:
    'group text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-primary -mb-px h-11 flex-none gap-2 rounded-none border-0 border-b-2 border-transparent px-0 text-sm font-medium data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:shadow-none',
  pill: 'group text-muted-foreground hover:text-foreground data-[state=active]:bg-primary/10 data-[state=active]:text-primary h-11 flex-none gap-2 rounded-[10px] px-4 text-sm font-medium data-[state=active]:font-semibold data-[state=active]:shadow-none',
} as const;

const COUNT = {
  underline:
    'bg-muted text-muted-foreground group-data-[state=active]:bg-primary group-data-[state=active]:text-primary-foreground flex h-5 min-w-5 items-center justify-center rounded-sm px-1.5 font-mono text-[11px]',
  pill: 'bg-muted text-muted-foreground group-data-[state=active]:bg-primary group-data-[state=active]:text-primary-foreground inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1.5 font-mono text-[11px] font-semibold tabular-nums',
} as const;

/** A plain left click stays in-page (Radix switches the tab); anything else is a link. */
const keepInPage = (event: MouseEvent<HTMLAnchorElement>) => {
  if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
    event.preventDefault();
  }
};

/**
 * A page's section tabs: a tablist with count chips over `SectionTabPanel`s. Radix gives
 * it tablist/tab/tabpanel semantics and arrow-key navigation; pair it with
 * {@link useSectionTab} to keep the open section in the URL.
 */
export function SectionTabs<T extends string>({
  tabs,
  value,
  onValueChange,
  label,
  hrefFor,
  variant = 'underline',
  sticky = false,
  children,
  className,
  listClassName,
}: SectionTabsProps<T>) {
  const stickyStyle: CSSProperties | undefined = sticky
    ? { top: typeof sticky === 'object' ? (sticky.top ?? 0) : 0 }
    : undefined;

  return (
    <Tabs
      value={value}
      onValueChange={next => onValueChange(next as T)}
      className={cn('gap-[18px]', className)}
    >
      <div className={cn(sticky && 'sticky z-30')} style={stickyStyle}>
        <TabsList aria-label={label} className={cn(LIST[variant], listClassName)}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const body = (
              <>
                {Icon ? <Icon aria-hidden className='size-4' /> : null}
                <span>{tab.label}</span>
                {typeof tab.count === 'number' ? (
                  <span className={COUNT[variant]}>{tab.count}</span>
                ) : null}
              </>
            );
            return hrefFor ? (
              <TabsTrigger key={tab.id} value={tab.id} className={TRIGGER[variant]} asChild>
                <Link href={hrefFor(tab.id)} scroll={false} onClick={keepInPage}>
                  {body}
                </Link>
              </TabsTrigger>
            ) : (
              <TabsTrigger key={tab.id} value={tab.id} className={TRIGGER[variant]}>
                {body}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>
      {children}
    </Tabs>
  );
}

/**
 * One section's panel. Every panel is rendered, the inactive ones hidden, so the whole page
 * reaches the server-rendered HTML (crawlers index it) and switching tabs keeps state.
 */
export function SectionTabPanel({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <TabsContent value={value} forceMount className={cn('data-[state=inactive]:hidden', className)}>
      {children}
    </TabsContent>
  );
}

/* Link tabs -------------------------------------------------------------------------- */

export interface UnderlineTab {
  id: string;
  label: string;
  /** Shown as a count chip, e.g. items waiting on that tab. */
  count?: number;
  href: string;
}

/**
 * Link-only tab strip (the admin 360 pages): each tab is its own address, rendered as
 * navigation rather than a tablist. Prefer `SectionTabs` for new pages.
 */
export function UnderlineTabs({
  tabs,
  active,
  className,
}: {
  tabs: UnderlineTab[];
  active: string;
  className?: string;
}) {
  return (
    <div className={cn('border-border/70 flex gap-6 overflow-x-auto border-b', className)}>
      {tabs.map(tab => {
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            scroll={false}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              '-mb-px flex h-11 shrink-0 items-center gap-2 border-b-2 text-sm whitespace-nowrap transition-colors',
              isActive
                ? 'border-primary text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground border-transparent font-medium'
            )}
          >
            {tab.label}
            {typeof tab.count === 'number' && tab.count > 0 ? (
              <span
                className={cn(
                  'flex h-5 min-w-5 items-center justify-center rounded-sm px-1.5 font-mono text-[11px]',
                  isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
