'use client'

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import React, { useMemo, useState } from 'react';

type PaymentRecord = {
    id: string;
    date: string;
    courseName: string;
    amount: number;
    currency?: string;
    status: 'completed' | 'pending' | 'failed' | 'refunded';
    invoiceId?: string;
};

type PurchaseRecord = {
    id: string;
    courseName: string;
    purchaseDate: string;
    price: number;
    status: 'active' | 'expired' | 'cancelled';
};

type RefundRequest = {
    id: string;
    courseName: string;
    requestDate: string;
    status: 'pending' | 'approved' | 'rejected';
};

const SAMPLE_PAYMENTS: PaymentRecord[] = [
    {
        id: 'p-001',
        date: '2026-01-01T10:00:00Z',
        courseName: 'Course A',
        amount: 100,
        currency: 'KES',
        status: 'completed',
        invoiceId: 'inv-001',
    },
    {
        id: 'p-002',
        date: '2026-02-12T12:00:00Z',
        courseName: 'Course B',
        amount: 150,
        currency: 'KES',
        status: 'completed',
        invoiceId: 'inv-002',
    },
    {
        id: 'p-003',
        date: '2026-03-03T09:30:00Z',
        courseName: 'Course C',
        amount: 80,
        currency: 'KES',
        status: 'pending',
    },
];

const SAMPLE_PURCHASES: PurchaseRecord[] = [
    {
        id: 'c-001',
        courseName: 'Course A',
        purchaseDate: '2026-01-01T10:00:00Z',
        price: 100,
        status: 'active',
    },
    {
        id: 'c-002',
        courseName: 'Course B',
        purchaseDate: '2026-02-12T12:00:00Z',
        price: 150,
        status: 'active',
    },
];

const SAMPLE_REFUNDS: RefundRequest[] = [
    {
        id: 'r-001',
        courseName: 'Course A',
        requestDate: '2026-03-10T08:00:00Z',
        status: 'pending',
    },
];

const currencyFormatter = (amount: number, currency = 'KES') =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);

