'use client'

import { Download } from "lucide-react";
import { Button } from "../../../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { formatKES } from "../../../../../src/features/dashboard/courses/pages/PaymentMethodPicker";
import { downloadCsv, fmtDate, useWallet, WalletStatement } from "../page";


/* =========================================================================
   Statements tab
   ========================================================================= */
export function StatementsTab() {
    const { statements, transactions, notify } = useWallet();

    function download(st: WalletStatement) {
        const start = new Date(st.period_start).getTime();
        const end = new Date(st.period_end).getTime() + 86400000;
        const rows = transactions.filter((t) => {
            const d = new Date(t.occurred_at).getTime();
            return d >= start && d <= end;
        });
        downloadCsv(
            `${st.label.replace(/\s+/g, "-").toLowerCase()}.csv`,
            ["Date", "Description", "Status", "Amount"],
            rows.map((t) => [fmtDate(t.occurred_at), t.description, t.status, `${t.direction === "credit" ? "+" : "-"}${t.amount_kes}`]),
        );
        notify({ type: "success", message: "Statement downloaded" });
    }

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {statements.map((st) => (
                <Card key={st.id}>
                    <CardHeader className="pb-2">
                        <CardDescription>{st.kind}</CardDescription>
                        <CardTitle className="text-base">{st.label}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">{fmtDate(st.period_start)} — {fmtDate(st.period_end)}</p>
                        <div className="flex gap-4 text-sm">
                            <span className="text-success">In {formatKES(st.total_in_kes)}</span>
                            <span className="text-warning">Out {formatKES(st.total_out_kes)}</span>
                        </div>
                        <Button size="sm" variant="outline" className="w-full" onClick={() => download(st)}>
                            <Download className="h-4 w-4 mr-1.5" /> Download CSV
                        </Button>
                    </CardContent>
                </Card>
            ))}
            {statements.length === 0 && <p className="text-sm text-muted-foreground">No statements available yet.</p>}
        </div>
    );
}