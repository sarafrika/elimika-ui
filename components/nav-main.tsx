'use client';

import { markActiveMenuItem, type MenuItem } from '@/lib/menu';
import type { UserDomain } from '@/lib/types';
import Link from 'next/link';
import { useState } from 'react';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from './ui/sidebar';

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
  const markedItems = markActiveMenuItem(items, pathname);

  return (
    <SidebarMenu>
      {markedItems
        .filter(item => (item.requiresAdmin ? isAdmin : true))
        .map((item, index) =>
          item.domain && item.domain !== activeDomain ? null : (
            <MenuItemWithAccordion key={index} item={item} isAdmin={isAdmin} />
          )
        )}
    </SidebarMenu>
  );
}

// Recursive Accordion MenuItem
function MenuItemWithAccordion({ item, isAdmin }: { item: MenuItem; isAdmin: boolean }) {
  const [isOpen, setIsOpen] = useState(true); // set initial accordion open state t true
  // const [isOpen, setIsOpen] = useState(item.isActive ?? false);

  const hasChildren = item.items && item.items.length > 0;

  return (
    <SidebarMenuItem>
      {hasChildren ? (
        <>
          {/* Toggle Button for Accordion */}
          <SidebarMenuButton isActive={item.isActive} onClick={() => setIsOpen(!isOpen)}>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
          </SidebarMenuButton>

          {/* Nested Items */}
          {isOpen && (
            <SidebarMenu className='border-border/60 ml-4 border-l pl-4'>
              {item.items
                ?.filter(child => (child.requiresAdmin ? isAdmin : true))
                .map((child, index) => (
                  <MenuItemWithAccordion key={index} item={child} isAdmin={isAdmin} />
                ))}
            </SidebarMenu>
          )}
        </>
      ) : (
        <SidebarMenuButton isActive={item.isActive} asChild>
          <Link href={item.url!}>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      )}
    </SidebarMenuItem>
  );
}
