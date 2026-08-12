'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../../../../../components/ui/card';
import { Input } from '../../../../../components/ui/input';
import { Label } from '../../../../../components/ui/label';
import { formatKES } from '../../../../../src/features/dashboard/courses/pages/PaymentMethodPicker';
import { useWallet } from '../page';

export function TopUpTab() {
    const { topUp } = useWallet();
    const [amount, setAmount] = useState('1000');
    const [busy, setBusy] = useState(false);

    function submit() {
        const value = Number(amount || 0);

        if (value <= 0) return;

        setBusy(true);

        // TODO: Implement M-Pesa top-up
        // topUp(value, 'mobile_money');
        toast.message("Implement M-Pesa top-up")

        setBusy(false);
    }

    return (
        <div className='grid gap-4 lg:grid-cols-2'>
            <Card>
                <CardHeader>
                    <CardTitle className='text-base'>Top up your wallet</CardTitle>
                    <CardDescription>
                        Add funds to your personal wallet using M-Pesa.
                    </CardDescription>
                </CardHeader>

                <CardContent className='space-y-3'>
                    <div className='space-y-1.5'>
                        <Label>Funding source</Label>

                        <div className='flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2.5'>
                            <div>
                                <p className='text-sm font-medium'>M-Pesa</p>
                                <p className='text-xs text-muted-foreground'>
                                    Mobile money
                                </p>
                            </div>

                            <Badge variant='secondary'>Available</Badge>
                        </div>
                    </div>

                    <div className='space-y-1.5'>
                        <Label>Amount (KES)</Label>

                        <Input
                            type='number'
                            min='1'
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                        />
                    </div>

                    <div className='flex flex-wrap gap-2'>
                        {[1000, 2500, 5000, 10000].map(value => (
                            <Button
                                key={value}
                                variant='outline'
                                size='sm'
                                onClick={() => setAmount(String(value))}
                            >
                                {formatKES(value)}
                            </Button>
                        ))}
                    </div>

                    <Button
                        className='w-full'
                        onClick={submit}
                        disabled={busy}
                    >
                        {busy ? 'Processing…' : 'Top up with M-Pesa'}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className='text-base'>Accepted top-up sources</CardTitle>
                </CardHeader>

                <CardContent className='space-y-2 text-sm'>
                    {[
                        'Mobile Money',
                        'Card',
                        'Bank Transfer',
                        'Parent Transfer',
                        'Employer Sponsorship',
                    ].map(source => (
                        <div
                            key={source}
                            className='flex items-center justify-between border-b py-2 last:border-0'
                        >
                            <span>{source}</span>
                            <Badge variant='secondary'>Available</Badge>
                        </div>
                    ))}

                    <p className='pt-2 text-xs text-muted-foreground'>
                        Card and bank payments are processed by PCI DSS-certified providers.
                        Elimika never stores card data.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}