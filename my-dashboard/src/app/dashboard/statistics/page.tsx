"use client"

import { useEffect, useState } from "react"
import { Users, Clock, FileText, MapPin } from "lucide-react"
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Statistics {
  onboarded_users: number
  total_users: number
  onboards_last_month: number
  onboards_last_week: number
  onboards_last_year: number
  proof_statistics: {
    proof_types: Record<string, number>
    proofs_per_user_average: number
    total_proofs_submitted: number
    verification_status: Record<string, number>
  }
  time_series_data: {
    daily_onboards: Array<{ date: string; count: number }>
    monthly_onboards: Array<{ month: string; count: number }>
  }
  top_current_countries: Array<{
    count: number
    country: string
    country_name: string
  }>
  top_target_countries: Array<{
    count: number
    country: string
    country_name: string
  }>
  user_activity: {
    active_last_24h: number
    active_last_7d: number
    active_last_30d: number
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
      {/* First row - Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.total_users || 0}</div>
            <div className="text-xs text-muted-foreground">
              {statistics?.user_activity?.active_last_24h || 0} active in last 24h
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Onboarded Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.onboarded_users || 0}</div>
            <div className="text-xs text-muted-foreground">
              {((statistics?.onboarded_users || 0) / (statistics?.total_users || 1) * 100).toFixed(1)}% completion rate
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Proofs</CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.proof_statistics?.total_proofs_submitted || 0}</div>
            <div className="text-xs text-muted-foreground">
              {statistics?.proof_statistics?.proofs_per_user_average?.toFixed(1) || '0.0'} per user
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second row - Full width graph */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Onboarding Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={statistics.time_series_data.monthly_onboards}>
                <XAxis 
                  dataKey="month" 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  padding={{ left: 10, right: 10 }}
                  tickFormatter={(value) => {
                    const [year, month] = value.split('-')
                    const date = new Date(parseInt(year), parseInt(month) - 1)
                    return date.toLocaleDateString('en-US', { 
                      month: 'short',
                      year: '2-digit'
                    })
                  }}
                />
                <YAxis 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  width={40}
                />
                <Tooltip
                  labelFormatter={(value) => {
                    const [year, month] = value.split('-')
                    const date = new Date(parseInt(year), parseInt(month) - 1)
                    return date.toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric'
                    })
                  }}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    padding: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#16a34a" 
                  strokeWidth={2} 
                  dot={true}
                  activeDot={{ strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Third row - Countries Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Top Countries Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            <div>
              <h4 className="text-sm font-medium mb-4">Current Countries</h4>
              {statistics.top_current_countries.map((country) => (
                <div key={country.country} className="flex items-center mb-4">
                  <div className="w-[140px] font-medium">{country.country_name}</div>
                  <div className="flex-1">
                    <div className="h-2 w-full rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full bg-green-600"
                        style={{
                          width: `${(country.count / statistics.total_users) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-[60px] text-right text-sm text-gray-600">{country.count}</div>
                </div>
              ))}
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-4">Target Countries</h4>
              {statistics.top_target_countries.map((country) => (
                <div key={country.country} className="flex items-center mb-4">
                  <div className="w-[140px] font-medium">{country.country_name}</div>
                  <div className="flex-1">
                    <div className="h-2 w-full rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full bg-blue-600"
                        style={{
                          width: `${(country.count / statistics.total_users) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-[60px] text-right text-sm text-gray-600">{country.count}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

