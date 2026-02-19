'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getRevenueDashboardOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle,
  DollarSign,
  Download,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// Mock data for features not yet supported by API
const paymentMethodData = [
  { name: 'Credit Card', value: 45, color: 'hsl(var(--chart-1))' },
  { name: 'PayPal', value: 30, color: 'hsl(var(--chart-2))' },
  { name: 'Stripe', value: 20, color: 'hsl(var(--chart-3))' },
  { name: 'Bank Transfer', value: 5, color: 'hsl(var(--chart-4))' },
];

const revenueByCategory = [
  { category: 'Course Sales', amount: 285000, percentage: 48, trend: 12.5 },
  { category: 'Subscriptions', amount: 175000, percentage: 29, trend: 8.3 },
  { category: 'Certifications', amount: 95000, percentage: 16, trend: -2.1 },
  { category: 'Others', amount: 40000, percentage: 7, trend: 5.7 },
];

const topInstructors = [
  // { name: 'Sarah Johnson', revenue: 45000, courses: 8, students: 1250 },
];

export default function AdminFinancialOverview() {
  const [timeRange, setTimeRange] = useState('12');
  const [comparisonPeriod, setComparisonPeriod] = useState('previous-year');

  // Calculate date range based on selection
  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();

    switch (timeRange) {
      case '7':
        start.setDate(end.getDate() - 7);
        break;
      case '30':
        start.setDate(end.getDate() - 30);
        break;
      case '90':
        start.setDate(end.getDate() - 90);
        break;
      case '12':
        start.setFullYear(end.getFullYear() - 1);
        break;
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  }, [timeRange]);

  const { data, isLoading, error } = useQuery(
    getRevenueDashboardOptions({
      query: { domain: 'admin', start_date: startDate, end_date: endDate },
    })
  );

  // Process API data
  const processedData = useMemo(() => {
    if (!data?.data) return null;

    const apiData = data.data;

    // Get primary currency (first currency in gross_totals)
    const primaryCurrency = apiData.gross_totals?.[0]?.currency_code || 'KES';

    // Calculate total revenue
    const totalRevenue =
      apiData.gross_totals?.find(g => g.currency_code === primaryCurrency)?.amount || 0;

    // Calculate estimated earnings
    const estimatedEarnings =
      apiData.estimated_earnings?.find(e => e.currency_code === primaryCurrency)?.amount || 0;

    // Calculate average order value
    const avgOrderValue =
      apiData.average_order_value?.find(a => a.currency_code === primaryCurrency)?.amount || 0;

    // Process daily series for charts
    const dailyData =
      apiData.daily_series?.map(day => ({
        date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: day.gross_totals?.find(g => g.currency_code === primaryCurrency)?.amount || 0,
        earnings:
          day.estimated_earnings?.find(e => e.currency_code === primaryCurrency)?.amount || 0,
        orders: day.order_count || 0,
        units: day.units_sold || 0,
      })) || [];

    // Process scope breakdown
    const scopeData =
      apiData.scope_breakdown?.map(scope => ({
        scope: scope.scope,
        revenue: scope.gross_totals?.find(g => g.currency_code === primaryCurrency)?.amount || 0,
        earnings:
          scope.estimated_earnings?.find(e => e.currency_code === primaryCurrency)?.amount || 0,
        items: scope.line_item_count || 0,
        units: scope.units_sold || 0,
      })) || [];

    // Calculate growth rate (comparing first and last data points)
    let growthRate = 0;
    if (dailyData.length >= 2) {
      const firstWeek = dailyData.slice(0, 7).reduce((sum, d) => sum + d.revenue, 0);
      const lastWeek = dailyData.slice(-7).reduce((sum, d) => sum + d.revenue, 0);
      if (firstWeek > 0) {
        growthRate = ((lastWeek - firstWeek) / firstWeek) * 100;
      }
    }

    return {
      primaryCurrency,
      totalRevenue,
      estimatedEarnings,
      avgOrderValue,
      orderCount: apiData.order_count || 0,
      lineItemCount: apiData.line_item_count || 0,
      unitsSold: apiData.units_sold || 0,
      dailyData,
      scopeData,
      growthRate,
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className='min-h-screen px-4 py-4 sm:px-6 sm:py-6'>
        <div className='mx-auto max-w-[1600px] space-y-4 sm:space-y-6'>
          {/* Header Skeleton */}
          <div className='space-y-4'>
            <div>
              <Skeleton className='h-8 w-64 sm:h-9' />
              <Skeleton className='mt-1 h-4 w-96' />
            </div>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end'>
              <Skeleton className='h-10 w-full sm:w-[150px]' />
              <Skeleton className='h-10 w-full sm:w-32' />
            </div>
          </div>

          {/* Key Metrics Skeleton */}
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className='p-4 sm:p-6'>
                  <div className='flex items-start gap-3'>
                    <Skeleton className='h-11 w-11 rounded-lg sm:h-14 sm:w-14' />
                    <div className='flex-1 space-y-2'>
                      <Skeleton className='h-3 w-24 sm:h-4' />
                      <Skeleton className='h-7 w-32 sm:h-8' />
                      <Skeleton className='h-3 w-20' />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs Skeleton */}
          <div className='space-y-4 sm:space-y-6'>
            <Skeleton className='h-10 w-full' />

            {/* Chart Skeleton */}
            <Card>
              <CardHeader className='p-4 sm:p-6'>
                <Skeleton className='h-5 w-40 sm:h-6' />
                <Skeleton className='mt-1 h-4 w-64' />
              </CardHeader>
              <CardContent className='p-4 pt-0 sm:p-6 sm:pt-0'>
                <Skeleton className='h-[300px] w-full sm:h-[350px]' />
              </CardContent>
            </Card>

            {/* Scope Breakdown Skeleton */}
            <Card>
              <CardHeader className='p-4 sm:p-6'>
                <Skeleton className='h-5 w-40 sm:h-6' />
                <Skeleton className='mt-1 h-4 w-64' />
              </CardHeader>
              <CardContent className='p-4 sm:p-6'>
                <div className='space-y-4'>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className='space-y-2'>
                      <div className='flex items-center justify-between'>
                        <Skeleton className='h-5 w-32' />
                        <Skeleton className='h-5 w-24' />
                      </div>
                      <Skeleton className='h-2 w-full rounded-full' />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Activity Chart Skeleton */}
            <Card>
              <CardHeader className='p-4 sm:p-6'>
                <Skeleton className='h-5 w-32 sm:h-6' />
                <Skeleton className='mt-1 h-4 w-48' />
              </CardHeader>
              <CardContent className='p-4 pt-0 sm:p-6 sm:pt-0'>
                <Skeleton className='h-[250px] w-full sm:h-[300px]' />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex min-h-screen items-center justify-center p-4'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle className='text-destructive flex items-center gap-2'>
              <AlertCircle className='h-5 w-5' />
              Error Loading Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-muted-foreground'>
              Failed to load financial data. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!processedData) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <p className='text-muted-foreground'>No data available</p>
      </div>
    );
  }

  const {
    primaryCurrency,
    totalRevenue,
    estimatedEarnings,
    avgOrderValue,
    orderCount,
    unitsSold,
    dailyData,
    scopeData,
    growthRate,
  } = processedData;

  // Calculate projected revenue (simple projection based on growth rate)
  const projectedRevenue = totalRevenue * 1.2;

  return (
    <div className='min-h-screen px-4 py-4 sm:px-6 sm:py-6'>
      <div className='mx-auto max-w-[1600px] space-y-4 sm:space-y-6'>
        {/* Header */}
        <div className='space-y-4'>
          <div>
            <Badge
              variant='outline'
              className='border-primary/60 bg-primary/10 text-xs font-semibold tracking-wide uppercase'
            >
              Financial Overview
            </Badge>
            {/* Header Section */}
            <div className='bg-card relative mt-4 overflow-hidden rounded-3xl'>
              <div className='flex flex-col'>
                <p className='text-muted-foreground max-w-3xl text-sm leading-relaxed'>
                  Comprehensive financial analytics and forecasting
                </p>
              </div>
            </div>
          </div>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end'>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className='w-full sm:w-[150px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='7'>Last 7 days</SelectItem>
                <SelectItem value='30'>Last 30 days</SelectItem>
                <SelectItem value='90'>Last 90 days</SelectItem>
                <SelectItem value='12'>Last 12 months</SelectItem>
              </SelectContent>
            </Select>
            <Button variant='outline' className='w-full sm:w-auto'>
              <Download className='mr-2 h-4 w-4' />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardContent className='p-4 sm:p-6'>
              <div className='flex items-start gap-3'>
                <div className='bg-chart-1/10 rounded-lg p-2.5 sm:p-3'>
                  <DollarSign className='text-chart-1 h-5 w-5 sm:h-6 sm:w-6' />
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='text-muted-foreground text-xs sm:text-sm'>Total Revenue</p>
                  <h3 className='truncate text-xl font-bold sm:text-2xl'>
                    {primaryCurrency} {totalRevenue.toLocaleString()}
                  </h3>
                  <div className='mt-1 flex items-center gap-1'>
                    {growthRate >= 0 ? (
                      <ArrowUpRight className='text-chart-1 h-3.5 w-3.5 sm:h-4 sm:w-4' />
                    ) : (
                      <ArrowDownRight className='text-destructive h-3.5 w-3.5 sm:h-4 sm:w-4' />
                    )}
                    <span
                      className={`text-xs font-medium sm:text-sm ${
                        growthRate >= 0 ? 'text-chart-1' : 'text-destructive'
                      }`}
                    >
                      {growthRate >= 0 ? '+' : ''}
                      {growthRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4 sm:p-6'>
              <div className='flex items-start gap-3'>
                <div className='bg-primary/10 rounded-lg p-2.5 sm:p-3'>
                  <Target className='text-primary h-5 w-5 sm:h-6 sm:w-6' />
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='text-muted-foreground text-xs sm:text-sm'>Estimated Earnings</p>
                  <h3 className='truncate text-xl font-bold sm:text-2xl'>
                    {primaryCurrency} {estimatedEarnings.toLocaleString()}
                  </h3>
                  <p className='text-muted-foreground mt-1 text-xs'>After fees & commissions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4 sm:p-6'>
              <div className='flex items-start gap-3'>
                <div className='bg-primary/10 rounded-lg p-2.5 sm:p-3'>
                  <Wallet className='text-primary h-5 w-5 sm:h-6 sm:w-6' />
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='text-muted-foreground text-xs sm:text-sm'>Avg Order Value</p>
                  <h3 className='truncate text-xl font-bold sm:text-2xl'>
                    {primaryCurrency} {avgOrderValue.toFixed(2)}
                  </h3>
                  <div className='mt-1 flex items-center gap-1'>
                    <ArrowUpRight className='text-chart-1 h-3.5 w-3.5 sm:h-4 sm:w-4' />
                    <span className='text-chart-1 text-xs font-medium sm:text-sm'>
                      Per transaction
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4 sm:p-6'>
              <div className='flex items-start gap-3'>
                <div className='bg-chart-2/10 rounded-lg p-2.5 sm:p-3'>
                  <Activity className='text-chart-2 h-5 w-5 sm:h-6 sm:w-6' />
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='text-muted-foreground text-xs sm:text-sm'>Total Orders</p>
                  <h3 className='text-xl font-bold sm:text-2xl'>{orderCount.toLocaleString()}</h3>
                  <p className='text-muted-foreground mt-1 text-xs'>
                    {unitsSold.toLocaleString()} units sold
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue='overview' className='space-y-4 sm:space-y-6'>
          <ScrollArea className='w-full'>
            <TabsList className='inline-flex h-auto w-full min-w-max sm:grid sm:grid-cols-5'>
              <TabsTrigger value='overview' className='text-xs sm:text-sm'>
                Overview
              </TabsTrigger>
              <TabsTrigger value='forecast' className='text-xs sm:text-sm'>
                Forecast
              </TabsTrigger>
              <TabsTrigger value='trends' className='text-xs sm:text-sm'>
                Trends
              </TabsTrigger>
              <TabsTrigger value='transactions' className='text-xs sm:text-sm'>
                Transactions
              </TabsTrigger>
              <TabsTrigger value='reports' className='text-xs sm:text-sm'>
                Reports
              </TabsTrigger>
            </TabsList>
          </ScrollArea>

          {/* Overview Tab */}
          <TabsContent value='overview' className='space-y-4 sm:space-y-6'>
            <div className='space-y-4 sm:space-y-6'>
              {/* Revenue Chart */}
              <Card>
                <CardHeader className='p-4 sm:p-6'>
                  <CardTitle className='text-base sm:text-lg'>Revenue Trend</CardTitle>
                  <CardDescription className='text-xs sm:text-sm'>
                    Daily revenue and earnings over time
                  </CardDescription>
                </CardHeader>
                <CardContent className='p-4 pt-0 sm:p-6 sm:pt-0'>
                  {dailyData.length > 0 ? (
                    <ResponsiveContainer width='100%' height={300} className='sm:h-[350px]'>
                      <AreaChart data={dailyData}>
                        <CartesianGrid strokeDasharray='3 3' className='stroke-border' />
                        <XAxis
                          dataKey='date'
                          className='fill-muted-foreground'
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor='end'
                          height={60}
                        />
                        <YAxis className='fill-muted-foreground' tick={{ fontSize: 12 }} />
                        <Tooltip
                          formatter={(value: any) => `${primaryCurrency} ${value.toLocaleString()}`}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '0.5rem',
                            fontSize: '12px',
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Area
                          type='monotone'
                          dataKey='revenue'
                          stroke='hsl(var(--chart-1))'
                          fill='hsl(var(--chart-1))'
                          fillOpacity={0.2}
                          name='Gross Revenue'
                        />
                        <Area
                          type='monotone'
                          dataKey='earnings'
                          stroke='hsl(var(--chart-3))'
                          fill='hsl(var(--chart-3))'
                          fillOpacity={0.2}
                          name='Estimated Earnings'
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className='text-muted-foreground flex h-[300px] items-center justify-center text-sm sm:h-[350px]'>
                      No daily data available for this period
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Scope Breakdown */}
            {scopeData.length > 0 && (
              <Card>
                <CardHeader className='p-4 sm:p-6'>
                  <CardTitle className='text-base sm:text-lg'>Revenue by Scope</CardTitle>
                  <CardDescription className='text-xs sm:text-sm'>
                    Breakdown by sales channel or category
                  </CardDescription>
                </CardHeader>
                <CardContent className='p-4 sm:p-6'>
                  <div className='space-y-4'>
                    {scopeData.map((scope, idx) => {
                      const percentage =
                        totalRevenue > 0 ? (scope.revenue / totalRevenue) * 100 : 0;
                      return (
                        <div key={idx} className='space-y-2'>
                          <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                            <div className='flex items-center gap-2 sm:gap-3'>
                              <span className='text-sm font-medium sm:text-base'>
                                {scope.scope}
                              </span>
                              <Badge variant='outline' className='text-xs'>
                                {scope.items} items
                              </Badge>
                            </div>
                            <div className='text-left sm:text-right'>
                              <p className='text-base font-bold sm:text-lg'>
                                {primaryCurrency} {scope.revenue.toLocaleString()}
                              </p>
                              <p className='text-muted-foreground text-xs sm:text-sm'>
                                {percentage.toFixed(1)}% of total
                              </p>
                            </div>
                          </div>
                          <div className='bg-muted/95 h-2 w-full rounded-full'>
                            <div
                              className='bg-primary/90 h-2 rounded-full transition-all'
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Transaction Volume */}
            <Card>
              <CardHeader className='p-4 sm:p-6'>
                <CardTitle className='text-base sm:text-lg'>Daily Activity</CardTitle>
                <CardDescription className='text-xs sm:text-sm'>
                  Orders and units sold over time
                </CardDescription>
              </CardHeader>
              <CardContent className='p-4 pt-0 sm:p-6 sm:pt-0'>
                {dailyData.length > 0 ? (
                  <ResponsiveContainer width='100%' height={250} className='sm:h-[300px]'>
                    <ComposedChart data={dailyData}>
                      <CartesianGrid strokeDasharray='3 3' className='stroke-border' />
                      <XAxis
                        dataKey='date'
                        className='fill-muted-foreground'
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor='end'
                        height={60}
                      />
                      <YAxis
                        yAxisId='left'
                        className='fill-muted-foreground'
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        yAxisId='right'
                        orientation='right'
                        className='fill-muted-foreground'
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '0.5rem',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar
                        yAxisId='left'
                        dataKey='orders'
                        fill='hsl(var(--chart-5))'
                        name='Orders'
                      />
                      <Line
                        yAxisId='right'
                        type='monotone'
                        dataKey='units'
                        stroke='hsl(var(--chart-1))'
                        strokeWidth={2}
                        name='Units Sold'
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className='text-muted-foreground flex h-[250px] items-center justify-center text-sm sm:h-[300px]'>
                    No activity data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Forecast Tab */}
          <TabsContent value='forecast' className='space-y-4 sm:space-y-6'>
            <div className='grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2'>
              <Card>
                <CardHeader className='p-4 sm:p-6'>
                  <CardTitle className='text-base sm:text-lg'>Revenue Forecast</CardTitle>
                  <CardDescription className='text-xs sm:text-sm'>
                    Projected future revenue based on trends
                  </CardDescription>
                </CardHeader>
                <CardContent className='p-4 pt-0 sm:p-6 sm:pt-0'>
                  {dailyData.length > 0 ? (
                    <ResponsiveContainer width='100%' height={300} className='sm:h-[350px]'>
                      <LineChart data={dailyData}>
                        <CartesianGrid strokeDasharray='3 3' className='stroke-border' />
                        <XAxis
                          dataKey='date'
                          className='fill-muted-foreground'
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor='end'
                          height={60}
                        />
                        <YAxis className='fill-muted-foreground' tick={{ fontSize: 12 }} />
                        <Tooltip
                          formatter={(value: any) => `${primaryCurrency} ${value.toLocaleString()}`}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '0.5rem',
                            fontSize: '12px',
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Line
                          type='monotone'
                          dataKey='revenue'
                          stroke='hsl(var(--chart-1))'
                          strokeWidth={2}
                          name='Actual Revenue'
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className='text-muted-foreground flex h-[300px] items-center justify-center text-sm sm:h-[350px]'>
                      No forecast data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='p-4 sm:p-6'>
                  <CardTitle className='text-base sm:text-lg'>Performance Insights</CardTitle>
                  <CardDescription className='text-xs sm:text-sm'>
                    Key metrics and projections
                  </CardDescription>
                </CardHeader>
                <CardContent className='p-4 sm:p-6'>
                  <div className='space-y-4 sm:space-y-6'>
                    <div className='bg-primary/10 rounded-lg p-4 text-center sm:p-6'>
                      <p className='text-muted-foreground mb-2 text-xs sm:text-sm'>
                        Projected Revenue
                      </p>
                      <h3 className='text-primary text-2xl font-bold sm:text-4xl'>
                        {primaryCurrency} {projectedRevenue.toLocaleString()}
                      </h3>
                      <p className='text-muted-foreground mt-2 text-xs sm:text-sm'>
                        Based on current trends
                      </p>
                    </div>

                    <div className='space-y-3'>
                      <div className='bg-muted/40 flex items-center justify-between rounded p-3'>
                        <span className='text-xs sm:text-sm'>Current Period</span>
                        <Badge>Active</Badge>
                      </div>
                      <div className='bg-muted/40 flex items-center justify-between rounded p-3'>
                        <span className='text-xs sm:text-sm'>Growth Rate</span>
                        <Badge variant={growthRate >= 0 ? 'default' : 'secondary'}>
                          {growthRate >= 0 ? '+' : ''}
                          {growthRate.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>

                    <div className='border-t pt-4'>
                      <h4 className='mb-3 text-sm font-medium sm:text-base'>Key Insights</h4>
                      <ul className='text-muted-foreground space-y-2 text-xs sm:text-sm'>
                        <li className='flex items-start gap-2'>
                          <CheckCircle className='text-chart-1 mt-0.5 h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4' />
                          <span>Total of {orderCount.toLocaleString()} orders processed</span>
                        </li>
                        <li className='flex items-start gap-2'>
                          <CheckCircle className='text-chart-1 mt-0.5 h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4' />
                          <span>{unitsSold.toLocaleString()} units sold in this period</span>
                        </li>
                        <li className='flex items-start gap-2'>
                          <CheckCircle className='text-chart-1 mt-0.5 h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4' />
                          <span>
                            Average {primaryCurrency} {avgOrderValue.toFixed(2)} per order
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value='trends' className='space-y-4 sm:space-y-6'>
            <div className='grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2'>
              <Card>
                <CardHeader className='p-4 sm:p-6'>
                  <CardTitle className='text-base sm:text-lg'>Revenue Trends</CardTitle>
                  <CardDescription className='text-xs sm:text-sm'>
                    Historical performance analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className='p-4 pt-0 sm:p-6 sm:pt-0'>
                  {dailyData.length > 0 ? (
                    <ResponsiveContainer width='100%' height={300} className='sm:h-[350px]'>
                      <AreaChart data={dailyData}>
                        <CartesianGrid strokeDasharray='3 3' className='stroke-border' />
                        <XAxis
                          dataKey='date'
                          className='fill-muted-foreground'
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor='end'
                          height={60}
                        />
                        <YAxis className='fill-muted-foreground' tick={{ fontSize: 12 }} />
                        <Tooltip
                          formatter={(value: any) => `${primaryCurrency} ${value.toLocaleString()}`}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '0.5rem',
                            fontSize: '12px',
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Area
                          type='monotone'
                          dataKey='revenue'
                          stroke='hsl(var(--chart-1))'
                          fill='hsl(var(--chart-1))'
                          fillOpacity={0.2}
                          name='Revenue'
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className='text-muted-foreground flex h-[300px] items-center justify-center text-sm sm:h-[350px]'>
                      No trend data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='p-4 sm:p-6'>
                  <CardTitle className='text-base sm:text-lg'>Top Revenue Generators</CardTitle>
                  <CardDescription className='text-xs sm:text-sm'>
                    Instructors by revenue contribution
                  </CardDescription>
                </CardHeader>
                <CardContent className='p-4 sm:p-6'>
                  <div className='space-y-4'>
                    {topInstructors.length > 0 ? (
                      topInstructors.map((instructor, idx) => (
                        <div
                          key={idx}
                          className='bg-muted/40 hover:bg-muted flex items-center justify-between rounded-lg p-3 transition-colors'
                        >
                          <div className='flex items-center gap-3'>
                            <div className='bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold sm:text-base'>
                              {instructor.name[0]}
                            </div>
                            <div className='min-w-0 flex-1'>
                              <p className='truncate text-sm font-medium sm:text-base'>
                                {instructor.name}
                              </p>
                              <p className='text-muted-foreground text-xs sm:text-sm'>
                                {instructor.courses} courses • {instructor.students} students
                              </p>
                            </div>
                          </div>
                          <div className='text-right'>
                            <p className='text-chart-1 text-base font-bold sm:text-lg'>
                              ${instructor.revenue.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className='text-muted-foreground flex h-[200px] items-center justify-center text-sm'>
                        No instructor data available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Growth Indicators */}
            <div className='grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3'>
              <Card>
                <CardHeader className='p-4 sm:p-6'>
                  <CardTitle className='text-xs font-medium sm:text-sm'>Growth Rate</CardTitle>
                </CardHeader>
                <CardContent className='p-4 pt-0 sm:p-6 sm:pt-0'>
                  <div className='flex items-center gap-2'>
                    <TrendingUp
                      className={`h-6 w-6 sm:h-8 sm:w-8 ${growthRate >= 0 ? 'text-chart-1' : 'text-destructive'}`}
                    />
                    <div>
                      <p
                        className={`text-2xl font-bold sm:text-3xl ${
                          growthRate >= 0 ? 'text-chart-1' : 'text-destructive'
                        }`}
                      >
                        {growthRate >= 0 ? '+' : ''}
                        {growthRate.toFixed(1)}%
                      </p>
                      <p className='text-muted-foreground text-xs sm:text-sm'>Period-over-period</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='p-4 sm:p-6'>
                  <CardTitle className='text-xs font-medium sm:text-sm'>Total Units Sold</CardTitle>
                </CardHeader>
                <CardContent className='p-4 pt-0 sm:p-6 sm:pt-0'>
                  <div className='flex items-center gap-2'>
                    <Users className='text-primary h-6 w-6 sm:h-8 sm:w-8' />
                    <div>
                      <p className='text-2xl font-bold sm:text-3xl'>{unitsSold.toLocaleString()}</p>
                      <p className='text-muted-foreground text-xs sm:text-sm'>This period</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='p-4 sm:p-6'>
                  <CardTitle className='text-xs font-medium sm:text-sm'>Conversion Rate</CardTitle>
                </CardHeader>
                <CardContent className='p-4 pt-0 sm:p-6 sm:pt-0'>
                  <div className='flex items-center gap-2'>
                    <ArrowDownRight className='text-chart-2 h-6 w-6 sm:h-8 sm:w-8' />
                    <div>
                      <p className='text-2xl font-bold sm:text-3xl'>
                        {orderCount > 0 ? ((unitsSold / orderCount) * 100).toFixed(1) : 0}%
                      </p>
                      <p className='text-muted-foreground text-xs sm:text-sm'>Units per order</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value='transactions' className='space-y-4 sm:space-y-6'>
            <Card>
              <CardHeader className='p-4 sm:p-6'>
                <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                  <div>
                    <CardTitle className='text-base sm:text-lg'>Transaction Summary</CardTitle>
                    <CardDescription className='text-xs sm:text-sm'>
                      Overview of order activity
                    </CardDescription>
                  </div>
                  <Button variant='outline' size='sm' className='w-full sm:w-auto'>
                    <Download className='mr-2 h-4 w-4' />
                    Export Data
                  </Button>
                </div>
              </CardHeader>
              <CardContent className='p-4 sm:p-6'>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                  <div className='rounded-lg border p-4'>
                    <p className='text-muted-foreground text-xs sm:text-sm'>Total Orders</p>
                    <p className='mt-2 text-xl font-bold sm:text-2xl'>
                      {orderCount.toLocaleString()}
                    </p>
                  </div>
                  <div className='rounded-lg border p-4'>
                    <p className='text-muted-foreground text-xs sm:text-sm'>Total Revenue</p>
                    <p className='mt-2 text-xl font-bold sm:text-2xl'>
                      {primaryCurrency} {totalRevenue.toLocaleString()}
                    </p>
                  </div>
                  <div className='rounded-lg border p-4'>
                    <p className='text-muted-foreground text-xs sm:text-sm'>Units Sold</p>
                    <p className='mt-2 text-xl font-bold sm:text-2xl'>
                      {unitsSold.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className='text-muted-foreground mt-6 text-center text-sm'>
                  <p>Detailed transaction list coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value='reports' className='space-y-4 sm:space-y-6'>
            <Card>
              <CardHeader className='p-4 sm:p-6'>
                <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                  <div>
                    <CardTitle className='text-base sm:text-lg'>Financial Reports</CardTitle>
                    <CardDescription className='text-xs sm:text-sm'>
                      Generated reports and exports
                    </CardDescription>
                  </div>
                  <Button variant='outline' size='sm' className='w-full sm:w-auto'>
                    <Download className='mr-2 h-4 w-4' />
                    Generate Report
                  </Button>
                </div>
              </CardHeader>
              <CardContent className='p-4 sm:p-6'>
                <div className='space-y-4'>
                  <div className='rounded-lg border p-4'>
                    <h4 className='mb-3 text-sm font-medium sm:text-base'>
                      Current Period Summary
                    </h4>
                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                      <div>
                        <p className='text-muted-foreground text-xs sm:text-sm'>Date Range</p>
                        <p className='text-sm font-medium sm:text-base'>
                          {startDate} to {endDate}
                        </p>
                      </div>
                      <div>
                        <p className='text-muted-foreground text-xs sm:text-sm'>Currency</p>
                        <p className='text-sm font-medium sm:text-base'>{primaryCurrency}</p>
                      </div>
                      <div>
                        <p className='text-muted-foreground text-xs sm:text-sm'>Total Revenue</p>
                        <p className='text-sm font-medium sm:text-base'>
                          {primaryCurrency} {totalRevenue.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className='text-muted-foreground text-xs sm:text-sm'>Net Earnings</p>
                        <p className='text-sm font-medium sm:text-base'>
                          {primaryCurrency} {estimatedEarnings.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className='text-muted-foreground text-center text-sm'>
                    <p>Additional reports and export options coming soon</p>
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
