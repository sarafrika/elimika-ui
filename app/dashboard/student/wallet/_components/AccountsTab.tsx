'use client'

import { Lock } from "lucide-react";
import { Badge } from "../../../../../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { formatKES } from "../../../../../src/features/dashboard/courses/pages/PaymentMethodPicker";
import { balanceBreakdown, fmtDate, useWallet, WalletTabProps } from "../page";
import { BUCKET_META, BUCKET_RULES, PAYABLE_ITEMS } from "./data";

/* =========================================================================
   Accounts tab
   ========================================================================= */
export function AccountsTab({ wallet }: WalletTabProps) {
    const { accounts } = useWallet();
    const breakdown = balanceBreakdown(accounts);


    return (
        <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                    <CardHeader className="-mb-2">
                        <CardDescription>Available to spend</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold text-success">{formatKES(breakdown.restricted)}</p>
                        <p className="text-xs text-muted-foreground">No purpose restrictions</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="-mb-2">
                        <CardDescription>Total</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold text-warning">{formatKES(breakdown.total)}</p>
                        <p className="text-xs text-muted-foreground">Usable only for permitted purposes</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="-mb-2">
                        <CardDescription>Total wallet value</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold">{formatKES(breakdown.total)}</p>
                        <p className="text-xs text-muted-foreground">
                            {breakdown.expired > 0 ? `${formatKES(breakdown.expired)} expired` : "Nothing expired"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {accounts.map((a) => {
                    const rule = BUCKET_RULES[a.bucket];
                    const expired = !!a.expires_at && new Date(a.expires_at) < new Date();
                    const restricted = !!rule?.restricted;
                    return (
                        <Card key={a.id} className={expired ? "opacity-70" : ""}>
                            <CardHeader className="-mb-2">
                                <div>
                                    <div className="flex items-center justify-between gap-2">
                                        <CardDescription>
                                            {BUCKET_META[a.bucket]?.label}
                                        </CardDescription>

                                        {restricted ? (
                                            <Badge
                                                variant="outline"
                                                className="gap-1 border-warning/30 bg-warning/10 text-warning"
                                            >
                                                <Lock className="h-3 w-3" />
                                                Restricted
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary">Available</Badge>
                                        )}
                                    </div>

                                    <CardTitle className="mt-1 text-lg">
                                        {a.label}
                                    </CardTitle>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-2">
                                <p className={`text-2xl font-semibold ${expired ? "line-through text-muted-foreground" : ""}`}>{formatKES(a.balance_kes)}</p>
                                <p className="text-xs text-muted-foreground">{a.permitted_purpose ?? rule?.purpose ?? BUCKET_META[a.bucket]?.hint}</p>

                                {rule?.allowed ? (
                                    <div className="space-y-1 pt-1">
                                        <p className="text-[11px] font-medium text-muted-foreground">Can pay for</p>
                                        <div className="flex flex-wrap gap-1">
                                            {rule.allowed.map((i) => (
                                                <Badge key={i} variant="outline" className="text-[10px] font-normal">{i}</Badge>
                                            ))}
                                        </div>
                                        <div className="flex flex-wrap gap-1 pt-1">
                                            {PAYABLE_ITEMS.filter((i) => !rule.allowed!.includes(i)).map((i) => (
                                                <Badge key={i} variant="outline" className="text-[10px] font-normal text-muted-foreground line-through">{i}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-[11px] text-success">Usable for any Elimika payment</p>
                                )}

                                <div className="flex flex-wrap gap-3 pt-1 text-[11px] text-muted-foreground">
                                    {a.funder && <span>Funder: {a.funder}</span>}
                                    {a.expires_at && (
                                        <span className={expired ? "text-destructive" : ""}>{expired ? "Expired" : "Expires"} {fmtDate(a.expires_at)}</span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}