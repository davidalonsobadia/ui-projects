import type React from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="w-64 border-r bg-white">
        <DashboardSidebar />
      </div>
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}

