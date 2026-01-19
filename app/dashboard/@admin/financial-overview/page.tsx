'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// Mock Data
const revenueData = [
  { month: 'Jan', actual: 45000, forecast: 42000, previousYear: 38000 },
  { month: 'Feb', actual: 52000, forecast: 48000, previousYear: 41000 },
  { month: 'Mar', actual: 48000, forecast: 50000, previousYear: 45000 },
  { month: 'Apr', actual: 61000, forecast: 55000, previousYear: 48000 },
  { month: 'May', actual: 58000, forecast: 58000, previousYear: 52000 },
  { month: 'Jun', actual: 67000, forecast: 62000, previousYear: 55000 },
  { month: 'Jul', actual: 72000, forecast: 68000, previousYear: 60000 },
  { month: 'Aug', actual: 69000, forecast: 70000, previousYear: 58000 },
  { month: 'Sep', actual: 75000, forecast: 72000, previousYear: 62000 },
  { month: 'Oct', actual: 0, forecast: 75000, previousYear: 65000 },
  { month: 'Nov', actual: 0, forecast: 78000, previousYear: 68000 },
  { month: 'Dec', actual: 0, forecast: 82000, previousYear: 72000 },
];

const paymentMethodData = [
  { name: 'Credit Card', value: 45, color: 'blue' },
  { name: 'PayPal', value: 30, color: 'green' },
  { name: 'Stripe', value: 20, color: 'purple' },
  { name: 'Bank Transfer', value: 5, color: 'yellow' },
];

const transactionVolumeData = [
  { day: 'Mon', volume: 1250, amount: 45000 },
  { day: 'Tue', volume: 1100, amount: 42000 },
  { day: 'Wed', volume: 1350, amount: 48000 },
  { day: 'Thu', volume: 1420, amount: 52000 },
  { day: 'Fri', volume: 1600, amount: 58000 },
  { day: 'Sat', volume: 980, amount: 35000 },
  { day: 'Sun', volume: 850, amount: 30000 },
];

const revenueByCategory = [
  { category: 'Course Sales', amount: 285000, percentage: 48, trend: 12.5 },
  { category: 'Subscriptions', amount: 175000, percentage: 29, trend: 8.3 },
  { category: 'Certifications', amount: 95000, percentage: 16, trend: -2.1 },
  { category: 'Others', amount: 40000, percentage: 7, trend: 5.7 },
];

const recentTransactions = [
  {
    id: 'TXN001',
    user: 'John Doe',
    amount: 299.99,
    status: 'completed',
    method: 'Credit Card',
    date: '2024-01-07 14:30',
    course: 'Web Development',
  },
  {
    id: 'TXN002',
    user: 'Jane Smith',
    amount: 199.99,
    status: 'completed',
    method: 'PayPal',
    date: '2024-01-07 14:25',
    course: 'Data Science',
  },
  {
    id: 'TXN003',
    user: 'Bob Wilson',
    amount: 149.99,
    status: 'pending',
    method: 'Stripe',
    date: '2024-01-07 14:20',
    course: 'UI/UX Design',
  },
  {
    id: 'TXN004',
    user: 'Alice Brown',
    amount: 399.99,
    status: 'completed',
    method: 'Credit Card',
    date: '2024-01-07 14:15',
    course: 'Full Stack',
  },
  {
    id: 'TXN005',
    user: 'Charlie Davis',
    amount: 99.99,
    status: 'failed',
    method: 'PayPal',
    date: '2024-01-07 14:10',
    course: 'Python Basics',
  },
];

const cashFlowData = [
  { month: 'Jan', inflow: 65000, outflow: 42000, net: 23000 },
  { month: 'Feb', inflow: 72000, outflow: 45000, net: 27000 },
  { month: 'Mar', inflow: 68000, outflow: 48000, net: 20000 },
  { month: 'Apr', inflow: 81000, outflow: 52000, net: 29000 },
  { month: 'May', inflow: 78000, outflow: 55000, net: 23000 },
  { month: 'Jun', inflow: 87000, outflow: 58000, net: 29000 },
];

const topInstructors = [
  { name: 'Sarah Johnson', revenue: 45000, courses: 8, students: 1250 },
  { name: 'Michael Chen', revenue: 38000, courses: 6, students: 980 },
  { name: 'Emily Rodriguez', revenue: 32000, courses: 5, students: 850 },
  { name: 'David Kim', revenue: 28000, courses: 4, students: 720 },
  { name: 'Lisa Anderson', revenue: 25000, courses: 3, students: 650 },
];

