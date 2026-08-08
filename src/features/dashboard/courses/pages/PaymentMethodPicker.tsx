import { Smartphone } from "lucide-react";

/**
 * M-Pesa is the only method that takes money today. Card, wallet and Skills Fund were shown here
 * with hardcoded balances and no backend behind them, which let a learner pick a way to pay that
 * could never charge them.
 */
export const formatKES = (amount: number | string) =>
    `KES ${amount?.toLocaleString()}`;

export default function PaymentMethodPicker() {
    return (
        <div className="space-y-3">
            <div className="border-primary bg-primary/5 flex items-start gap-3 rounded-lg border p-4 text-left">
                <Smartphone className="text-primary mt-0.5 h-5 w-5 shrink-0" />
                <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">M-Pesa</div>
                    <div className="text-muted-foreground text-xs">
                        You will get a prompt on your phone to approve the payment.
                    </div>
                </div>
            </div>
            <p className="text-muted-foreground text-xs">
                Your seat is confirmed once the payment goes through.
            </p>
        </div>
    );
}
