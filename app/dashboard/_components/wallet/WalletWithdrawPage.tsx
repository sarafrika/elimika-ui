'use client';

import { TransferFundsSheet } from '@/app/dashboard/_components/transfer-funds-sheet';
import { buildWalletAccounts, fmtDateTime, fmtKES, TxnRow, useWallet } from '@/app/dashboard/student/wallet/page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { transferMutation } from '@/services/client/@tanstack/react-query.gen';
import { useMutation } from '@tanstack/react-query';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowRight,
  Landmark,
  Send,
  Wallet as WalletIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { formatKES } from '../../../../src/features/dashboard/courses/pages/PaymentMethodPicker';

export function WalletWithdrawPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const walletHref = pathname.replace(/\/withdraw$/, '');
  const { wallet, transactions, notify } = useWallet();
  const transferFundsMut = useMutation({ ...transferMutation() });

  const walletAccounts = useMemo(() => buildWalletAccounts(wallet), [wallet]);
  const availableBalance = wallet?.balance_amount ?? walletAccounts[0]?.balance_kes ?? 0;
  const walletCurrency = wallet?.currency_code ?? 'KES';

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDestination, setWithdrawDestination] = useState<'mpesa' | 'bank'>('mpesa');
  const [withdrawReference, setWithdrawReference] = useState('');
  const [withdrawNote, setWithdrawNote] = useState('');

  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [targetUserUuid, setTargetUserUuid] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferCurrency, setTransferCurrency] = useState(walletCurrency);
  const [transferReference, setTransferReference] = useState('');
  const [transferDescription, setTransferDescription] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  useEffect(() => {
    if (searchParams.get('section') === 'transfer') {
      setIsTransferOpen(true);
    }
  }, [searchParams]);

  const isWithdrawalInvalid =
    !withdrawAmount || Number(withdrawAmount) <= 0 || Number(withdrawAmount) > availableBalance;
  const isTransferInvalid =
    !targetUserUuid || !transferAmount || Number(transferAmount) <= 0 || Number(transferAmount) > availableBalance;

  const handleWithdraw = () => {
    if (isWithdrawalInvalid) return;

    notify({
      type: 'success',
      message: 'Withdrawal request queued',
      description:
        withdrawDestination === 'mpesa'
          ? 'M-Pesa withdrawal is queued for review.'
          : 'Bank withdrawal is queued for review.',
    });
    setWithdrawAmount('');
    setWithdrawReference('');
    setWithdrawNote('');
  };

  const handleTransfer = () => {
    if (isTransferInvalid) return;

    transferFundsMut.mutate(
      {
        body: {
          target_user_uuid: targetUserUuid,
          amount: Number(transferAmount),
          currency_code: transferCurrency,
          reference:
            transferReference ||
            `TRANSFER-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
          description: transferDescription || 'Wallet transfer',
        },
        path: { userUuid: targetUserUuid },
      },
      {
        onSuccess: () => {
          notify({
            type: 'success',
            message: 'Transfer submitted',
            description: 'The transfer request has been sent.',
          });
          setTargetUserUuid('');
          setTransferAmount('');
          setTransferCurrency(walletCurrency);
          setTransferReference('');
          setTransferDescription('');
          setUserSearchQuery('');
          setIsTransferOpen(false);
        },
      }
    );
  };

  return (
    <div className='space-y-6'>
      <div className='flex gap-2 my-6'>
        <Button asChild variant='outline'>
          <Link href={walletHref}>
            <ArrowLeftRight className='mr-2 h-4 w-4' />
            Back to wallet
          </Link>
        </Button>
        <Button asChild>
          <Link href={`${walletHref}?tab=top-up`}>
            <WalletIcon className='mr-2 h-4 w-4' />
            Top up
          </Link>
        </Button>
      </div>

      <header className='border-border/70 bg-card rounded-2xl border p-6 shadow-sm'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
          <div className='space-y-2'>
            <div className='space-y-1'>
              <h1 className='text-2xl font-bold tracking-tight text-foreground'>Withdraw and transfer</h1>
              <p className='max-w-2xl text-sm text-muted-foreground'>
                Manage withdrawals, move money to another wallet, and review recent activity from one place.
              </p>
            </div>
          </div>

          <Badge variant='secondary' className='rounded-full px-3 py-1 text-[11px] uppercase tracking-wide'>
            Wallet actions
          </Badge>

        </div>
      </header>

      <section className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <Card className='border-primary/20 bg-primary text-primary-foreground'>
          <CardHeader className='pb-0'>
            <CardDescription className='text-primary-foreground/80'>Available balance</CardDescription>
            <CardTitle className='text-2xl'>{formatKES(availableBalance)}</CardTitle>
          </CardHeader>
          <CardContent className='text-xs text-primary-foreground/80'>Spendable funds across your active wallet.</CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-0'>
            <CardDescription>Accounts</CardDescription>
            <CardTitle className='text-2xl'>{walletAccounts.length}</CardTitle>
          </CardHeader>
          <CardContent className='text-xs text-muted-foreground'>Wallet buckets and allocations available to this profile.</CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-0'>
            <CardDescription>Recent activity</CardDescription>
            <CardTitle className='text-2xl'>{transactions.length}</CardTitle>
          </CardHeader>
          <CardContent className='text-xs text-muted-foreground'>Tracked wallet transactions and movements.</CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-0'>
            <CardDescription>Currency</CardDescription>
            <CardTitle className='text-2xl'>{walletCurrency}</CardTitle>
          </CardHeader>
          <CardContent className='text-xs text-muted-foreground'>The active wallet currency.</CardContent>
        </Card>
      </section>

      <section className='grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]'>
        <Card>
          <CardHeader className='border-border border-b'>
            <div className='flex items-start justify-between gap-3'>
              <div className='space-y-1'>
                <CardTitle className='text-base'>Withdraw balance</CardTitle>
                <CardDescription>Move money out of your wallet to a payout destination.</CardDescription>
              </div>
              <div className='rounded-xl bg-primary/10 p-3'>
                <Landmark className='h-5 w-5 text-primary' />
              </div>
            </div>
          </CardHeader>

          <CardContent className='space-y-4'>
            <div className='rounded-2xl border border-border/70 bg-muted/30 p-4'>
              <p className='text-sm text-muted-foreground'>Available to withdraw</p>
              <p className='mt-2 text-3xl font-bold text-foreground'>{formatKES(availableBalance)}</p>
              <p className='mt-2 text-xs text-muted-foreground'>Withdrawals are currently staged as a request flow.</p>
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label>Destination</Label>
                <Select value={withdrawDestination} onValueChange={value => setWithdrawDestination(value as 'mpesa' | 'bank')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='mpesa'>M-Pesa</SelectItem>
                    <SelectItem value='bank'>Bank transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label>Amount</Label>
                <Input
                  type='number'
                  min='1'
                  placeholder='0.00'
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label>Reference</Label>
              <Input
                placeholder='WDR-2026-0001'
                value={withdrawReference}
                onChange={e => setWithdrawReference(e.target.value)}
              />
            </div>

            <div className='space-y-2'>
              <Label>Note</Label>
              <Input
                placeholder='Optional withdrawal note'
                value={withdrawNote}
                onChange={e => setWithdrawNote(e.target.value)}
              />
            </div>

            <Button
              className='w-full'
              disabled={isWithdrawalInvalid}
              onClick={handleWithdraw}
            >
              <ArrowDownLeft className='mr-2 h-4 w-4' />
              Request withdrawal
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='border-border border-b'>
            <div className='flex items-start justify-between gap-3'>
              <div className='space-y-1'>
                <CardTitle className='text-base'>Transfer funds</CardTitle>
                <CardDescription>Send money to another wallet from the same balance.</CardDescription>
              </div>
              <div className='rounded-xl bg-primary/10 p-3'>
                <Send className='h-5 w-5 text-primary' />
              </div>
            </div>
          </CardHeader>

          <CardContent className='space-y-4'>
            <div className='rounded-2xl border border-border/70 bg-muted/30 p-4'>
              <p className='text-sm text-muted-foreground'>Transfer status</p>
              <p className='mt-2 text-sm font-medium text-foreground'>
                {transferFundsMut.isPending ? 'Processing transfer...' : 'Ready to transfer'}
              </p>
            </div>

            <div className='space-y-2'>
              <Label>Recipient UUID</Label>
              <Input
                placeholder='Search or paste user UUID'
                value={userSearchQuery}
                onChange={e => setUserSearchQuery(e.target.value)}
                onFocus={() => setIsTransferOpen(true)}
              />
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label>Amount</Label>
                <Input
                  type='number'
                  min='1'
                  placeholder='0.00'
                  value={transferAmount}
                  onChange={e => setTransferAmount(e.target.value)}
                />
              </div>

              <div className='space-y-2'>
                <Label>Currency</Label>
                <Select value={transferCurrency} onValueChange={setTransferCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='KES'>KES</SelectItem>
                    <SelectItem value='USD'>USD</SelectItem>
                    <SelectItem value='EUR'>EUR</SelectItem>
                    <SelectItem value='GBP'>GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='space-y-2'>
              <Label>Reference</Label>
              <Input
                placeholder='TRANSFER-2026-0001'
                value={transferReference}
                onChange={e => setTransferReference(e.target.value)}
              />
            </div>

            <div className='space-y-2'>
              <Label>Description</Label>
              <Input
                placeholder='Course fee, reimbursement, settlement...'
                value={transferDescription}
                onChange={e => setTransferDescription(e.target.value)}
              />
            </div>

            <Button
              className='w-full'
              disabled={isTransferInvalid || transferFundsMut.isPending}
              onClick={handleTransfer}
            >
              <ArrowRight className='mr-2 h-4 w-4' />
              Send transfer
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className='grid gap-6 lg:grid-cols-2'>
        <Card>
          <CardHeader className='border-border border-b'>
            <CardTitle className='text-base'>Accounts</CardTitle>
            <CardDescription>Wallet buckets and balances available on this profile.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            {walletAccounts.map(account => (
              <div key={account.id} className='flex items-start justify-between gap-3 rounded-2xl border border-border/70 bg-card p-4'>
                <div className='min-w-0'>
                  <p className='truncate text-sm font-semibold text-foreground'>{account.label}</p>
                  <p className='text-xs text-muted-foreground'>
                    {account.bucket.replace(/_/g, ' ')}
                    {account.funder ? ` · ${account.funder}` : ''}
                  </p>
                </div>
                <div className='text-right'>
                  <p className='text-sm font-semibold text-foreground'>{fmtKES(account.balance_kes)}</p>
                  <p className='text-[11px] text-muted-foreground'>{account.currency_code ?? walletCurrency}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='border-border border-b'>
            <CardTitle className='text-base'>Recent transactions</CardTitle>
            <CardDescription>Latest wallet movements from the same wallet shell.</CardDescription>
          </CardHeader>
          <CardContent className='p-0'>
            <div className='divide-y divide-border'>
              {transactions.slice(0, 6).map(txn => (
                <TxnRow key={txn.uuid} txn={txn} />
              ))}
            </div>

            {transactions.length > 0 && (
              <div className='border-border border-t px-5 py-4 text-xs text-muted-foreground'>
                Latest update {fmtDateTime(transactions[0]?.created_date)}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <TransferFundsSheet
        open={isTransferOpen}
        onOpenChange={setIsTransferOpen}
        balance={availableBalance}
        isInsufficientBalance={Number(transferAmount || 0) > availableBalance}
        userSearchQuery={userSearchQuery}
        setUserSearchQuery={setUserSearchQuery}
        targetUserUuid={targetUserUuid}
        setTargetUserUuid={setTargetUserUuid}
        transferAmount={transferAmount}
        setTransferAmount={setTransferAmount}
        transferCurrency={transferCurrency}
        setTransferCurrency={setTransferCurrency}
        transferReference={transferReference}
        setTransferReference={setTransferReference}
        transferDescription={transferDescription}
        setTransferDescription={setTransferDescription}
        isPending={transferFundsMut.isPending}
        isError={transferFundsMut.isError}
        isSuccess={transferFundsMut.isSuccess}
        onSubmit={handleTransfer}
        onCancel={() => setIsTransferOpen(false)}
      />
    </div>
  );
}
