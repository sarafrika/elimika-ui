"use client"

import React from "react"
import {
    LayoutDashboard,
    Users,
    Building2,
} from "lucide-react"
import {
    Sidebar,
    SidebarContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarGroupContent,
    SidebarGroupLabel,
} from "@/components/ui/sidebar"
import Link from "next/link"

const adminMenuItems = [
    {
        title: "Overview",
        url: "/dashboard/overview",
        icon: LayoutDashboard,
    },
    {
        title: "Instructors",
        url: "/dashboard/instructors",
        icon: Users,
    },
    {
        title: "Organizations",
        url: "/dashboard/organizations",
        icon: Building2,
    },
]

function AdminSidebar(): React.JSX.Element {
    return (
        <Sidebar>
            <SidebarContent>
                <SidebarGroupLabel>Admin Panel</SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenu>
                        {adminMenuItems.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild>
                                    <Link href={item.url}>
                                        <item.icon />
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarContent>
        </Sidebar>

    )
}

export default AdminSidebar
