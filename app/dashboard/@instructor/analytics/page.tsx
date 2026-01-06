'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Star, Trophy, Users } from 'lucide-react';
import { useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30');

  // Mock data - replace with real API data
  const statsCards = [
    { title: 'Total Students', value: '1,234', change: '+12%', icon: Users, color: 'text-blue-600' },
    { title: 'Active Courses', value: '24', change: '+3', icon: BookOpen, color: 'text-green-600' },
    { title: 'Completion Rate', value: '87%', change: '+5%', icon: Trophy, color: 'text-purple-600' },
    { title: 'Avg. Rating', value: '4.8', change: '+0.2', icon: Star, color: 'text-yellow-600' },
  ];

  const enrollmentData = [
    { month: 'Jan', students: 45 },
    { month: 'Feb', students: 52 },
    { month: 'Mar', students: 78 },
    { month: 'Apr', students: 95 },
    { month: 'May', students: 112 },
    { month: 'Jun', students: 134 },
  ];

  const coursePerformanceData = [
    { course: 'Web Development', enrolled: 234, completed: 198, rating: 4.9 },
    { course: 'Data Science', enrolled: 189, completed: 145, rating: 4.7 },
    { course: 'Mobile Apps', enrolled: 156, completed: 132, rating: 4.8 },
    { course: 'UI/UX Design', enrolled: 142, completed: 128, rating: 4.6 },
    { course: 'Cloud Computing', enrolled: 98, completed: 76, rating: 4.5 },
  ];

  const engagementData = [
    { day: 'Mon', hours: 3.2 },
    { day: 'Tue', hours: 4.1 },
    { day: 'Wed', hours: 3.8 },
    { day: 'Thu', hours: 4.5 },
    { day: 'Fri', hours: 3.9 },
    { day: 'Sat', hours: 2.4 },
    { day: 'Sun', hours: 1.8 },
  ];

  const completionDistribution = [
    { name: 'Completed', value: 68, color: '#10b981' },
    { name: 'In Progress', value: 22, color: '#3b82f6' },
    { name: 'Not Started', value: 10, color: '#ef4444' },
  ];

  const revenueData = [
    { month: 'Jan', revenue: 12400 },
    { month: 'Feb', revenue: 14200 },
    { month: 'Mar', revenue: 18900 },
    { month: 'Apr', revenue: 21500 },
    { month: 'May', revenue: 24800 },
    { month: 'Jun', revenue: 28300 },
  ];

  const topStudents = [
    { name: 'Alice Johnson', courses: 8, completion: 100, hours: 124 },
    { name: 'Bob Smith', courses: 6, completion: 98, hours: 98 },
    { name: 'Carol Williams', courses: 7, completion: 95, hours: 112 },
    { name: 'David Brown', courses: 5, completion: 92, hours: 87 },
    { name: 'Emma Davis', courses: 6, completion: 90, hours: 95 },
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-end items-end">
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
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <h3 className="text-2xl font-bold mt-2">{stat.value}</h3>
                    <p className="text-sm text-green-600 mt-1">{stat.change} from last period</p>
                  </div>
                  <stat.icon className={`w-12 h-12 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Enrollment Trend */}
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
                      <Area type="monotone" dataKey="students" stroke="#3b82f6" fill="#93c5fd" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Engagement Hours */}
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
                      <Bar dataKey="hours" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Completion Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Course Status</CardTitle>
                  <CardDescription>Student progress distribution</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={completionDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {completionDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
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
                  <CardDescription>Students with highest engagement</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topStudents.map((student, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                            {student.name[0]}
                          </div>
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-sm text-gray-600">{student.courses} courses • {student.hours}h</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">{student.completion}%</p>
                          <p className="text-xs text-gray-600">completion</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Performance</CardTitle>
                <CardDescription>Detailed metrics for each course</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {coursePerformanceData.map((course, index) => (
                    <div key={index} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <BookOpen className="w-10 h-10 p-2 bg-blue-100 text-blue-600 rounded-lg" />
                          <div>
                            <h4 className="font-semibold">{course.course}</h4>
                            <p className="text-sm text-gray-600">{course.enrolled} students enrolled</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                          <span className="font-semibold">{course.rating}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-blue-600">{course.enrolled}</p>
                          <p className="text-xs text-gray-600">Enrolled</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-600">{course.completed}</p>
                          <p className="text-xs text-gray-600">Completed</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-purple-600">
                            {Math.round((course.completed / course.enrolled) * 100)}%
                          </p>
                          <p className="text-xs text-gray-600">Completion Rate</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Student Growth</CardTitle>
                  <CardDescription>Monthly student acquisition</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={enrollmentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="students" stroke="#8b5cf6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Learning Patterns</CardTitle>
                  <CardDescription>Peak learning hours by day</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={engagementData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="hours" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly earnings from courses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => `$${value.toLocaleString()}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      fill="#86efac"
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-3 gap-4 mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">$120,100</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Avg. Per Course</p>
                    <p className="text-2xl font-bold text-blue-600">$5,004</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Growth Rate</p>
                    <p className="text-2xl font-bold text-purple-600">+18%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}