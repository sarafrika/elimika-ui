'use client'

import { CheckCircle2, Clock, CreditCard } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "../../../../../components/ui/badge";
import { Button } from "../../../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../../components/ui/dialog";
import { Input } from "../../../../../components/ui/input";
import { Label } from "../../../../../components/ui/label";
import { Progress } from "../../../../../components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../components/ui/select";
import { Wallet } from "../../../../../services/client";
import { formatKES } from "../../../../../src/features/dashboard/courses/pages/PaymentMethodPicker";
import { StatusBadge } from "../../../admin/_components/ui";
import { Bucket, checkBucketRule, fmtDate, METHOD_LABEL, PAY_METHODS, PaymentMethod, useWallet, validatePayment, WalletPayment } from "../page";
import { PAYABLE_ITEMS } from "./data";
/* =========================================================================
   Payments tab
   ========================================================================= */
export function PaymentsTab() {
    const { payments, accounts } = useWallet();
    const [target, setTarget] = useState<WalletPayment | null>(null);
    const [adhoc, setAdhoc] = useState(false);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                    Pay for courses, classes, assessments, certifications, marketplace items, equipment, competitions and tickets.
                </p>
                <Button size="sm" onClick={() => setAdhoc(true)}>
                    <CreditCard className="h-4 w-4 mr-1.5" /> New payment
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {payments.length === 0 ? (
                    <Card className="md:col-span-2">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                <CreditCard className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <CardTitle className="text-base">No payments</CardTitle>
                            <CardDescription className="mt-1 text-xs">
                                You don't have any payments to make at the moment.
                            </CardDescription>
                        </CardContent>
                    </Card>
                ) : (
                    payments.map((p, i) => {
                        const outstanding = p.amount_kes - p.amount_paid_kes;
                        const pct = Math.round((p.amount_paid_kes / p.amount_kes) * 100);

                        return (
                            <Card key={i}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <CardDescription>{p.item_type}</CardDescription>
                                            <CardTitle className="text-base truncate">
                                                {p.item_name}
                                            </CardTitle>
                                        </div>
                                        <StatusBadge status={p.status} />
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Outstanding</span>
                                        <span className="font-semibold">
                                            {formatKES(outstanding)}
                                        </span>
                                    </div>

                                    {p.amount_paid_kes > 0 && (
                                        <div className="space-y-1">
                                            <Progress value={pct} className="h-1.5" />
                                            <p className="text-[11px] text-muted-foreground">
                                                {formatKES(p.amount_paid_kes)} of{" "}
                                                {formatKES(p.amount_kes)} paid
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            Due {fmtDate(p.due_at)}
                                        </span>
                                        {p.partial_allowed && (
                                            <Badge variant="outline">
                                                Partial payments allowed
                                            </Badge>
                                        )}
                                    </div>

                                    <Button
                                        size="sm"
                                        className="w-full"
                                        disabled={p.status === "completed"}
                                        onClick={() => setTarget(p)}
                                    >
                                        {p.status === "completed" ? (
                                            <>
                                                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                                                Settled
                                            </>
                                        ) : (
                                            "Pay now"
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>


            <PayDialog
                open={!!target || adhoc}
                payment={target}
                accounts={accounts || []}
                onClose={() => { setTarget(null); setAdhoc(false); }}
            />
        </div>
    );
}



function PayDialog({ open, payment, accounts, onClose }: { open: boolean; payment: WalletPayment | null; accounts: Wallet[]; onClose: () => void }) {
    const { pay } = useWallet();

    const outstanding = payment ? payment.amount_kes - payment.amount_paid_kes : 0;
    const [amount, setAmount] = useState("");
    const [method, setMethod] = useState<PaymentMethod>("personal_wallet");
    const [itemType, setItemType] = useState<string>("Course");
    const [itemName, setItemName] = useState("");
    const [accountId, setAccountId] = useState<string>("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!open) return;
        setAmount(payment ? String(outstanding) : "");
        setMethod(payment?.method ?? "personal_wallet");
        setItemType(payment?.item_type ?? "Course");
        setItemName(payment?.item_name ?? "");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, payment?.uuid]);

    const byMethodBuckets: Partial<Record<PaymentMethod, Bucket[]>> = {
        personal_wallet: ["personal", "refunds", "marketplace_credits"],
        skills_fund: ["skills_fund"],
        rewards: ["rewards"],
    };

    const eligible = useMemo(() => {
        const buckets = byMethodBuckets[method];
        if (!buckets) return [];
        return accounts.filter((a) => buckets.includes(a.bucket) && checkBucketRule(a.bucket, itemType, a).allowed);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accounts, method, itemType]);

    const blockedSources = useMemo(
        () => accounts.map((a) => ({ a, rule: checkBucketRule(a.bucket, itemType, a) })).filter((x) => !x.rule.allowed && x.a.balance_amount! > 0),
        [accounts, itemType],
    );

    useEffect(() => {
        setAccountId(eligible[0]?.uuid ?? "");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [method, itemType, eligible.length]);

    const account = accounts.find((a) => a.uuid === accountId) ?? null;
    const available = account ? account.balance_amount! : Infinity;
    const numeric = Number(amount || 0);
    const check = validatePayment({ itemType, method, amount: numeric, available, account });
    const partial = payment ? numeric < outstanding : false;

    async function submit() {
        if (!check.ok || !account) return;
        if (partial && !payment?.partial_allowed) return;
        setBusy(true);
        pay({
            paymentId: payment?.uuid ?? null,
            itemType,
            itemName: itemName || itemType,
            amount: numeric,
            method,
            accountId: account.uuid!,
            total: payment?.amount_kes,
            alreadyPaid: payment?.amount_paid_kes ?? 0,
        });
        setBusy(false);
        onClose();
    }

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Make a payment</DialogTitle>
                    <DialogDescription>The rules engine validates Skills Fund restrictions before funds are reserved.</DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                    {!payment && (
                        <>
                            <div className="space-y-1.5">
                                <Label>What are you paying for?</Label>
                                <Select value={itemType} onValueChange={setItemType}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {PAYABLE_ITEMS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Item name</Label>
                                <Input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g. Python for Data Science" />
                            </div>
                        </>
                    )}

                    <div className="space-y-1.5">
                        <Label>Payment method</Label>
                        <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {PAY_METHODS.map((m) => <SelectItem key={m} value={m}>{METHOD_LABEL[m]}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    {eligible.length > 0 ? (
                        <div className="space-y-1.5">
                            <Label>Source account</Label>
                            <Select value={accountId} onValueChange={setAccountId}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a source account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {eligible.map((a) => (
                                        <SelectItem key={a.id} value={a.id}>
                                            {a.label} — {formatKES(a.balance_kes)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>


                            {account && (
                                <p className="text-[11px] text-muted-foreground">{checkBucketRule(account.bucket, itemType, account).reason}</p>
                            )}
                        </div>
                    ) : (
                        <p className="rounded-lg border border-warning/30 bg-warning/10 p-2.5 text-xs text-warning">
                            No {METHOD_LABEL[method].toLowerCase()} balance may be used for {itemType.toLowerCase()}.
                        </p>
                    )}

                    {blockedSources.length > 0 && (
                        <div className="rounded-lg border p-2.5 text-[11px] space-y-1">
                            <p className="font-medium text-muted-foreground">Not usable for {itemType.toLowerCase()}</p>
                            {blockedSources.map(({ a, rule }) => (
                                <p key={a.uuid} className="text-muted-foreground">
                                    <Lock className="inline h-3 w-3 mr-1 -mt-0.5" />
                                    {a.label} ({formatKES(a.balance_kes)}) — {rule.reason}
                                </p>
                            ))}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label>Amount (KES)</Label>
                        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
                        {payment && (
                            <p className="text-[11px] text-muted-foreground">
                                Outstanding {formatKES(outstanding)}{payment.partial_allowed ? " · partial payments allowed" : " · full payment required"}
                            </p>
                        )}
                    </div>

                    <div className={`rounded-lg border p-2.5 text-xs ${check.ok ? "border-success/30 bg-success/10 text-success" : "border-destructive/30 bg-destructive/10 text-destructive"}`}>
                        {check.message}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={submit} disabled={!check.ok || busy}>{busy ? "Processing…" : `Pay ${formatKES(numeric)}`}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}