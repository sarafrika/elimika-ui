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

export const formatKES = (amount: number) =>
    `KES ${amount.toLocaleString()}`;

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
                                    ? "border-[#0f4c81] bg-[#0f4c81]/5"
                                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                }`}
                        >
                            <Icon
                                className={`mt-0.5 h-5 w-5 shrink-0 ${active ? "text-[#0f4c81]" : "text-slate-400"
                                    }`}
                            />

                            <div className="min-w-0 flex-1">
                                <div className="font-medium text-sm">
                                    {method.label}
                                </div>

                                <div className="text-xs text-slate-500">
                                    {method.description}
                                </div>

                                {"balance" in method && method.balance !== undefined && (
                                    <div className="mt-1 text-xs font-medium text-slate-700">
                                        {formatKES(method.balance)} available
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-sm text-emerald-800">
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
