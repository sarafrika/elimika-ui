'use client';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  useSidebar
} from '@/components/ui/sidebar';
import type { UserDomain } from '@/lib/types';
import menu, {
  isMenuGroups,
  type MenuGroup,
  type MenuItem,
} from '@/src/features/dashboard/config/menu';
import { buildWorkspaceAliasPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { SettingsSupportWidget } from '@/src/features/dashboard/settings/_components/settings-support-widget';
import { useOrganisation } from '@/src/features/organisation/context/organisation-context';
import { useUserProfile } from '@/src/features/profile/context/profile-context';
import { Menu } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type * as React from 'react';
import { NavMain } from './nav-main';
import { NavSecondary } from './nav-secondary';

const UNVERIFIED_ORGANISATION_MENU_PREFIXES = [
  '/dashboard/overview',
  '/dashboard/account',
  '/dashboard/profile',
];

function isUnverifiedOrganisationMenuItem(item: MenuItem) {
  if (!item.url) return false;
  return UNVERIFIED_ORGANISATION_MENU_PREFIXES.some(prefix => item.url?.startsWith(prefix));
}

export function AppSidebar({
  activeDomain,
  ...props
}: React.ComponentProps<typeof Sidebar> & { activeDomain: UserDomain }) {
  const { toggleSidebar } = useSidebar();
  const organisation = useOrganisation();
  const profile = useUserProfile();
  const pathname = usePathname();
  const isAdmin = profile?.user_domain?.includes('admin');
  const isOrganisationDomain =
    activeDomain === 'organisation' || activeDomain === 'organisation_user';
  const isUnverifiedOrganisation =
    isOrganisationDomain && organisation?.admin_verified !== true;

  // Helper to get menu items for a domain. Org nav is a MenuGroup[]; other
  // domains stay a flat MenuItem[].
  const getMenuItems = (domain: UserDomain): MenuItem[] | MenuGroup[] => {
    // Map 'organisation' domain to 'organisation_user' menu items
    const menuKey: Exclude<keyof typeof menu, 'main' | 'secondary' | 'user'> =
      domain === 'organisation' ? 'organisation_user' : domain;

    const domainItems = menu[menuKey] ?? [];

    if (!isUnverifiedOrganisation) return domainItems;

    if (isMenuGroups(domainItems)) {
      return domainItems
        .map(group => ({
          ...group,
          items: group.items.filter(isUnverifiedOrganisationMenuItem),
        }))
        .filter(group => group.items.length > 0);
    }

    return domainItems.filter(isUnverifiedOrganisationMenuItem);
  };



  return (
    <Sidebar variant='inset' collapsible='icon' {...props} className='p-0'>
      <SidebarHeader className='pt-2'>
        <div className='flex items-center gap-2 -ml-[6px]'>
          <div
            className="shrink-0 cursor-pointer hover:bg-primary/5 p-1.5 rounded-sm"
            onClick={() => toggleSidebar()}
          >
            <Menu size={20} />
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
              <span className='truncate font-bold capitalize text-[15px]'>
                {organisation?.name || 'Elimika'}
              </span>
              {isOrganisationDomain && (
                <span className='text-muted-foreground truncate text-xs'>
                  Organisation dashboard
                </span>
              )}
            </div>
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent
        className="
      overflow-y-auto
      [scrollbar-width:thin]
      [scrollbar-color:hsl(var(--border))_transparent]
      [&::-webkit-scrollbar]:w-2
      [&::-webkit-scrollbar-track]:bg-transparent
      [&::-webkit-scrollbar-thumb]:rounded-full
      [&::-webkit-scrollbar-thumb]:bg-border
      [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground
    "
      >
        {(() => {
          const navItems = getMenuItems(activeDomain);
          if (isMenuGroups(navItems)) {
            return navItems.map(group => (
              <SidebarGroup key={group.label} className='px-2 py-0.5'>
                <SidebarGroupLabel className='h-6'>{group.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <NavMain
                    items={group.items}
                    activeDomain={activeDomain}
                    pathname={pathname}
                    isAdmin={Boolean(isAdmin)}
                  />
                </SidebarGroupContent>
              </SidebarGroup>
            ));
          }
          return (
            <NavMain
              items={navItems}
              activeDomain={activeDomain}
              pathname={pathname}
              isAdmin={Boolean(isAdmin)}
            />
          );
        })()}

        <NavSecondary items={menu?.secondary ?? []} className='mt-auto' />
      </SidebarContent>

      <SidebarFooter className='w-full p-0'>
        {/* <NavUser items={menu?.user ?? []} /> */}
        <SettingsSupportWidget href={'/help'} />
      </SidebarFooter>
    </Sidebar>
  );
}
