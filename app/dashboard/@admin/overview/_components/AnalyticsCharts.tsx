'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Mock data - replace with actual API data when endpoints are available
const userGrowthData = [
  { date: 'Day 1', users: 120 },
  { date: 'Day 5', users: 145 },
  { date: 'Day 10', users: 178 },
  { date: 'Day 15', users: 210 },
  { date: 'Day 20', users: 245 },
  { date: 'Day 25', users: 289 },
  { date: 'Day 30', users: 324 },
];

const organizationGrowthData = [
  { month: 'Jan', orgs: 12 },
  { month: 'Feb', orgs: 15 },
  { month: 'Mar', orgs: 18 },
  { month: 'Apr', orgs: 22 },
  { month: 'May', orgs: 28 },
  { month: 'Jun', orgs: 35 },
];

const domainDistributionData = [
  { name: 'Students', value: 450, color: '#3b82f6' },
  { name: 'Instructors', value: 85, color: '#8b5cf6' },
  { name: 'Admins', value: 15, color: '#ec4899' },
  { name: 'Organizations', value: 35, color: '#10b981' },
];

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981'];

export default function AnalyticsCharts() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Analytics</CardTitle>
        <CardDescription>Growth trends and user distribution</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue='user-growth' className='space-y-4'>
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger value='user-growth'>User Growth</TabsTrigger>
            <TabsTrigger value='org-growth'>Organizations</TabsTrigger>
            <TabsTrigger value='distribution'>Distribution</TabsTrigger>
          </TabsList>

          <TabsContent value='user-growth' className='space-y-4'>
            <div className='h-[300px]'>
              <ResponsiveContainer width='100%' height='100%'>
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' />
                  <XAxis
                    dataKey='date'
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      fontSize: 13,
                      border: '1px solid #e5e7eb',
                    }}
                  />
                  <Legend />
                  <Line
                    type='monotone'
                    dataKey='users'
                    stroke='#3b82f6'
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name='New Users'
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className='text-muted-foreground text-sm'>
              User registrations over the last 30 days
            </p>
          </TabsContent>

          <TabsContent value='org-growth' className='space-y-4'>
            <div className='h-[300px]'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={organizationGrowthData}>
                  <CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' />
                  <XAxis
                    dataKey='month'
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      fontSize: 13,
                      border: '1px solid #e5e7eb',
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey='orgs'
                    fill='#10b981'
                    radius={[8, 8, 0, 0]}
                    name='New Organizations'
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className='text-muted-foreground text-sm'>
              Organization sign-ups over the last 6 months
            </p>
          </TabsContent>

          <TabsContent value='distribution' className='space-y-4'>
            <div className='h-[300px]'>
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Pie
                    data={domainDistributionData}
                    cx='50%'
                    cy='50%'
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${percent && (percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill='#8884d8'
                    dataKey='value'
                  >
                    {domainDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      fontSize: 13,
                      border: '1px solid #e5e7eb',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className='text-muted-foreground text-sm'>
              Current breakdown of users by role/domain
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
