import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { TrainingCenterProvider } from "@/context/training-center-provider"
import { BreadcrumbProvider } from "@/context/breadcrumb-provider"
import { getUser } from "@/services/user/actions"
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
  children,
}: Props) {
  const userResponse = await getUser()
  if (
    userResponse.error &&
    userResponse.error.toString().includes("User not found")
  ) {
    redirect("/onboarding")
  }

  const user = userResponse.data
  console.log(user)

  return (
    <TrainingCenterProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <SidebarInset>
            <BreadcrumbProvider>
              <DashboardHeader />
              <div className="flex flex-1 flex-col gap-4 space-y-4 px-6 pt-0">
                {student}
              </div>
            </BreadcrumbProvider>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </TrainingCenterProvider>
  )
}
