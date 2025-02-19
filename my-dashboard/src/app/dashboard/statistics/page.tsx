"use client"

import { useEffect, useState } from "react"
import { Users } from "lucide-react"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Statistics {
  userTypes: {
    freemium: number
    premium: number
    totalUsers: number
    conversionRate: string
  }
  recentActivity: {
    newUsersToday: number
    newUsersThisWeek: number
    newUsersThisMonth: number
  }
  topCountries: Array<{
    country: string
    users: number
    percentage: string
  }>
  userGrowth: Array<{
    month: string
    freemium: number
    premium: number
  }>
  onboardingSuccess: {
    completed: number
    inProgress: number
    stalled: number
    completionRate: string
  }
}

export default function StatisticsPage() {
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStatistics() {
      try {
        const response = await fetch("/api/statistics")
        const data = await response.json()
        setStatistics(data)
      } catch (error) {
        console.error("Error fetching statistics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStatistics()
  }, [])

  if (loading || !statistics) {
    return <div>Loading statistics...</div>
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.userTypes.totalUsers}</div>
            <div className="text-xs text-muted-foreground">
              {statistics.recentActivity.newUsersThisMonth} new this month
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.userTypes.premium}</div>
            <div className="text-xs text-muted-foreground">Conversion rate: {statistics.userTypes.conversionRate}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Freemium Users</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.userTypes.freemium}</div>
            <div className="text-xs text-muted-foreground">{statistics.recentActivity.newUsersToday} new today</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Onboarding Success</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.onboardingSuccess.completionRate}</div>
            <div className="text-xs text-muted-foreground">{statistics.onboardingSuccess.completed} completed</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={statistics.userGrowth}>
                  <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip />
                  <Line type="monotone" dataKey="premium" stroke="#16a34a" strokeWidth={2} dot={{ strokeWidth: 4 }} />
                  <Line type="monotone" dataKey="freemium" stroke="#94a3b8" strokeWidth={2} dot={{ strokeWidth: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Countries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statistics.topCountries.map((country) => (
                <div key={country.country} className="flex items-center">
                  <div className="w-[140px] font-medium">{country.country}</div>
                  <div className="flex-1">
                    <div className="h-2 w-full rounded-full bg-gray-100">
                      <div className="h-2 rounded-full bg-green-600" style={{ width: country.percentage }} />
                    </div>
                  </div>
                  <div className="ml-4 w-[60px] text-right text-sm text-gray-600">{country.percentage}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

