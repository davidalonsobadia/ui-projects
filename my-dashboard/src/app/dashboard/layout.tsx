import type React from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex w-full min-h-svh bg-gray-50">
      <div className="w-64 border-r bg-white">
        <DashboardSidebar />
      </div>
      <main className="flex-1 w-full p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

