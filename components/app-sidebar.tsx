'use client';
import { NavSecondary } from '@/components/nav-secondary';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import menu from '@/lib/menu';
import { UserDomain } from '@/lib/types';
import { LibraryBigIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { useTrainingCenter } from '../context/training-center-provide';
import { useUserProfile } from '../context/profile-context';
import { NavMain } from './nav-main';

export function AppSidebar({
  activeDomain,
  ...props
}: React.ComponentProps<typeof Sidebar> & { activeDomain: UserDomain }) {
  const trainingCenter = useTrainingCenter();
  const profile = useUserProfile();
  const pathname = usePathname();
  const isAdmin = profile?.user_domain?.includes('admin');

  // Helper to get menu items for a domain
  const getMenuItems = (domain: UserDomain) => {
    // Map 'organisation' domain to 'organisation_user' menu items
    const menuKey = domain === 'organisation' ? 'organisation_user' : domain;
    return (menu as any)[menuKey] || [];
  };

  const formatDomainName = (domain: string) =>
    domain
      .split('_')
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

  // Label for the sidebar group
  const groupLabel = activeDomain ? `${formatDomainName(activeDomain)} Panel` : 'Panel';

  return (
    <Sidebar variant='inset' {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size='lg' asChild>
              <Link prefetch href={`/dashboard/overview`}>
                <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
                  <LibraryBigIcon className='size-4' />
                </div>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-medium capitalize'>
                    {trainingCenter?.name || 'Elimika'}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroupContent>
          <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>
          <NavMain
            items={getMenuItems(activeDomain)}
            activeDomain={activeDomain}
            pathname={pathname}
            isAdmin={Boolean(isAdmin)}
          />
        </SidebarGroupContent>

        {/* Secondary menu */}
        <NavSecondary items={menu?.secondary ?? []} className='mt-auto' />
      </SidebarContent>
      <SidebarFooter>
        <NavUser items={menu?.user ?? []} />
      </SidebarFooter>
    </Sidebar>
  );
}
