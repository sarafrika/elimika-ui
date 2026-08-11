'use client'

import { Banknote, CheckCircle2, ChevronRight, Filter, GraduationCap } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '../../../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card'
import { Input } from '../../../../../components/ui/input'
import { Progress } from '../../../../../components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger } from '../../../../../components/ui/select'
import { Donut, TOKEN } from '../../../_components/color-charts'
import {
  formatDate,
  formatMoneyOrUnavailable,
  NOT_AVAILABLE,
  SectionHeader,
  StatusBadge,
  useStudentSkillsFundData,
} from './shared'

type FundingItem = {
  uuid: string
  name: string
  funder: string
  id: string
  program: string
  total: number | null
  available: number | null
  committed: number | null
  disbursed: number | null
  util: number | null
  start: string
  end: string
  renewable: boolean | null
  status: 'active' | 'completed' | 'pending' | 'expired' | 'cancelled'
}

export function MyFundingTab() {
  const { currencyCode, sources, summary } = useStudentSkillsFundData()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('All Funding')
  const [statusFilter, setStatusFilter] = useState('All')

  const funding = useMemo<FundingItem[]>(
    () =>
      sources.map((source, index) => {
        const total = Number(source.amount ?? 0)
        const name = source.name ?? 'Funding source'
        return {
          uuid: source.uuid ?? `${name}-${index}`,
          name,
          funder: source.source_type ?? 'Not available',
          id: source.uuid ?? NOT_AVAILABLE,
          program: NOT_AVAILABLE,
          total,
          available: summary?.remaining ?? null,
          committed: summary?.allocated ?? null,
          disbursed: summary?.disbursed ?? null,
          util:
            summary?.total_balance && summary.total_balance > 0 && summary.disbursed !== undefined
              ? Math.min(100, Math.round(((summary.disbursed ?? 0) / summary.total_balance) * 100))
              : null,
          start: formatDate(source.created_date),
          end: NOT_AVAILABLE,
          renewable: null,
          status: 'active',
        }
      }),
    [sources, summary]
  )

  const filteredFunding = useMemo(() => {
    return funding.filter(item => {
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.funder.toLowerCase().includes(search.toLowerCase()) ||
        item.id.toLowerCase().includes(search.toLowerCase())

      const matchesTab =
        activeTab === 'All Funding' ||
        item.status === activeTab.replace(/\s\d+$/, '').toLowerCase()

      const matchesFilter = statusFilter === 'All' || item.status === statusFilter.toLowerCase()

      return matchesSearch && matchesTab && matchesFilter
    })
  }, [funding, search, activeTab, statusFilter])

  const completed = useMemo(
    () => filteredFunding.filter(item => item.status === 'completed'),
    [filteredFunding]
  )
  const active = useMemo(
    () => filteredFunding.filter(item => item.status === 'active'),
    [filteredFunding]
  )

  const tabs = [
    'All Funding',
    `Active ${funding.filter(item => item.status === 'active').length}`,
    `Pending ${NOT_AVAILABLE}`,
    `Completed ${NOT_AVAILABLE}`,
    `Expired ${NOT_AVAILABLE}`,
    `Cancelled ${NOT_AVAILABLE}`,
  ]

  const summaryTotals = useMemo(
    () => ({
      active: funding.filter(item => item.status === 'active').reduce((sum, item) => sum + (item.total ?? 0), 0),
      completed: 0,
      pending: 0,
      expired: 0,
      cancelled: 0,
    }),
    [funding]
  )

  const totalAwarded =
    summaryTotals.active +
    summaryTotals.completed +
    summaryTotals.pending +
    summaryTotals.expired +
    summaryTotals.cancelled

  const allocated = summary?.allocated ?? null
  const remaining = summary?.remaining ?? null

  return (
    <div className='grid min-w-0 gap-6 *:min-w-0 lg:grid-cols-[minmax(0,1fr)_320px]'>
      <div className='space-y-6 min-w-0'>
        <SectionHeader
          title='My Funding'
          desc='All the scholarships, bursaries, grants and sponsorships a student have received.'
          right={
            <div className='flex items-center gap-2'>
              <Input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder='Search my funding...'
                className='h-9 w-[80%]'
              />

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className='h-9 w-16 justify-center p-0' aria-label='Filter funding'>
                  <Filter className='h-4 w-4' />
                </SelectTrigger>

                <SelectContent align='end'>
                  <SelectItem value='All'>All</SelectItem>
                  <SelectItem value='Active'>Active</SelectItem>
                  <SelectItem value='Pending'>Pending</SelectItem>
                  <SelectItem value='Completed'>Completed</SelectItem>
                  <SelectItem value='Expired'>Expired</SelectItem>
                  <SelectItem value='Cancelled'>Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        />

        <div className='flex flex-wrap gap-2 border-b'>
          {tabs.map(tab => (
            <button
              key={tab}
              type='button'
              onClick={() => setActiveTab(tab)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm ${activeTab === tab
                ? 'border-primary font-medium text-primary'
                : 'border-transparent text-muted-foreground'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div>
          <h3 className='mb-2 text-sm font-semibold text-foreground'>
            Active Funding ({filteredFunding.length})
          </h3>

          <div className='space-y-3'>
            {filteredFunding.length > 0 ? (
              filteredFunding.map(item => (
                <Card key={item.uuid}>
                  <CardContent className='p-4'>
                    <div className='flex items-start gap-3'>
                      <div className='grid h-12 w-12 place-items-center rounded-lg bg-success/10 text-success'>
                        <GraduationCap className='h-6 w-6' />
                      </div>
                      <div className='min-w-0 flex-1'>
                        <div className='flex flex-wrap items-start justify-between gap-2'>
                          <div>
                            <p className='flex items-center gap-2 font-semibold text-foreground'>
                              {item.name} <StatusBadge status='Active' />
                            </p>
                            <p className='mt-0.5 text-xs text-muted-foreground'>
                              {item.funder} • Award ID: {item.id}
                            </p>
                            <p className='text-xs text-muted-foreground'>{item.program}</p>
                          </div>
                          <div className='text-right'>
                            <p className='text-lg font-semibold text-foreground'>
                              {formatMoneyOrUnavailable(item.total, currencyCode)}
                            </p>
                            <p className='text-[11px] text-muted-foreground'>Total Award</p>
                          </div>
                        </div>
                        <div className='mt-3 grid gap-3 text-sm sm:grid-cols-4'>
                          <div>
                            <p className='text-[11px] text-muted-foreground'>Available</p>
                            <p className='font-medium text-success'>
                              {formatMoneyOrUnavailable(item.available, currencyCode)}
                            </p>
                          </div>
                          <div>
                            <p className='text-[11px] text-muted-foreground'>Committed</p>
                            <p className='font-medium text-warning'>
                              {formatMoneyOrUnavailable(item.committed, currencyCode)}
                            </p>
                          </div>
                          <div>
                            <p className='text-[11px] text-muted-foreground'>Disbursed</p>
                            <p className='font-medium text-info'>
                              {formatMoneyOrUnavailable(item.disbursed, currencyCode)}
                            </p>
                          </div>
                          <div>
                            <p className='text-[11px] text-muted-foreground'>Utilization</p>
                            <div className='flex items-center gap-2'>
                              <Progress value={item.util ?? 0} className='h-1.5' />
                              <span className='text-xs'>
                                {item.util === null ? NOT_AVAILABLE : `${item.util}%`}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className='mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground'>
                          <div className='flex flex-wrap gap-x-4 gap-y-1'>
                            <span>Started: {item.start}</span>
                            <span>Ends: {item.end}</span>
                            <span>Renewable: {item.renewable === null ? NOT_AVAILABLE : item.renewable ? 'Yes' : 'No'}</span>
                          </div>
                          <Button size='sm' variant='outline' className='gap-1'>
                            View Details <ChevronRight className='h-3.5 w-3.5' />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className='flex flex-col items-center justify-center py-12 text-center'>
                  <GraduationCap className='mb-3 h-10 w-10 text-muted-foreground/50' />
                  <h4 className='text-sm font-semibold text-foreground'>No active funding found</h4>
                  <p className='mt-1 max-w-sm text-sm text-muted-foreground'>
                    There are no active funding awards matching your current search or filters.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-base'>Completed Funding ({completed.length})</CardTitle>
            <Button variant='link' size='sm'>
              View all
            </Button>
          </CardHeader>

          <CardContent className='p-0'>
            {completed.length > 0 ? (
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead className='bg-muted/50 text-xs text-muted-foreground'>
                    <tr>
                      <th className='px-4 py-2 text-left font-medium'>Programme</th>
                      <th className='px-4 py-2 text-left font-medium'>Funder</th>
                      <th className='px-4 py-2 text-left font-medium'>Award ID</th>
                      <th className='px-4 py-2 text-left font-medium'>Total</th>
                      <th className='px-4 py-2 text-left font-medium'>Completed On</th>
                      <th className='px-4 py-2 text-left font-medium'>Status</th>
                    </tr>
                  </thead>

                  <tbody className='divide-y'>
                    {completed.map(item => (
                      <tr key={item.uuid} className='hover:bg-muted/40'>
                        <td className='px-4 py-2.5 font-medium text-foreground'>{item.name}</td>
                        <td className='px-4 py-2.5 text-muted-foreground'>{item.funder}</td>
                        <td className='px-4 py-2.5 font-mono text-xs text-muted-foreground'>{item.id}</td>
                        <td className='px-4 py-2.5 text-foreground'>
                          {formatMoneyOrUnavailable(item.total, currencyCode)}
                        </td>
                        <td className='px-4 py-2.5 text-muted-foreground'>{item.end}</td>
                        <td className='px-4 py-2.5'>
                          <StatusBadge status={item.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center py-12 text-center'>
                <CheckCircle2 className='mb-3 h-10 w-10 text-muted-foreground/50' />

                <h4 className='text-sm font-semibold text-foreground'>
                  No completed funding awards
                </h4>

                <p className='mt-1 max-w-sm text-sm text-muted-foreground'>
                  No completed funding awards were found for your account.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <aside className='space-y-4 min-w-0'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-base'>Funding Summary</CardTitle>
          </CardHeader>
          <CardContent className='flex items-center gap-4'>
            <Donut
              segments={[
                { value: summaryTotals.active, color: TOKEN.chart1, label: 'Active' },
                { value: summaryTotals.completed, color: TOKEN.chart2, label: 'Completed' },
                { value: summaryTotals.pending, color: TOKEN.chart3, label: 'Pending' },
                { value: summaryTotals.expired, color: TOKEN.chart4, label: 'Expired' },
                { value: summaryTotals.cancelled, color: TOKEN.chart5, label: 'Cancelled' },
              ]}
              centerTop={formatMoneyOrUnavailable(totalAwarded, currencyCode)}
              centerBottom='Total Awarded'
            />

            <div className='space-y-1.5 text-sm'>
              <div className='flex items-center gap-2'>
                <span className='h-2.5 w-2.5 rounded-sm' style={{ background: TOKEN.chart1 }} />
                Active
              </div>
              <div className='flex items-center gap-2'>
                <span className='h-2.5 w-2.5 rounded-sm' style={{ background: TOKEN.chart2 }} />
                Completed
              </div>
              <div className='flex items-center gap-2'>
                <span className='h-2.5 w-2.5 rounded-sm' style={{ background: TOKEN.chart3 }} />
                Pending
              </div>
              <div className='flex items-center gap-2 text-muted-foreground'>
                <span className='h-2.5 w-2.5 rounded-sm bg-destructive' />
                Expired
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-base'>Next Disbursement</CardTitle>
          </CardHeader>
          <CardContent className='space-y-2 text-sm'>
            <div className='flex items-start gap-3'>
              <Banknote className='h-5 w-5 text-success' />
              <div>
                <p className='font-medium'>Not available</p>
                <p className='text-xs text-muted-foreground'>No upcoming disbursement data is available in the live hook.</p>
              </div>
              <span className='ml-auto font-semibold'>{NOT_AVAILABLE}</span>
            </div>
            <div className='flex justify-between rounded-md bg-muted/50 p-2 text-xs'>
              <span>On <b>{NOT_AVAILABLE}</b></span>
              <span>In <b>{NOT_AVAILABLE}</b></span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-base'>My Obligations</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3 text-sm'>
            {[
              ['Maintain 80% attendance', NOT_AVAILABLE, 'text-muted-foreground'],
              ['Submit Assignment 2', NOT_AVAILABLE, 'text-muted-foreground'],
              ['Mid-Term Exam', NOT_AVAILABLE, 'text-muted-foreground'],
            ].map(([title, state, tone]) => (
              <div key={title} className='flex items-start gap-2'>
                <CheckCircle2 className='mt-0.5 h-4 w-4 text-success' />
                <div className='min-w-0 flex-1'>
                  <p className='text-foreground'>{title}</p>
                </div>
                <span className={`text-xs ${tone}`}>{state}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}
