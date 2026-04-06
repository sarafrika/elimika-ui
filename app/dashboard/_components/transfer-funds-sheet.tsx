import { Send } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../../components/ui/sheet';
import { Textarea } from '../../../components/ui/textarea';

type TransferFundsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  balance: number;
  isInsufficientBalance: boolean;

  userSearchQuery: string;
  setUserSearchQuery: (v: string) => void;

  targetUserUuid: string;
  setTargetUserUuid: (v: string) => void;

  transferAmount: string;
  setTransferAmount: (v: string) => void;

  transferCurrency: string;
  setTransferCurrency: (v: string) => void;

  transferReference: string;
  setTransferReference: (v: string) => void;

  transferDescription: string;
  setTransferDescription: (v: string) => void;

  isPending: boolean;
  isError: boolean;
  isSuccess: boolean;

  onSubmit: () => void;
  onCancel: () => void;
};

export function TransferFundsSheet({
  open,
  onOpenChange,
  balance,
  isInsufficientBalance,
  userSearchQuery,
  setUserSearchQuery,
  targetUserUuid,
  setTargetUserUuid,
  transferAmount,
  setTransferAmount,
  transferCurrency,
  setTransferCurrency,
  transferReference,
  setTransferReference,
  transferDescription,
  setTransferDescription,
  isPending,
  isError,
  isSuccess,
  onSubmit,
  onCancel,
}: TransferFundsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex w-full flex-col px-3 py-3 sm:max-w-[600px] sm:px-6 sm:py-6'>
        <SheetHeader className='border-border border-b pb-4'>
          <SheetTitle className='flex items-center gap-2'>
            <Send size={18} className='text-primary' />
            Transfer Funds
          </SheetTitle>

          <SheetDescription>
            Transfer funds from your wallet to another user's wallet. Fields marked with{' '}
            <span className='text-destructive'>*</span> are required.
          </SheetDescription>
        </SheetHeader>

        {/* Body */}
        <div className='flex-1 space-y-5 overflow-y-auto py-4 pr-1'>
          {/* Balance */}
          <div className='border-border bg-muted/50 rounded-lg border p-4'>
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground text-sm font-medium'>Available Balance</span>

              <span className='text-foreground text-lg font-bold'>
                KES {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {isInsufficientBalance && (
              <p className='text-destructive mt-2 text-xs'>
                Insufficient balance. You cannot transfer more than your available balance.
              </p>
            )}
          </div>

          {/* Recipient */}
          <div className='space-y-2'>
            <Label htmlFor='target-user'>
              Recipient User UUID <span className='text-destructive'>*</span>
            </Label>

            <Input
              placeholder='Search for user...'
              value={userSearchQuery}
              onChange={e => setUserSearchQuery(e.target.value)}
              disabled={isPending}
            />

            <Input
              placeholder='Enter or select user UUID'
              value={targetUserUuid}
              onChange={e => setTargetUserUuid(e.target.value)}
              disabled={isPending}
            />

            <p className='text-muted-foreground text-xs'>
              The selected user will receive the funds in their wallet
            </p>
          </div>

          {/* Amount + Currency */}
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label>
                Amount <span className='text-destructive'>*</span>
              </Label>
              <Input
                type='number'
                placeholder='0.00'
                value={transferAmount}
                onChange={e => setTransferAmount(e.target.value)}
                disabled={isPending}
              />
            </div>

            <div className='space-y-2'>
              <Label>
                Currency <span className='text-destructive'>*</span>
              </Label>

              <Select
                value={transferCurrency}
                onValueChange={setTransferCurrency}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select currency' />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value='KES'>KES - Kenyan Shilling</SelectItem>
                  <SelectItem value='USD'>USD - US Dollar</SelectItem>
                  <SelectItem value='EUR'>EUR - Euro</SelectItem>
                  <SelectItem value='GBP'>GBP - British Pound</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reference */}
          <div className='space-y-2'>
            <Label>Reference</Label>

            <Input
              placeholder='TRANSFER-2026-0001'
              value={transferReference}
              onChange={e => setTransferReference(e.target.value)}
              disabled={isPending}
            />

            <p className='text-muted-foreground text-xs'>
              Leave blank to auto-generate a reference number
            </p>
          </div>

          {/* Description */}
          <div className='space-y-2'>
            <Label>Description</Label>

            <Textarea
              rows={3}
              className='resize-none'
              placeholder='Reward payout, Course payment...'
              value={transferDescription}
              onChange={e => setTransferDescription(e.target.value)}
              disabled={isPending}
            />
          </div>

          {/* Errors */}
          {isError && (
            <div className='bg-destructive/10 text-destructive rounded-md p-3 text-sm'>
              Failed to transfer funds. Please check the details and try again.
            </div>
          )}

          {/* Success */}
          {isSuccess && (
            <div className='bg-primary/10 text-primary rounded-md p-3 text-sm'>
              Transfer completed successfully!
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='border-border flex flex-col gap-3 border-t pt-4 sm:flex-row sm:justify-end'>
          <Button
            variant='outline'
            onClick={onCancel}
            disabled={isPending}
            className='w-full sm:w-auto'
          >
            Cancel
          </Button>

          <Button
            onClick={onSubmit}
            disabled={
              !targetUserUuid ||
              !transferAmount ||
              !transferCurrency ||
              isPending ||
              parseFloat(transferAmount) <= 0 ||
              isInsufficientBalance
            }
            className='w-full sm:w-auto'
          >
            {isPending ? (
              'Processing...'
            ) : (
              <>
                <Send size={16} className='mr-2' />
                Transfer Funds
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
