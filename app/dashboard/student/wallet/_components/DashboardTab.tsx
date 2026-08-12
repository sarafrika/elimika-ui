'use client'

import { AlertTriangle, CalendarCheck, ReceiptText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { formatKES } from "../../../../../src/features/dashboard/courses/pages/PaymentMethodPicker";
import { balanceBreakdown, fmtDate, METHOD_LABEL, TxnRow, useWallet, WalletDashboardTabProps, WalletPayment } from "../page";


export function DashboardTab({ onNavigate, wallet, transactions }: WalletDashboardTabProps) {
    const { accounts } = useWallet();
    const payments: WalletPayment[] = []

    const breakdown = balanceBreakdown(accounts);
    const pendingPayments = payments.filter((p) => p.status === "pending");
    const rewardsTotal = accounts.filter((a) => a.bucket === "rewards").reduce((s, a) => s + a.balance_kes, 0);
    const pendingTotal = pendingPayments.reduce((s, p) => s + (p.amount_kes - p.amount_paid_kes), 0);
    const lowBalance = wallet?.balance_amount! < 5000;

    const stats = [
        { label: "Available balance", value: formatKES(wallet?.balance_amount!), hint: "Spendable on anything", tone: "primary" },
        { label: "Restricted balance", value: formatKES(0), hint: "Skills Fund & marketplace credits — permitted purposes only", tone: "muted" },
        { label: "Rewards", value: formatKES(0), hint: "Earned credits", tone: "muted" },
        { label: "Pending payments", value: formatKES(pendingTotal), hint: `${pendingPayments.length} awaiting settlement`, tone: "muted" },
    ];

    return (
        <div className="space-y-5">
            {lowBalance && (
                <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>Low balance alert — your unrestricted balance is below KES 5,000. Top up to avoid missed payments.</span>
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((s) => (
                    <Card key={s.label} className={s.tone === "primary" ? "rounded-md bg-gradient-to-br from-primary to-accent text-primary-foreground border-0" : "rounded-md"}>
                        <CardHeader className="pb-0">
                            <CardDescription className={s.tone === "primary" ? "text-primary-foreground/80" : ""}>{s.label}</CardDescription>
                            <CardTitle className="text-2xl">{s.value}</CardTitle>
                        </CardHeader>
                        <CardContent className={`text-[11px] ${s.tone === "primary" ? "text-primary-foreground/85" : "text-muted-foreground"}`}>{s.hint}</CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader className="w-full flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-base">Recent transactions</CardTitle>
                        <button onClick={() => onNavigate("transactions")} className="text-xs text-primary">View all</button>
                    </CardHeader>
                    <CardContent className="divide-y">
                        {transactions?.slice(0, 6).map((t) => (
                            <TxnRow key={t.uuid} txn={t} />
                        ))}

                        {transactions?.length === 0 && (
                            <div className='flex flex-col items-center justify-center rounded-xl  bg-muted/20 px-6 py-12 text-center'>
                                <div className='mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-muted'>
                                    <ReceiptText className='h-5 w-5 text-muted-foreground' />
                                </div>

                                <h4 className='text-sm font-semibold text-foreground'>
                                    No transactions recorded
                                </h4>

                                <p className='mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground'>
                                    Your wallet activity will appear here once payments, top-ups,
                                    or other transactions are recorded.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-base">Upcoming payments</CardTitle>
                        <button onClick={() => onNavigate("payments")} className="text-xs text-primary">Manage</button>
                    </CardHeader>
                    <CardContent className="divide-y">
                        {pendingPayments.slice(0, 6).map((p) => (
                            <div key={p.uuid} className="flex items-center justify-between gap-3 py-3">
                                <div className="flex flex-col gap-1.5 min-w-0">
                                    <p className="text-sm font-medium truncate">{p.item_name}</p>
                                    <p className="text-xs text-muted-foreground">{p.item_type} · due {fmtDate(p.due_at)}</p>
                                </div>
                                <div className="flex flex-col gap-1.5 text-right">
                                    <p className="text-sm font-semibold">{formatKES(p.amount_kes - p.amount_paid_kes)}</p>
                                    <p className="text-[11px] text-muted-foreground">{p.method ? METHOD_LABEL[p.method] : "Method not set"}</p>
                                </div>
                            </div>
                        ))}

                        {pendingPayments.length === 0 && (
                            <div className='flex flex-col items-center justify-center rounded-xl  bg-muted/20 px-6 py-12 text-center'>
                                <div className='mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-muted'>
                                    <CalendarCheck className='h-5 w-5 text-muted-foreground' />
                                </div>

                                <h4 className='text-sm font-semibold text-foreground'>
                                    No upcoming payments
                                </h4>

                                <p className='mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground'>
                                    Any scheduled or outstanding payments will appear here when
                                    they become due.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}