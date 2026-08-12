'use client'

import { ArrowUpRight, Banknote, BarChart3, CalendarDays, ChevronDown, ChevronRight, Download, GraduationCap, PieChart, Wallet } from 'lucide-react'
import { useMemo } from 'react'

import { Badge } from '../../../../../components/ui/badge'
import { Button } from '../../../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../components/ui/card'
import { Donut, TOKEN, TrendChart } from '../../../_components/color-charts'
import { SectionHeader, StatCard, formatMoney, useStudentSkillsFundData } from './shared'

export function OverviewTab() {
  const { currencyCode, summary, sources, transactions, walletTransactions } = useStudentSkillsFundData()

  const segments = useMemo(
    () => [
      { value: Number(summary?.allocated ?? 0), color: TOKEN.chart1, label: 'Allocated' },
      { value: Number(summary?.disbursed ?? 0), color: TOKEN.chart2, label: 'Disbursed' },
      { value: Number(summary?.pending ?? 0), color: TOKEN.chart3, label: 'Pending' },
      { value: 0, color: TOKEN.chart4, label: 'Other' },
      { value: 0, color: TOKEN.chart5, label: 'Reserved' },
    ],
    [summary]
  )

  const totalAwarded = Number(summary?.total_balance ?? 0)
  const totalDisbursed = Number(summary?.disbursed ?? 0)
  const totalSpent = Number(summary?.allocated ?? 0)
  const availableBalance = Number(summary?.remaining ?? 0)
  const totalTransactions = walletTransactions.length + transactions.length

  const notAvailable = 'Not available'

  return (
    <div className='grid min-w-0 gap-6 *:min-w-0 [@media(min-width:1350px)]:grid-cols-[minmax(0,1fr)_320px]'>
      <div className='space-y-6 min-w-0'>
        <SectionHeader
          title='Reports'
          desc='Generate and download detailed reports about your funding, spending and performance.'
          right={
            <div className='flex w-full items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-xs sm:w-auto sm:text-sm'>
              <CalendarDays className='h-4 w-4 shrink-0 text-muted-foreground' />
              <span className='truncate'>{notAvailable}</span>
              <ChevronDown className='h-4 w-4 shrink-0 text-muted-foreground' />
            </div>
          }
        />

        <div className='grid grid-cols-2 gap-3 lg:grid-cols-5'>
          <StatCard icon={GraduationCap} tint='bg-success/10 text-success' label='Total Awarded' value={formatMoney(totalAwarded, currencyCode)} sub={sources.length > 0 ? `Across ${sources.length} awards` : "Across 0 awards"} />
          <StatCard icon={Banknote} tint='bg-info/10 text-info' label='Total Disbursed' value={formatMoney(totalDisbursed, currencyCode)} sub={summary ? `${summary.currency_code ?? currencyCode} live data` : "0% of awarded"} />
          <StatCard icon={ArrowUpRight} tint='bg-warning/10 text-warning' label='Total Spent' value={formatMoney(totalSpent, currencyCode)} sub={transactions.length > 0 ? `${transactions.length} organisation transactions` : "0% of disbursed"} />
          <StatCard icon={Wallet} tint='bg-primary/10 text-primary' label='Available Balance' value={formatMoney(availableBalance, currencyCode)} sub={summary ? 'Live remaining balance' : "0% of awarded"} />
          <StatCard icon={BarChart3} tint='bg-accent/10 text-accent' label='Total Transactions' value={String(totalTransactions)} sub={totalTransactions > 0 ? 'Live wallet + fund entries' : "This period"} />
        </div>

        <div className='grid gap-4 min-w-0 lg:grid-cols-2'>
          <Card className='min-w-0 overflow-hidden'>
            <CardHeader className='flex-row items-center justify-between gap-2 pb-2'>
              <CardTitle className='text-base'>Funding &amp; Spending Trend</CardTitle>
              <Badge variant='outline' className='shrink-0 text-[11px]'>
                Monthly
              </Badge>
            </CardHeader>
            <CardContent className='min-w-0 px-3 sm:px-6'>
              <TrendChart
                months={['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May']}
                series={[
                  {
                    label: 'Awarded',
                    data: [0, 0, 0, 0, 0, 0],
                    color: TOKEN.chart1,
                  },
                  {
                    label: 'Disbursed',
                    data: [0, 0, 0, 0, 0, 0],
                    color: TOKEN.chart2,
                  },
                  {
                    label: 'Spent',
                    data: [0, 0, 0, 0, 0, 0],
                    color: TOKEN.chart3,
                  },
                ]}
              />
            </CardContent>
          </Card>
          <Card className='min-w-0 overflow-hidden'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base'>Allocation Utilization</CardTitle>
            </CardHeader>
            <CardContent className='flex min-w-0 flex-col items-center gap-4 sm:flex-row sm:gap-6'>
              <div className='shrink-0'>
                <Donut
                  segments={segments}
                  centerTop={totalAwarded > 0 ? `${totalAwarded.toLocaleString()}` : "0"}
                  centerBottom='Total Awarded'
                />
              </div>
              <div className='w-full min-w-0 space-y-1.5 text-sm'>
                {segments.map(s => (
                  <div key={s.label} className='flex items-center gap-2'>
                    <span className='h-2.5 w-2.5 shrink-0 rounded-sm' style={{ background: s.color }} />
                    <span className='truncate text-foreground'>{s.label}</span>
                    <span className='ml-auto shrink-0 tabular-nums text-muted-foreground'>
                      {s.value > 0 ? formatMoney(s.value, currencyCode) : "KES 0"}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-base'>Recent Reports</CardTitle>
          </CardHeader>
          <CardContent className='p-0 overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead className='text-xs text-muted-foreground bg-muted/50'>
                <tr>
                  <th className='px-4 py-2 text-left font-medium'>Report Name</th>
                  <th className='px-4 py-2 text-left font-medium'>Type</th>
                  <th className='px-4 py-2 text-left font-medium'>Period</th>
                  <th className='px-4 py-2 text-left font-medium'>Format</th>
                  <th className='px-4 py-2 text-right font-medium'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y'>
                {[
                  ['Funding Summary Report', 'Funding Report', notAvailable, 'PDF'],
                  ['Disbursement Report', 'Disbursement Report', notAvailable, 'Excel'],
                  ['Spending Report', 'Spending Report', notAvailable, 'PDF'],
                  ['Transaction Report', 'Transaction Report', notAvailable, 'Excel'],
                  ['Allocation Utilization', 'Allocation Report', notAvailable, 'PDF'],
                ].map(([name, type, period, format]) => (
                  <tr key={name} className='hover:bg-muted/40'>
                    <td className='px-4 py-2.5 font-medium text-foreground'>{name}</td>
                    <td className='px-4 py-2.5 text-muted-foreground'>{type}</td>
                    <td className='px-4 py-2.5 text-muted-foreground'>{period}</td>
                    <td className='px-4 py-2.5'>
                      <Badge variant='outline' className='text-[10px]'>
                        {format}
                      </Badge>
                    </td>
                    <td className='px-4 py-2.5 text-right'>
                      <Button size='icon' variant='ghost' className='h-8 w-8'>
                        <Download className='h-4 w-4' />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <aside className='space-y-4 min-w-0'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-base'>Quick Report Generator</CardTitle>
            <CardDescription>Choose a report type and generate instantly.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-2'>
            {[
              ['Funding Summary', 'Overview of all awards and balances'],
              ['Disbursement Report', 'Details of all fund releases'],
              ['Spending Report', 'How your funds were spent'],
              ['Transaction Report', 'All money in and out activities'],
              ['Allocation Report', 'Breakdown by allocation category'],
              ['Utilization Report', 'Funding utilization and remaining balance'],
              ['Tax Report', 'Download tax related documents'],
            ].map(([title, description]) => (
              <button
                key={title}
                className='w-full flex items-center justify-between gap-3 rounded-lg border bg-card p-3 text-left hover:border-primary'
              >
                <div className='min-w-0'>
                  <p className='truncate text-sm font-medium text-foreground'>{title}</p>
                  <p className='truncate text-[11px] text-muted-foreground'>{description}</p>
                </div>
                <ChevronRight className='h-4 w-4 text-muted-foreground' />
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-base'>Report Insights</CardTitle>
          </CardHeader>

          <CardContent className='space-y-3 text-sm'>
            <div className='flex gap-2'>
              <ArrowUpRight className='mt-0.5 h-4 w-4 text-success' />
              <p className='text-foreground'>
                Your available balance is{' '}
                <span className='font-semibold'>
                  {formatMoney(availableBalance ?? 0, currencyCode)}
                </span>
                .
              </p>
            </div>

            <div className='flex gap-2'>
              <PieChart className='mt-0.5 h-4 w-4 text-warning' />
              <p className='text-foreground'>
                Tuition Fees allocation utilization is currently{' '}
                <span className='font-semibold'>0%</span>.
              </p>
            </div>

            <div className='flex gap-2'>
              <CalendarDays className='mt-0.5 h-4 w-4 text-info' />
              <p className='text-foreground'>
                No upcoming stipend disbursement is scheduled.
              </p>
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}
