import { AppSidebar } from "@/components/app-sidebar"
import ProtectedRoute from "@/components/protected-route"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { TrainingCenterProvider } from "@/context/training-center-provider"
import { BreadcrumbProvider } from "@/context/breadcrumb-provider"
import { UsersApiService } from "@/api-client"
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

  return (
    <ProtectedRoute>
      <TrainingCenterProvider>
        <SidebarProvider>
          <div className="flex min-h-screen w-full">
            <AppSidebar />
            <SidebarInset>
              <BreadcrumbProvider>
                <DashboardHeader />
                <div className="flex flex-1 flex-col gap-4 space-y-4 px-6 pt-0">
                  {children}
                </div>
              </BreadcrumbProvider>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </TrainingCenterProvider>
    </ProtectedRoute>
  )
}
