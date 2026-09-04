'use client';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { UserDomain } from '@/lib/types';
import { type MenuItem, markActiveMenuItem } from '@/src/features/dashboard/config/menu';
import { roleScopedDashboardPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { toBareDashboardPath } from '@/src/features/dashboard/lib/dashboard-url';
import Link from 'next/link';
import { useState } from 'react';

export function NavMain({
  items,
  activeDomain,
  pathname,
  isAdmin = false,
}: {
  items: MenuItem[];
  activeDomain: UserDomain | null;
  pathname: string;
  isAdmin?: boolean;
}) {
  // Menu urls are bare (/dashboard/courses); the live pathname is role-scoped
  // (/dashboard/<segment>/courses). Strip the segment before active-state matching.
  const markedItems = markActiveMenuItem(items, toBareDashboardPath(pathname));

  const visibleItems = markedItems.filter(
    item => (item.requiresAdmin ? isAdmin : true) && (!item.domain || item.domain === activeDomain)
  );

  return (
    <>
      {visibleItems.map((item, index) => {
        const isCategoryGroup = Boolean(item.items && item.items.length > 0) && !item.url;

        if (isCategoryGroup) {
          const children = (item.items ?? []).filter(child =>
            child.requiresAdmin ? isAdmin : true
          );

          if (children.length === 0) return null;

          return (
            <SidebarGroup className='-space-y-2' key={`${item.title}-${index}`}>
              <SidebarGroupLabel className='text-sidebar-foreground/50 -mt-3 mb-[1px] text-xs font-medium tracking-wide'>
                {item.title}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {children.map((child, childIndex) => (
                    <MenuItemWithAccordion
                      key={childIndex}
                      item={child}
                      isAdmin={isAdmin}
                      activeDomain={activeDomain}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        }

        // Fallback: an ungrouped top-level item (e.g. a real accordion submenu like "Course Management",
        // or a plain link) — keeps the original behavior untouched.
        return (
          <SidebarMenu key={`${item.title}-${index}`}>
            <MenuItemWithAccordion item={item} isAdmin={isAdmin} activeDomain={activeDomain} />
          </SidebarMenu>
        );
      })}
    </>
  );
}

// Recursive Accordion MenuItem
function MenuItemWithAccordion({
  item,
  isAdmin,
  activeDomain,
}: {
  item: MenuItem;
  isAdmin: boolean;
  activeDomain: UserDomain | null;
}) {
  const [isOpen, setIsOpen] = useState(true); // set initial accordion open state t true
  // const [isOpen, setIsOpen] = useState(item.isActive ?? false);

  const hasChildren = item.items && item.items.length > 0;

  return (
    <SidebarMenuItem>
      {hasChildren ? (
        <>
          {/* Toggle Button for Accordion */}
          <SidebarMenuButton
            isActive={item.isActive}
            onClick={() => setIsOpen(!isOpen)}
            tooltip={item.title}
          >
            {item.icon && <item.icon />}
            <span>{item.title}</span>
          </SidebarMenuButton>

          {/* Nested Items */}
          {isOpen && (
            <SidebarMenu className='border-border/60 border-l pl-4'>
              {item.items
                ?.filter(child => (child.requiresAdmin ? isAdmin : true))
                .map((child, index) => (
                  <MenuItemWithAccordion
                    key={index}
                    item={child}
                    isAdmin={isAdmin}
                    activeDomain={activeDomain}
                  />
                ))}
            </SidebarMenu>
          )}
        </>
      ) : (
        <SidebarMenuButton isActive={item.isActive} asChild tooltip={item.title}>
          <Link href={roleScopedDashboardPath(activeDomain, item.url!)}>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      )}
    </SidebarMenuItem>
  );
}
