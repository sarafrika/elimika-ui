'use client';

import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchState } from '@/hooks/use-search-state';
import { enumParam } from '@/lib/search-state';
import { cn } from '@/lib/utils';
import { errorCountLabel } from './tab-errors';

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

export { type FieldToTab } from './tab-errors';
export { usePinnedNavHeight } from './use-pinned-nav-height';
/** Form section tabs: map react-hook-form errors to tab badges and jump to the first. */
export { useTabErrors } from './use-tab-errors';

/* Tabs ------------------------------------------------------------------------------- */

export interface SectionTab<T extends string = string> {
  id: T;
  label: string;
  /** Shown as a count chip. Omit, or pass null, for a section without a count. */
  count?: number | null;
  icon?: LucideIcon;
  /**
   * Failing form fields on this section. Above zero, the tab shows a destructive badge and
   * is described as "N errors". `SectionTabs`' `errorCounts` sets the same thing in one go.
   */
  errorCount?: number | null;
  /**
   * A short status chip after the count, e.g. "2 clashes" or "No rate yet", which the tab
   * is also described by. An error count renders as the `danger` tone of the same chip.
   */
  flag?: SectionTabFlag | null;
}

export interface SectionTabFlag {
  label: string;
  tone: 'warning' | 'danger' | 'muted';
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
  /**
   * Extra classes for the pinned bar (only used with `sticky`), e.g. `bg-card` on a page
   * whose surface is a card. It already has a solid `bg-background` and a shadow once stuck.
   */
  stickyClassName?: string;
  /**
   * Failing form fields per section, e.g. `useTabErrors(form, …).counts`. Takes precedence
   * over a tab's own `errorCount`.
   */
  errorCounts?: Partial<Record<T, number>>;
};

const LIST = {
  underline:
    'thin-scrollbar h-auto w-full justify-start gap-6 overflow-x-auto overflow-y-hidden rounded-none bg-transparent p-0 shadow-[inset_0_-1px_0_0_var(--color-border)]',
  pill: 'thin-scrollbar bg-card h-auto w-full justify-start gap-1 overflow-x-auto overflow-y-hidden rounded-2xl border p-1.5',
} as const;

const TRIGGER = {
  underline:
    'group text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-primary h-11 flex-none gap-2 rounded-none border-0 border-b-2 border-transparent px-0 text-sm font-medium data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:shadow-none',
  pill: 'group text-muted-foreground hover:text-foreground data-[state=active]:bg-primary/10 data-[state=active]:text-primary h-11 flex-none gap-2 rounded-[10px] px-4 text-sm font-medium data-[state=active]:font-semibold data-[state=active]:shadow-none',
} as const;

/** Status chips (flags and error counts): one shape, toned with tokens, never a raw red. */
const FLAG_BASE =
  'inline-flex h-5 items-center rounded-full border px-2 text-[11px] font-semibold whitespace-nowrap';
const FLAG_TONE: Record<SectionTabFlag['tone'], string> = {
  danger: 'border-destructive bg-destructive text-destructive-foreground',
  warning: 'border-warning/50 bg-warning/15 text-foreground',
  muted: 'border-border bg-muted text-muted-foreground',
};

function TabFlag({ id, flag }: { id: string; flag: SectionTabFlag }) {
  return (
    <span id={id} className={cn(FLAG_BASE, FLAG_TONE[flag.tone])}>
      {flag.label}
    </span>
  );
}

const COUNT = {
  underline:
    'bg-muted text-muted-foreground group-data-[state=active]:bg-primary group-data-[state=active]:text-primary-foreground flex h-5 min-w-5 items-center justify-center rounded-sm px-1.5 font-mono text-[11px]',
  pill: 'bg-muted text-muted-foreground group-data-[state=active]:bg-primary group-data-[state=active]:text-primary-foreground inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1.5 font-mono text-[11px] font-semibold tabular-nums',
} as const;

