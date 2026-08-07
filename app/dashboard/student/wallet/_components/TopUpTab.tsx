'use client'

import { useState } from "react";
import { Label } from "recharts";
import { Badge } from "../../../../../components/ui/badge";
import { Button } from "../../../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { Input } from "../../../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../components/ui/select";
import { formatKES } from "../../../../../src/features/dashboard/courses/pages/PaymentMethodPicker";
import { METHOD_LABEL, PaymentMethod, TOPUP_METHODS, useWallet } from "../page";


export function TopUpTab() {
    const { topUp } = useWallet();
    const [amount, setAmount] = useState("500");
    const [method, setMethod] = useState<PaymentMethod>("mobile_money");
    const [busy, setBusy] = useState(false);

    function submit() {
        const value = Number(amount || 0);
        if (value <= 0) return;
        setBusy(true);
        topUp(value, method);
        setBusy(false);
    }

    return (
        <div className="grid gap-4 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Top up your wallet</CardTitle>
                    <CardDescription>Funds land in your personal (unrestricted) balance.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="space-y-1.5">
                        <Label>Method</Label>
                        <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {TOPUP_METHODS.map((m) => <SelectItem key={m} value={m}>{METHOD_LABEL[m]}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label>Amount (KES)</Label>
                        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {[1000, 2500, 5000, 10000].map((v) => (
                            <Button key={v} variant="outline" size="sm" onClick={() => setAmount(String(v))}>{formatKES(v)}</Button>
                        ))}
                    </div>
                    <Button className="w-full" onClick={submit} disabled={busy}>{busy ? "Processing…" : "Top up"}</Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="text-base">Accepted top-up sources</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                    {TOPUP_METHODS.map((m) => (
                        <div key={m} className="flex items-center justify-between border-b last:border-0 py-2">
                            <span>{METHOD_LABEL[m]}</span>
                            <Badge variant="secondary">Available</Badge>
                        </div>
                    ))}
                    <p className="text-xs text-muted-foreground pt-2">
                        Card and bank payments are processed by PCI DSS-certified providers. Elimika never stores card data.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}