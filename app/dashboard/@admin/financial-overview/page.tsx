'use client'

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    Wallet
} from 'lucide-react';
import { useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

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
    { name: 'Credit Card', value: 45, color: '#3b82f6' },
    { name: 'PayPal', value: 30, color: '#10b981' },
    { name: 'Stripe', value: 20, color: '#8b5cf6' },
    { name: 'Bank Transfer', value: 5, color: '#f59e0b' },
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
    { id: 'TXN001', user: 'John Doe', amount: 299.99, status: 'completed', method: 'Credit Card', date: '2024-01-07 14:30', course: 'Web Development' },
    { id: 'TXN002', user: 'Jane Smith', amount: 199.99, status: 'completed', method: 'PayPal', date: '2024-01-07 14:25', course: 'Data Science' },
    { id: 'TXN003', user: 'Bob Wilson', amount: 149.99, status: 'pending', method: 'Stripe', date: '2024-01-07 14:20', course: 'UI/UX Design' },
    { id: 'TXN004', user: 'Alice Brown', amount: 399.99, status: 'completed', method: 'Credit Card', date: '2024-01-07 14:15', course: 'Full Stack' },
    { id: 'TXN005', user: 'Charlie Davis', amount: 99.99, status: 'failed', method: 'PayPal', date: '2024-01-07 14:10', course: 'Python Basics' },
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
        <div className="min-h-screen py-6">
            <div className="max-w-[1600px] mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-muted-foreground">Financial Overview</h1>
                        <p className="text-muted-foreground mt-1">Comprehensive financial analytics and forecasting</p>
                    </div>
                    <div className="flex gap-3">
                        <Select value={comparisonPeriod} onValueChange={setComparisonPeriod}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="previous-year">vs Previous Year</SelectItem>
                                <SelectItem value="previous-quarter">vs Previous Quarter</SelectItem>
                                <SelectItem value="previous-month">vs Previous Month</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={timeRange} onValueChange={setTimeRange}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7">Last 7 days</SelectItem>
                                <SelectItem value="30">Last 30 days</SelectItem>
                                <SelectItem value="90">Last 90 days</SelectItem>
                                <SelectItem value="12">Last 12 months</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Export Report
                        </Button>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-green-100 rounded-lg">
                                        <DollarSign className="w-6 h-6 text-success" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                                        <h3 className="text-2xl font-bold">${totalRevenue.toLocaleString()}</h3>
                                        <div className="flex items-center gap-1 mt-1">
                                            <ArrowUpRight className="w-4 h-4 text-success" />
                                            <span className="text-sm text-success font-medium">+{growthRate}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-primary/10 rounded-lg">
                                        <Target className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Projected Revenue</p>
                                        <h3 className="text-2xl font-bold">${projectedRevenue.toLocaleString()}</h3>
                                        <p className="text-sm text-muted-foreground mt-1">End of year forecast</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-primary/10 rounded-lg">
                                        <Wallet className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Avg Order Value</p>
                                        <h3 className="text-2xl font-bold">${averageOrderValue}</h3>
                                        <div className="flex items-center gap-1 mt-1">
                                            <ArrowUpRight className="w-4 h-4 text-success" />
                                            <span className="text-sm text-success font-medium">+5.2%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-orange-100 rounded-lg">
                                        <Activity className="w-6 h-6 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Transaction Volume</p>
                                        <h3 className="text-2xl font-bold">8,550</h3>
                                        <p className="text-sm text-muted-foreground mt-1">This month</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Tabs */}
                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="forecast">Forecast</TabsTrigger>
                        <TabsTrigger value="trends">Trends</TabsTrigger>
                        <TabsTrigger value="transactions">Transactions</TabsTrigger>
                        <TabsTrigger value="reports">Reports</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Revenue Chart */}
                            <Card className="lg:col-span-2">
                                <CardHeader>
                                    <CardTitle>Revenue Overview</CardTitle>
                                    <CardDescription>Actual vs forecasted revenue trends</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={350}>
                                        <AreaChart data={revenueData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="month" />
                                            <YAxis />
                                            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                                            <Legend />
                                            <Area
                                                type="monotone"
                                                dataKey="actual"
                                                stroke="#10b981"
                                                fill="#86efac"
                                                name="Actual Revenue"
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="forecast"
                                                stroke="#3b82f6"
                                                fill="#93c5fd"
                                                name="Forecasted"
                                                strokeDasharray="5 5"
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
                                <CardContent className="flex flex-col items-center">
                                    <ResponsiveContainer width="100%" height={250}>
                                        <PieChart>
                                            <Pie
                                                data={paymentMethodData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {paymentMethodData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => `${value}%`} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="grid grid-cols-2 gap-3 w-full mt-4">
                                        {paymentMethodData.map((method, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: method.color }}
                                                />
                                                <span className="text-sm text-muted-foreground">{method.name}</span>
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
                                <div className="space-y-4">
                                    {revenueByCategory.map((category, idx) => (
                                        <div key={idx} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-medium">{category.category}</span>
                                                    <Badge variant={category.trend > 0 ? 'default' : 'secondary'}>
                                                        {category.trend > 0 ? '+' : ''}{category.trend}%
                                                    </Badge>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-lg">${category.amount.toLocaleString()}</p>
                                                    <p className="text-sm text-muted-foreground">{category.percentage}% of total</p>
                                                </div>
                                            </div>
                                            <div className="w-full bg-muted-foreground rounded-full h-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full transition-all"
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
                                <ResponsiveContainer width="100%" height={300}>
                                    <ComposedChart data={transactionVolumeData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="day" />
                                        <YAxis yAxisId="left" />
                                        <YAxis yAxisId="right" orientation="right" />
                                        <Tooltip />
                                        <Legend />
                                        <Bar yAxisId="left" dataKey="volume" fill="#8b5cf6" name="Transactions" />
                                        <Line
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey="amount"
                                            stroke="#10b981"
                                            strokeWidth={2}
                                            name="Amount ($)"
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Forecast Tab */}
                    <TabsContent value="forecast" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>12-Month Revenue Forecast</CardTitle>
                                    <CardDescription>AI-powered revenue predictions</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={350}>
                                        <LineChart data={revenueData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="month" />
                                            <YAxis />
                                            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                                            <Legend />
                                            <Line
                                                type="monotone"
                                                dataKey="actual"
                                                stroke="#10b981"
                                                strokeWidth={2}
                                                name="Actual"
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="forecast"
                                                stroke="#3b82f6"
                                                strokeWidth={2}
                                                strokeDasharray="5 5"
                                                name="Forecast"
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="previousYear"
                                                stroke="#9ca3af"
                                                strokeWidth={1}
                                                name="Previous Year"
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
                                    <div className="space-y-6">
                                        <div className="text-center p-6 bg-primary/10 rounded-lg">
                                            <p className="text-sm text-muted-foreground mb-2">Forecast Accuracy Rate</p>
                                            <h3 className="text-4xl font-bold text-primary">94.5%</h3>
                                            <p className="text-sm text-muted-foreground mt-2">Based on last 12 months</p>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center p-3 bg-muted/40 rounded">
                                                <span className="text-sm">Q1 2024</span>
                                                <Badge>96% accurate</Badge>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-muted/40 rounded">
                                                <span className="text-sm">Q2 2024</span>
                                                <Badge>93% accurate</Badge>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-muted/40 rounded">
                                                <span className="text-sm">Q3 2024</span>
                                                <Badge variant="secondary">In Progress</Badge>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t">
                                            <h4 className="font-medium mb-3">Key Insights</h4>
                                            <ul className="space-y-2 text-sm text-muted-foreground">
                                                <li className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 text-success mt-0.5" />
                                                    <span>Revenue trending 8% above forecast</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 text-success mt-0.5" />
                                                    <span>Q4 expected to exceed targets by 12%</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
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
                                <ResponsiveContainer width="100%" height={350}>
                                    <BarChart data={cashFlowData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                                        <Legend />
                                        <Bar dataKey="inflow" fill="#10b981" name="Inflow" />
                                        <Bar dataKey="outflow" fill="#ef4444" name="Outflow" />
                                        <Bar dataKey="net" fill="#3b82f6" name="Net Cash Flow" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Trends Tab */}
                    <TabsContent value="trends" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Year-over-Year Growth</CardTitle>
                                    <CardDescription>Revenue comparison with previous year</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={350}>
                                        <AreaChart data={revenueData.slice(0, 9)}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="month" />
                                            <YAxis />
                                            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                                            <Legend />
                                            <Area
                                                type="monotone"
                                                dataKey="actual"
                                                stroke="#10b981"
                                                fill="#86efac"
                                                name="2024"
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="previousYear"
                                                stroke="#9ca3af"
                                                fill="#d1d5db"
                                                name="2023"
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
                                    <div className="space-y-4">
                                        {topInstructors.map((instructor, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg hover:bg-muted/100 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                                                        {instructor.name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{instructor.name}</p>
                                                        <p className="text-sm text-muted-foreground">{instructor.courses} courses • {instructor.students} students</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-success">${instructor.revenue.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Growth Indicators */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">Monthly Growth Rate</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="w-8 h-8 text-success" />
                                        <div>
                                            <p className="text-3xl font-bold text-success">+18.5%</p>
                                            <p className="text-sm text-muted-foreground">vs last month</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">Customer Lifetime Value</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2">
                                        <Users className="w-8 h-8 text-primary" />
                                        <div>
                                            <p className="text-3xl font-bold">$1,247</p>
                                            <p className="text-sm text-muted-foreground">Average per user</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2">
                                        <ArrowDownRight className="w-8 h-8 text-orange-600" />
                                        <div>
                                            <p className="text-3xl font-bold">2.3%</p>
                                            <p className="text-sm text-muted-foreground">Monthly average</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Transactions Tab */}
                    <TabsContent value="transactions" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>Recent Transactions</CardTitle>
                                        <CardDescription>Latest payment activities</CardDescription>
                                    </div>
                                    <Button variant="outline" size="sm">
                                        <Download className="w-4 h-4 mr-2" />
                                        Export All
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left p-3 font-medium">Transaction ID</th>
                                                <th className="text-left p-3 font-medium">User</th>
                                                <th className="text-left p-3 font-medium">Course</th>
                                                <th className="text-left p-3 font-medium">Method</th>
                                                <th className="text-right p-3 font-medium">Amount</th>
                                                <th className="text-left p-3 font-medium">Date</th>
                                                <th className="text-left p-3 font-medium">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <div className='flex items-center justify-center' >
                                                No recent transaction recorded
                                            </div>
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Reports Tab */}
                    <TabsContent value="reports" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>Financial Reports</CardTitle>
                                        <CardDescription>Generated payment reports</CardDescription>
                                    </div>
                                    <Button variant="outline" size="sm">
                                        <Download className="w-4 h-4 mr-2" />
                                        Export Report
                                    </Button>
                                </div>
                            </CardHeader>

                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left p-3 font-medium">Report ID</th>
                                                <th className="text-left p-3 font-medium">Period</th>
                                                <th className="text-right p-3 font-medium">Revenue</th>
                                                <th className="text-right p-3 font-medium">Transactions</th>
                                                <th className="text-left p-3 font-medium">Generated On</th>
                                                <th className="text-left p-3 font-medium">Status</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            <tr>
                                                <td colSpan={6} className="text-center p-6 text-muted-foreground">
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
        </div>)
}    
