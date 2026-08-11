'use client'

import { CalendarDays, Download, FileText, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Badge } from '../../../../../components/ui/badge'
import { Button } from '../../../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card'
import { Input } from '../../../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../components/ui/select'
import { Donut, TOKEN } from '../../../_components/color-charts'
import { formatDate, NOT_AVAILABLE, SectionHeader, useStudentSkillsFundData } from './shared'

const FILTERS = ['All Documents', 'Agreements', 'Certificates', 'Receipts', 'Forms', 'Other'] as const

export function DocumentsTab() {
  const { sources, transactions, walletTransactions } = useStudentSkillsFundData()
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>('All Documents')
  const [search, setSearch] = useState('')

  const documents = useMemo(() => {
    const sourceDocs = sources.map(source => ({
      name: `${source.name ?? 'Funding source'} agreement`,
      type: 'Agreements',
      source: source.source_type ?? NOT_AVAILABLE,
      uploaded: formatDate(source.created_date),
      size: source.amount != null ? `${Math.max(80, Math.round(Number(source.amount) / 1000))} KB` : NOT_AVAILABLE,
    }))

    const receiptDocs = [...transactions, ...walletTransactions].map(item => ({
      name: item.description ?? item.reference ?? 'Receipt',
      type: 'Receipts',
      source: 'Live wallet activity',
      uploaded: formatDate('transaction_date' in item ? item.transaction_date : 'created_date' in item ? item.created_date : null),
      size:
        'amount' in item && item.amount != null
          ? `${Math.max(60, Math.round(Math.abs(Number(item.amount)) / 1000))} KB`
          : NOT_AVAILABLE,
    }))

    return [...sourceDocs, ...receiptDocs].filter(doc => {
      if (activeFilter !== 'All Documents' && doc.type !== activeFilter) return false
      const needle = search.trim().toLowerCase()
      if (!needle) return true
      return `${doc.name} ${doc.type} ${doc.source}`.toLowerCase().includes(needle)
    })
  }, [activeFilter, search, sources, transactions, walletTransactions])

  const summary = useMemo(
    () => ({
      agreements: documents.filter(doc => doc.type === 'Agreements').length,
      receipts: documents.filter(doc => doc.type === 'Receipts').length,
      total: documents.length,
    }),
    [documents]
  )

  return (
    <div className='grid min-w-0 gap-6 *:min-w-0 xl:grid-cols-[minmax(0,1fr)_320px]'>
      <div className='space-y-4'>
        <SectionHeader
          title='Documents'
          desc='Access all your funding related documents, agreements and receipts.'
        />

        <div className='flex flex-wrap gap-2 border-b'>
          {FILTERS.map(filter => (
            <button
              key={filter}
              type='button'
              onClick={() => setActiveFilter(filter)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm ${
                filter === activeFilter ? 'border-primary font-medium text-primary' : 'border-transparent text-muted-foreground'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <div className='relative'>
            <FileText className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input value={search} onChange={event => setSearch(event.target.value)} placeholder='Search documents...' className='h-9 w-64 pl-8' />
          </div>

          <Select defaultValue='all'>
            <SelectTrigger className='h-9 w-36'>
              <SelectValue placeholder='All types' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All types</SelectItem>
              <SelectItem value='agreements'>Agreements</SelectItem>
              <SelectItem value='receipts'>Receipts</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue='latest'>
            <SelectTrigger className='h-9 w-36'>
              <SelectValue placeholder='Sort by' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='latest'>Latest</SelectItem>
              <SelectItem value='oldest'>Oldest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className='p-0 overflow-x-auto'>
            {documents.length === 0 ? (
              <div className='flex flex-col items-center gap-2 py-12 text-sm text-muted-foreground'>
                <FileText className='h-6 w-6' />
                Not available
              </div>
            ) : (
              <table className='w-full text-sm'>
                <thead className='bg-muted/50 text-xs text-muted-foreground'>
                  <tr>
                    <th className='px-4 py-2 text-left font-medium'>Document</th>
                    <th className='px-4 py-2 text-left font-medium'>Type</th>
                    <th className='px-4 py-2 text-left font-medium'>Source</th>
                    <th className='px-4 py-2 text-left font-medium'>Uploaded</th>
                    <th className='px-4 py-2 text-left font-medium'>Size</th>
                    <th className='px-4 py-2 text-right font-medium'>Action</th>
                  </tr>
                </thead>
                <tbody className='divide-y'>
                  {documents.map(doc => (
                    <tr key={`${doc.name}-${doc.uploaded}`} className='hover:bg-muted/40'>
                      <td className='px-4 py-2.5 font-medium text-foreground'>{doc.name}</td>
                      <td className='px-4 py-2.5'>
                        <Badge variant='outline' className='text-[10px]'>
                          {doc.type}
                        </Badge>
                      </td>
                      <td className='px-4 py-2.5 text-muted-foreground'>{doc.source}</td>
                      <td className='px-4 py-2.5 text-muted-foreground'>{doc.uploaded}</td>
                      <td className='px-4 py-2.5 text-muted-foreground'>{doc.size}</td>
                      <td className='px-4 py-2.5 text-right'>
                        <Button size='icon' variant='ghost' className='h-8 w-8'>
                          <Download className='h-4 w-4' />
                        </Button>
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
            <CardTitle className='text-base'>Document Summary</CardTitle>
          </CardHeader>
          <CardContent className='flex items-center gap-3'>
            <Donut
              segments={[
                { value: summary.agreements, color: TOKEN.chart1, label: 'Agreements' },
                { value: summary.receipts, color: TOKEN.chart2, label: 'Receipts' },
                { value: 0, color: TOKEN.chart3, label: 'Other' },
              ]}
              centerTop={String(summary.total)}
              centerBottom='Total'
              size={130}
            />
            <div className='text-xs space-y-1'>
              <div>Agreements ({summary.agreements})</div>
              <div>Receipts ({summary.receipts})</div>
              <div>Other ({NOT_AVAILABLE})</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-base'>Storage</CardTitle>
          </CardHeader>
          <CardContent className='space-y-2 text-sm text-muted-foreground'>
            <div className='flex items-center justify-between'>
              <span>Used</span>
              <span>{NOT_AVAILABLE}</span>
            </div>
            <div className='flex items-center justify-between'>
              <span>Limit</span>
              <span>{NOT_AVAILABLE}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-base'>Reminders</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3 text-sm text-muted-foreground'>
            <div className='flex gap-2'>
              <ShieldCheck className='mt-0.5 h-4 w-4 text-success' />
              Keep your agreements and receipts available for audits.
            </div>
            <div className='flex gap-2'>
              <CalendarDays className='mt-0.5 h-4 w-4 text-info' />
              Review new documents after each disbursement or source update.
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}
