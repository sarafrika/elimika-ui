'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import clsx from 'clsx';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';

const sections = [
  { name: 'General', href: '/dashboard/profile/general' },
  { name: 'Education', href: '/dashboard/profile/education' },
  { name: 'Experience', href: '/dashboard/profile/experience' },
  {
    name: 'Professional Memberships',
    href: '/dashboard/profile/professional-membership',
  },
  { name: 'Skills', href: '/dashboard/profile/skills' },
  { name: 'Training Areas', href: '/dashboard/profile/training-areas' },
  { name: 'Availability & Rates', href: '/dashboard/profile/availability' },
];

export default function ProfileLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(typeof window !== 'undefined' && window.innerWidth <= 745);
      if (typeof window !== 'undefined' && window.innerWidth > 745) {
        setShowSidebar(true); // Always show sidebar on desktop
      } else {
        setShowSidebar(false); // Hide sidebar by default on mobile
      }
    };

    checkMobile();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  return (
    <div className='relative flex min-h-screen p-0'>
      {(showSidebar || !isMobile) && (
        <Sidebar
          variant='inset'
          className={clsx(
            'z-50 border-r bg-white p-0 transition-all',
            isMobile ? 'fixed inset-y-0 right-0 w-64 pt-8 shadow-lg' : 'relative w-64'
          )}
          collapsible='none'
        >
          <SidebarContent className='h-full border-none'>
            <SidebarGroup>
              <SidebarGroupLabel
                onClick={() => setShowSidebar(false)}
                className='flex items-center justify-between px-4 text-sm text-gray-500'
              >
                <span>PROFILE SETTINGS</span>
                {isMobile && (
                  <button className='text-gray-500 hover:text-gray-800' aria-label='Close Sidebar'>
                    <ChevronsLeft size={16} />
                  </button>
                )}
              </SidebarGroupLabel>
              <SidebarMenu className='space-y-1 px-2'>
                {sections.map(section => (
                  <SidebarMenuItem key={section.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === section.href}
                      className='w-full rounded px-4 py-2 text-left transition hover:bg-gray-100'
                      onClick={() => isMobile && setShowSidebar(false)} // close sidebar on menu click in mobile
                    >
                      <Link href={section.href}>
                        <span>{section.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      )}

      <main className='relative flex-1 overflow-auto px-6 py-3'>
        {/* Show open button on mobile only when sidebar is closed */}
        {isMobile && !showSidebar && (
          <div
            onClick={() => setShowSidebar(true)}
            className='mt-4 mb-4 flex w-fit items-center justify-between gap-2 text-sm text-gray-500'
          >
            <span>PROFILE SETTINGS</span>
            <button className='text-gray-500 hover:text-gray-800' aria-label='Open Sidebar'>
              <ChevronsRight size={20} />
            </button>
          </div>
        )}

        {/* Makeup for space when profile setting is shown on sidebar */}
        {showSidebar && <div className='mb-4 h-9' />}

        <div>{children}</div>
      </main>
    </div>
  );
}
