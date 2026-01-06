"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Calendar,
  CreditCard,
  DollarSign,
  Download,
  ShoppingCart,
  TrendingUp,
} from "lucide-react"
import { useState } from "react"
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"

/* -------------------- DATA -------------------- */

const earningsData = {
  totalRevenue: 12500,
  withdrawn: 8000,
  availableBalance: 4500,
  monthlyGrowth: 23.5,
  averageOrderValue: 41.66,
  totalSales: 300,
  conversionRate: 3.8,
  recentTransactions: [
    {
      id: "txn_1",
      course: "Mastering Next.js",
      amount: 49.99,
      date: "2023-10-26",
      status: "cleared",
      student: "John Doe",
    },
    {
      id: "txn_2",
      course: "GraphQL for Beginners",
      amount: 29.99,
      date: "2023-10-24",
      status: "cleared",
      student: "Jane Smith",
    },
    {
      id: "txn_3",
      course: "Mastering Next.js",
      amount: 49.99,
      date: "2023-10-22",
      status: "pending",
      student: "Bob Johnson",
    },
  ],
  payouts: [
    {
      id: "p_1",
      amount: 2000,
      date: "2023-10-15",
      method: "PayPal",
      status: "completed",
    },
    {
      id: "p_2",
      amount: 6000,
      date: "2023-09-15",
      method: "Stripe",
      status: "completed",
    },
  ],
}

const revenueData = [
  { month: "Jan", revenue: 1200, sales: 24 },
  { month: "Feb", revenue: 1500, sales: 30 },
  { month: "Mar", revenue: 1800, sales: 36 },
  { month: "Apr", revenue: 2100, sales: 42 },
  { month: "May", revenue: 1900, sales: 38 },
  { month: "Jun", revenue: 2400, sales: 48 },
]

/* -------------------- PAGE -------------------- */

export default function EarningsPage() {
  const [timeRange, setTimeRange] = useState("30")

  return (
    <div className="space-y-6 p-4 md:p-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Earnings Dashboard
          </h2>
          <p className="mt-1 text-muted-foreground">
            Track your revenue, sales, and financial performance
          </p>
        </div>

        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-6 md:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={`$${earningsData.totalRevenue.toFixed(2)}`}
          icon={<DollarSign className="h-4 w-4" />}
          footer={`+${earningsData.monthlyGrowth}% from last month`}
        />

        <MetricCard
          title="Available Balance"
          value={`$${earningsData.availableBalance.toFixed(2)}`}
          icon={<CreditCard className="h-4 w-4" />}
          action={<Button size="sm">Request Payout</Button>}
        />

        <MetricCard
          title="Total Sales"
          value={earningsData.totalSales.toString()}
          icon={<ShoppingCart className="h-4 w-4" />}
          footer={`Avg: $${earningsData.averageOrderValue.toFixed(2)}`}
        />

        <MetricCard
          title="Conversion Rate"
          value={`${earningsData.conversionRate}%`}
          icon={<TrendingUp className="h-4 w-4" />}
          footer="From course page visits"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>
                Monthly revenue vs sales
              </CardDescription>
            </CardHeader>

            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="var(--chart-2)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Course</th>
                    <th className="p-3 text-left">Student</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {earningsData.recentTransactions.map(txn => (
                    <tr
                      key={txn.id}
                      className="border-b hover:bg-muted/50"
                    >
                      <td className="p-3 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {txn.date}
                      </td>
                      <td className="p-3 font-medium">
                        {txn.course}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {txn.student}
                      </td>
                      <td className="p-3 text-right font-semibold">
                        ${txn.amount.toFixed(2)}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={
                            txn.status === "cleared"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {txn.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payouts */}
        <TabsContent value="payouts">
          <div className="grid gap-6 md:grid-cols-3">
            <SummaryCard
              title="Total Withdrawn"
              value={`$${earningsData.withdrawn.toFixed(2)}`}
            />
            <SummaryCard
              title="Available Balance"
              value={`$${earningsData.availableBalance.toFixed(2)}`}
            />
            <SummaryCard title="Next Payout" value="Nov 15" />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

/* -------------------- SMALL COMPONENTS -------------------- */

function MetricCard({
  title,
  value,
  icon,
  footer,
  action,
}: {
  title: string
  value: string
  icon: React.ReactNode
  footer?: string
  action?: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-3xl font-bold">{value}</p>
        {footer && (
          <p className="text-xs text-muted-foreground">
            {footer}
          </p>
        )}
        {action}
      </CardContent>
    </Card>
  )
}

function SummaryCard({
  title,
  value,
}: {
  title: string
  value: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}
