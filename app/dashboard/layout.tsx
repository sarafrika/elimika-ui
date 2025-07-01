import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { TrainingCenterProvider } from "@/context/training-center-provider"
import { BreadcrumbProvider } from "@/context/breadcrumb-provider"
import { getUserProfile } from "@/services/user/actions"
import { redirect } from "next/navigation"
import { DashboardViewProvider } from "@/components/dashboard-view-context"
import { UserDomain } from "@/lib/types"
import DashboardLayoutContent from "@/components/dashboard-layout-content"
import DashboardTopBar from "@/components/dashboard-top-bar"
import DashboardMainContent from "@/components/dashboard-main-content"

// Helper to get the default view and available views
function getDashboardViews(userDomains: UserDomain[]): {
  initialView: "student" | "admin"
  availableViews: ("student" | "admin")[]
} {
  const hasStudent = userDomains.includes("student")
  const hasAdmin = userDomains.includes("admin")
  if (hasStudent && hasAdmin) {
    return { initialView: "student", availableViews: ["student", "admin"] }
  } else if (hasAdmin) {
    return { initialView: "admin", availableViews: ["admin"] }
  } else {
    return { initialView: "student", availableViews: ["student"] }
  }
}

export default async function DashboardLayout({
  instructor,
  student,
  admin,
  organization,
  children,
}: any) {
  const userResponse = await getUserProfile()
  const userData = userResponse?.data?.content?.[0]
  if (!userData || (userData && userData.user_domain?.length == 0)) {
    redirect("/onboarding")
  }
  let userDomains = userData.user_domain || []
  // Ensure all student users have admin access
  if (userDomains.includes("student") && !userDomains.includes("admin")) {
    userDomains = [...userDomains, "admin"]
  }
  const { initialView, availableViews } = getDashboardViews(userDomains)

  return (
    <TrainingCenterProvider>
      <SidebarProvider>
        <DashboardViewProvider
          initialView={initialView}
          availableViews={availableViews}
        >
          <BreadcrumbProvider>
            <div className="flex min-h-screen w-full">
              {/* Sidebar */}
              <DashboardLayoutContent
                student={student}
                admin={admin}
                instructor={instructor}
                organization={organization}
                children={children}
              />
              {/* Main content area */}
              <div className="flex w-full flex-1 flex-col">
                <DashboardMainContent
                  student={student}
                  admin={admin}
                  instructor={instructor}
                  organization={organization}
                  children={children}
                />
              </div>
            </div>
          </BreadcrumbProvider>
        </DashboardViewProvider>
      </SidebarProvider>
    </TrainingCenterProvider>
  )
}
