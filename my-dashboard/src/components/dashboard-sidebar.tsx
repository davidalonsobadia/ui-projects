"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, FileText, Users } from "lucide-react"

export function DashboardSidebar() {
  const pathname = usePathname()

  const menuItems = [
    {
      title: "Users",
      icon: Users,
      href: "/dashboard/users",
    },
    {
      title: "Proofs",
      icon: FileText,
      href: "/dashboard/proofs",
    },
    {
      title: "Statistics",
      icon: BarChart3,
      href: "/dashboard/statistics",
    },
  ]

  return (
    <div className="flex h-screen flex-col">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900">Admin Dashboard</h2>
      </div>
      <nav className="flex-1 space-y-1 px-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? "bg-green-50 text-green-600" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? "text-green-600" : "text-gray-400"}`} />
              {item.title}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

