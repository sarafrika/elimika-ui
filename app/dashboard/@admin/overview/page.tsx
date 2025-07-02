"use client"

import { useSession } from "next-auth/react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  ArrowUpRight,
  Users,
  DollarSign,
  CheckCircle,
  Activity,
  TrendingUp,
  Bell,
} from "lucide-react"
import Link from "next/link"
import {
  stats,
  approvalStats,
  tasks,
  topPerformers,
  recentActivity,
  revenueGraphData,
  sampleInstructors,
  sampleOrganizations,
} from "./sample-admin-data"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"

// Prepare data for Recharts
const chartData = revenueGraphData.labels.map((label, i) => ({
  month: label,
  revenue: revenueGraphData.values[i],
}))

export default function AdminOverviewPage() {
  const { data: session } = useSession()

  // You can now use sampleInstructors and sampleOrganizations for any additional widgets or stats

  return (
    <div className="flex flex-col gap-6 px-2 py-4 md:px-6">
      {/* Approval Cards - Main Admin Role */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2">
        {approvalStats.map((stat, i) => (
          <Link key={i} href={stat.route} className="hover:opacity-90">
            <Card className="border-warning/40 bg-warning/10 flex cursor-pointer flex-row items-center gap-4 border-2 p-4 transition-shadow hover:shadow-lg">
              <div className="bg-warning/20 rounded-full p-3">
                <stat.icon className="text-warning h-6 w-6" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg font-semibold">
                  {stat.value}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  {stat.label}
                  <Badge variant={stat.badge as any} className="ml-2">
                    Pending
                  </Badge>
                </CardDescription>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Welcome and Quick Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="flex flex-row items-center gap-4 p-4">
            <div className="bg-primary/10 rounded-full p-3">
              <stat.icon className="text-primary h-6 w-6" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold">
                {stat.value}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                {stat.label}
                <Badge variant={stat.badge as any} className="ml-2">
                  {stat.change}
                </Badge>
              </CardDescription>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Content Grid: Tasks left, Graph right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Tasks (left) */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Admin Tasks</CardTitle>
            <CardDescription>Stay on top of your work</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tasks.map((task, i) => (
              <div
                key={i}
                className="flex items-start gap-2 border-b pb-2 last:border-b-0 last:pb-0"
              >
                <Badge
                  variant={
                    task.status === "Completed"
                      ? "success"
                      : task.status === "Pending"
                        ? "warning"
                        : task.status === "Scheduled"
                          ? "secondary"
                          : "secondary"
                  }
                >
                  {task.status}
                </Badge>
                <div className="flex-1">
                  <div className="mt-0.5 flex items-center gap-2 font-medium">
                    {task.title}
                    {task.notification && (
                      <span title="Upcoming Event">
                        <Bell className="text-warning h-4 w-4 animate-bounce" />
                      </span>
                    )}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {task.comments} comments
                  </div>
                </div>
                <span className="text-muted-foreground ml-auto text-xs whitespace-nowrap">
                  {task.due}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Revenue Graph (right, smaller) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 w-full flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                  />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid: Top Performers & Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>Instructors & Organizations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topPerformers.map((perf, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full font-bold">
                  {perf.name[0]}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{perf.name}</div>
                  <div className="text-muted-foreground text-xs">
                    {perf.role} &mdash; {perf.stat}
                  </div>
                  <Progress value={perf.progress} className="mt-1 h-2" />
                </div>
                <span className="text-primary text-xs font-semibold">
                  {perf.progress}%
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivity.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell>{item.user}</TableCell>
                    <TableCell>{item.action}</TableCell>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.status === "Success"
                            ? "success"
                            : item.status === "Pending"
                              ? "warning"
                              : "secondary"
                        }
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
