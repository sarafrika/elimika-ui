'use client';

import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

const sections = [
  { name: 'General', href: '/dashboard/profile/general' },
  { name: 'Guardian Information', href: '/dashboard/profile/guardian-information' },
];

export default function ProfileLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className='relative min-h-screen p-0'>
      {/* <Sidebar
        variant="inset"
        className="relative w-64 border-r bg-white p-0"
        collapsible="none"
      >
        <SidebarContent className="border-none bg-white">
          <SidebarGroup>
            <SidebarGroupLabel className="px-4 py-2 text-sm text-gray-500">
              PROFILE SETTINGS
            </SidebarGroupLabel>
            <SidebarMenu className="space-y-1 px-2">
              {sections.map((section) => (
                <SidebarMenuItem key={section.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === section.href}
                    className="w-full rounded px-4 py-2 text-left transition hover:bg-gray-100"
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
      </Sidebar> */}

      <main className='flex-1 flex flex-col overflow-auto px-6 py-3 gap-8'>
        <ul className="flex gap-5 mt-4 ">
          {sections.map(sec => {
            const isActive = pathname.startsWith(sec.href);

            return (
              <li key={sec.name}>
                <Link
                  href={sec.href}
                  className={`px-3 py-1 rounded-md transition-colors ${isActive ? 'bg-gray-200 text-black' : 'hover:bg-gray-100 text-gray-700'
                    }`}
                >
                  {sec.name}
                </Link>
              </li>
            );
          })}
        </ul>
        <Separator />

        {children}
      </main>
    </div>
  );
}
