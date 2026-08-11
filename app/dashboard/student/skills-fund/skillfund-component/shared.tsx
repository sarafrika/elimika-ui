'use client'

import { useQuery } from '@tanstack/react-query'
import type { LucideIcon } from 'lucide-react'
import { Banknote, BarChart3, CheckCircle2, Clock3, FileText, GraduationCap, Info, ShieldAlert } from 'lucide-react'
import { useMemo } from 'react'

import { useUserProfile } from '@/context/profile-context'
import { extractEntity, extractPage, extractList } from '@/lib/api-helpers'
import {
  type SkillsFundSource,
  type SkillsFundSummary,
  type SkillsFundTransaction,
  type Wallet,
  type WalletTransaction,
} from '@/services/client'
import {
  getWalletOptions,
  getSummaryOptions,
  listSourcesOptions,
  listTransactionsOptions,
  listTransactions1Options,
} from '@/services/client/@tanstack/react-query.gen'

import { Badge } from '../../../../../components/ui/badge'
import { Card, CardContent } from '../../../../../components/ui/card'

export type FundingCategory =
  | 'Tuition Fees'
  | 'Stipend'
  | 'Assessments'
  | 'Equipment'
  | 'Learning Materials'
  | 'Transport'
  | 'Other Support'

export type SkillsFundData = {
  organisationUuid: string | null
  organisationName: string
  currencyCode: string
  wallet?: Wallet | null
  summary?: SkillsFundSummary | null
  sources: SkillsFundSource[]
  transactions: SkillsFundTransaction[]
  walletTransactions: WalletTransaction[]
  isLoading: boolean
}

export const NOT_AVAILABLE = 'Not available'

export const STATUS_TONE: Record<string, string> = {
  PENDING: 'bg-warning/10 text-warning border-warning/20',
  ALLOCATED: 'bg-primary/10 text-primary border-primary/20',
  APPROVED: 'bg-info/10 text-info border-info/20',
  DISBURSED: 'bg-success/10 text-success border-success/20',
  DEPOSIT: 'bg-success/10 text-success border-success/20',
  SALE: 'bg-success/10 text-success border-success/20',
  TRANSFER_IN: 'bg-success/10 text-success border-success/20',
  TRANSFER_OUT: 'bg-destructive/10 text-destructive border-destructive/20',
  Completed: 'bg-success/10 text-success border-success/20',
  Pending: 'bg-warning/10 text-warning border-warning/20',
  Approved: 'bg-info/10 text-info border-info/20',
  Active: 'bg-success/10 text-success border-success/20',
  Upcoming: 'bg-info/10 text-info border-info/20',
  Processing: 'bg-warning/10 text-warning border-warning/20',
  Failed: 'bg-destructive/10 text-destructive border-destructive/20',
  Cancelled: 'bg-muted text-muted-foreground border-border',
  CANCELLED: 'bg-muted text-muted-foreground border-border',
  FAILED: 'bg-destructive/10 text-destructive border-destructive/20',
  ACTIVE: 'bg-success/10 text-success border-success/20',
  UPCOMING: 'bg-info/10 text-info border-info/20',
  PROCESSING: 'bg-warning/10 text-warning border-warning/20',
  Draft: 'bg-muted text-muted-foreground border-border',
  Submitted: 'bg-info/10 text-info border-info/20',
  Rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  Waitlisted: 'bg-warning/10 text-warning border-warning/20',
  DRAFT: 'bg-muted text-muted-foreground border-border',
  SUBMITTED: 'bg-info/10 text-info border-info/20',
  REJECTED: 'bg-destructive/10 text-destructive border-destructive/20',
  WAITLISTED: 'bg-warning/10 text-warning border-warning/20',
}

export const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending',
  ALLOCATED: 'Allocated',
  APPROVED: 'Approved',
  DISBURSED: 'Disbursed',
  DEPOSIT: 'Deposit',
  SALE: 'Sale',
  TRANSFER_IN: 'Money In',
  TRANSFER_OUT: 'Money Out',
  Active: 'Active',
  Upcoming: 'Upcoming',
  Processing: 'Processing',
  Failed: 'Failed',
  Cancelled: 'Cancelled',
  CANCELLED: 'Cancelled',
  FAILED: 'Failed',
  ACTIVE: 'Active',
  UPCOMING: 'Upcoming',
  PROCESSING: 'Processing',
  Draft: 'Draft',
  Submitted: 'Submitted',
  Rejected: 'Rejected',
  Waitlisted: 'Waitlisted',
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  REJECTED: 'Rejected',
  WAITLISTED: 'Waitlisted',
}

const CATEGORY_MATCHERS: Array<[FundingCategory, RegExp]> = [
  ['Tuition Fees', /tuition|course|class|enrol|enroll|bootcamp/i],
  ['Stipend', /stipend|allowance|living|meals?/i],
  ['Assessments', /assessment|exam|certif/i],
  ['Equipment', /equipment|device|laptop|tool/i],
  ['Learning Materials', /material|book|textbook|resource|library/i],
  ['Transport', /transport|travel|commute/i],
]

export function formatMoney(value?: number | string | null, currencyCode = 'KES') {
  const amount = Number(value ?? 0)
  return `${currencyCode} ${amount.toLocaleString()}`
}

export function formatMoneyOrUnavailable(value?: number | string | null, currencyCode = 'KES') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return NOT_AVAILABLE
  return formatMoney(value, currencyCode)
}

