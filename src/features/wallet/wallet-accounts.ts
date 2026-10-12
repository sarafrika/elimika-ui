import type { Wallet } from '@/services/client';

// Shell-safe wallet model: imported by the top bar without pulling in the wallet page.
export type Bucket = 'personal' | 'skills_fund' | 'rewards' | 'marketplace_credits' | 'refunds';
export interface WalletAccount {
  id: string;
  bucket: Bucket;
  label: string;
  balance_kes: number;
  currency_code?: string;
  funder?: string;
  expires_at?: string | null;
  permitted_purpose?: string;
}

export function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function buildWalletAccounts(wallet?: Wallet | null): WalletAccount[] {
  return [
    {
      id: wallet?.uuid ?? 'acc-personal',
      bucket: 'personal',
      label: 'Personal Wallet',
      balance_kes: wallet?.balance_amount ?? 0,
      currency_code: wallet?.currency_code ?? 'KES',
    },
    {
      id: 'acc-skillsfund-1',
      bucket: 'skills_fund',
      label: 'County Skills Fund — 2026 Cohort',
      balance_kes: 0,
      funder: 'Nairobi County Government',
      expires_at: daysFromNow(120),
      permitted_purpose: 'Courses, assessments & certifications only',
    },
    {
      id: 'acc-skillsfund-2',
      bucket: 'skills_fund',
      label: 'Elimika Bootcamp Grant',
      balance_kes: 0,
      funder: 'Mastercard Foundation',
      expires_at: daysFromNow(-10),
      permitted_purpose: 'Courses, assessments & certifications only',
    },
    {
      id: 'acc-marketplace',
      bucket: 'marketplace_credits',
      label: 'Marketplace Credits',
      balance_kes: 0,
    },
    {
      id: 'acc-rewards',
      bucket: 'rewards',
      label: 'Rewards Balance',
      balance_kes: 0,
    },
    {
      id: 'acc-refunds',
      bucket: 'refunds',
      label: 'Refund Balance',
      balance_kes: 0,
    },
  ];
}