/** The nearest scrolling ancestor: dashboards scroll an inner pane, not the window. */
function scrollParent(element: HTMLElement): HTMLElement | null {
  for (let node = element.parentElement; node; node = node.parentElement) {
    if (/(auto|scroll|overlay)/.test(getComputedStyle(node).overflowY)) return node;
  }
  return null;
}

/**
 * Whether a sticky bar is pinned right now, so it can lift itself off the content below.
 * Watches the bar against its scroll container shrunk by its own `top` offset: once pinned,
 * its top edge pokes above that line.
 */
function useStuck(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!enabled || !element || typeof IntersectionObserver === 'undefined') {
      setStuck(false);
      return;
    }
    const offset = Number.parseFloat(getComputedStyle(element).top) || 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        const lineTop = entry.rootBounds?.top ?? 0;
        setStuck(entry.intersectionRatio < 1 && entry.boundingClientRect.top < lineTop);
      },
      {
        root: scrollParent(element),
        rootMargin: `-${offset + 1}px 0px 0px 0px`,
        threshold: [1],
      }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled]);

  return { ref, stuck };
}

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
  stickyClassName,
  errorCounts,
}: SectionTabsProps<T>) {
  const baseId = useId();
  const { ref: stickyRef, stuck } = useStuck(Boolean(sticky));
  const stickyStyle: CSSProperties | undefined = sticky
    ? { top: typeof sticky === 'object' ? (sticky.top ?? 0) : 0 }
    : undefined;

  return (
    <Tabs
      value={value}
      onValueChange={next => onValueChange(next as T)}
      className={cn('gap-[18px]', className)}
    >
      <div
        ref={sticky ? stickyRef : undefined}
        data-stuck={sticky ? stuck : undefined}
        className={cn(
          // Printing shows every panel, so the strip that switches between them goes.
          'print:hidden',
          sticky && 'bg-background sticky z-30 transition-shadow data-[stuck=true]:shadow-sm',
          sticky && stickyClassName
        )}
        style={stickyStyle}
      >
        <TabsList aria-label={label} className={cn(LIST[variant], listClassName)}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const errors = errorCounts?.[tab.id] ?? tab.errorCount ?? 0;
            const errorId = errors > 0 ? `${baseId}-${tab.id}-errors` : undefined;
            const flagId = tab.flag ? `${baseId}-${tab.id}-flag` : undefined;
            const describedBy = [errorId, flagId].filter(Boolean).join(' ') || undefined;
            const body = (
              <>
                {Icon ? <Icon aria-hidden className='size-4' /> : null}
                <span>{tab.label}</span>
                {typeof tab.count === 'number' ? (
                  <span className={COUNT[variant]}>{tab.count}</span>
                ) : null}
                {tab.flag && flagId ? <TabFlag id={flagId} flag={tab.flag} /> : null}
                {errorId ? (
                  <TabFlag id={errorId} flag={{ label: errorCountLabel(errors), tone: 'danger' }} />
                ) : null}
              </>
            );
            return hrefFor ? (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={TRIGGER[variant]}
                aria-describedby={describedBy}
                asChild
              >
                <Link href={hrefFor(tab.id)} scroll={false} onClick={keepInPage}>
                  {body}
                </Link>
              </TabsTrigger>
            ) : (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={TRIGGER[variant]}
                aria-describedby={describedBy}
              >
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
 * reaches the server-rendered HTML (crawlers index it), switching tabs keeps state, and a
 * form's fields on a closed tab stay registered and validated. Printing shows every panel.
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
    <TabsContent
      value={value}
      forceMount
      className={cn('data-[state=inactive]:hidden print:block!', className)}
    >
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
    <div className={cn('flex gap-6 overflow-x-auto overflow-y-hidden shadow-[inset_0_-1px_0_0_var(--color-border)]', className)}>
      {tabs.map(tab => {
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            scroll={false}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex h-11 shrink-0 items-center gap-2 border-b-2 text-sm whitespace-nowrap transition-colors',
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
