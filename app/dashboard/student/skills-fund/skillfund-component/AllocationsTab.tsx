'use client'

import {
  Banknote,
  BookOpen,
  Building2,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  GraduationCap,
  Info,
  Laptop,
  PieChart,
  ShieldCheck,
  Wallet,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { Badge } from '../../../../../components/ui/badge'
import { Button } from '../../../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card'
import { Donut, TOKEN } from '../../../_components/color-charts'
import {
  NOT_AVAILABLE,
  SectionHeader,
  StatCard,
  formatMoneyOrUnavailable,
  getFundingCategory,
  useStudentSkillsFundData,
} from './shared'

const ALLOCATION_TABS = [
  'All Allocations',
  'Tuition Fees',
  'Stipend',
  'Assessments',
  'Equipment',
  'Learning Materials',
  'Transport',
  'Other Support',
] as const

const ICON_BY_CATEGORY: Record<string, typeof GraduationCap> = {
  'Tuition Fees': GraduationCap,
  Stipend: Wallet,
  Assessments: PieChart,
  Equipment: Laptop,
  'Learning Materials': BookOpen,
  Transport: CalendarDays,
  'Other Support': CircleDollarSign,
}

export function AllocationsTab() {
  const { currencyCode, sources, summary } = useStudentSkillsFundData()
  const [activeCategory, setActiveCategory] = useState<(typeof ALLOCATION_TABS)[number]>('All Allocations')
  const [showAllRestrictions, setShowAllRestrictions] = useState(false)

  const allocations = useMemo(() => {
    const grouped = new Map<string, { name: string; amount: number; count: number }>()

    for (const source of sources) {
      const category = getFundingCategory(source.name ?? source.source_type ?? '')
      const current = grouped.get(category) ?? { name: category, amount: 0, count: 0 }
      current.amount += Number(source.amount ?? 0)
      current.count += 1
      grouped.set(category, current)
    }

    return Array.from(grouped.values())
      .map((item, index) => ({
        name: item.name,
        category: item.name,
        primary: index === 0,
        desc: 'Live allocation category from the current skills-fund sources.',
        allocated: item.amount,
        available: null as number | null,
        committed: summary?.allocated ?? null,
        disbursed: summary?.disbursed ?? null,
        used: null as number | null,
        color: Object.values(TOKEN)[index % Object.values(TOKEN).length],
        tintClass: 'bg-muted text-muted-foreground',
        icon: ICON_BY_CATEGORY[item.name] ?? Building2,
        note: item.count > 0 ? `${item.count} source${item.count === 1 ? '' : 's'} in this category` : NOT_AVAILABLE,
      }))
      .filter(item => activeCategory === 'All Allocations' || item.category === activeCategory)
  }, [activeCategory, sources, summary?.allocated, summary?.disbursed])

  const overview = useMemo(() => {
    const totalAwarded = allocations.reduce((sum, item) => sum + item.allocated, 0)
    const activeAllocations = allocations.filter(item => item.allocated > 0)

    return {
      totalAwarded,
      totalAvailable: summary?.remaining ?? 0,
      totalCommitted: summary?.allocated ?? 0,
      totalDisbursed: summary?.disbursed ?? 0,
      activeCount: activeAllocations.length,
      exhaustedCount: 0,
    }
  }, [allocations, summary?.allocated, summary?.disbursed, summary?.remaining])

  const allocationSegments = useMemo(() => {
    return allocations
      .filter(item => item.allocated > 0)
      .map((item, index) => ({
        label: item.name,
        value: item.allocated,
        color: [TOKEN.chart1, TOKEN.chart2, TOKEN.chart3, TOKEN.chart4, TOKEN.chart5][index % 5],
        percentage: overview.totalAwarded > 0 ? (item.allocated / overview.totalAwarded) * 100 : 0,
      }))
  }, [allocations, overview.totalAwarded])

  const restrictions = [
    { label: 'Approved Courses', value: NOT_AVAILABLE, icon: BookOpen },
    { label: 'Approved Institutions', value: NOT_AVAILABLE, icon: Building2 },
    { label: 'Delivery Modes', value: NOT_AVAILABLE, icon: Laptop },
    { label: 'Academic Period', value: NOT_AVAILABLE, icon: CalendarDays },
    { label: 'Payment Categories', value: NOT_AVAILABLE, icon: Wallet },
    { label: 'Funding Limit', value: formatMoneyOrUnavailable(summary?.total_balance ?? null, currencyCode), icon: CircleDollarSign },
    { label: 'Approval Required', value: NOT_AVAILABLE, icon: ShieldCheck },
    { label: 'Unused Funds', value: NOT_AVAILABLE, icon: Clock3 },
  ]

  const visibleRestrictions = showAllRestrictions ? restrictions : restrictions.slice(0, 4)

  return (
    <div className='grid min-w-0 gap-6 *:min-w-0 xl:grid-cols-[minmax(0,1fr)_320px]'>
      <div className='space-y-4'>
        <SectionHeader
          title='Allocations'
          desc='Breakdown of your accepted funding by category and how you can use them.'
        />

        <div className='grid grid-cols-2 gap-3 lg:grid-cols-5'>
          <StatCard icon={GraduationCap} tint='bg-success/10 text-success' label='Total awarded' value={formatMoneyOrUnavailable(overview.totalAwarded, currencyCode)} sub='Across 0 awards' />
          <StatCard icon={Banknote} tint='bg-info/10 text-info' label='Total available' value={formatMoneyOrUnavailable(overview.totalAvailable, currencyCode)} sub='0% of awarded' />
          <StatCard icon={Clock3} tint='bg-warning/10 text-warning' label='Total committed' value={formatMoneyOrUnavailable(overview.totalCommitted, currencyCode)} sub='0% of awarded' />
          <StatCard icon={CircleDollarSign} tint='bg-primary/10 text-primary' label='Total disbursed' value={formatMoneyOrUnavailable(overview.totalDisbursed, currencyCode)} sub='0% of awarded' />
          <StatCard icon={PieChart} tint='bg-accent/10 text-accent' label='Allocations' value={String(overview.activeCount)} sub='Active allocations' />
        </div>

        <div className='flex flex-wrap gap-2 border-b'>
          {ALLOCATION_TABS.map(tab => (
            <button
              key={tab}
              type='button'
              onClick={() => setActiveCategory(tab)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm ${tab === activeCategory ? 'border-primary font-medium text-primary' : 'border-transparent text-muted-foreground'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className='rounded-md border border-info/20 bg-info/10 p-3 text-sm text-info flex items-center gap-2'>
          <Info className='h-4 w-4' />
          Funds are restricted to approved uses only. Ensure you meet all conditions before making a payment.
        </div>

        <div className='space-y-3'>
          {allocations.length === 0 ? (
            <Card>
              <CardContent className='py-10 text-center text-sm text-muted-foreground'>
                No allocations in this category yet.
              </CardContent>
            </Card>
          ) : (
            allocations.map(item => {
              const Icon = item.icon
              return (
                <Card key={item.name}>
                  <CardContent className='p-4'>
                    <div className='flex items-start gap-3'>
                      <div className='grid h-11 w-11 place-items-center rounded-lg bg-muted'>
                        <Icon className='h-5 w-5 text-muted-foreground' />
                      </div>
                      <div className='min-w-0 flex-1'>
                        <div className='flex flex-wrap items-start justify-between gap-2'>
                          <div>
                            <p className='flex items-center gap-2 font-semibold text-foreground'>
                              {item.name}
                              {item.primary && (
                                <Badge variant='outline' className='border-accent/20 bg-accent/10 text-[10px] text-accent'>
                                  Primary Allocation
                                </Badge>
                              )}
                            </p>
                            <p className='text-xs text-muted-foreground'>{item.desc}</p>
                            <button type='button' className='mt-1 text-xs text-primary'>
                              View restrictions ↓
                            </button>
                          </div>
                          <div className='grid grid-cols-4 gap-4 text-sm'>
                            <div className='text-right'>
                              <p className='text-[11px] text-muted-foreground'>Allocated</p>
                              <p className='font-medium'>{formatMoneyOrUnavailable(item.allocated, currencyCode)}</p>
                            </div>
                            <div className='text-right'>
                              <p className='text-[11px] text-muted-foreground'>Available</p>
                              <p className='font-medium text-success'>{NOT_AVAILABLE}</p>
                            </div>
                            <div className='text-right'>
                              <p className='text-[11px] text-muted-foreground'>Committed</p>
                              <p className='font-medium text-warning'>{formatMoneyOrUnavailable(item.committed, currencyCode)}</p>
                            </div>
                            <div className='text-right'>
                              <p className='text-[11px] text-muted-foreground'>Disbursed</p>
                              <p className='font-medium text-info'>{formatMoneyOrUnavailable(item.disbursed, currencyCode)}</p>
                            </div>
                          </div>
                        </div>
                        <div className='mt-3'>
                          <div className='h-2 overflow-hidden rounded-full bg-muted'>
                            <div className='h-full bg-primary' style={{ width: '0%' }} />
                          </div>
                          <div className='mt-1 flex justify-between text-[11px] text-muted-foreground'>
                            <span>{item.used === null ? NOT_AVAILABLE : `${item.used}% Used`}</span>
                            <span>{item.note}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>

      <aside className='space-y-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-base'>Allocation Overview</CardTitle>
          </CardHeader>
          <CardContent className='flex flex-col gap-4 lg:items-center'>
            <Donut
              segments={allocationSegments}
              centerTop={formatMoneyOrUnavailable(overview.totalAwarded, currencyCode)}
              centerBottom='Total Awarded'
            />

            <div className='flex-1 space-y-2 text-xs'>
              {allocationSegments.map(segment => (
                <div key={segment.label} className='flex items-center gap-2'>
                  <span className='h-2.5 w-2.5 shrink-0 rounded-sm' style={{ background: segment.color }} />
                  <span className='truncate'>{segment.label}</span>
                  <span className='ml-auto shrink-0 text-muted-foreground'>
                    {formatMoneyOrUnavailable(segment.value, currencyCode)} ({segment.percentage.toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-base'>Restrictions Summary</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='space-y-2 text-xs'>
              {visibleRestrictions.map(({ label, value, icon: Icon }) => (
                <div key={label} className='flex items-start gap-2'>
                  <Icon className='mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground' />
                  <div className='min-w-0'>
                    <p className='font-medium text-foreground'>{label}</p>
                    <p className='text-muted-foreground'>{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {restrictions.length > 4 ? (
              <Button
                variant='link'
                size='sm'
                className='h-auto w-full p-0 text-center'
                onClick={() => setShowAllRestrictions(prev => !prev)}
              >
                {showAllRestrictions
                  ? 'Show Less'
                  : `View ${restrictions.length - 4} More Restriction${restrictions.length - 4 > 1 ? 's' : ''} →`}
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}
