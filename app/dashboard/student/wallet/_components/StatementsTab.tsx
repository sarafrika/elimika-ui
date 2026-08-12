'use client';

import { Download } from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../../../../../components/ui/card';
import { formatKES } from '../../../../../src/features/dashboard/courses/pages/PaymentMethodPicker';
import { downloadCsv, fmtDate, useWallet, WalletStatement } from '../page';

/* =========================================================================
   Statements tab
   ========================================================================= */
export function StatementsTab() {
    const { statements, notify } = useWallet();

    function download(st: WalletStatement) {
        downloadCsv(
            `${st.label.replace(/\s+/g, '-').toLowerCase()}.csv`,
            ['Date', 'Description', 'Status', 'Amount'],
            []
        );

        notify({
            type: 'success',
            message: 'Statement downloaded',
        });
    }

    return (
        <div className='grid gap-4 md:grid-cols-2'>
            {statements.map(st => (
                <Card key={st.id}>
                    <CardHeader className='pb-2'>
                        <CardDescription>{st.kind}</CardDescription>
                        <CardTitle className='text-base'>{st.label}</CardTitle>
                    </CardHeader>

                    <CardContent className='space-y-3'>
                        <p className='text-sm text-muted-foreground'>
                            {fmtDate(st.period_start)} — {fmtDate(st.period_end)}
                        </p>

                        <div className='flex gap-4 text-sm'>
                            <span className='text-success'>
                                In {formatKES(0)}
                            </span>

                            <span className='text-warning'>
                                Out {formatKES(0)}
                            </span>
                        </div>

                        <Button
                            size='sm'
                            variant='outline'
                            className='w-full'
                            onClick={() => download(st)}
                        >
                            <Download className='mr-1.5 h-4 w-4' />
                            Download CSV
                        </Button>
                    </CardContent>
                </Card>
            ))}

            {statements.length === 0 && (
                <div className='col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 py-14 text-center'>
                    <div className='mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-muted'>
                        <Download className='h-5 w-5 text-muted-foreground' />
                    </div>

                    <h4 className='text-sm font-semibold text-foreground'>
                        No statements to display
                    </h4>

                    <p className='mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground'>
                        Statements will appear here when your wallet has activity to report.
                    </p>
                </div>
            )}
        </div>
    );
}