import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { cookies } from "next/headers"

import { SidebarProvider } from "@/components/ui/sidebar"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar:state")?.value === "true"

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider>
          <SidebarProvider defaultOpen={defaultOpen}>{children}</SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