const StudentPaymentPage: React.FC = () => {
    // pagination state (client-side sample)
    const [paymentsPage, setPaymentsPage] = useState(1);
    const PAGE_SIZE = 10;
    const [refundCourse, setRefundCourse] = useState('');
    const [refundReason, setRefundReason] = useState('');

    const payments = useMemo(() => SAMPLE_PAYMENTS, []);
    const purchases = useMemo(() => SAMPLE_PURCHASES, []);
    const refunds = useMemo(() => SAMPLE_REFUNDS, []);

    const totals = useMemo(() => {
        const totalAmount = payments.reduce((s, p) => s + p.amount, 0);
        const completedCount = payments.filter(p => p.status === 'completed').length;
        const pendingRefunds = refunds.filter(r => r.status === 'pending').length;
        return { totalAmount, completedCount, pendingRefunds };
    }, [payments, refunds]);

    const paymentsPaged = useMemo(() => {
        const start = (paymentsPage - 1) * PAGE_SIZE;
        return payments.slice(start, start + PAGE_SIZE);
    }, [payments, paymentsPage]);

    const handleSubmitRefund = (e: React.FormEvent) => {
        e.preventDefault();
        // Placeholder - integrate with API mutation
        // show a small confirmation (replace with toast / mutation)
        alert(`Refund request submitted for ${refundCourse || '—'}: ${refundReason || '—'}`);
        setRefundCourse('');
        setRefundReason('');
    };

    return (
        <div className='space-y-8'>
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <Card className="p-4 rounded-xl shadow-md bg-card">
                    <div className="text-sm text-muted-foreground">Total Spent</div>
                    <div className="mt-2 text-2xl font-semibold text-foreground">
                        {currencyFormatter(totals.totalAmount)}
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground">Completed payments: {totals.completedCount}</div>
                </Card>

                <Card className="p-4 rounded-xl shadow-md bg-card">
                    <div className="text-sm text-muted-foreground">Courses Purchased</div>
                    <div className="mt-2 text-2xl font-semibold text-foreground">{purchases.length}</div>
                    <div className="mt-3 text-xs text-muted-foreground">Active: {purchases.filter(p => p.status === 'active').length}</div>
                </Card>

                <Card className="p-4 rounded-xl shadow-md bg-card">
                    <div className="text-sm text-muted-foreground">Pending Refunds</div>
                    <div className="mt-2 text-2xl font-semibold text-foreground">{totals.pendingRefunds}</div>
                    <div className="mt-3 text-xs text-muted-foreground">Requests awaiting review</div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Payment History */}
                <section className="lg:col-span-2">
                    <Card className="p-4 rounded-xl shadow-md bg-card">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-medium text-foreground">Payment History</h2>
                                <p className="text-sm text-muted-foreground">Recent payments and invoices</p>
                            </div>

                            <div className="flex items-center gap-2">
                                <Input placeholder="Filter by course or id…" onChange={() => { /* implement filtering when integrating API */ }} className="w-48" />
                                <Button variant="ghost" size="sm">Export</Button>
                            </div>
                        </div>

                        <Separator className="my-4" />

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[700px] table-auto text-sm">
                                <thead>
                                    <tr className="text-left text-xs uppercase text-muted-foreground">
                                        <th className="py-2 pr-4">Date</th>
                                        <th className="py-2 pr-4">Course</th>
                                        <th className="py-2 pr-4">Amount</th>
                                        <th className="py-2 pr-4">Status</th>
                                        <th className="py-2 pr-4">Invoice</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paymentsPaged.map(p => (
                                        <tr key={p.id} className="border-t border-border">
                                            <td className="py-3 pr-4 text-muted-foreground">{format(new Date(p.date), 'MMM dd, yyyy')}</td>
                                            <td className="py-3 pr-4 text-foreground">{p.courseName}</td>
                                            <td className="py-3 pr-4 text-foreground">{currencyFormatter(p.amount, p.currency)}</td>
                                            <td className="py-3 pr-4">
                                                <Badge variant={p.status === 'completed' ? 'success' : p.status === 'pending' ? 'secondary' : 'destructive'}>
                                                    {p.status}
                                                </Badge>
                                            </td>
                                            <td className="py-3 pr-4">
                                                {p.invoiceId ? (
                                                    <Button variant="link" size="sm">View</Button>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination controls */}
                        <div className="mt-4 flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                Showing {Math.min(paymentsPage * PAGE_SIZE, payments.length)} of {payments.length}
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => setPaymentsPage(p => Math.max(1, p - 1))} disabled={paymentsPage === 1}>
                                    Prev
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setPaymentsPage(p => p + 1)} disabled={paymentsPage * PAGE_SIZE >= payments.length}>
                                    Next
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Course Purchases */}
                    <Card className="p-4 rounded-xl shadow-md bg-card mt-4">
                        <h3 className="text-lg font-medium text-foreground">Course Purchases</h3>
                        <p className="text-sm text-muted-foreground mb-3">Overview of active purchases</p>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[600px] text-sm">
                                <thead>
                                    <tr className="text-left text-xs uppercase text-muted-foreground">
                                        <th className="py-2 pr-4">Course</th>
                                        <th className="py-2 pr-4">Purchase Date</th>
                                        <th className="py-2 pr-4">Price</th>
                                        <th className="py-2 pr-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {purchases.map(p => (
                                        <tr key={p.id} className="border-t border-border">
                                            <td className="py-3 pr-4 text-foreground">{p.courseName}</td>
                                            <td className="py-3 pr-4 text-muted-foreground">{format(new Date(p.purchaseDate), 'MMM dd, yyyy')}</td>
                                            <td className="py-3 pr-4 text-foreground">{currencyFormatter(p.price)}</td>
                                            <td className="py-3 pr-4">
                                                <Badge variant={p.status === 'active' ? 'success' : 'secondary'} className="capitalize">{p.status}</Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </section>

                {/* Right column: Invoices & Refunds */}
                <aside className="space-y-4">
                    <Card className="p-4 rounded-xl shadow-md bg-card">
                        <h4 className="text-lg font-medium text-foreground">Invoice Downloads</h4>
                        <p className="text-sm text-muted-foreground mb-3">Download invoices for completed payments</p>

                        <div className="space-y-2">
                            {payments.filter(p => p.invoiceId).map(p => (
                                <div key={p.id} className="flex items-center justify-between gap-2 rounded-md border p-2">
                                    <div className="text-sm">
                                        <div className="font-medium text-foreground">{p.courseName}</div>
                                        <div className="text-xs text-muted-foreground">{format(new Date(p.date), 'MMM dd, yyyy')}</div>
                                    </div>
                                    <Button variant="ghost" size="sm">Download</Button>
                                </div>
                            ))}

                            {payments.filter(p => p.invoiceId).length === 0 && (
                                <div className="text-sm text-muted-foreground">No invoices available</div>
                            )}
                        </div>
                    </Card>

                    <Card className="p-4 rounded-xl shadow-md bg-card">
                        <div className="flex items-center justify-between">
                            <h4 className="text-lg font-medium text-foreground">Refund Requests</h4>
                            <Badge variant="secondary" className="text-sm">{refunds.length} total</Badge>
                        </div>

                        <Separator className="my-3" />

                        <form onSubmit={handleSubmitRefund} className="space-y-3">
                            <div>
                                <label className="text-sm text-muted-foreground block mb-1">Course</label>
                                <select
                                    value={refundCourse}
                                    onChange={(e) => setRefundCourse(e.target.value)}
                                    className="w-full rounded-md border px-2 py-2 bg-background text-foreground"
                                >
                                    <option value="">Select course</option>
                                    {purchases.map(p => <option key={p.id} value={p.courseName}>{p.courseName}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm text-muted-foreground block mb-1">Reason</label>
                                <textarea
                                    value={refundReason}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                    rows={3}
                                    className="w-full rounded-md border px-2 py-2 bg-background text-foreground"
                                />
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => { setRefundCourse(''); setRefundReason(''); }} type="button">
                                    Reset
                                </Button>
                                <Button type="submit" size="sm">Submit Request</Button>
                            </div>
                        </form>

                        <Separator className="my-3" />

                        <div className="space-y-2">
                            {refunds.map(r => (
                                <div key={r.id} className="flex items-center justify-between gap-2 rounded-md border p-2">
                                    <div className="text-sm">
                                        <div className="font-medium text-foreground">{r.courseName}</div>
                                        <div className="text-xs text-muted-foreground">{format(new Date(r.requestDate), 'MMM dd, yyyy')}</div>
                                    </div>
                                    <Badge variant={r.status === 'pending' ? 'secondary' : r.status === 'approved' ? 'success' : 'destructive'}>
                                        {r.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </Card>
                </aside>
            </div>
        </div>
    );
};

export default StudentPaymentPage;