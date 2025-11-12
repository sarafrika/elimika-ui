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
import { NavMain } from './nav-main';

export function AppSidebar({
  activeDomain,
  ...props
}: React.ComponentProps<typeof Sidebar> & { activeDomain: UserDomain }) {
  const trainingCenter = useTrainingCenter();
  const pathname = usePathname();

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

  const domainNavSections: Array<{ key: UserDomain; label: string }> = [
    { key: 'student', label: 'Student surfaces' },
    { key: 'instructor', label: 'Instructor surfaces' },
    { key: 'course_creator', label: 'Course creator surfaces' },
    { key: 'organisation_user', label: 'Organisation surfaces' },
  ];

  const shouldShowAllDomainNav = activeDomain === 'admin';

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
          />
        </SidebarGroupContent>

        {shouldShowAllDomainNav && (
          <div className='mt-6 space-y-4'>
            <SidebarGroupLabel>All domain workspaces</SidebarGroupLabel>
            <SidebarGroupContent className='space-y-4'>
              {domainNavSections.map(section => (
                <div
                  key={section.key}
                  className='rounded-2xl border border-border/60 bg-card/90 p-4 shadow-sm'
                >
                  <div className='text-sm font-semibold text-foreground'>{section.label}</div>
                  <div className='mt-2 rounded-xl border border-border/50 bg-muted/40 p-2'>
                    <NavMain
                      items={getMenuItems(section.key)}
                      activeDomain={section.key}
                      pathname={pathname}
                    />
                  </div>
                </div>
              ))}
            </SidebarGroupContent>
          </div>
        )}

        {/* Secondary menu */}
        <NavSecondary items={menu?.secondary ?? []} className='mt-auto' />
      </SidebarContent>
      <SidebarFooter>
        <NavUser items={menu?.user ?? []} />
      </SidebarFooter>
    </Sidebar>
  );
}
