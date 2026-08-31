'use client'

import { ArrowLeftRight, Download } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../components/ui/select";
import { TxnRow, downloadCsv, fmtDateTime, fmtMoney, useWallet } from "../page";

export function TransactionsTab() {
    const { transactions, notify } = useWallet();
    const [transactionType, setTransactionType] = useState("all");

    const availableTypes = useMemo(
        () => Array.from(new Set(transactions.map((t) => t.transaction_type).filter(Boolean))).sort(),
        [transactions],
    );

    const rows = transactions.filter((t) => transactionType === "all" || t.transaction_type === transactionType);

    function exportCsv() {
        downloadCsv(
            "elimika-wallet-transactions.csv",
            [
                "Date",
                "Type",
                "Amount",
                "Currency",
                "Balance Before",
                "Balance After",
                "Reference",
                "Description",
                "Wallet UUID",
                "Transfer Reference",
                "Counterparty User UUID",
            ],
            rows.map((t) => [
                fmtDateTime(t.created_date),
                t.transaction_type ?? "",
                t.amount ?? "",
                t.currency_code ?? "",
                t.balance_before ?? "",
                t.balance_after ?? "",
                t.reference ?? "",
                t.description ?? "",
                t.wallet_uuid ?? "",
                t.transfer_reference ?? "",
                t.counterparty_user_uuid ?? "",
            ]),
        );
        notify({ type: "success", message: "Export ready", description: "elimika-wallet-transactions.csv downloaded." });
    }

    return (
        <Card>
            <CardHeader className="gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-base">Transactions</CardTitle>
                    <Button variant="outline" size="sm" onClick={exportCsv}>
                        <Download className="mr-1.5 h-4 w-4" /> Export CSV
                    </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Select value={transactionType} onValueChange={setTransactionType}>
                        <SelectTrigger className="w-52">
                            <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All transaction types</SelectItem>
                            {availableTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                    {type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>

            <CardContent className="divide-y">
                {rows.length > 0 ? (
                    rows.map((txn) => (
                        <div key={txn.uuid} className="space-y-1 py-2">
                            <TxnRow txn={txn} />

                            <p className="pl-11 -mt-2 text-xs text-muted-foreground">
                                {fmtMoney(txn.balance_before ?? 0, txn.currency_code ?? "KES")} →{" "}
                                {fmtMoney(txn.balance_after ?? 0, txn.currency_code ?? "KES")}
                                {txn.counterparty_user_uuid ? ` · counterparty ${txn.counterparty_user_uuid}` : ""}
                            </p>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                            <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
                        </div>

                        <h4 className="text-sm font-semibold text-foreground">No transactions found</h4>

                        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                            There are no wallet transactions matching the selected filter.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
