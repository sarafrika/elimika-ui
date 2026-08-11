'use client'

import { Bell, CheckCircle2, ClipboardList, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '../../../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card'
import { Input } from '../../../../../components/ui/input'
import { Donut, TOKEN } from '../../../_components/color-charts'
import { SectionHeader, useStudentSkillsFundData } from './shared'

const STATUS_TABS = [
  ['all', 'All'],
  ['draft', 'Draft'],
  ['submitted', 'Submitted'],
  ['under_review', 'Under Review'],
  ['approved', 'Approved'],
  ['rejected', 'Rejected'],
  ['waitlisted', 'Waitlisted'],
] as const

export function ApplicationsTab() {
  const { isLoading } = useStudentSkillsFundData()
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_TABS)[number][0]>('all')
  const [search, setSearch] = useState('')

  const counts = useMemo(
    () => ({
      all: 0,
      draft: 0,
      submitted: 0,
      under_review: 0,
      approved: 0,
      rejected: 0,
      waitlisted: 0,
    }),
    []
  )

  const filtered: Array<never> = []
  const total = counts.all

  return (
    <div className='grid min-w-0 gap-6 *:min-w-0 xl:grid-cols-[minmax(0,1fr)_320px]'>
      <div className='space-y-4'>
        <div className='flex items-start justify-between gap-2'>
          <SectionHeader
            title='Applications'
            desc='Track the status of your funding applications from draft to decision.'
          />
          <Button variant='outline' size='sm' className='shrink-0'>
            <Bell className='mr-2 h-4 w-4' />
            Notifications
          </Button>
        </div>

        <div className='flex flex-wrap gap-2 border-b'>
          {STATUS_TABS.map(([key, label]) => (
            <button
              key={key}
              type='button'
              onClick={() => setStatusFilter(key)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm ${key === statusFilter ? 'border-primary font-medium text-primary' : 'border-transparent text-muted-foreground'
                }`}
            >
              {label}
              {' '}
              {counts[key]}
            </button>
          ))}
        </div>

        <div className='flex items-center gap-2'>
          <div className='relative'>
            <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Search applications...'
              className='h-9 w-64 pl-8'
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <Card>
            <CardContent className='flex flex-col items-center justify-center py-12 text-center'>
              <ClipboardList className='mb-3 h-10 w-10 text-muted-foreground/50' />

              <h4 className='text-sm font-semibold text-foreground'>
                {isLoading ? 'Loading applications…' : 'No applications found'}
              </h4>

              <p className='mt-1 max-w-sm text-sm text-muted-foreground'>
                {isLoading
                  ? 'Fetching your application records.'
                  : 'You haven’t submitted any Skills Fund applications yet.'}
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <aside className='space-y-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-base'>Application Summary</CardTitle>
          </CardHeader>
          <CardContent className='flex items-center gap-3'>
            <Donut
              segments={[
                { value: counts.under_review, color: TOKEN.warning, label: 'Under Review' },
                { value: counts.submitted, color: TOKEN.info, label: 'Submitted' },
                { value: counts.approved, color: TOKEN.success, label: 'Approved' },
                { value: counts.rejected, color: TOKEN.destructive, label: 'Rejected' },
                { value: counts.waitlisted, color: TOKEN.accent, label: 'Waitlisted' },
                { value: counts.draft, color: TOKEN.muted, label: 'Drafts' },
              ]}
              centerTop={String(total)}
              centerBottom='Total'
              size={130}
            />
            <div className='space-y-1 text-xs'>
              {[
                ['bg-warning', `Under Review (${counts.under_review})`],
                ['bg-info', `Submitted (${counts.submitted})`],
                ['bg-success', `Approved (${counts.approved})`],
                ['bg-destructive', `Rejected (${counts.rejected})`],
                ['bg-accent', `Waitlisted (${counts.waitlisted})`],
                ['bg-muted-foreground', `Drafts (${counts.draft})`],
              ].map(([color, label]) => (
                <div key={label} className='flex items-center gap-2'>
                  <span className={`h-2 w-2 rounded-sm ${color}`} />
                  {label}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-base'>Application Tips</CardTitle>
          </CardHeader>
          <CardContent className='space-y-1.5 text-xs text-muted-foreground'>
            {[
              'Ensure your profile is complete',
              'Upload clear and valid documents',
              'Double-check eligibility criteria',
              'Submit before the deadline',
              'Respond to reviewer requests promptly',
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
