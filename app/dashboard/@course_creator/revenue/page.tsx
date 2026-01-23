'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { elimikaDesignSystem } from "@/lib/design-system";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, ChevronDown, DollarSign, Download, Eye, EyeOff, Landmark, Search, ShoppingCart, TrendingUp, Users } from 'lucide-react';
import { useCallback, useMemo, useState } from "react";
import { useCourseCreator } from "../../../../context/course-creator-context";
import { getWalletOptions, listTransactionsOptions } from "../../../../services/client/@tanstack/react-query.gen";

const RevenuePage = () => {
    const courseCreator = useCourseCreator()
    const userUuid = courseCreator?.profile?.user_uuid
    const [timeRange, setTimeRange] = useState('7days');
    const [showStats, setShowStats] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [sortBy, setSortBy] = useState('created_date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const { data: walletData } = useQuery({
        ...getWalletOptions({ path: { userUuid: userUuid as string } }),
        enabled: !!userUuid
    })

    const { data: listTransactions } = useQuery({
        ...listTransactionsOptions({
            path: { userUuid: userUuid as string },
            query: {
                currency_code: walletData?.data?.currency_code,
                pageable: { page, size, sort: [[sortBy, sortOrder]] }
            }
        }),
        enabled: !!userUuid && !!walletData?.data?.currency_code
    })

    ///// GENERATE SAMPLE DATA
    const randomFrom = <T,>(arr: T[]): T =>
        arr[Math?.floor(Math.random() * arr.length)]

    const randomAmount = () =>
        Math.floor(Math.random() * 2000) + 100

    const randomDate = (daysBack = 30) => {
        const date = new Date()
        date.setDate(date.getDate() - Math.floor(Math.random() * daysBack))
        return date.toISOString()
    }

    const generateTransactions = (
        count: number,
        walletUuid = 'wallet-001',
        currency = 'KES'
    ): WalletTransaction[] => {
        let balance = 50000

        return Array.from({ length: count }).map((_, index) => {
            const transaction_type = randomFrom(TRANSACTION_TYPES)
            const amount = randomAmount()
            const balance_before = balance

            // Adjust balance logically
            if (transaction_type === 'DEPOSIT') balance += amount
            if (transaction_type === 'WITHDRAWAL' || transaction_type === 'PAYMENT' || transaction_type === 'TRANSFER') {
                balance = Math.max(balance - amount, 0)
            }

            const balance_after = balance

            return {
                uuid: `txn-${String(index + 1).padStart(3, '0')}`,
                wallet_uuid: walletUuid,
                transaction_type,
                amount,
                currency_code: currency,
                balance_before,
                balance_after,
                reference: `${transaction_type}-${2026}-${String(index + 1).padStart(4, '0')}`,
                description: randomFrom(DESCRIPTIONS[transaction_type]),
                counterparty_user_uuid:
                    transaction_type === 'TRANSFER' || transaction_type === 'PAYMENT'
                        ? `user-${Math.floor(Math.random() * 1000)}`
                        : "counter_party_uuid",
                created_date: randomDate(),
            }
        })
    }
    const transactions25 = generateTransactions(50)
    /// GENERATE SAMPLE DATA

    // const listAllTransactions = transactions25
    const listAllTransactions = useMemo(
        () => listTransactions?.data?.content || [],
        [listTransactions?.data?.content]
    );

    // Calculate analytics from actual transactions
    const analyticsData = useMemo(() => {
        const totalCount = listAllTransactions.length;
        const totalRevenue = listAllTransactions
            .filter((t: any) => t.transaction_type === 'DEPOSIT' || t.transaction_type === 'PAYMENT')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalWithdrawals = listAllTransactions
            .filter((t: any) => t.transaction_type === 'WITHDRAWAL')
            .reduce((sum, t) => sum + t.amount, 0);

        const completedCount = listAllTransactions.filter((t: any) => getStatusFromType(t.transaction_type) === 'completed').length;
        const pendingCount = listAllTransactions.filter((t: any) => getStatusFromType(t.transaction_type) === 'pending').length;
        const failedCount = listAllTransactions.filter((t: any) => getStatusFromType(t.transaction_type) === 'failed').length;

        const avgTransactionValue = totalCount > 0 ? totalRevenue / totalCount : 0;

        return {
            totalRevenue,
            totalWithdrawals,
            netRevenue: totalRevenue - totalWithdrawals,
            totalTransactions: totalCount,
            completedTransactions: completedCount,
            pendingTransactions: pendingCount,
            failedTransactions: failedCount,
            averageTransactionValue: avgTransactionValue,
            successRate: totalCount > 0 ? (completedCount / totalCount) * 100 : 0,
        };
    }, [listAllTransactions]);

    // Filter transactions based on search query and status
    const filteredTransactions = useMemo(() => {
        let filtered = listAllTransactions;

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter((txn: any) =>
                txn?.description?.toLowerCase().includes(query) ||
                txn?.reference?.toLowerCase().includes(query) ||
                txn?.transaction_type?.toLowerCase().includes(query)
            );
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter((txn: any) =>
                getStatusFromType(txn?.transaction_type) === statusFilter
            );
        }

        return filtered;
    }, [listAllTransactions, searchQuery, statusFilter]);

    const revenueBySource = [
        { source: 'Advanced React Masterclass', revenue: 15847.50, percentage: 35 },
        { source: 'Python for Data Science', revenue: 12340.00, percentage: 27 },
        { source: 'UI/UX Design Fundamentals', revenue: 9823.00, percentage: 22 },
        { source: 'Marketing Strategy Bootcamp', revenue: 7219.50, percentage: 16 },
    ];

    const handleSort = useCallback((field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
        setPage(0);
    }, [sortBy, sortOrder]);

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
        setPage(0);
    }, []);

    const handleStatusFilter = useCallback((status: 'all' | 'completed' | 'pending' | 'failed') => {
        setStatusFilter(status);
        setPage(0);
    }, []);

    const handlePageChange = useCallback((newPage: number) => {
        setPage(newPage);
    }, []);

    const handlePageSizeChange = useCallback((newSize: string) => {
        setSize(Number(newSize));
        setPage(0);
    }, []);

    const totalPages = useMemo(
        () => Math.ceil((filteredTransactions.length || 0) / size),
        [filteredTransactions.length, size]
    );

    const STATUS_OPTIONS = [
        {
            value: 'all',
            label: 'All',
            count: listAllTransactions.length,
        },
        {
            value: 'completed',
            label: 'Completed',
            count: analyticsData.completedTransactions,
        },
        {
            value: 'pending',
            label: 'Pending',
            count: analyticsData.pendingTransactions,
        },
        {
            value: 'failed',
            label: 'Failed',
            count: analyticsData.failedTransactions,
        },
    ]


    const paginatedTransactions = useMemo(() => {
        const start = page * size;
        return filteredTransactions.slice(start, start + size);
    }, [filteredTransactions, page, size]);

    return (
        <div className={elimikaDesignSystem.components.pageContainer}>
            {/* Header */}
            <section className='mb-6'>
                <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                    <div>
                        <h1 className="text-foreground text-2xl font-bold">Revenue</h1>
                        <p className="text-muted-foreground text-sm">
                            Track and analyze your earnings, view payment history, and manage financial insights across courses and sessions.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            className="px-4 py-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="7days">Last 7 days</option>
                            <option value="30days">Last 30 days</option>
                            <option value="90days">Last 90 days</option>
                            <option value="year">This year</option>
                        </select>
                        <Button className="flex items-center gap-2">
                            <Download size={16} />
                            Export
                        </Button>
                    </div>
                </div>
            </section>

            <div className="bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 rounded-md shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <p className="font-medium">🚧 This page is under construction.</p>
                </div>
            </div>

            <section className="mx-auto space-y-6 max-w-7xl">
                {/* Wallet Card */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm max-w-[300px] sm:max-w-2/5">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-muted-foreground text-sm font-medium">Available Balance</p>
                            <h2 className="text-4xl font-bold text-foreground mt-2">
                                KES {analyticsData.netRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </h2>
                            <p className="text-muted-foreground text-sm mt-2">Ready to withdraw</p>
                        </div>
                        <div className="p-3 bg-primary/10 rounded-lg">
                            <Landmark className="text-primary" size={24} />
                        </div>
                    </div>
                    <Button className="mt-6 w-full">
                        Withdraw Funds
                    </Button>
                </div>

                {/* View Stats Button */}
                <div className="flex justify-end">
                    <Button
                        variant={showStats ? "default" : "outline"}
                        onClick={() => setShowStats(!showStats)}
                        className="flex items-center gap-2"
                    >
                        {showStats ? (
                            <>
                                <EyeOff size={16} />
                                Hide Stats
                            </>
                        ) : (
                            <>
                                <Eye size={16} />
                                View Stats
                            </>
                        )}
                    </Button>
                </div>

                {/* Analytics Grid - Conditionally Shown */}
                {showStats && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in-50 duration-300">
                        <div className="bg-card border border-border rounded-lg p-5">
                            <div className="flex items-center justify-between">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <TrendingUp className="text-primary" size={20} />
                                </div>
                                <span className="flex items-center text-sm font-medium text-green-600 dark:text-green-400">
                                    <ArrowUpRight size={16} />
                                    +{analyticsData.successRate.toFixed(1)}%
                                </span>
                            </div>
                            <p className="text-muted-foreground text-sm mt-3">Total Revenue</p>
                            <p className="text-2xl font-bold text-foreground mt-1">KES {analyticsData.totalRevenue.toLocaleString()}</p>
                        </div>

                        <div className="bg-card border border-border rounded-lg p-5">
                            <div className="flex items-center justify-between">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <ShoppingCart className="text-primary" size={20} />
                                </div>
                                <span className="flex items-center text-sm font-medium text-green-600 dark:text-green-400">
                                    <ArrowUpRight size={16} />
                                    {analyticsData.totalTransactions}
                                </span>
                            </div>
                            <p className="text-muted-foreground text-sm mt-3">Total Transactions</p>
                            <p className="text-2xl font-bold text-foreground mt-1">{analyticsData.totalTransactions}</p>
                        </div>

                        <div className="bg-card border border-border rounded-lg p-5">
                            <div className="flex items-center justify-between">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Users className="text-primary" size={20} />
                                </div>
                                <span className="flex items-center text-sm font-medium text-green-600 dark:text-green-400">
                                    <ArrowUpRight size={16} />
                                    {analyticsData.completedTransactions}
                                </span>
                            </div>
                            <p className="text-muted-foreground text-sm mt-3">Completed</p>
                            <p className="text-2xl font-bold text-foreground mt-1">{analyticsData.completedTransactions}</p>
                        </div>

                        <div className="bg-card border border-border rounded-lg p-5">
                            <div className="flex items-center justify-between">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <DollarSign className="text-primary" size={20} />
                                </div>
                                <span className="flex items-center text-sm font-medium text-green-600 dark:text-green-400">
                                    <ArrowUpRight size={16} />
                                    +5.2%
                                </span>
                            </div>
                            <p className="text-muted-foreground text-sm mt-3">Avg Transaction</p>
                            <p className="text-2xl font-bold text-foreground mt-1">KES {analyticsData.averageTransactionValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Transactions */}
                    <div className="lg:col-span-2 bg-card border border-border rounded-xl shadow-sm">
                        <div className="flex flex-col gap-3 p-4">
                            <div className="flex flex-col sm:flex-row gap-3">
                                {/* Search */}
                                <div className="flex-1 relative">
                                    <Search
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                        size={16}
                                    />
                                    <Input
                                        placeholder="Search transactions..."
                                        value={searchQuery}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>

                                {/* Page Size */}
                                <Select value={size.toString()} onValueChange={handlePageSizeChange}>
                                    <SelectTrigger className="w-full sm:w-32">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="5">5 items</SelectItem>
                                        <SelectItem value="10">10 items</SelectItem>
                                        <SelectItem value="20">20 items</SelectItem>
                                        <SelectItem value="50">50 items</SelectItem>
                                    </SelectContent>
                                </Select>

                                {/* Status Filter */}
                                <Select value={statusFilter} onValueChange={handleStatusFilter}>
                                    <SelectTrigger className="w-full sm:w-48">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STATUS_OPTIONS.map((status) => (
                                            <SelectItem key={status.value} value={status.value}>
                                                {/* {status.label} ({status.count}) */}
                                                {status.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>


                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50 border-b border-border">
                                    <tr>
                                        <th
                                            className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 cursor-pointer hover:text-foreground transition-colors"
                                            onClick={() => handleSort('description')}
                                        >
                                            <div className="flex items-center gap-2">
                                                Transaction
                                                <ChevronDown size={14} />
                                            </div>
                                        </th>
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                                            Counter Party
                                        </th>
                                        <th
                                            className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 cursor-pointer hover:text-foreground transition-colors"
                                            onClick={() => handleSort('created_date')}
                                        >
                                            <div className="flex items-center gap-2">
                                                Date
                                                <ChevronDown size={14} />
                                            </div>
                                        </th>
                                        <th
                                            className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 cursor-pointer hover:text-foreground transition-colors"
                                            onClick={() => handleSort('amount')}
                                        >
                                            <div className="flex items-center justify-end gap-2">
                                                Amount
                                                <ChevronDown size={14} />
                                            </div>
                                        </th>
                                        <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {paginatedTransactions.length > 0 ? (
                                        paginatedTransactions.map((txn: WalletTransaction) => {
                                            const status = getStatusFromType(txn.transaction_type);

                                            return (
                                                <tr key={txn.uuid} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium text-foreground">
                                                                {txn.description}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {txn.reference}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-4 text-sm text-muted-foreground">
                                                        {txn.counterparty_user_uuid ? txn.counterparty_user_uuid.substring(0, 8) + '...' : '—'}
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm text-foreground">
                                                                {formatDate(txn.created_date)}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {formatTime(txn.created_date)}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-4 text-right text-sm font-medium text-foreground">
                                                        {txn.currency_code} {txn.amount.toLocaleString()}
                                                    </td>

                                                    <td className="px-6 py-4 text-right">
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status === 'completed'
                                                                ? 'bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-400'
                                                                : status === 'pending'
                                                                    ? 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-400'
                                                                    : 'bg-red-100 dark:bg-red-950/30 text-destructive dark:text-destructive/50'
                                                                }`}
                                                        >
                                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center">
                                                <p className="text-muted-foreground text-sm">No transactions found</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="p-6 border-t border-border flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                Page {page + 1} of {Math.max(1, totalPages)} • {paginatedTransactions.length} of {filteredTransactions.length} results
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page === 0}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page + 1 >= totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Revenue by Course */}
                    <div className="bg-card border border-border rounded-xl shadow-sm">
                        <div className="p-6 border-b border-border">
                            <h3 className="text-lg font-semibold text-foreground">Revenue by Course</h3>
                            <p className="text-muted-foreground text-sm mt-1">Top performing courses</p>
                        </div>
                        <div className="p-6 space-y-5">
                            {revenueBySource.map((item, index) => (
                                <div key={index}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-foreground truncate pr-2">{item.source}</span>
                                        <span className="text-sm font-semibold text-foreground">KES {item.revenue.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-2">
                                        <div
                                            className="bg-primary h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${item.percentage}%` }}
                                        />
                                    </div>
                                    <div className="mt-1 text-xs text-muted-foreground">{item.percentage}% of total</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default RevenuePage;

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString()

const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

const getStatusFromType = (type: string) => {
    switch (type) {
        case 'DEPOSIT':
        case 'PAYMENT':
            return 'completed'
        case 'TRANSFER':
            return 'pending'
        case 'WITHDRAWAL':
            return 'failed'
        default:
            return 'completed'
    }
}

export type WalletTransaction = {
    uuid: string
    wallet_uuid: string
    transaction_type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'PAYMENT'
    amount: number
    currency_code: string
    balance_before: number
    balance_after: number
    reference: string
    description: string
    transfer_reference?: string
    counterparty_user_uuid?: string
    created_date: string
}

const TRANSACTION_TYPES = ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'PAYMENT'] as const
type TransactionType = typeof TRANSACTION_TYPES[number]

const DESCRIPTIONS: Record<TransactionType, string[]> = {
    DEPOSIT: ['Wallet deposit via M-Pesa', 'Wallet top-up via card'],
    WITHDRAWAL: ['Wallet withdrawal to bank', 'Cash withdrawal'],
    TRANSFER: ['Transfer to instructor', 'Transfer to another user'],
    PAYMENT: ['Payment for React Course', 'Payment for UI/UX Course'],
}