export default function AdminFinancialOverview() {
  const [timeRange, setTimeRange] = useState('12');
  const [comparisonPeriod, setComparisonPeriod] = useState('previous-year');

  const totalRevenue = 587000;
  const projectedRevenue = 720000;
  const growthRate = 18.5;
  const averageOrderValue = 245.67;

  return (
    <div className='min-h-screen py-6'>
      <div className='mx-auto max-w-[1600px] space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-muted-foreground text-3xl font-bold'>Financial Overview</h1>
            <p className='text-muted-foreground mt-1'>
              Comprehensive financial analytics and forecasting
            </p>
          </div>
          <div className='flex gap-3'>
            <Select value={comparisonPeriod} onValueChange={setComparisonPeriod}>
              <SelectTrigger className='w-[180px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='previous-year'>vs Previous Year</SelectItem>
                <SelectItem value='previous-quarter'>vs Previous Quarter</SelectItem>
                <SelectItem value='previous-month'>vs Previous Month</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className='w-[150px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='7'>Last 7 days</SelectItem>
                <SelectItem value='30'>Last 30 days</SelectItem>
                <SelectItem value='90'>Last 90 days</SelectItem>
                <SelectItem value='12'>Last 12 months</SelectItem>
              </SelectContent>
            </Select>
            <Button variant='outline'>
              <Download className='mr-2 h-4 w-4' />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='rounded-lg bg-green-100 p-3'>
                    <DollarSign className='text-success h-6 w-6' />
                  </div>
                  <div>
                    <p className='text-muted-foreground text-sm'>Total Revenue</p>
                    <h3 className='text-2xl font-bold'>${totalRevenue.toLocaleString()}</h3>
                    <div className='mt-1 flex items-center gap-1'>
                      <ArrowUpRight className='text-success h-4 w-4' />
                      <span className='text-success text-sm font-medium'>+{growthRate}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='bg-primary/10 rounded-lg p-3'>
                    <Target className='text-primary h-6 w-6' />
                  </div>
                  <div>
                    <p className='text-muted-foreground text-sm'>Projected Revenue</p>
                    <h3 className='text-2xl font-bold'>${projectedRevenue.toLocaleString()}</h3>
                    <p className='text-muted-foreground mt-1 text-sm'>End of year forecast</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='bg-primary/10 rounded-lg p-3'>
                    <Wallet className='text-primary h-6 w-6' />
                  </div>
                  <div>
                    <p className='text-muted-foreground text-sm'>Avg Order Value</p>
                    <h3 className='text-2xl font-bold'>${averageOrderValue}</h3>
                    <div className='mt-1 flex items-center gap-1'>
                      <ArrowUpRight className='text-success h-4 w-4' />
                      <span className='text-success text-sm font-medium'>+5.2%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='rounded-lg bg-orange-100 p-3'>
                    <Activity className='h-6 w-6 text-orange-600' />
                  </div>
                  <div>
                    <p className='text-muted-foreground text-sm'>Transaction Volume</p>
                    <h3 className='text-2xl font-bold'>8,550</h3>
                    <p className='text-muted-foreground mt-1 text-sm'>This month</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue='overview' className='space-y-6'>
          <TabsList className='grid w-full grid-cols-5'>
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='forecast'>Forecast</TabsTrigger>
            <TabsTrigger value='trends'>Trends</TabsTrigger>
            <TabsTrigger value='transactions'>Transactions</TabsTrigger>
            <TabsTrigger value='reports'>Reports</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value='overview' className='space-y-6'>
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
              {/* Revenue Chart */}
              <Card className='lg:col-span-2'>
                <CardHeader>
                  <CardTitle>Revenue Overview</CardTitle>
                  <CardDescription>Actual vs forecasted revenue trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width='100%' height={350}>
                    <AreaChart data={revenueData}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='month' />
                      <YAxis />
                      <Tooltip formatter={value => `$${value.toLocaleString()}`} />
                      <Legend />
                      <Area
                        type='monotone'
                        dataKey='actual'
                        stroke='green'
                        fill='lime'
                        name='Actual Revenue'
                      />
                      <Area
                        type='monotone'
                        dataKey='forecast'
                        stroke='primary'
                        fill='blue'
                        name='Forecasted'
                        strokeDasharray='5 5'
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>Distribution by type</CardDescription>
                </CardHeader>
                <CardContent className='flex flex-col items-center'>
                  <ResponsiveContainer width='100%' height={250}>
                    <PieChart>
                      <Pie
                        data={paymentMethodData}
                        cx='50%'
                        cy='50%'
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey='value'
                      >
                        {paymentMethodData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={value => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className='mt-4 grid w-full grid-cols-2 gap-3'>
                    {paymentMethodData.map((method, idx) => (
                      <div key={idx} className='flex items-center gap-2'>
                        <div
                          className='h-3 w-3 rounded-full'
                          style={{ backgroundColor: method.color }}
                        />
                        <span className='text-muted-foreground text-sm'>{method.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Category</CardTitle>
                <CardDescription>Breakdown of income sources</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {revenueByCategory.map((category, idx) => (
                    <div key={idx} className='space-y-2'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-3'>
                          <span className='font-medium'>{category.category}</span>
                          <Badge variant={category.trend > 0 ? 'default' : 'secondary'}>
                            {category.trend > 0 ? '+' : ''}
                            {category.trend}%
                          </Badge>
                        </div>
                        <div className='text-right'>
                          <p className='text-lg font-bold'>${category.amount.toLocaleString()}</p>
                          <p className='text-muted-foreground text-sm'>
                            {category.percentage}% of total
                          </p>
                        </div>
                      </div>
                      <div className='bg-muted/95 h-2 w-full rounded-full'>
                        <div
                          className='bg-primary/90 h-2 rounded-full transition-all'
                          style={{ width: `${category.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Transaction Volume */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Transaction Volume</CardTitle>
                <CardDescription>Number of transactions and total amount</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={300}>
                  <ComposedChart data={transactionVolumeData}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='day' />
                    <YAxis yAxisId='left' />
                    <YAxis yAxisId='right' orientation='right' />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId='left' dataKey='volume' fill='purple' name='Transactions' />
                    <Line
                      yAxisId='right'
                      type='monotone'
                      dataKey='amount'
                      stroke='green'
                      strokeWidth={2}
                      name='Amount ($)'
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Forecast Tab */}
          <TabsContent value='forecast' className='space-y-6'>
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
              <Card>
                <CardHeader>
                  <CardTitle>12-Month Revenue Forecast</CardTitle>
                  <CardDescription>AI-powered revenue predictions</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width='100%' height={350}>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='month' />
                      <YAxis />
                      <Tooltip formatter={value => `$${value.toLocaleString()}`} />
                      <Legend />
                      <Line
                        type='monotone'
                        dataKey='actual'
                        stroke='green'
                        strokeWidth={2}
                        name='Actual'
                      />
                      <Line
                        type='monotone'
                        dataKey='forecast'
                        stroke='primary'
                        strokeWidth={2}
                        strokeDasharray='5 5'
                        name='Forecast'
                      />
                      <Line
                        type='monotone'
                        dataKey='previousYear'
                        stroke='orange'
                        strokeWidth={1}
                        name='Previous Year'
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Forecast Accuracy</CardTitle>
                  <CardDescription>Comparing predictions vs actuals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-6'>
                    <div className='bg-primary/10 rounded-lg p-6 text-center'>
                      <p className='text-muted-foreground mb-2 text-sm'>Forecast Accuracy Rate</p>
                      <h3 className='text-primary text-4xl font-bold'>94.5%</h3>
                      <p className='text-muted-foreground mt-2 text-sm'>Based on last 12 months</p>
                    </div>

                    <div className='space-y-3'>
                      <div className='bg-muted/40 flex items-center justify-between rounded p-3'>
                        <span className='text-sm'>Q1 2024</span>
                        <Badge>96% accurate</Badge>
                      </div>
                      <div className='bg-muted/40 flex items-center justify-between rounded p-3'>
                        <span className='text-sm'>Q2 2024</span>
                        <Badge>93% accurate</Badge>
                      </div>
                      <div className='bg-muted/40 flex items-center justify-between rounded p-3'>
                        <span className='text-sm'>Q3 2024</span>
                        <Badge variant='secondary'>In Progress</Badge>
                      </div>
                    </div>

                    <div className='border-t pt-4'>
                      <h4 className='mb-3 font-medium'>Key Insights</h4>
                      <ul className='text-muted-foreground space-y-2 text-sm'>
                        <li className='flex items-start gap-2'>
                          <CheckCircle className='text-success mt-0.5 h-4 w-4' />
                          <span>Revenue trending 8% above forecast</span>
                        </li>
                        <li className='flex items-start gap-2'>
                          <CheckCircle className='text-success mt-0.5 h-4 w-4' />
                          <span>Q4 expected to exceed targets by 12%</span>
                        </li>
                        <li className='flex items-start gap-2'>
                          <AlertCircle className='text-destructive mt-0.5 h-4 w-4' />
                          <span>Seasonal dip expected in December</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cash Flow Projection */}
            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Projection</CardTitle>
                <CardDescription>6-month inflow, outflow, and net cash flow</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={350}>
                  <BarChart data={cashFlowData}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='month' />
                    <YAxis />
                    <Tooltip formatter={value => `$${value.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey='inflow' fill='green' name='Inflow' />
                    <Bar dataKey='outflow' fill='red' name='Outflow' />
                    <Bar dataKey='net' fill='blue' name='Net Cash Flow' />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value='trends' className='space-y-6'>
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
              <Card>
                <CardHeader>
                  <CardTitle>Year-over-Year Growth</CardTitle>
                  <CardDescription>Revenue comparison with previous year</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width='100%' height={350}>
                    <AreaChart data={revenueData.slice(0, 9)}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='month' />
                      <YAxis />
                      <Tooltip formatter={value => `$${value.toLocaleString()}`} />
                      <Legend />
                      <Area
                        type='monotone'
                        dataKey='actual'
                        stroke='green'
                        fill='lime'
                        name='2024'
                      />
                      <Area
                        type='monotone'
                        dataKey='previousYear'
                        stroke='primary'
                        fill='blue'
                        name='2023'
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Revenue Generators</CardTitle>
                  <CardDescription>Instructors by revenue contribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    {topInstructors.map((instructor, idx) => (
                      <div
                        key={idx}
                        className='bg-muted/40 hover:bg-muted/100 flex items-center justify-between rounded-lg p-3 transition-colors'
                      >
                        <div className='flex items-center gap-3'>
                          <div className='bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full font-semibold'>
                            {instructor.name[0]}
                          </div>
                          <div>
                            <p className='font-medium'>{instructor.name}</p>
                            <p className='text-muted-foreground text-sm'>
                              {instructor.courses} courses • {instructor.students} students
                            </p>
                          </div>
                        </div>
                        <div className='text-right'>
                          <p className='text-success text-lg font-bold'>
                            ${instructor.revenue.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Growth Indicators */}
            <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
              <Card>
                <CardHeader>
                  <CardTitle className='text-sm font-medium'>Monthly Growth Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='flex items-center gap-2'>
                    <TrendingUp className='text-success h-8 w-8' />
                    <div>
                      <p className='text-success text-3xl font-bold'>+18.5%</p>
                      <p className='text-muted-foreground text-sm'>vs last month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='text-sm font-medium'>Customer Lifetime Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='flex items-center gap-2'>
                    <Users className='text-primary h-8 w-8' />
                    <div>
                      <p className='text-3xl font-bold'>$1,247</p>
                      <p className='text-muted-foreground text-sm'>Average per user</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='text-sm font-medium'>Churn Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='flex items-center gap-2'>
                    <ArrowDownRight className='h-8 w-8 text-orange-600' />
                    <div>
                      <p className='text-3xl font-bold'>2.3%</p>
                      <p className='text-muted-foreground text-sm'>Monthly average</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value='transactions' className='space-y-6'>
            <Card>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <div>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>Latest payment activities</CardDescription>
                  </div>
                  <Button variant='outline' size='sm'>
                    <Download className='mr-2 h-4 w-4' />
                    Export All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead>
                      <tr className='border-b'>
                        <th className='p-3 text-left font-medium'>Transaction ID</th>
                        <th className='p-3 text-left font-medium'>User</th>
                        <th className='p-3 text-left font-medium'>Course</th>
                        <th className='p-3 text-left font-medium'>Method</th>
                        <th className='p-3 text-right font-medium'>Amount</th>
                        <th className='p-3 text-left font-medium'>Date</th>
                        <th className='p-3 text-left font-medium'>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <div className='flex items-center justify-center'>
                        No recent transaction recorded
                      </div>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value='reports' className='space-y-6'>
            <Card>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <div>
                    <CardTitle>Financial Reports</CardTitle>
                    <CardDescription>Generated payment reports</CardDescription>
                  </div>
                  <Button variant='outline' size='sm'>
                    <Download className='mr-2 h-4 w-4' />
                    Export Report
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead>
                      <tr className='border-b'>
                        <th className='p-3 text-left font-medium'>Report ID</th>
                        <th className='p-3 text-left font-medium'>Period</th>
                        <th className='p-3 text-right font-medium'>Revenue</th>
                        <th className='p-3 text-right font-medium'>Transactions</th>
                        <th className='p-3 text-left font-medium'>Generated On</th>
                        <th className='p-3 text-left font-medium'>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      <tr>
                        <td colSpan={6} className='text-muted-foreground p-6 text-center'>
                          No reports generated yet
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
