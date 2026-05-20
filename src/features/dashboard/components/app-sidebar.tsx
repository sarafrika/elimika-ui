'use client';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';
import type { UserDomain } from '@/lib/types';
import menu, { type MenuItem } from '@/src/features/dashboard/config/menu';
import { buildWorkspaceAliasPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { SettingsSupportWidget } from '@/src/features/dashboard/settings/_components/settings-support-widget';
import { useOrganisation } from '@/src/features/organisation/context/organisation-context';
import { useUserProfile } from '@/src/features/profile/context/profile-context';
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
    <Sidebar variant='inset' {...props} className='px-1'>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size='lg' asChild>
              <Link prefetch href={buildWorkspaceAliasPath(activeDomain, '/dashboard/overview')}>
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
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-medium capitalize'>
                    {organisation?.name || 'Elimika'}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroupContent>
          {/* <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel> */}
          <NavMain
            items={getMenuItems(activeDomain)}
            activeDomain={activeDomain}
            pathname={pathname}
            isAdmin={Boolean(isAdmin)}
          />
        </SidebarGroupContent>

        <NavSecondary items={menu?.secondary ?? []} className='mt-auto' />
      </SidebarContent>
      <SidebarFooter className='gap-3'>
        {/* <NavUser items={menu?.user ?? []} /> */}

        <SettingsSupportWidget href={'/help'} />

        <div className="flex justify-between rounded-md border border-border/70 bg-muted/60 px-4 py-2 text-xs">
          <p>© 2026 Elimika.</p>
          <p>v.1.0.0</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
