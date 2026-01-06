'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookOpen, Star, Trophy, Users } from 'lucide-react'
import { useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30')

  const statsCards = [
    { title: 'Total Students', value: '1,234', change: '+12%', icon: Users },
    { title: 'Active Courses', value: '24', change: '+3', icon: BookOpen },
    { title: 'Completion Rate', value: '87%', change: '+5%', icon: Trophy },
    { title: 'Avg. Rating', value: '4.8', change: '+0.2', icon: Star },
  ]

  const enrollmentData = [
    { month: 'Jan', students: 45 },
    { month: 'Feb', students: 52 },
    { month: 'Mar', students: 78 },
    { month: 'Apr', students: 95 },
    { month: 'May', students: 112 },
    { month: 'Jun', students: 134 },
  ]

  const coursePerformanceData = [
    { course: 'Web Development', enrolled: 234, completed: 198, rating: 4.9 },
    { course: 'Data Science', enrolled: 189, completed: 145, rating: 4.7 },
    { course: 'Mobile Apps', enrolled: 156, completed: 132, rating: 4.8 },
    { course: 'UI/UX Design', enrolled: 142, completed: 128, rating: 4.6 },
    { course: 'Cloud Computing', enrolled: 98, completed: 76, rating: 4.5 },
  ]

  const engagementData = [
    { day: 'Mon', hours: 3.2 },
    { day: 'Tue', hours: 4.1 },
    { day: 'Wed', hours: 3.8 },
    { day: 'Thu', hours: 4.5 },
    { day: 'Fri', hours: 3.9 },
    { day: 'Sat', hours: 2.4 },
    { day: 'Sun', hours: 1.8 },
  ]

  const completionDistribution = [
    { name: 'Completed', value: 68, color: 'hsl(var(--primary))' },
    { name: 'In Progress', value: 22, color: 'hsl(var(--accent))' },
    { name: 'Not Started', value: 10, color: 'hsl(var(--destructive))' },
  ]

  const revenueData = [
    { month: 'Jan', revenue: 12400 },
    { month: 'Feb', revenue: 14200 },
    { month: 'Mar', revenue: 18900 },
    { month: 'Apr', revenue: 21500 },
    { month: 'May', revenue: 24800 },
    { month: 'Jun', revenue: 28300 },
  ]

  const topStudents = [
    { name: 'Alice Johnson', courses: 8, completion: 100, hours: 124 },
    { name: 'Bob Smith', courses: 6, completion: 98, hours: 98 },
    { name: 'Carol Williams', courses: 7, completion: 95, hours: 112 },
    { name: 'David Brown', courses: 5, completion: 92, hours: 87 },
    { name: 'Emma Davis', courses: 6, completion: 90, hours: 95 },
  ]

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-end">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <h3 className="text-2xl font-bold mt-2">{stat.value}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stat.change} from last period
                  </p>
                </div>
                <stat.icon className="w-12 h-12 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Student Enrollment Trend</CardTitle>
                  <CardDescription>New students over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={enrollmentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        dataKey="students"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.25}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Weekly Engagement</CardTitle>
                  <CardDescription>Average hours per student</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={engagementData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="hours" fill="hsl(var(--accent))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Course Status</CardTitle>
                  <CardDescription>Student progress distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={completionDistribution} dataKey="value">
                        {completionDistribution.map((e, i) => (
                          <Cell key={i} fill={e.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Top Performers</CardTitle>
                  <CardDescription>
                    Students with highest engagement
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {topStudents.map((student, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                          {student.name[0]}
                        </div>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {student.courses} courses • {student.hours}h
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-foreground">
                          {student.completion}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          completion
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Revenue */}
          <TabsContent value="revenue">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>
                  Monthly earnings from courses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.25}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
