'use client'

import { useState } from 'react'
import { ArrowLeftRight, Banknote, BarChart3, ClipboardList, Compass, FileText, LayoutDashboard, PieChart, ShieldCheck, Wallet } from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { useStudentSkillsFundData } from './skillfund-component/shared'
import { AllocationsTab } from './skillfund-component/AllocationsTab'
import { ApplicationsTab } from './skillfund-component/ApplicationsTab'
import { DisbursementsTab } from './skillfund-component/DisbursementTab'
import { DocumentsTab } from './skillfund-component/DocumentsTab'
import { MyFundingTab } from './skillfund-component/MyFundingTab'
import { OpportunitiesTab } from './skillfund-component/OpportunitiesTab'
import { OverviewTab } from './skillfund-component/OverviewTab'
import { ReportsTab } from './skillfund-component/ReportsTab'
import { TransactionsTab } from './skillfund-component/TransactionsTab'

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'my-funding', label: 'My Funding', icon: Wallet },
  { id: 'opportunities', label: 'Opportunities', icon: Compass },
  { id: 'applications', label: 'Applications', icon: ClipboardList },
  { id: 'allocations', label: 'Allocations', icon: PieChart },
  { id: 'disbursements', label: 'Disbursements', icon: Banknote },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
] as const

type TabId = (typeof TABS)[number]['id']

export default function SkillsFundPage() {
  const [tab, setTab] = useState<TabId>('overview')
  const data = useStudentSkillsFundData()

  return (
    <div className='min-h-screen bg-muted/30'>
      <Tabs value={tab} onValueChange={value => setTab(value as TabId)} className='gap-0'>
        <div className='border-b bg-card'>
          <div className='px-4 py-5'>
            <div className='flex flex-wrap items-start justify-between gap-3'>
              <div>
                <h1 className='flex items-center gap-2 text-2xl font-bold text-foreground'>
                  Skills Fund
                  <ShieldCheck className='h-5 w-5 text-accent' />
                </h1>
                <p className='text-sm text-muted-foreground'>
                  Live funding activity for {data.organisationName}.
                </p>
              </div>

              <div className='hidden items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm md:flex'>
                <Wallet className='h-4 w-4 text-primary' />
                <span className='text-muted-foreground'>Available Balance</span>
                <span className='font-semibold tabular-nums'>
                  {data.currencyCode} {Number(data.summary?.remaining ?? data.wallet?.balance_amount ?? 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className='mt-4 -mx-4 overflow-x-auto px-4 no-scrollbar'>
              <TabsList className='h-auto w-max gap-2 bg-transparent p-0'>
                {TABS.map(tabConfig => {
                  const Icon = tabConfig.icon

                  return (
                    <TabsTrigger
                      key={tabConfig.id}
                      value={tabConfig.id}
                      className='inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm whitespace-nowrap data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground'
                    >
                      <Icon className='h-3.5 w-3.5' />
                      {tabConfig.label}
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </div>
          </div>
        </div>

        <div className='px-4 py-6'>
          <TabsContent value='overview'>
            <OverviewTab />
          </TabsContent>

          <TabsContent value='my-funding'>
            <MyFundingTab />
          </TabsContent>

          <TabsContent value='opportunities'>
            <OpportunitiesTab />
          </TabsContent>

          <TabsContent value='applications'>
            <ApplicationsTab />
          </TabsContent>

          <TabsContent value='allocations'>
            <AllocationsTab />
          </TabsContent>

          <TabsContent value='disbursements'>
            <DisbursementsTab />
          </TabsContent>

          <TabsContent value='transactions'>
            <TransactionsTab />
          </TabsContent>

          <TabsContent value='documents'>
            <DocumentsTab />
          </TabsContent>

          <TabsContent value='reports'>
            <ReportsTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
