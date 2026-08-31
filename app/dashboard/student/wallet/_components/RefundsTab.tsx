'use client'

import { ReceiptText, RefreshCcw } from "lucide-react";
import { useState } from "react";
import { Badge } from "../../../../../components/ui/badge";
import { Button } from "../../../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../../components/ui/dialog";
import { WalletTransaction } from "../../../../../services/client";
import { balanceBreakdown, fmtDateTime, fmtMoney, TxnRow, useWallet } from "../page";

function isRefundableTransaction(txn: WalletTransaction) {
    return ["WITHDRAWAL", "TRANSFER_OUT", "PAYMENT"].includes((txn.transaction_type ?? "").toUpperCase());
}

export function RefundsTab() {
    const { transactions, accounts, refund } = useWallet();
    const refundable = transactions.filter(isRefundableTransaction);
    const recentTransactions = transactions.slice(0, 6);
    const breakdown = balanceBreakdown(accounts);
    const [preview, setPreview] = useState<WalletTransaction | null>(null);

    return (
        <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardDescription>Available balance</CardDescription>
                        <CardTitle className="text-xl text-success">{fmtMoney(breakdown.available)}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 text-xs text-muted-foreground">
                        Refunds of unrestricted spend land here
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardDescription>Restricted balance</CardDescription>
                        <CardTitle className="text-xl text-warning">{fmtMoney(breakdown.restricted)}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 text-xs text-muted-foreground">
                        Skills Fund and marketplace credits keep their rules after a refund
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardDescription>Expired funder balance</CardDescription>
                        <CardTitle className="text-xl text-muted-foreground">{fmtMoney(breakdown.expired)}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 text-xs text-muted-foreground">
                        Refunds to an expired allocation are re-routed to your refund balance
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Request a refund</CardTitle>
                        <CardDescription>
                            Review a transaction from the live ledger and record a refund request against it.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="divide-y">
                        {refundable.map((txn) => (
                            <div key={txn.uuid}>
                                <TxnRow
                                    txn={txn}
                                    action={
                                        <Button size="sm" variant="outline" onClick={() => setPreview(txn)}>
                                            Preview & refund
                                        </Button>
                                    }
                                />
                                <div className="pb-3 pl-11 text-xs text-muted-foreground">
                                    {txn.transaction_type ?? "UNKNOWN"} · {fmtMoney(txn.amount ?? 0, txn.currency_code ?? "KES")}
                                </div>
                            </div>
                        ))}

                        {refundable.length === 0 && (
                            <div className="flex flex-col items-center justify-center rounded-xl bg-muted/20 px-6 py-12 text-center">
                                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-muted">
                                    <RefreshCcw className="h-5 w-5 text-muted-foreground" />
                                </div>

                                <h4 className="text-sm font-semibold text-foreground">No refundable payments</h4>

                                <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
                                    Refundable ledger entries will appear here once they are returned by the API.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Recent ledger entries</CardTitle>
                    </CardHeader>
                    <CardContent className="divide-y">
                        {recentTransactions.map((txn) => (
                            <div key={txn.uuid}>
                                <TxnRow txn={txn} />
                                {/* <div className="pb-3 pl-11 text-xs text-muted-foreground">
                                    {fmtDateTime(txn.created_date)} · {txn.reference ?? "—"}
                                </div> */}
                            </div>
                        ))}

                        {recentTransactions.length === 0 && (
                            <div className="flex flex-col items-center justify-center rounded-xl bg-muted/20 px-6 py-12 text-center">
                                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-muted">
                                    <ReceiptText className="h-5 w-5 text-muted-foreground" />
                                </div>

                                <h4 className="text-sm font-semibold text-foreground">No refund history</h4>

                                <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
                                    Recent wallet transactions will appear here when the API returns them.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <RefundPreviewDialog
                txn={preview}
                onClose={() => setPreview(null)}
                onConfirm={(t) => {
                    refund(t);
                    setPreview(null);
                }}
            />
        </div>
    );
}

function RefundPreviewDialog({
    txn,
    onClose,
    onConfirm,
}: {
    txn: WalletTransaction | null;
    onClose: () => void;
    onConfirm: (txn: WalletTransaction) => void;
}) {
    if (!txn) return null;

    return (
        <Dialog open={!!txn} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Refund preview</DialogTitle>
                    <DialogDescription>
                        Review the transaction details before recording the refund request.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                    <div className="rounded-lg border p-3 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{txn.description ?? txn.transaction_type ?? "Wallet transaction"}</p>
                                <p className="text-[11px] text-muted-foreground">Reference {txn.reference ?? "—"}</p>
                            </div>
                            <span className="text-sm font-semibold text-success whitespace-nowrap">
                                {fmtMoney(txn.amount ?? 0, txn.currency_code ?? "KES")}
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            <Badge variant="outline" className="font-normal">
                                {txn.transaction_type ?? "UNKNOWN"}
                            </Badge>
                            <Badge variant="outline" className="font-normal">
                                {txn.currency_code ?? "KES"}
                            </Badge>
                        </div>

                        <p className="text-[11px] text-muted-foreground">
                            {fmtDateTime(txn.created_date)} · balance {fmtMoney(txn.balance_before ?? 0, txn.currency_code ?? "KES")} to{" "}
                            {fmtMoney(txn.balance_after ?? 0, txn.currency_code ?? "KES")}
                        </p>
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
