import type React from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Sidebar, SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="flex w-full min-h-svh bg-gray-50">
        <Sidebar>
          <DashboardSidebar />
        </Sidebar>
        <SidebarInset className="p-0">
          <div className="p-4">
            <SidebarTrigger className="mb-4" />
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

