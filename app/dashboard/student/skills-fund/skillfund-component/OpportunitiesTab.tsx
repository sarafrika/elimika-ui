'use client'

import { Building2, CheckCircle2, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Badge } from '../../../../../components/ui/badge'
import { Button } from '../../../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card'
import { Input } from '../../../../../components/ui/input'
import { Donut, TOKEN } from '../../../_components/color-charts'
import {
  formatDate,
  formatMoney,
  getFundingCategory,
  SectionHeader,
  useStudentSkillsFundData
} from './shared'

export function OpportunitiesTab() {
  const { currencyCode, sources } = useStudentSkillsFundData()
  const [category, setCategory] = useState<'All' | string>('All')
  const [search, setSearch] = useState('')
  const categoryRowRef = useRef<HTMLDivElement>(null)
  const categoryRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  const categories = useMemo(() => {
    return ['All', ...new Set(sources.map(source => getFundingCategory(source.name ?? source.source_type ?? '')))]
  }, [sources])

  useEffect(() => {
    const button = categoryRefs.current.get(category)
    if (button) button.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' })
  }, [category])

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return sources.filter(source => {
      const cat = getFundingCategory(source.name ?? source.source_type ?? '')
      if (category !== 'All' && cat !== category) return false
      if (!needle) return true
      return `${source.name ?? ''} ${source.source_type ?? ''} ${cat}`.toLowerCase().includes(needle)
    })
  }, [category, search, sources])

  return (
    <div className='grid min-w-0 gap-6 *:min-w-0 xl:grid-cols-[minmax(0,1fr)_320px]'>
      <div className='space-y-4'>
        <SectionHeader
          title='Opportunities'
          desc='Discover scholarships, bursaries, grants and sponsorships you can apply for.'
        />

        <div className='flex items-center gap-1'>
          <button
            type='button'
            aria-label='Scroll categories left'
            onClick={() => categoryRowRef.current?.scrollBy({ left: -200, behavior: 'smooth' })}
            className='inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground'
          >
            <ChevronLeft className='h-4 w-4' />
          </button>
          <div
            ref={categoryRowRef}
            className='flex flex-1 flex-nowrap gap-2 overflow-x-auto border-b pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
          >
            {categories.map(item => (
              <button
                key={item}
                type='button'
                ref={el => {
                  if (el) categoryRefs.current.set(item, el)
                }}
                onClick={() => setCategory(item)}
                className={`shrink-0 border-b-2 px-3 py-2 text-sm -mb-px ${item === category ? 'border-primary font-medium text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                {item}
              </button>
            ))}
          </div>
          <button
            type='button'
            aria-label='Scroll categories right'
            onClick={() => categoryRowRef.current?.scrollBy({ left: 200, behavior: 'smooth' })}
            className='inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground'
          >
            <ChevronRight className='h-4 w-4' />
          </button>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <div className='relative'>
            <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input value={search} onChange={event => setSearch(event.target.value)} placeholder='Search opportunities...' className='h-9 w-64 pl-8' />
          </div>
          <div className='ml-auto text-xs text-muted-foreground'>
            {filtered.length} opportunity{filtered.length === 1 ? '' : 'ies'} found
          </div>
        </div>

        <div className='grid gap-3 lg:grid-cols-2 xl:grid-cols-3'>
          {filtered.map(source => {
            const categoryLabel = getFundingCategory(source.name ?? source.source_type ?? '')
            return (
              <Card key={source.uuid ?? source.name}>
                <CardContent className='p-4'>
                  <div className='flex items-start justify-between gap-2'>
                    <Badge variant='outline' className='text-[10px]'>
                      {categoryLabel}
                    </Badge>
                    <span className='text-[11px] text-muted-foreground'>{formatDate(source.created_date)}</span>
                  </div>
                  <div className='mt-3 flex items-center gap-2'>
                    <div className='grid h-8 w-8 place-items-center rounded-md bg-muted'>
                      <Building2 className='h-4 w-4 text-muted-foreground' />
                    </div>
                    <p className='truncate text-xs text-muted-foreground'>
                      {source.source_type ?? 'Skills Fund opportunity'}
                    </p>
                  </div>
                  <p className='mt-2 font-semibold text-foreground'>{source.name ?? 'Funding opportunity'}</p>
                  <p className='mt-1 text-xs text-muted-foreground'>
                    Available value {formatMoney(source.amount ?? 0, currencyCode)}
                  </p>
                  <div className='mt-3 flex items-center justify-between gap-2'>
                    <Button size='sm' variant='outline'>View</Button>
                    <Button size='sm'>Track</Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <aside className='space-y-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-base'>Eligibility Match</CardTitle>
          </CardHeader>

          <CardContent className='flex items-center gap-3'>
            <div className='size-[100px] shrink-0'>
              <Donut
                segments={[
                  { value: 0, color: TOKEN.chart1, label: 'Match' },
                  { value: 100, color: TOKEN.muted, label: 'Not available' },
                ]}
                size={100}
                stroke={12}
                centerTop={"0%"}
              />
            </div>

            <div className='min-w-0 flex-1 text-xs text-muted-foreground'>
              Complete your profile to improve matches. Update →
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-base'>Tips</CardTitle>
          </CardHeader>
          <CardContent className='space-y-1.5 text-xs text-muted-foreground'>
            {[
              'Save drafts and complete before deadlines',
              'Upload clear, valid documents (PDF, JPG, PNG)',
              'Tailor your personal statement per opportunity',
              'Track status from the Applications tab',
            ].map(tip => (
              <div key={tip} className='flex items-start gap-2'>
                <CheckCircle2 className='mt-0.5 h-3.5 w-3.5 text-success' />
                {tip}
              </div>
            ))}
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}
