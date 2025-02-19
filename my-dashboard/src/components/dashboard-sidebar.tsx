"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BarChart3, FileText, Users, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const menuItems = [
    {
      title: "Statistics",
      icon: BarChart3,
      href: "/dashboard/statistics",
    },
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
  ]

  const handleLogout = () => {
    // Clear authentication token
    localStorage.removeItem("token")
    // Redirect to login page
    router.push("/login")
  }

  return (
    <div className="flex h-full flex-col">
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
      <div className="p-4 mt-auto border-t">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 text-gray-400" />
          Logout
        </Button>
      </div>
    </div>
  )
}

