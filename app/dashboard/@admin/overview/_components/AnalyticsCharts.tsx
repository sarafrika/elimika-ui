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
import { Skeleton } from '@/components/ui/skeleton';
import type { AdminDashboardStatsDTO } from '@/services/api/actions';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f97316', '#22d3ee'];

interface AnalyticsChartsProps {
  statistics?: AdminDashboardStatsDTO;
  isLoading: boolean;
}

const toNumber = (value?: bigint | number | string | null) => {
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

export default function AnalyticsCharts({ statistics, isLoading }: AnalyticsChartsProps) {
  const userMetrics = statistics?.user_metrics;
  const organizationMetrics = statistics?.organization_metrics;
  const complianceMetrics = statistics?.compliance_metrics;
  const learningMetrics = statistics?.learning_metrics;

  const userGrowthData = [
    { label: 'Total Users', value: toNumber(userMetrics?.total_users) },
    { label: 'Active 24h', value: toNumber(userMetrics?.active_users_24h) },
    { label: 'New 7d', value: toNumber(userMetrics?.new_registrations_7d) },
    { label: 'Suspended', value: toNumber(userMetrics?.suspended_accounts) },
  ];

  const organizationGrowthData = [
    { label: 'Total Organisations', value: toNumber(organizationMetrics?.total_organizations) },
    { label: 'Active', value: toNumber(organizationMetrics?.active_organizations) },
    { label: 'Pending', value: toNumber(organizationMetrics?.pending_approvals) },
    { label: 'Suspended', value: toNumber(organizationMetrics?.suspended_organizations) },
  ];

  const distributionData = [
    {
      name: 'Verified Instructors',
      value: toNumber(complianceMetrics?.verified_instructors),
      color: COLORS[0],
    },
    {
      name: 'Pending Instructor Verifications',
      value: toNumber(complianceMetrics?.pending_instructor_verifications),
      color: COLORS[1],
    },
    {
      name: 'Course Creators',
      value: toNumber(complianceMetrics?.total_course_creators),
      color: COLORS[2],
    },
    {
      name: 'Verified Course Creators',
      value: toNumber(complianceMetrics?.verified_course_creators),
      color: COLORS[3],
    },
    {
      name: 'Pending Course Creators',
      value: toNumber(complianceMetrics?.pending_course_creator_verifications),
      color: COLORS[4],
    },
    {
      name: 'Published Courses',
      value: toNumber(learningMetrics?.published_courses),
      color: COLORS[5],
    },
  ].filter(item => item.value > 0);

  const hasUserData = userGrowthData.some(item => item.value > 0);
  const hasOrgData = organizationGrowthData.some(item => item.value > 0);
  const hasDistributionData = distributionData.length > 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Platform Analytics</CardTitle>
          <CardDescription>Growth trends and user distribution</CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-[260px] w-full' />
          <Skeleton className='h-[260px] w-full' />
        </CardContent>
      </Card>
    );
  }

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
            {hasUserData ? (
              <>
                <div className='h-[300px]'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <LineChart data={userGrowthData}>
                      <CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' />
                      <XAxis
                        dataKey='label'
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
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
                        dataKey='value'
                        stroke='#3b82f6'
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                        name='Users'
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className='text-muted-foreground text-sm'>
                  Aggregated user metrics from the latest dashboard snapshot
                </p>
              </>
            ) : (
              <p className='text-muted-foreground text-sm'>
                No user metrics available for the current dashboard snapshot.
              </p>
            )}
          </TabsContent>

          <TabsContent value='org-growth' className='space-y-4'>
            {hasOrgData ? (
              <>
                <div className='h-[300px]'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart data={organizationGrowthData}>
                      <CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' />
                      <XAxis
                        dataKey='label'
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
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
                        dataKey='value'
                        fill='#10b981'
                        radius={[8, 8, 0, 0]}
                        name='Organisations'
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className='text-muted-foreground text-sm'>
                  Organisation metrics aggregated from the latest dashboard snapshot
                </p>
              </>
            ) : (
              <p className='text-muted-foreground text-sm'>
                No organisation metrics available for the current dashboard snapshot.
              </p>
            )}
          </TabsContent>

          <TabsContent value='distribution' className='space-y-4'>
            {hasDistributionData ? (
              <>
                <div className='h-[300px]'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <PieChart>
                      <Pie
                        data={distributionData}
                        cx='50%'
                        cy='50%'
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${percent && (percent * 100).toFixed(0)}%`
                        }
                        outerRadius={90}
                        dataKey='value'
                      >
                        {distributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
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
                  Compliance and learning distribution derived from latest snapshot metrics
                </p>
              </>
            ) : (
              <p className='text-muted-foreground text-sm'>
                No distribution metrics available for the current dashboard snapshot.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
