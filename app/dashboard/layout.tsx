import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { TrainingCenterProvider } from "@/context/training-center-provider"
import { BreadcrumbProvider } from "@/context/breadcrumb-provider"
import { getUserProfile } from "@/services/user/actions"
import { redirect } from "next/navigation"
type Props = {
  instructor: React.ReactNode
  student: React.ReactNode
  admin: React.ReactNode
  children: React.ReactNode
}
export default async function DashboardLayout({
  instructor,
  student,
  admin,
  children
}: Props) {

  const userResponse = await getUserProfile()
  const userData = userResponse?.data?.content?.[0]
  if (
    !userData || (userData && !userData?.user_domain)

  ) {
    redirect("/onboarding")
  }
  const domain = userData.user_domain
  const activeChild = domain === "instructor" ? instructor : domain === "student" ? student : domain == 'organisation_user' ? admin : children
  return (
    <TrainingCenterProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <SidebarInset>
            <BreadcrumbProvider>
              <DashboardHeader />
              <div className="flex flex-1 flex-col gap-4 space-y-4 px-6 pt-0">
                {activeChild}
              </div>
            </BreadcrumbProvider>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </TrainingCenterProvider>
  )
}
