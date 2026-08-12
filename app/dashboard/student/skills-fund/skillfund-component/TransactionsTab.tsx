'use client'

import { ChevronLeft, ChevronRight, Inbox, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card'
import { Input } from '../../../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../components/ui/select'
import { Donut, TOKEN } from '../../../_components/color-charts'
import {
  NOT_AVAILABLE,
  SectionHeader,
  formatDateTime,
  formatMoney,
  formatMoneyOrUnavailable,
  useStudentSkillsFundData,
} from './shared'

const TABS = ['All Transactions', 'Money In', 'Payments', 'Refunds', 'Adjustments', 'Reservations'] as const

export function TransactionsTab() {
  const { currencyCode, walletTransactions } = useStudentSkillsFundData()
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('All Transactions')
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState<'all' | '30d' | '90d'>('all')

  const tabRowRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  useEffect(() => {
    const activeButton = tabRefs.current.get(activeTab)
    activeButton?.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' })
  }, [activeTab])

  const rows = useMemo(() => {
    const cutoff =
      dateFilter === '30d'
        ? Date.now() - 30 * 86_400_000
        : dateFilter === '90d'
          ? Date.now() - 90 * 86_400_000
          : null
    const needle = search.trim().toLowerCase()

    return walletTransactions
      .map(txn => {
        const direction = String(txn.transaction_type ?? '')
        const description = txn.description ?? 'Wallet transaction'
        const isIn = direction === 'DEPOSIT' || direction === 'SALE' || direction === 'TRANSFER_IN'
        const type =
          direction === 'TRANSFER_IN'
            ? 'Money In'
            : direction === 'TRANSFER_OUT'
              ? 'Money Out'
              : direction || NOT_AVAILABLE
        return {
          id: txn.uuid ?? txn.reference ?? description ?? crypto.randomUUID(),
          description,
          reference: txn.reference ?? '—',
          date: txn.created_date,
          amount: Number(txn.amount ?? 0) * (isIn ? 1 : -1),
          type,
          counterparty: txn.counterparty_user_uuid ?? 'External',
        }
      })
      .filter(row => {
        if (activeTab === 'Money In' && row.amount <= 0) return false
        if (activeTab === 'Payments' && row.amount >= 0) return false
        if (activeTab === 'Refunds' && !row.description.toLowerCase().includes('refund')) return false
        if (activeTab === 'Adjustments' && !row.description.toLowerCase().includes('adjust')) return false
        if (activeTab === 'Reservations' && !row.description.toLowerCase().includes('reserv')) return false
        if (cutoff && row.date && new Date(row.date).getTime() < cutoff) return false
        if (!needle) return true
        return `${row.description} ${row.reference} ${row.type} ${row.counterparty}`.toLowerCase().includes(needle)
      })
      .sort((left, right) => {
        const leftTime = left.date ? new Date(left.date).getTime() : 0
        const rightTime = right.date ? new Date(right.date).getTime() : 0
        return rightTime - leftTime
      })
  }, [activeTab, dateFilter, search, walletTransactions])

  const totalIn = rows.filter(row => row.amount > 0).reduce((sum, row) => sum + row.amount, 0)
  const totalOut = Math.abs(rows.filter(row => row.amount < 0).reduce((sum, row) => sum + row.amount, 0))
  const net = totalIn - totalOut

  const spendingSegments = useMemo(() => {
    const groups = new Map<string, number>()

    for (const row of rows) {
      if (row.amount >= 0) continue
      const label =
        row.description.toLowerCase().includes('refund')
          ? 'Refunds'
          : row.description.toLowerCase().includes('reserv')
            ? 'Reservations'
            : row.description.toLowerCase().includes('adjust')
              ? 'Adjustments'
              : 'Payments'
      groups.set(label, (groups.get(label) ?? 0) + Math.abs(row.amount))
    }

    const total = Array.from(groups.values()).reduce((sum, value) => sum + value, 0)
    return Array.from(groups.entries()).map(([label, value], index) => ({
      label,
      value,
      color: [TOKEN.chart1, TOKEN.chart2, TOKEN.chart3, TOKEN.chart4, TOKEN.chart5][index % 5],
      percentage: total > 0 ? (value / total) * 100 : 0,
    }))
  }, [rows])

  return (
    <div className='grid min-w-0 gap-6 *:min-w-0 xl:grid-cols-[minmax(0,1fr)_320px]'>
      <div className='space-y-4'>
        <SectionHeader
          title='Transactions'
          desc='View all money in and out of your wallet, including payments, disbursements and refunds.'
        />

        <div className='flex items-center gap-1'>
          <button
            type='button'
            aria-label='Scroll tabs left'
            onClick={() => tabRowRef.current?.scrollBy({ left: -200, behavior: 'smooth' })}
            className='inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground'
          >
            <ChevronLeft className='h-4 w-4' />
          </button>
          <div
            ref={tabRowRef}
            className='flex flex-1 flex-nowrap gap-2 overflow-x-auto border-b pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
          >
            {TABS.map(tab => (
              <button
                key={tab}
                type='button'
                ref={el => {
                  if (el) tabRefs.current.set(tab, el)
                }}
                onClick={() => setActiveTab(tab)}
                className={`-mb-px shrink-0 border-b-2 px-3 py-2 text-sm ${tab === activeTab ? 'border-primary font-medium text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button
            type='button'
            aria-label='Scroll tabs right'
            onClick={() => tabRowRef.current?.scrollBy({ left: 200, behavior: 'smooth' })}
            className='inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground'
          >
            <ChevronRight className='h-4 w-4' />
          </button>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <div className='relative'>
            <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder='Search wallet transactions...'
              className='h-9 w-64 pl-8'
            />
          </div>
          <Select value={dateFilter} onValueChange={value => setDateFilter(value as typeof dateFilter)}>
            <SelectTrigger className='h-9 w-36'>
              <SelectValue placeholder='Date range' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All time</SelectItem>
              <SelectItem value='30d'>Last 30 days</SelectItem>
              <SelectItem value='90d'>Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-base'>Wallet history</CardTitle>
          </CardHeader>
          <CardContent className='p-0 overflow-x-auto'>
            {rows.length === 0 ? (
              <div className='flex flex-col items-center gap-2 py-12 text-sm text-muted-foreground'>
                <Inbox className='h-6 w-6' />
                No wallet transactions match your filters.
              </div>
            ) : (
              <table className='w-full text-sm'>
                <thead className='bg-muted/50 text-xs text-muted-foreground'>
                  <tr>
                    <th className='px-4 py-2 text-left font-medium'>Description</th>
                    <th className='px-4 py-2 text-left font-medium'>Reference</th>
                    <th className='px-4 py-2 text-left font-medium'>Date</th>
                    <th className='px-4 py-2 text-left font-medium'>Counterparty</th>
                    <th className='px-4 py-2 text-right font-medium'>Amount</th>
                  </tr>
                </thead>
                <tbody className='divide-y'>
                  {rows.map(row => (
                    <tr key={row.id} className='hover:bg-muted/40'>
                      <td className='px-4 py-2.5 font-medium text-foreground'>{row.description}</td>
                      <td className='px-4 py-2.5 text-muted-foreground'>{row.reference}</td>
                      <td className='px-4 py-2.5 text-muted-foreground'>{row.date ? formatDateTime(row.date) : NOT_AVAILABLE}</td>
                      <td className='px-4 py-2.5 text-muted-foreground'>{row.counterparty}</td>
                      <td className={`px-4 py-2.5 text-right font-medium ${row.amount >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {row.amount >= 0 ? '+' : '-'}
                        {formatMoney(Math.abs(row.amount), currencyCode)}
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
          <CardHeader className='flex-row items-center justify-between gap-2 pb-2'>
            <CardTitle className='text-base'>Transaction Summary</CardTitle>
          </CardHeader>
          <CardContent className='space-y-2 text-sm'>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Money In</span>
              <span className='font-semibold text-success'>{formatMoneyOrUnavailable(totalIn, currencyCode)}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Money Out</span>
              <span className='font-semibold text-destructive'>{formatMoneyOrUnavailable(totalOut, currencyCode)}</span>
            </div>
            <div className='flex justify-between border-t pt-2'>
              <span className='text-muted-foreground'>Net Flow</span>
              <span className={`font-semibold ${net >= 0 ? 'text-success' : 'text-destructive'}`}>
                {net >= 0 ? '' : '-'}
                {formatMoney(Math.abs(net), currencyCode)}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Transactions</span>
              <span className='font-semibold'>{rows.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-base'>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent className='flex flex-col items-center gap-3'>
            {spendingSegments.length === 0 ? (
              <div className='flex flex-col items-center gap-2 py-8 text-center text-xs text-muted-foreground'>
                <Inbox className='h-5 w-5 text-muted-foreground' />
                Not available
              </div>
            ) : (
              <>
                <Donut segments={spendingSegments} centerTop={formatMoney(totalOut, currencyCode)} centerBottom='Total Spent' />
                <div className='w-full space-y-1 text-xs'>
                  {spendingSegments.map(segment => (
                    <div key={segment.label} className='flex items-center gap-2'>
                      <span className='h-2 w-2 rounded-sm' style={{ background: segment.color }} />
                      <span className='truncate'>{segment.label}</span>
                      <span className='ml-auto text-muted-foreground'>
                        {formatMoney(segment.value, currencyCode)} ({segment.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}
