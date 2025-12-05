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
import { useTheme } from 'next-themes';
import type { AdminDashboardStats } from '@/services/client/types.gen';
import { toNumber } from '@/lib/metrics';
import { elimikaDesignSystem } from '@/lib/design-system';

// Use theme-aware chart colors
const useChartColors = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return isDark
    ? elimikaDesignSystem.charts.getColors('dark')
    : elimikaDesignSystem.charts.getColors('light');
};

const AXIS_COLOR = 'hsl(var(--muted-foreground))';
const GRID_COLOR = 'hsl(var(--border))';
const tooltipStyles = {
  backgroundColor: 'hsl(var(--card))',
  color: 'hsl(var(--foreground))',
  borderRadius: 8,
  border: `1px solid hsl(var(--border))`,
  boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
};
const legendWrapperStyle = { color: 'hsl(var(--muted-foreground))' };
const RADIAN = Math.PI / 180;
const renderPieLabel = ({ cx, cy, midAngle, outerRadius, percent, name }: any) => {
  const radius = outerRadius + 12;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill='hsl(var(--foreground))'
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline='central'
      fontSize={12}
    >
      {`${name} ${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

interface AnalyticsChartsProps {
  statistics?: AdminDashboardStats;
  isLoading: boolean;
}

export default function AnalyticsCharts({ statistics, isLoading }: AnalyticsChartsProps) {
  const CHART_COLORS = useChartColors();
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
      color: CHART_COLORS[0],
    },
    {
      name: 'Pending Instructor Verifications',
      value: toNumber(complianceMetrics?.pending_instructor_verifications),
      color: CHART_COLORS[1],
    },
    {
      name: 'Course Creators',
      value: toNumber(complianceMetrics?.total_course_creators),
      color: CHART_COLORS[2],
    },
    {
      name: 'Verified Course Creators',
      value: toNumber(complianceMetrics?.verified_course_creators),
      color: CHART_COLORS[3],
    },
    {
      name: 'Pending Course Creators',
      value: toNumber(complianceMetrics?.pending_course_creator_verifications),
      color: CHART_COLORS[4],
    },
    {
      name: 'Published Courses',
      value: toNumber(learningMetrics?.published_courses),
      color: CHART_COLORS[5],
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
                      <CartesianGrid strokeDasharray='3 3' stroke={GRID_COLOR} />
                      <XAxis
                        dataKey='label'
                        tick={{ fontSize: 12, fill: AXIS_COLOR }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: AXIS_COLOR }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={tooltipStyles}
                      />
                      <Legend wrapperStyle={legendWrapperStyle} />
                      <Line
                        type='monotone'
                        dataKey='value'
                        stroke={CHART_COLORS[0]}
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
                      <CartesianGrid strokeDasharray='3 3' stroke={GRID_COLOR} />
                      <XAxis
                        dataKey='label'
                        tick={{ fontSize: 12, fill: AXIS_COLOR }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: AXIS_COLOR }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={tooltipStyles}
                      />
                      <Legend wrapperStyle={legendWrapperStyle} />
                      <Bar
                        dataKey='value'
                        fill={CHART_COLORS[0]}
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
                        label={renderPieLabel}
                        outerRadius={90}
                        dataKey='value'
                      >
                        {distributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyles} />
                      <Legend wrapperStyle={legendWrapperStyle} />
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
