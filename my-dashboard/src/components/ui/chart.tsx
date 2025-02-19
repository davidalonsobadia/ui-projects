"use client"

import type * as React from "react"
import { Area, Bar, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export function Chart({
  data,
  height = 350,
  children,
}: {
  data: any[]
  height?: number
  children: React.ReactNode
}) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>{children}</LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ChartArea({ dataKey, ...props }: any) {
  return <Area dataKey={dataKey} strokeWidth={2} {...props} />
}

export function ChartBar({ dataKey, ...props }: any) {
  return <Bar dataKey={dataKey} {...props} />
}

export function ChartLine({ dataKey, ...props }: any) {
  return <Line type="monotone" dataKey={dataKey} strokeWidth={2} dot={{ strokeWidth: 2, r: 4 }} {...props} />
}

export function ChartTooltip() {
  return (
    <Tooltip
      contentStyle={{
        backgroundColor: "white",
        border: "1px solid #ccc",
        borderRadius: "6px",
        padding: "8px",
      }}
    />
  )
}

export function ChartXAxis({ dataKey }: { dataKey: string }) {
  return <XAxis dataKey={dataKey} axisLine={false} tickLine={false} tick={{ fill: "#666", fontSize: 12 }} />
}

export function ChartYAxis() {
  return <YAxis axisLine={false} tickLine={false} tick={{ fill: "#666", fontSize: 12 }} />
}

