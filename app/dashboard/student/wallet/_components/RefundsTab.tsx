'use client'

import { useState } from "react";
import { Badge } from "../../../../../components/ui/badge";
import { Button } from "../../../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../../components/ui/dialog";
import { formatKES } from "../../../../../src/features/dashboard/courses/pages/PaymentMethodPicker";
import { WalletTransaction } from "../../../course-creator/revenue/page";
import { balanceBreakdown, TxnRow, useWallet, WalletAccount } from "../page";
import { BUCKET_META, BUCKET_RULES } from "./data";

/* =========================================================================
   Refunds tab
   ========================================================================= */

export function RefundsTab() {
    const { transactions, accounts, refund } = useWallet();
    const candidates = transactions.filter((t) => t.direction === "debit" && t.status !== "refunded");
    const refunded = transactions.filter((t) => t.status === "refunded" && t.direction === "credit");
    const breakdown = balanceBreakdown(accounts);
    const [preview, setPreview] = useState<WalletTransaction | null>(null);

    function routeFor(txn: WalletTransaction) {
        const originAccount = accounts.find((a) => a.label === txn.source || a.bucket === txn.bucket);
        const isExpired = !!originAccount?.expires_at && new Date(originAccount.expires_at).getTime() < Date.now();
        const routeAccount = isExpired ? accounts.find((a) => a.bucket === "refunds") : originAccount;
        return {
            account: routeAccount,
            restricted: !!(routeAccount && BUCKET_RULES[routeAccount.bucket]?.restricted),
            rerouted: isExpired,
            reason: isExpired
                ? `${originAccount?.label ?? "The original allocation"} has expired — funds go to your Refund Balance instead.`
                : `Returns to the exact source it was paid from.`,
        };
    }

    return (
        <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2"><CardDescription>Available balance</CardDescription><CardTitle className="text-xl text-success">{formatKES(breakdown.available)}</CardTitle></CardHeader>
                    <CardContent className="pt-0 text-xs text-muted-foreground">Refunds of unrestricted spend land here</CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardDescription>Restricted balance</CardDescription><CardTitle className="text-xl text-warning">{formatKES(breakdown.restricted)}</CardTitle></CardHeader>
                    <CardContent className="pt-0 text-xs text-muted-foreground">Skills Fund & marketplace credits keep their funder rules after a refund</CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardDescription>Expired funder balance</CardDescription><CardTitle className="text-xl text-muted-foreground">{formatKES(breakdown.expired)}</CardTitle></CardHeader>
                    <CardContent className="pt-0 text-xs text-muted-foreground">Refunds to an expired allocation are re-routed to your Refund Balance</CardContent>
                </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Request a refund</CardTitle>
                        <CardDescription>Money always returns to the bucket it was spent from, unless that allocation has expired.</CardDescription>
                    </CardHeader>
                    <CardContent className="divide-y">
                        {candidates.map((t) => {
                            const route = routeFor(t);
                            return (
                                <div key={t.uuid}>
                                    <TxnRow
                                        txn={t}
                                        action={
                                            <Button size="sm" variant="outline" onClick={() => setPreview(t)}>Preview & refund</Button>
                                        }
                                    />
                                    <div className="flex flex-wrap items-center gap-2 pb-3 text-xs text-muted-foreground">
                                        <Badge variant="outline" className="font-normal">Returns to {route.account?.label ?? "Refund Balance"}</Badge>
                                        <Badge variant="outline" className={route.restricted ? "border-warning/30 bg-warning/10 font-normal text-warning" : "border-success/30 bg-success/10 font-normal text-success"}>
                                            {route.restricted ? "Stays restricted" : "Available to spend"}
                                        </Badge>
                                        {route.rerouted && <span>{route.reason}</span>}
                                    </div>
                                </div>
                            );
                        })}
                        {candidates.length === 0 && <p className="py-6 text-sm text-muted-foreground">No payments available for refund.</p>}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Refund history</CardTitle>
                        <CardDescription>Each refund shows the bucket it was restored to.</CardDescription>
                    </CardHeader>
                    <CardContent className="divide-y">
                        {refunded.map((t) => (
                            <div key={t.uuid}>
                                <TxnRow txn={t} />
                                <div className="flex flex-wrap items-center gap-2 pb-3 text-xs">
                                    <Badge variant="outline" className="font-normal">{BUCKET_META[t.bucket]?.label ?? t.bucket}</Badge>
                                    <Badge variant="outline" className={BUCKET_RULES[t.bucket]?.restricted ? "border-warning/30 bg-warning/10 font-normal text-warning" : "border-success/30 bg-success/10 font-normal text-success"}>
                                        {BUCKET_RULES[t.bucket]?.restricted ? "Restricted" : "Available"}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                        {refunded.length === 0 && <p className="py-6 text-sm text-muted-foreground">No refunds yet.</p>}
                    </CardContent>
                </Card>
            </div>

            <RefundPreviewDialog txn={preview} onClose={() => setPreview(null)} routeFor={routeFor} onConfirm={(t) => { refund(t); setPreview(null); }} />
        </div>
    );
}

function RefundPreviewDialog({
    txn,
    onClose,
    onConfirm,
    routeFor,
}: {
    txn: WalletTransaction | null;
    onClose: () => void;
    onConfirm: (txn: WalletTransaction) => void;
    routeFor: (txn: WalletTransaction) => { account?: WalletAccount; restricted: boolean; rerouted: boolean; reason: string };
}) {
    if (!txn) return null;
    const route = routeFor(txn);
    return (
        <Dialog open={!!txn} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Refund routing preview</DialogTitle>
                    <DialogDescription>Review exactly which wallet bucket this refund of {formatKES(txn.amount_kes)} will restore before you confirm.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                    <div className="rounded-lg border p-3 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{txn.description}</p>
                                <p className="text-[11px] text-muted-foreground">Paid from {txn.source ?? BUCKET_META[txn.bucket].label}</p>
                            </div>
                            <span className="text-sm font-semibold text-success whitespace-nowrap">+ {formatKES(txn.amount_kes)}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            <Badge variant="outline" className="font-normal">{route.account ? BUCKET_META[route.account.bucket].label : "Refund Balance"}</Badge>
                            <Badge variant="outline" className={route.restricted ? "border-warning/30 bg-warning/10 font-normal text-warning" : "border-success/30 bg-success/10 font-normal text-success"}>
                                {route.restricted ? "Restricted" : "Available"}
                            </Badge>
                            {route.rerouted && <Badge variant="outline" className="border-primary/30 bg-primary/10 font-normal text-primary">Re-routed</Badge>}
                        </div>
                        <p className="text-[11px] text-muted-foreground">{route.reason}</p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => onConfirm(txn)}>Confirm refund</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}