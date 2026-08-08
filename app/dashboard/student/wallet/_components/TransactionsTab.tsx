'use client'

import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../components/ui/select";
import { Bucket, fmtDateTime, METHOD_LABEL, TxnRow, useWallet } from "../page";
import { BUCKET_META } from "./data";

function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
    const lines = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export function TransactionsTab() {
    const { transactions, notify } = useWallet();
    const [status, setStatus] = useState("all");
    const [bucket, setBucket] = useState("all");

    const rows = transactions.filter((t) => (status === "all" || t.status === status) && (bucket === "all" || t.bucket === bucket));

    function exportCsv() {
        downloadCsv(
            "elimika-wallet-transactions.csv",
            ["Date", "Description", "Amount", "Direction", "Source", "Destination", "Bucket", "Funding source", "Status", "Reference"],
            rows.map((t) => [
                fmtDateTime(t.created_date), t.description, t.amount, t.transaction_type, t.source ?? "", t.counterparty_user_uuid ?? "",
                BUCKET_META[t.bucket]?.label ?? t.bucket, t.funding_source ?? "", t.status, t.reference,
            ]),
        );
        notify({ type: "success", message: "Export ready", description: "elimika-wallet-transactions.csv downloaded." });
    }

    return (
        <Card>
            <CardHeader className="gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-base">Transactions</CardTitle>
                    <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4 mr-1.5" /> Export CSV</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            {["pending", "completed", "failed", "reversed", "refunded"].map((s) => (
                                <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={bucket} onValueChange={setBucket}>
                        <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All allocation buckets</SelectItem>
                            {(Object.entries(BUCKET_META) as [Bucket, { label: string }][]).map(([k, v]) => (
                                <SelectItem key={k} value={k}>{v.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>

            <CardContent className="divide-y">
                {rows.map((t) => (
                    <div key={t.uuid} className="py-3 space-y-1">
                        <TxnRow txn={t} />

                        <p className="text-[11px] text-muted-foreground pl-11">
                            {t.source ?? "—"} → {t.destination ?? "—"} · funded by {t.funding_source ?? "—"}
                            {t.method ? ` · ${METHOD_LABEL[t.method]}` : ""}
                        </p>
                    </div>
                ))}
                {rows.length === 0 && <p className="py-6 text-sm text-muted-foreground">No transactions match these filters.</p>}
            </CardContent>
        </Card>
    );
}
