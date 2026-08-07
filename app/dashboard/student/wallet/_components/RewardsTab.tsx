
'use client'

import { Badge } from "../../../../../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { formatKES } from "../../../../../src/features/dashboard/courses/pages/PaymentMethodPicker";
import { fmtDate, useWallet } from "../page";


export function RewardsTab() {
    const { rewards } = useWallet();
    const total = rewards.reduce((s, r) => s + r.amount_kes, 0);
    const kinds = ["Learning Reward", "Referral Bonus", "Competition Prize", "Promotional Credit", "Cashback"];

    return (
        <div className="space-y-4">
            <Card className="bg-gradient-to-br from-primary to-accent text-primary-foreground border-0">
                <CardHeader className="pb-2">
                    <CardDescription className="text-primary-foreground/80">Total rewards earned</CardDescription>
                    <CardTitle className="text-2xl">{formatKES(total)}</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-primary-foreground/85">Rewards can be spent on courses, assessments, marketplace items and tickets.</CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
                {kinds.map((k) => {
                    const rows = rewards.filter((r) => r.kind === k);
                    return (
                        <Card key={k}>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">{k}</CardTitle>
                                    <Badge variant="secondary">{formatKES(rows.reduce((s, r) => s + r.amount_kes, 0))}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="divide-y">
                                {rows.map((r) => (
                                    <div key={r.id} className="flex items-center justify-between gap-3 py-2">
                                        <div className="min-w-0">
                                            <p className="text-sm truncate">{r.title}</p>
                                            <p className="text-[11px] text-muted-foreground">
                                                Earned {fmtDate(r.earned_at)}{r.expires_at ? ` · expires ${fmtDate(r.expires_at)}` : ""}
                                            </p>
                                        </div>
                                        <span className="text-sm font-semibold text-success">+ {formatKES(r.amount_kes)}</span>
                                    </div>
                                ))}
                                {rows.length === 0 && <p className="py-3 text-sm text-muted-foreground">None yet.</p>}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}