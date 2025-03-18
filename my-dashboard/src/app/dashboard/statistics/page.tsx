"use client"

import { useEffect, useState } from "react"
import { Users, FileText, Activity, BarChart2, Award } from "lucide-react"
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// Inline Tabs components to avoid import issues
const Tabs = TabsPrimitive.Root
const TabsList = ({ className, ...props }: React.ComponentPropsWithRef<typeof TabsPrimitive.List>) => (
  <TabsPrimitive.List
    className={cn(
      "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
)
const TabsTrigger = ({ className, ...props }: React.ComponentPropsWithRef<typeof TabsPrimitive.Trigger>) => (
  <TabsPrimitive.Trigger
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow",
      className
    )}
    {...props}
  />
)
const TabsContent = ({ className, ...props }: React.ComponentPropsWithRef<typeof TabsPrimitive.Content>) => (
  <TabsPrimitive.Content
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
)

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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStatistics() {
      try {
        const response = await fetch("/api/statistics")
        const data = await response.json()

        if (!response.ok) {
          throw new Error('Failed to fetch statistics')
        }

        setStatistics(data)
      } catch (error) {
        console.error("Error fetching statistics:", error)
        setError(error instanceof Error ? error.message : 'Failed to fetch statistics')
      } finally {
        setLoading(false)
      }
    }

    fetchStatistics()
  }, [])

  if (loading) {
    return <div>Loading statistics...</div>
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6">
      {/* First row - Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-emerald-500" />
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
            <Users className="h-4 w-4 text-emerald-500" />
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
            <CardTitle className="text-sm font-medium">Last Month Onboards</CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.onboards_last_month || 0}</div>
            <div className="text-xs text-muted-foreground">
              {statistics?.onboards_last_week || 0} in the last week
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Proofs</CardTitle>
            <FileText className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.proof_statistics?.total_proofs_submitted || 0}</div>
            <div className="text-xs text-muted-foreground">
              {statistics?.proof_statistics?.proofs_per_user_average?.toFixed(1) || '0.0'} per user
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second row - User Activity */}
      <Card>
        <CardHeader>
          <CardTitle>User Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col items-center justify-center p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
              <div className="text-3xl font-bold text-emerald-600">{statistics?.user_activity?.active_last_24h}</div>
              <div className="text-sm text-muted-foreground mt-1">Active in last 24h</div>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
              <div className="text-3xl font-bold text-emerald-600">{statistics?.user_activity?.active_last_7d}</div>
              <div className="text-sm text-muted-foreground mt-1">Active in last 7 days</div>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
              <div className="text-3xl font-bold text-emerald-600">{statistics?.user_activity?.active_last_30d}</div>
              <div className="text-sm text-muted-foreground mt-1">Active in last 30 days</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Third row - Onboarding Trends */}
      <Tabs defaultValue="monthly">
        <CardHeader className="px-0 pt-0">
          <div className="flex items-center justify-between">
            <CardTitle>Onboarding Trends</CardTitle>
            <TabsList>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="daily">Daily</TabsTrigger>
            </TabsList>
          </div>
        </CardHeader>
        <TabsContent value="monthly" className="mt-0 p-0">
          <Card className="border-0 shadow-none">
            <CardContent className="p-0">
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={statistics?.time_series_data.monthly_onboards}
                    margin={{ top: 20, right: 20, bottom: 20, left: 10 }}
                  >
                    <XAxis 
                      dataKey="month" 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      padding={{ left: 20, right: 20 }}
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
                    <Bar 
                      dataKey="count" 
                      fill="rgb(16, 185, 129)" /* emerald-500 */
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="daily" className="mt-0 p-0">
          <Card className="border-0 shadow-none">
            <CardContent className="p-0">
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={statistics?.time_series_data.daily_onboards}
                    margin={{ top: 20, right: 20, bottom: 20, left: 10 }}
                  >
                    <XAxis 
                      dataKey="date" 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      padding={{ left: 20, right: 20 }}
                      tickFormatter={(value) => {
                        const date = new Date(value)
                        return date.toLocaleDateString('en-US', { 
                          month: 'short',
                          day: 'numeric'
                        })
                      }}
                      interval={Math.ceil(statistics?.time_series_data?.daily_onboards?.length || 0 / 10)}
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
                        const date = new Date(value)
                        return date.toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
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
                      stroke="rgb(20, 184, 166)" /* teal-500 */
                      strokeWidth={2}
                      dot={{ r: 4, fill: "rgb(20, 184, 166)" }}
                      activeDot={{ r: 6, fill: "rgb(20, 184, 166)" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Fourth row - Proof Statistics - Redesigned */}
      <Card>
        <CardHeader>
          <CardTitle>Proof Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Proof Types - Redesigned as cards with percentages */}
            <div>
              <h4 className="text-sm font-medium mb-4">Proof Types Distribution</h4>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(statistics?.proof_statistics?.proof_types || {}).map(([type, count]) => {
                  const percentage = ((count / (statistics?.proof_statistics?.total_proofs_submitted || 1)) * 100).toFixed(1);
                  return (
                    <div key={type} className="bg-card p-3 rounded-lg border shadow-sm">
                      <div className="text-xs text-muted-foreground">{type}</div>
                      <div className="flex items-end justify-between mt-1">
                        <div className="text-lg font-bold">{count}</div>
                        <div className="text-sm text-emerald-600 font-medium">{percentage}%</div>
                      </div>
                      <div className="mt-2 h-1.5 w-full bg-emerald-50 dark:bg-emerald-950/30 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Proof Metrics */}
            <div>
              <h4 className="text-sm font-medium mb-4">Proof Metrics</h4>
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-500">Total Proofs</div>
                      <div className="text-2xl font-bold mt-1">{statistics?.proof_statistics?.total_proofs_submitted}</div>
                    </div>
                    <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <FileText className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-500">Average per User</div>
                      <div className="text-2xl font-bold mt-1">{statistics?.proof_statistics?.proofs_per_user_average.toFixed(1)}</div>
                    </div>
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <BarChart2 className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-500">Most Common Type</div>
                      <div className="text-2xl font-bold mt-1">
                        {Object.entries(statistics?.proof_statistics?.proof_types || {})
                          .sort((a, b) => b[1] - a[1])[0][0]}
                      </div>
                    </div>
                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Award className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fifth row - Countries Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Top Countries Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Current Countries */}
            <div>
              <h4 className="text-sm font-medium mb-4">Current Countries</h4>
              <div className="space-y-3">
                {statistics?.top_current_countries.map((country) => (
                  <div key={country.country} className="bg-card p-3 rounded-lg border shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{country.country_name}</div>
                      <div className="text-sm font-bold text-emerald-600">{country.count}</div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-emerald-50 dark:bg-emerald-950/30">
                      <div
                        className="h-2 rounded-full bg-emerald-500"
                        style={{
                          width: `${(country.count / statistics.total_users) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {((country.count / statistics.total_users) * 100).toFixed(1)}% of users
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Target Countries */}
            <div>
              <h4 className="text-sm font-medium mb-4">Target Countries</h4>
              <div className="space-y-3">
                {statistics?.top_target_countries.map((country) => (
                  <div key={country.country} className="bg-card p-3 rounded-lg border shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{country.country_name}</div>
                      <div className="text-sm font-bold text-teal-600">{country.count}</div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-teal-50 dark:bg-teal-950/30">
                      <div
                        className="h-2 rounded-full bg-teal-500"
                        style={{
                          width: `${(country.count / statistics.total_users) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {((country.count / statistics.total_users) * 100).toFixed(1)}% of users
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

