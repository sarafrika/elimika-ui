import {
    CreditCard,
    PiggyBank,
    Smartphone,
    Wallet,
} from "lucide-react";
import { useState } from "react";

type PaymentMethod =
    | "personal_wallet"
    | "skills_fund"
    | "mobile_money"
    | "card";

const PAYMENT_METHODS = [
    {
        id: "personal_wallet" as PaymentMethod,
        label: "Personal Wallet",
        description: "Pay using your wallet balance",
        balance: 12500,
        icon: Wallet,
    },
    {
        id: "skills_fund" as PaymentMethod,
        label: "Skills Fund",
        description: "Sponsored learning funds",
        balance: 8000,
        icon: PiggyBank,
    },
    {
        id: "mobile_money" as PaymentMethod,
        label: "M-Pesa",
        description: "Pay with mobile money",
        icon: Smartphone,
    },
    {
        id: "card" as PaymentMethod,
        label: "Debit / Credit Card",
        description: "Visa or Mastercard",
        icon: CreditCard,
    },
];

export const formatKES = (amount: number | string) =>
    `KES ${amount?.toLocaleString()}`;

export default function PaymentMethodPicker() {
    const [selectedMethod, setSelectedMethod] =
        useState<PaymentMethod>("personal_wallet");

    return (
        <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
                {PAYMENT_METHODS.map((method) => {
                    const Icon = method.icon;
                    const active = selectedMethod === method.id;

                    return (
                        <button
                            key={method.id}
                            type="button"
                            onClick={() => setSelectedMethod(method.id)}
                            className={`flex items-start gap-3 rounded-lg border p-4 text-left transition
                ${active
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/40 hover:bg-muted"
                                }`}
                        >
                            <Icon
                                className={`mt-0.5 h-5 w-5 shrink-0 ${active ? "text-primary" : "text-muted-foreground"
                                    }`}
                            />

                            <div className="min-w-0 flex-1">
                                <div className="font-medium text-sm">
                                    {method.label}
                                </div>

                                <div className="text-xs text-muted-foreground">
                                    {method.description}
                                </div>

                                {"balance" in method && method.balance !== undefined && (
                                    <div className="mt-1 text-xs font-medium text-foreground">
                                        {formatKES(method.balance)} available
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="rounded-md border border-success/30 bg-success/10 p-3">
                <p className="text-sm text-success">
                    Selected payment method:
                    <span className="ml-1 font-semibold">
                        {
                            PAYMENT_METHODS.find(
                                (m) => m.id === selectedMethod
                            )?.label
                        }
                    </span>
                </p>
            </div>
        </div>
    );
}