'use client';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar
} from '@/components/ui/sidebar';
import type { UserDomain } from '@/lib/types';
import menu, { type MenuItem } from '@/src/features/dashboard/config/menu';
import { buildWorkspaceAliasPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { SettingsSupportWidget } from '@/src/features/dashboard/settings/_components/settings-support-widget';
import { useOrganisation } from '@/src/features/organisation/context/organisation-context';
import { useUserProfile } from '@/src/features/profile/context/profile-context';
import { MoreHorizontalIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type * as React from 'react';
import { NavMain } from './nav-main';
import { NavSecondary } from './nav-secondary';

export function AppSidebar({
  activeDomain,
  ...props
}: React.ComponentProps<typeof Sidebar> & { activeDomain: UserDomain }) {
  const { toggleSidebar } = useSidebar();
  const organisation = useOrganisation();
  const profile = useUserProfile();
  const pathname = usePathname();
  const isAdmin = profile?.user_domain?.includes('admin');

  // Helper to get menu items for a domain
  const getMenuItems = (domain: UserDomain): MenuItem[] => {
    // Map 'organisation' domain to 'organisation_user' menu items
    const menuKey: Exclude<keyof typeof menu, 'main' | 'secondary' | 'user'> =
      domain === 'organisation' ? 'organisation_user' : domain;

    return menu[menuKey] ?? [];
  };



  return (
    <Sidebar variant='inset' collapsible='icon' {...props} className='px-1'>
      <SidebarHeader className='pt-2'>
        <div className='flex items-center gap-2 -ml-[6px]'>
          <div
            className="shrink-0 cursor-pointer hover:bg-primary/5 p-1.5 rounded-sm"
            onClick={() => toggleSidebar()}
          >
            <MoreHorizontalIcon size={20} />
          </div>

          <Link
            className='flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-sidebar-accent group-data-[collapsible=icon]:hidden'
            prefetch
            href={buildWorkspaceAliasPath(activeDomain, '/dashboard/overview')}
          >
            <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
              <Image
                alt='Elimika logo in white'
                src='/logos/elimika/Artboard 12.svg'
                width={40}
                height={60}
                className='h-20 w-20 drop-shadow-sm'
                priority
              />
            </div>

            <div className='grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden'>
              <span className='truncate font-medium capitalize'>
                {organisation?.name || 'Elimika'}
              </span>
            </div>
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={getMenuItems(activeDomain)}
          activeDomain={activeDomain}
          pathname={pathname}
          isAdmin={Boolean(isAdmin)}
        />

        <NavSecondary items={menu?.secondary ?? []} className='mt-auto' />
      </SidebarContent>
      <SidebarFooter className='w-full gap-3 px-0'>
        {/* <NavUser items={menu?.user ?? []} /> */}
        <SettingsSupportWidget href={'/help'} />
      </SidebarFooter>
    </Sidebar>
  );
}
