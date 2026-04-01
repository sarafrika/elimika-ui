'use client';

import { markActiveMenuItem, type MenuItem } from '@/lib/menu';
import type { UserDomain } from '@/lib/types';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from './ui/sidebar';

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
  const { state } = useSidebar();
  const [isOpen, setIsOpen] = useState(item.isActive ?? true);

  const hasChildren = item.items && item.items.length > 0;
  const isCollapsed = state === 'collapsed';
  const shouldShowChildren = hasChildren && isOpen && !isCollapsed;

  return (
    <SidebarMenuItem>
      {hasChildren ? (
        <>
          <SidebarMenuButton
            isActive={item.isActive}
            tooltip={item.title}
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isCollapsed ? undefined : isOpen}
            className='group/menu-button'
          >
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            <ChevronRight
              className={`ml-auto size-4 transition-transform group-data-[collapsible=icon]:hidden ${isOpen ? 'rotate-90' : ''
                }`}
            />
          </SidebarMenuButton>

          {shouldShowChildren && (
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
        <SidebarMenuButton isActive={item.isActive} asChild tooltip={item.title}>
          <Link href={item.url!}>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      )}
    </SidebarMenuItem>
  );
}