export function formatDate(iso?: string | Date | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(iso?: string | Date | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getFundingCategory(label?: string | null): FundingCategory {
  const source = label ?? ''
  for (const [category, pattern] of CATEGORY_MATCHERS) {
    if (pattern.test(source)) return category
  }
  return 'Other Support'
}

export function useStudentSkillsFundData(): SkillsFundData {
  const profile = useUserProfile()
  const affiliation = useMemo(
    () => profile?.organisation_affiliations?.find(item => item.active) ?? profile?.organisation_affiliations?.[0] ?? null,
    [profile?.organisation_affiliations]
  )
  const organisationUuid = affiliation?.organisation_uuid ?? null
  const organisationName = affiliation?.organisation_name ?? 'Your organisation'
  const organisationKey = organisationUuid ?? 'pending'
  const userKey = profile?.uuid ?? 'pending'
  const currencyCode = 'KES'

  const summaryQuery = useQuery({
    ...getSummaryOptions({ path: { organisationUuid: organisationKey } }),
    enabled: Boolean(organisationUuid),
  })

  const sourcesQuery = useQuery({
    ...listSourcesOptions({ path: { organisationUuid: organisationKey } }),
    enabled: Boolean(organisationUuid),
  })

  const transactionsQuery = useQuery({
    ...listTransactionsOptions({ path: { organisationUuid: organisationKey } }),
    enabled: Boolean(organisationUuid),
  })

  const walletBalanceQuery = useQuery({
    ...getWalletOptions({ path: { userUuid: userKey } }),
    enabled: Boolean(profile?.uuid),
  })

  const walletTransactionsQuery = useQuery({
    ...listTransactions1Options({
      path: { userUuid: userKey },
      query: { pageable: { page: 0, size: 50 } },
    }),
    enabled: Boolean(profile?.uuid),
  })

  const wallet = extractEntity<Wallet>(walletBalanceQuery.data)
  const summary = extractEntity<SkillsFundSummary>(summaryQuery.data)
  const sources = extractList<SkillsFundSource>(sourcesQuery.data)
  const transactions = extractList<SkillsFundTransaction>(transactionsQuery.data)
  const walletTransactions = extractPage<WalletTransaction>(walletTransactionsQuery.data).items

  return {
    organisationUuid,
    organisationName,
    currencyCode,
    wallet,
    summary,
    sources,
    transactions,
    walletTransactions,
    isLoading:
      summaryQuery.isLoading ||
      sourcesQuery.isLoading ||
      transactionsQuery.isLoading ||
      walletBalanceQuery.isLoading ||
      walletTransactionsQuery.isLoading ||
      profile?.isLoading === true,
  }
}

export function SectionHeader({
  title,
  desc,
  right,
}: {
  title: string
  desc?: string
  right?: React.ReactNode
}) {
  return (
    <div className='mb-4 flex flex-col gap-3'>
      <div>
        <h2 className='text-lg font-semibold text-foreground'>{title}</h2>
        {desc ? <p className='text-sm text-muted-foreground'>{desc}</p> : null}
      </div>
      {right}
    </div>
  )
}

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tint = 'bg-muted text-muted-foreground',
}: {
  icon: LucideIcon
  label: string
  value: string
  sub?: string
  tint?: string
}) {
  return (
    <Card className='h-full min-w-0 rounded-md py-0'>
      <CardContent className='flex h-full flex-col gap-3 px-3 py-0 sm:p-2 xl:p-4'>
        <div className='flex items-center gap-3'>
          <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full sm:h-11 sm:w-11 ${tint}`}>
            <Icon className='h-4 w-4 sm:h-5 sm:w-5' />
          </div>
          <p className='flex-1 text-xs font-medium text-muted-foreground'>{label}</p>
        </div>
        <div className='min-w-0 flex-1'>
          <p className='break-words text-base font-semibold tracking-tight sm:text-xl'>{value}</p>
          {sub ? <p className='mt-1 text-[10px] text-muted-foreground sm:text-[11px]'>{sub}</p> : null}
        </div>
      </CardContent>
    </Card>
  )
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant='outline' className={`text-[11px] ${STATUS_TONE[status] ?? 'bg-muted text-muted-foreground border-border'}`}>
      {STATUS_LABEL[status] ?? status}
    </Badge>
  )
}

export function LiveDataHint({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className='rounded-md border bg-info/10 p-3 text-sm text-info'>
      <div className='flex items-start gap-2'>
        <Info className='mt-0.5 h-4 w-4' />
        <div>
          <p className='font-medium'>{title}</p>
          <p className='text-info/80'>{description}</p>
        </div>
      </div>
    </div>
  )
}

export function EmptyCard({
  icon: Icon = FileText,
  title,
  description,
}: {
  icon?: LucideIcon
  title: string
  description: string
}) {
  return (
    <Card>
      <CardContent className='flex flex-col items-center justify-center gap-2 py-10 text-center'>
        <Icon className='h-8 w-8 text-muted-foreground' />
        <p className='font-medium text-foreground'>{title}</p>
        <p className='max-w-md text-sm text-muted-foreground'>{description}</p>
      </CardContent>
    </Card>
  )
}

export function fundingCategoryIcon(category: FundingCategory): LucideIcon {
  switch (category) {
    case 'Tuition Fees':
      return GraduationCap
    case 'Stipend':
      return Banknote
    case 'Assessments':
      return CheckCircle2
    case 'Equipment':
      return ShieldAlert
    case 'Learning Materials':
      return FileText
    case 'Transport':
      return Clock3
    default:
      return BarChart3
  }
}
