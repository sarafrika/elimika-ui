'use client';

import { ReactNode, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  AdminNavigationNode,
  matchAdminRouteByPath,
} from '@/app/dashboard/@admin/_components/admin-navigation';
import { AdminLayoutProvider } from './layout-context';
import { AdminNavigationMenu } from './admin-nav';
import { Button } from '@/components/ui/button';
import { AppBreadcrumb } from '@/components/ui/app-breadcrumb';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAdminLayout } from './layout-context';

export function AdminLayoutShell({
  navigation,
  children,
}: {
  navigation: AdminNavigationNode[];
  children: ReactNode;
}) {
  const pathname = usePathname() ?? '';
  const activeRoute = useMemo(() => matchAdminRouteByPath(pathname, navigation), [pathname, navigation]);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AdminLayoutProvider initialMeta={activeRoute ?? null}>
      <div className='flex flex-1 flex-col gap-6 lg:flex-row lg:gap-8'>
        <aside className='hidden w-full max-w-xs flex-shrink-0 lg:flex'>
          <div className='border-border/60 h-full w-full overflow-hidden rounded-xl border bg-card/40'>
            <AdminNavigationMenu navigation={navigation} activeRouteId={activeRoute?.id} />
          </div>
        </aside>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side='left' className='w-[280px] p-0'>
            <SheetHeader className='border-b px-4 py-4'>
              <SheetTitle>Admin navigation</SheetTitle>
            </SheetHeader>
            <AdminNavigationMenu
              navigation={navigation}
              activeRouteId={activeRoute?.id}
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <div className='flex min-h-[calc(100vh-10rem)] flex-1 flex-col rounded-xl border border-border/60 bg-background/60 shadow-sm backdrop-blur'>
          <AdminLayoutHeader onOpenNav={() => setMobileOpen(true)} />
          <main className='flex-1 overflow-x-hidden px-4 pb-10 pt-6 sm:px-6 lg:px-8'>{children}</main>
        </div>
      </div>
    </AdminLayoutProvider>
  );
}

function AdminLayoutHeader({ onOpenNav }: { onOpenNav: () => void }) {
  const { pageMeta } = useAdminLayout();

  return (
    <header className='border-b border-border/60 bg-background/80 px-4 py-4 backdrop-blur-sm sm:px-6'>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <div className='flex items-start gap-3 lg:items-center'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='lg:hidden'
            onClick={onOpenNav}
          >
            <Menu className='h-4 w-4' />
            <span className='sr-only'>Open navigation</span>
          </Button>
          <div>
            <p className='text-muted-foreground text-xs font-semibold uppercase tracking-wide'>Admin</p>
            <h1 className='text-xl font-semibold leading-tight sm:text-2xl'>
              {pageMeta?.title ?? 'Admin Dashboard'}
            </h1>
            {pageMeta?.description && (
              <p className='text-muted-foreground mt-1 max-w-2xl text-sm'>{pageMeta.description}</p>
            )}
          </div>
        </div>
        <div className='hidden lg:block'>
          <AppBreadcrumb />
        </div>
      </div>
      <div className={cn('mt-3 lg:hidden', !pageMeta?.breadcrumbs?.length && 'hidden')}>
        <AppBreadcrumb />
      </div>
    </header>
  );
}
