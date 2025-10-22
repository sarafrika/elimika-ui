'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  getAllInstructorsOptions,
  getAllOrganisationsOptions,
  getDashboardStatisticsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { Bell, Building2, CheckCircle, User } from 'lucide-react';
import Link from 'next/link';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { recentActivity, revenueGraphData, stats, tasks, topPerformers } from './sample-admin-data';

// Prepare data for Recharts
const chartData = revenueGraphData.labels.map((label, i) => ({
  month: label,
  revenue: revenueGraphData.values[i],
}));

export default function AdminOverviewPage() {
  const { data } = useQuery(getDashboardStatisticsOptions());

  const { data: organisations } = useQuery(
    getAllOrganisationsOptions({ query: { pageable: { page: 0, size: 100 } } })
  );
  const pendingOrganisationApprovals = organisations?.data?.content?.filter(o => !o.admin_verified);

  const { data: instructors } = useQuery(
    getAllInstructorsOptions({ query: { pageable: { page: 0, size: 100 } } })
  );
  const pendingInstructorApprovals = instructors?.data?.content?.filter(o => !o.admin_verified);

  return (
    <div className='flex flex-col gap-6 px-2 py-4 md:px-6'>
      {/* Approval Cards - Main Admin Role */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2'>
        <Link href={'/dashboard/instructors'} className='hover:opacity-90'>
          <Card className='border-warning/40 bg-warning/10 flex cursor-pointer flex-row items-center gap-4 border-2 p-4 transition-shadow hover:shadow-lg'>
            <div className='bg-warning/20 rounded-full p-3'>
              <CheckCircle className='text-warning h-6 w-6' />
            </div>
            <div className='flex-1'>
              <CardTitle className='text-lg font-semibold'>
                {pendingInstructorApprovals?.length}
              </CardTitle>
              <CardDescription className='flex items-center gap-2'>
                {'Instructor Pending Approval'}
                <Badge variant={'warning'} className='ml-2'>
                  Pending
                </Badge>
              </CardDescription>
            </div>
          </Card>
        </Link>

        <Link href={'/dashboard/organizations'} className='hover:opacity-90'>
          <Card className='border-warning/40 bg-warning/10 flex cursor-pointer flex-row items-center gap-4 border-2 p-4 transition-shadow hover:shadow-lg'>
            <div className='bg-warning/20 rounded-full p-3'>
              <CheckCircle className='text-warning h-6 w-6' />
            </div>
            <div className='flex-1'>
              <CardTitle className='text-lg font-semibold'>
                {pendingOrganisationApprovals?.length}
              </CardTitle>
              <CardDescription className='flex items-center gap-2'>
                {'Organisation Pending Approval'}
                <Badge variant={'warning'} className='ml-2'>
                  Pending
                </Badge>
              </CardDescription>
            </div>
          </Card>
        </Link>
      </div>

      {/* Welcome and Quick Stats */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {stats.map((stat, i) => (
          <Card key={i} className='flex flex-row items-center gap-4 p-4'>
            <div className='bg-primary/10 rounded-full p-3'>
              <stat.icon className='text-primary h-6 w-6' />
            </div>
            <div className='flex-1'>
              <CardTitle className='text-lg font-semibold'>{stat.value}</CardTitle>
              <CardDescription className='flex items-center gap-2'>
                {stat.label}
                <Badge variant={stat.badge as any} className='ml-2'>
                  {stat.change}
                </Badge>
              </CardDescription>
            </div>
          </Card>
        ))}

        <Card className='flex flex-row items-center gap-4 p-4'>
          <div className='bg-primary/10 rounded-full p-3'>
            <User className='text-primary h-6 w-6' />
          </div>
          <div className='flex-1'>
            <CardTitle className='text-lg font-semibold'>
              {data?.data?.user_metrics?.total_users}
            </CardTitle>
            <CardDescription className='flex items-center gap-2'>
              {'Total Users'}
              <Badge variant={'success'} className='ml-2'>
                {'+0%'}
              </Badge>
            </CardDescription>
          </div>
        </Card>

        <Card className='flex flex-row items-center gap-4 p-4'>
          <div className='bg-primary/10 rounded-full p-3'>
            <Building2 className='text-primary h-6 w-6' />
          </div>
          <div className='flex-1'>
            <CardTitle className='text-lg font-semibold'>
              {data?.data?.organization_metrics?.active_organizations}
            </CardTitle>
            <CardDescription className='flex items-center gap-2'>
              {'Active Organizations'}
              <Badge variant={'success'} className='ml-2'>
                {'+0%'}
              </Badge>
            </CardDescription>
          </div>
        </Card>
      </div>

      {/* Main Content Grid: Tasks left, Graph right */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        {/* Tasks (left) */}
        <Card className='lg:col-span-1'>
          <CardHeader>
            <CardTitle>Admin Tasks</CardTitle>
            <CardDescription>Stay on top of your work</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {tasks.map((task, i) => (
              <div
                key={i}
                className='flex items-start gap-2 border-b pb-2 last:border-b-0 last:pb-0'
              >
                <Badge
                  variant={
                    task.status === 'Completed'
                      ? 'success'
                      : task.status === 'Pending'
                        ? 'warning'
                        : task.status === 'Scheduled'
                          ? 'secondary'
                          : 'secondary'
                  }
                >
                  {task.status}
                </Badge>
                <div className='flex-1'>
                  <div className='mt-0.5 flex items-center gap-2 font-medium'>
                    {task.title}
                    {task.notification && (
                      <span title='Upcoming Event'>
                        <Bell className='text-warning h-4 w-4 animate-bounce' />
                      </span>
                    )}
                  </div>
                  <div className='text-muted-foreground text-xs'>{task.comments} comments</div>
                </div>
                <span className='text-muted-foreground ml-auto text-xs whitespace-nowrap'>
                  {task.due}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Revenue Graph (right, smaller) */}
        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex h-48 w-full flex-col items-center justify-center'>
              <ResponsiveContainer width='100%' height='100%'>
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                    width={30}
                  />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                  <Line
                    type='monotone'
                    dataKey='revenue'
                    stroke='#6366f1'
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
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>Instructors & Organizations</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {topPerformers.map((perf, i) => (
              <div key={i} className='flex items-center gap-4'>
                <div className='bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full font-bold'>
                  {perf.name[0]}
                </div>
                <div className='flex-1'>
                  <div className='font-medium'>{perf.name}</div>
                  <div className='text-muted-foreground text-xs'>
                    {perf.role} &mdash; {perf.stat}
                  </div>
                  <Progress value={perf.progress} className='mt-1 h-2' />
                </div>
                <span className='text-primary text-xs font-semibold'>{perf.progress}%</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className='col-span-1 lg:col-span-2'>
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
                          item.status === 'Success'
                            ? 'success'
                            : item.status === 'Pending'
                              ? 'warning'
                              : 'secondary'
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
  );
}
