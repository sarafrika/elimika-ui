'use client'

import { Banknote, CalendarDays, CheckCircle2, Clock, Download, Filter, Inbox, RefreshCcw, ShieldCheck, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '../../../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card'
import { Donut, TOKEN } from '../../../_components/color-charts'
import { NOT_AVAILABLE, SectionHeader, StatCard, StatusBadge, formatDate, formatMoney, useStudentSkillsFundData } from './shared'

const STATUS_TABS: Array<'All' | 'PENDING' | 'ALLOCATED' | 'APPROVED' | 'DISBURSED' | 'CANCELLED' | 'FAILED'> = [
    'All',
    'PENDING',
    'ALLOCATED',
    'APPROVED',
    'DISBURSED',
    'CANCELLED',
    'FAILED',
]

export function DisbursementsTab() {
    const { currencyCode, transactions } = useStudentSkillsFundData()
    const [activeStatus, setActiveStatus] = useState<(typeof STATUS_TABS)[number]>('All')

    const rows = useMemo(() => {
        return transactions
            .map(transaction => ({
                id: transaction.uuid ?? transaction.description ?? crypto.randomUUID(),
                name: transaction.description ?? 'Disbursement',
                funding: transaction.organisation_uuid ?? 'Skills Fund',
                allocationType: transaction.transaction_type ?? NOT_AVAILABLE,
                amount: Number(transaction.amount ?? 0),
                date: transaction.transaction_date ?? transaction.created_date ?? null,
                to: transaction.target_name ?? NOT_AVAILABLE,
                status: String(transaction.status ?? 'PENDING'),
            }))
            .filter(row => activeStatus === 'All' || row.status === activeStatus)
            .sort((a, b) => {
                const left = a.date ? new Date(a.date).getTime() : 0
                const right = b.date ? new Date(b.date).getTime() : 0
                return right - left
            })
    }, [activeStatus, transactions])

    const counts = useMemo(() => {
        const tally = {
            All: rows.length,
            PENDING: 0,
            ALLOCATED: 0,
            APPROVED: 0,
            DISBURSED: 0,
            CANCELLED: 0,
            FAILED: 0,
        }
        for (const row of rows) {
            if (row.status in tally) tally[row.status as keyof typeof tally] += 1
        }
        return tally
    }, [rows])

    const completed = rows.filter(row => row.status === 'DISBURSED')
    const upcoming = rows.filter(row => row.status === 'PENDING' || row.status === 'ALLOCATED')
    const processing = rows.filter(row => row.status === 'APPROVED')

    const summarySegments = useMemo(
        () => [
            { label: 'Completed', value: completed.reduce((sum, row) => sum + row.amount, 0), color: TOKEN.success },
            { label: 'Upcoming', value: upcoming.reduce((sum, row) => sum + row.amount, 0), color: TOKEN.info },
            { label: 'Processing', value: processing.reduce((sum, row) => sum + row.amount, 0), color: TOKEN.warning },
            { label: 'Other', value: 0, color: TOKEN.destructive },
        ],
        [completed, upcoming, processing]
    )

    const recent = useMemo(() => rows.slice(0, 6), [rows])

    return (
        <div className='grid min-w-0 gap-6 *:min-w-0 xl:grid-cols-[minmax(0,1fr)_320px]'>
            <div className='space-y-4'>
                <SectionHeader
                    title='Disbursements'
                    desc='Track all funding releases, upcoming payments and disbursement history.'
                    right={
                        <div className='flex gap-2'>
                            <Button variant='outline' size='sm' className='gap-1'>
                                <Filter className='h-4 w-4' />
                                Filters
                            </Button>
                            <Button size='sm' className='gap-1 bg-primary text-primary-foreground hover:bg-primary/90'>
                                <Download className='h-4 w-4' />
                                Export
                            </Button>
                        </div>
                    }
                />

                <div className='flex flex-wrap gap-2 border-b'>
                    {STATUS_TABS.map(status => (
                        <button
                            key={status}
                            type='button'
                            onClick={() => setActiveStatus(status)}
                            className={`-mb-px border-b-2 px-3 py-2 text-sm ${status === activeStatus ? 'border-primary font-medium text-primary' : 'border-transparent text-muted-foreground'
                                }`}
                        >
                            {status === 'All'
                                ? 'All'
                                : status === 'DISBURSED'
                                    ? 'Disbursed'
                                    : status === 'PENDING'
                                        ? 'Pending'
                                        : status === 'ALLOCATED'
                                            ? 'Allocated'
                                            : status === 'APPROVED'
                                                ? 'Approved'
                                                : status === 'CANCELLED'
                                                    ? 'Cancelled'
                                                    : 'Failed'}
                            {' '}
                            {counts[status]}
                        </button>
                    ))}
                </div>

                <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
                    <StatCard icon={CalendarDays} tint='bg-success/10 text-success' label='Total Disbursed' value={formatMoney(completed.reduce((sum, row) => sum + row.amount, 0), currencyCode)} sub='This year' />
                    <StatCard icon={Clock} tint='bg-accent/10 text-accent' label='Upcoming Disbursements' value={formatMoney(upcoming.reduce((sum, row) => sum + row.amount, 0), currencyCode)} sub='Across 0 payments' />
                    <StatCard icon={RefreshCcw} tint='bg-warning/10 text-warning' label='Processing' value={formatMoney(processing.reduce((sum, row) => sum + row.amount, 0), currencyCode)} sub='Across 0 payments' />
                    <StatCard icon={Banknote} tint='bg-info/10 text-info' label='Total Scheduled' value={formatMoney(rows.reduce((sum, row) => sum + row.amount, 0), currencyCode)} sub='This year' />
                </div>

                <Card>
                    <CardHeader className='pb-2'>
                        <CardTitle className='text-base'>
                            {activeStatus === 'All' ? `All Disbursements (${rows.length})` : `${activeStatus} Disbursements (${rows.length})`}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className='p-0 overflow-x-auto'>
                        {rows.length === 0 ? (
                            <div className='flex flex-col items-center gap-2 py-12 text-sm text-muted-foreground'>
                                <Inbox className='h-6 w-6' />
                                Not available
                            </div>
                        ) : (
                            <table className='w-full text-sm'>
                                <thead className='bg-muted/50 text-xs text-muted-foreground'>
                                    <tr>
                                        {['Disbursement', 'Funding', 'Allocation Type', 'Amount', 'Date', 'To', 'Status', 'Action'].map(header => (
                                            <th key={header} className='px-3 py-2 text-left font-medium'>
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className='divide-y'>
                                    {rows.map(row => (
                                        <tr key={row.id} className='hover:bg-muted/40'>
                                            <td className='px-3 py-2'>
                                                <p className='font-medium text-foreground'>{row.name}</p>
                                                <p className='font-mono text-[10px] text-muted-foreground'>#{row.id.slice(0, 8)}</p>
                                            </td>
                                            <td className='px-3 py-2 text-xs text-muted-foreground'>{row.funding}</td>
                                            <td className='px-3 py-2 text-xs text-muted-foreground'>{row.allocationType}</td>
                                            <td className='px-3 py-2 font-medium'>{formatMoney(row.amount, currencyCode)}</td>
                                            <td className='px-3 py-2 text-xs'>{row.date ? formatDate(row.date) : NOT_AVAILABLE}</td>
                                            <td className='px-3 py-2 text-xs'>{row.to}</td>
                                            <td className='px-3 py-2'>
                                                <StatusBadge status={row.status} />
                                            </td>
                                            <td className='px-3 py-2'>
                                                {row.status === 'DISBURSED' ? (
                                                    <Button size='sm' variant='link' className='h-auto p-0'>
                                                        <Download className='mr-1 h-3.5 w-3.5' />
                                                        Download
                                                    </Button>
                                                ) : row.status === 'PENDING' || row.status === 'ALLOCATED' ? (
                                                    <Button size='sm' variant='outline'>
                                                        View
                                                    </Button>
                                                ) : (
                                                    '—'
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='pb-2'>
                        <CardTitle className='text-base'>Recent Disbursements</CardTitle>
                    </CardHeader>
                    <CardContent className='p-0 overflow-x-auto'>
                        {recent.length === 0 ? (
                            <div className='flex flex-col items-center gap-2 py-12 text-sm text-muted-foreground'>
                                <Inbox className='h-6 w-6' />
                                No disbursements have been processed yet.
                            </div>
                        ) : (
                            <table className='w-full text-sm'>
                                <thead className='bg-muted/50 text-xs text-muted-foreground'>
                                    <tr>
                                        {['Disbursement', 'Allocation', 'Amount', 'To', 'Date', 'Status', 'Receipt'].map(header => (
                                            <th key={header} className='px-3 py-2 text-left font-medium'>
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className='divide-y'>
                                    {recent.map(row => (
                                        <tr key={row.id} className='hover:bg-muted/40'>
                                            <td className='px-3 py-2'>
                                                <div className='flex items-center gap-2'>
                                                    {row.status === 'DISBURSED' ? (
                                                        <CheckCircle2 className='h-4 w-4 text-success' />
                                                    ) : (
                                                        <XCircle className='h-4 w-4 text-destructive' />
                                                    )}
                                                    <div>
                                                        <p className='font-medium text-foreground'>{row.name}</p>
                                                        <p className='font-mono text-[10px] text-muted-foreground'>#{row.id.slice(0, 8)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='px-3 py-2 text-xs text-muted-foreground'>{row.allocationType}</td>
                                            <td className='px-3 py-2 font-medium'>{formatMoney(row.amount, currencyCode)}</td>
                                            <td className='px-3 py-2 text-xs'>{row.to}</td>
                                            <td className='px-3 py-2 text-xs'>{row.date ? formatDate(row.date) : NOT_AVAILABLE}</td>
                                            <td className='px-3 py-2'>
                                                <StatusBadge status={row.status} />
                                            </td>
                                            <td className='px-3 py-2'>
                                                {row.status === 'DISBURSED' ? (
                                                    <Button size='sm' variant='link' className='h-auto p-0'>
                                                        <Download className='mr-1 h-3.5 w-3.5' />
                                                        Download
                                                    </Button>
                                                ) : (
                                                    '—'
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </CardContent>
                </Card>
            </div>

            <aside className='space-y-4'>
                <Card>
                    <CardHeader className='pb-2'>
                        <CardTitle className='text-base'>Disbursement Summary</CardTitle>
                    </CardHeader>
                    <CardContent className='flex flex-col items-center gap-3'>
                        <Donut
                            segments={summarySegments}
                            centerTop={formatMoney(rows.reduce((sum, row) => sum + row.amount, 0), currencyCode)}
                            centerBottom='Total Scheduled'
                        />

                        <div className='w-full space-y-1 text-xs'>
                            {summarySegments.map(segment => (
                                <div key={segment.label} className='flex items-center gap-2'>
                                    <span className='h-2 w-2 rounded-sm' style={{ background: segment.color }} />
                                    {segment.label}
                                    <span className='ml-auto text-muted-foreground'>{formatMoney(segment.value, currencyCode)}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='pb-2'>
                        <CardTitle className='text-base'>About Disbursements</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-2 text-xs text-muted-foreground'>
                        {[
                            'Funds are released according to the terms of your award.',
                            'Some payments go directly to institutions or service providers.',
                            'Stipends and allowances are paid to your Student Wallet.',
                            'Ensure you meet all conditions to avoid delays.',
                        ].map(item => (
                            <div key={item} className='flex gap-2'>
                                <ShieldCheck className='mt-0.5 h-3.5 w-3.5 text-success' />
                                {item}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </aside>
        </div>
    )
}
