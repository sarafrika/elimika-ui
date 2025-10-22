'use client';

import { markActiveMenuItem, MenuItem } from '@/lib/menu';
import { UserDomain } from '@/lib/types';
import Link from 'next/link';
import { useState } from 'react';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from './ui/sidebar';

export function NavMain({
  items,
  activeDomain,
  pathname,
}: {
  items: MenuItem[];
  activeDomain: UserDomain | null;
  pathname: string;
}) {
  const markedItems = markActiveMenuItem(items, pathname);

  return (
    <SidebarMenu>
      {markedItems.map((item, index) =>
        item.domain && item.domain !== activeDomain ? null : (
          <MenuItemWithAccordion key={index} item={item} />
        )
      )}
    </SidebarMenu>
  );
}

// Recursive Accordion MenuItem
function MenuItemWithAccordion({ item }: { item: MenuItem }) {
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
            <SidebarMenu className='ml-4 border-l border-border/60 pl-4'>
              {item.items!.map((child, index) => (
                <MenuItemWithAccordion key={index} item={child} />
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
