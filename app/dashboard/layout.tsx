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
  initialView: "student" | "admin" | "instructor" | "organisation_user"
  availableViews: ("student" | "admin" | "instructor" | "organisation_user")[]
} {
  // If organization user, only show organization view
  if (userDomains.includes("organisation_user")) {
    return {
      initialView: "organisation_user",
      availableViews: ["organisation_user"],
    }
  }
  // If instructor and admin, allow toggling
  const availableViews = Array.from(
    new Set(
      userDomains.filter(
        (d) => d === "student" || d === "admin" || d === "instructor",
      ),
    ),
  ) as ("student" | "admin" | "instructor")[]
  // Default to instructor if present, else student, else admin
  let initialView: "student" | "admin" | "instructor" = availableViews.includes(
    "instructor",
  )
    ? "instructor"
    : availableViews.includes("student")
      ? "student"
      : availableViews[0] || "student"
  return { initialView, availableViews }
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
  // Ensure all instructors have admin access
  if (userDomains.includes("instructor") && !userDomains.includes("admin")) {
    userDomains = [...userDomains, "admin"]
  }
  const { initialView, availableViews } = getDashboardViews(userDomains)

  // If organisation_user, do not use DashboardViewProvider
  if (initialView === "organisation_user") {
    return (
      <TrainingCenterProvider>
        <SidebarProvider>
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
        </SidebarProvider>
      </TrainingCenterProvider>
    )
  }

  // For student, admin, instructor
  // Filter out 'organisation_user' for DashboardViewProvider
  const filteredViews = availableViews.filter(
    (v) => v !== "organisation_user",
  ) as ("student" | "admin" | "instructor")[]
  return (
    <TrainingCenterProvider>
      <SidebarProvider>
        <DashboardViewProvider
          initialView={initialView as "student" | "admin" | "instructor"}
          availableViews={filteredViews}
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
