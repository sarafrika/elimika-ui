'use client';

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { TransferFundsSheet } from '@/app/dashboard/_components/transfer-funds-sheet';
import { apiMessage } from '@/components/wallet/payout-api';
import { transferMutation } from '@/services/client/@tanstack/react-query.gen';
import type { Purse } from '@/src/features/wallet/purses';

/** Sends money from the signed-in user's wallet, out of the dashboard's purse, to another user. */
export function WalletTransferSheet({
  open,
  onOpenChange,
  userUuid,
  balance,
  currency,
  sourcePurse,
  onTransferred,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userUuid: string;
  balance: number;
  currency: string;
  /** The purse the money leaves; `source_purse` is not in the generated body yet. */
  sourcePurse?: Purse;
  onTransferred: () => void;
}) {
  const transfer = useMutation(transferMutation());
  const [search, setSearch] = useState('');
  const [target, setTarget] = useState('');
  const [amount, setAmount] = useState('');
  const [transferCurrency, setTransferCurrency] = useState(currency);
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const insufficient = Number(amount || 0) > balance;

  const reset = () => {
    setSearch('');
    setTarget('');
    setAmount('');
    setReference('');
    setDescription('');
  };

  const submit = () => {
    if (!target || Number(amount) <= 0 || insufficient) return;
    transfer.mutate(
      {
        // The wallet the money leaves: the caller's own.
        path: { userUuid },
        body: {
          target_user_uuid: target,
          amount: Number(amount),
          currency_code: transferCurrency,
          reference: reference || `TRANSFER-${Date.now()}`,
          description: description || 'Wallet transfer',
          ...(sourcePurse ? { source_purse: sourcePurse } : {}),
        } as never,
      },
      {
        onSuccess: () => {
          toast.success('Transfer sent.');
          reset();
          onTransferred();
          onOpenChange(false);
        },
        onError: error => toast.error(apiMessage(error, 'The transfer did not go through. Try again.')),
      }
    );
  };

  return (
    <TransferFundsSheet
      open={open}
      onOpenChange={onOpenChange}
      balance={balance}
      isInsufficientBalance={insufficient}
      userSearchQuery={search}
      setUserSearchQuery={setSearch}
      targetUserUuid={target}
      setTargetUserUuid={setTarget}
      transferAmount={amount}
      setTransferAmount={setAmount}
      transferCurrency={transferCurrency}
      setTransferCurrency={setTransferCurrency}
      transferReference={reference}
      setTransferReference={setReference}
      transferDescription={description}
      setTransferDescription={setDescription}
      isPending={transfer.isPending}
      isError={transfer.isError}
      isSuccess={transfer.isSuccess}
      onSubmit={submit}
      onCancel={() => onOpenChange(false)}
    />
  );
}
