'use client'

import {
    createContext,
    useContext,
    useMemo,
    useState,
    type ReactNode
} from "react";

import { Badge } from "@/components/ui/badge";


import { useQuery } from "@tanstack/react-query";
import {
    ArrowDownLeft,
    ArrowLeftRight,
    ArrowUpRight,
    CreditCard,
    FileText,
    Gift,
    Landmark,
    LayoutDashboard,
    PlusCircle,
    ShieldCheck,
    Undo2,
    Wallet as WalletIcon,
    X
} from "lucide-react";
import { useUserProfile } from "../../../../context/profile-context";
import { Wallet, WalletTransaction } from "../../../../services/client";
import { getWalletOptions, listTransactions1Options } from "../../../../services/client/@tanstack/react-query.gen";
import { AccountsTab } from "./_components/AccountsTab";
import { AuditTab } from "./_components/AuditTab";
import { DashboardTab } from "./_components/DashboardTab";
import { BUCKET_RULES } from "./_components/data";
import { PaymentsTab } from "./_components/PaymentsTab";
import { RefundsTab } from "./_components/RefundsTab";
import { RewardsTab } from "./_components/RewardsTab";
import { StatementsTab } from "./_components/StatementsTab";
import { TopUpTab } from "./_components/TopUpTab";
import { TransactionsTab } from "./_components/TransactionsTab";

/* =========================================================================
   Types
   ========================================================================= */

export type Bucket = "personal" | "skills_fund" | "rewards" | "marketplace_credits" | "refunds";
export type PaymentMethod = "personal_wallet" | "skills_fund" | "rewards" | "mobile_money" | "card" | "bank";
export type TxnStatus = "pending" | "completed" | "failed" | "reversed" | "refunded";

export interface WalletAccount {
    id: string;
    bucket: Bucket;
    label: string;
    balance_kes: number;
    currency_code?: string;
    funder?: string;
    expires_at?: string | null;
    permitted_purpose?: string;
}

export interface WalletPayment {
    uuid: string;
    item_name: string;
    item_type: string;
    amount_kes: number;
    amount_paid_kes: number;
    due_at: string;
    status: TxnStatus;
    partial_allowed: boolean;
    method?: PaymentMethod;
}

export interface WalletReward {
    id: string;
    kind: string;
    title: string;
    amount_kes: number;
    earned_at: string;
    expires_at?: string | null;
}

export interface WalletStatement {
    id: string;
    kind: string;
    label: string;
    period_start: string;
    period_end: string;
    total_in_kes: number;
    total_out_kes: number;
}

export interface AuditEntry {
    id: string;
    event_type: string;
    entity_type?: string;
    reason?: string;
    actor_role: string;
    created_at: string;
    previous_values?: Record<string, unknown>;
    updated_values?: Record<string, unknown>;
}

/* =========================================================================
   Static reference data
   ========================================================================= */
export const METHOD_LABEL: Record<PaymentMethod, string> = {
    personal_wallet: "Personal Wallet",
    skills_fund: "Skills Fund",
    rewards: "Rewards",
    mobile_money: "Mobile Money",
    card: "Card",
    bank: "Bank Transfer",
};

export const PAY_METHODS: PaymentMethod[] = ["personal_wallet", "skills_fund", "rewards"];
export const TOPUP_METHODS: PaymentMethod[] = ["mobile_money", "card", "bank"];

export const STATUS_TINT: Record<string, string> = {
    completed: "bg-success/10 text-success border-success/20",
    pending: "bg-warning/10 text-warning border-warning/20",
    failed: "bg-destructive/10 text-destructive border-destructive/20",
    reversed: "bg-muted text-muted-foreground border-border",
    refunded: "bg-primary/10 text-primary border-primary/20",
};

const TABS = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "accounts", label: "Accounts", icon: Landmark },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "top-up", label: "Top-Up", icon: PlusCircle },
    { id: "transactions", label: "Transactions", icon: ArrowLeftRight },
    { id: "refunds", label: "Refunds", icon: Undo2 },
    { id: "rewards", label: "Rewards", icon: Gift },
    { id: "statements", label: "Statements", icon: FileText },
    { id: "audit", label: "Audit", icon: ShieldCheck },
] as const;

export type WalletTabId = (typeof TABS)[number]["id"];

/* =========================================================================
   Formatting helpers
   ========================================================================= */

export function fmtKES(value: number | string) {
    return fmtMoney(value, "KES");
}

export function fmtMoney(value: number | string, currency = "KES") {
    const n = Number(value ?? 0);
    return new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}

export function fmtDate(iso?: string | Date | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

export function fmtDateTime(iso?: string | Date | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("en-KE", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}
export function daysFromNow(days: number) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString();
}

export function buildWalletAccounts(wallet?: Wallet | null): WalletAccount[] {
    return [
        {
            id: wallet?.uuid ?? "acc-personal",
            bucket: "personal",
            label: "Personal Wallet",
            balance_kes: wallet?.balance_amount ?? 0,
            currency_code: wallet?.currency_code ?? "KES",
        },
        {
            id: "acc-skillsfund-1",
            bucket: "skills_fund",
            label: "County Skills Fund — 2026 Cohort",
            balance_kes: 0,
            funder: "Nairobi County Government",
            expires_at: daysFromNow(120),
            permitted_purpose: "Courses, assessments & certifications only",
        },
        {
            id: "acc-skillsfund-2",
            bucket: "skills_fund",
            label: "Elimika Bootcamp Grant",
            balance_kes: 0,
            funder: "Mastercard Foundation",
            expires_at: daysFromNow(-10),
            permitted_purpose: "Courses, assessments & certifications only",
        },
        {
            id: "acc-marketplace",
            bucket: "marketplace_credits",
            label: "Marketplace Credits",
            balance_kes: 0,
        },
        {
            id: "acc-rewards",
            bucket: "rewards",
            label: "Rewards Balance",
            balance_kes: 0,
        },
        {
            id: "acc-refunds",
            bucket: "refunds",
            label: "Refund Balance",
            balance_kes: 0,
        },
    ];
}

function uid(prefix: string) {
    return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function balanceBreakdown(accounts: WalletAccount[]) {
    const now = Date.now();
    let available = 0;
    let restricted = 0;
    let expired = 0;
    for (const a of accounts) {
        const isExpired = !!a.expires_at && new Date(a.expires_at).getTime() < now;
        if (isExpired) {
            expired += a.balance_kes;
            continue;
        }
        if (BUCKET_RULES[a.bucket]?.restricted) restricted += a.balance_kes;
        else available += a.balance_kes;
    }
    return { available, restricted, expired, total: available + restricted + expired };
}

export function checkBucketRule(bucket: Bucket, itemType: string, account?: WalletAccount) {
    const rule = BUCKET_RULES[bucket];
    if (!rule) return { allowed: true, reason: "Usable for any Elimika payment" };
    const isExpired = !!account?.expires_at && new Date(account.expires_at).getTime() < Date.now();
    if (isExpired) return { allowed: false, reason: "This allocation has expired" };
    const allowed = rule.allowed.includes(itemType);
    return { allowed, reason: allowed ? rule.purpose : `Not permitted for ${itemType.toLowerCase()} — ${rule.purpose}` };
}

export function validatePayment(opts: { itemType: string; method: PaymentMethod; amount: number; available: number; account: WalletAccount | null }) {
    const { amount, available, account, itemType } = opts;
    if (!amount || amount <= 0) return { ok: false, message: "Enter an amount greater than zero." };
    if (!account) return { ok: false, message: "Choose a source account with a permitted balance." };
    const rule = checkBucketRule(account.bucket, itemType, account);
    if (!rule.allowed) return { ok: false, message: rule.reason };
    if (amount > available) return { ok: false, message: `Insufficient balance — only ${fmtKES(available)} available.` };
    return { ok: true, message: `Ready to pay ${fmtKES(amount)} from ${account.label}.` };
}


/* =========================================================================
   Wallet context — mock "backend" living in local state
   ========================================================================= */

interface Toast {
    id: string;
    type: "success" | "error";
    message: string;
    description?: string;
}

interface WalletState {
    wallet: Wallet | undefined;
    accounts: WalletAccount[];
    transactions: WalletTransaction[];
    payments: WalletPayment[];
    rewards: WalletReward[];
    statements: WalletStatement[];
    audit: AuditEntry[];
    notify: (t: Omit<Toast, "id">) => void;
    topUp: (amount: number, method: PaymentMethod) => void;
    pay: (opts: { paymentId: string | null; itemType: string; itemName: string; amount: number; method: PaymentMethod; accountId: string; total?: number; alreadyPaid: number }) => void;
    refund: (txn: WalletTransaction) => void;
}

const WalletContext = createContext<WalletState | null>(null);
export function useWallet() {
    const ctx = useContext(WalletContext);
    if (!ctx) throw new Error("useWallet must be used within WalletProvider");
    return ctx;
}

export function WalletProvider({ children }: { children: ReactNode }) {
    const user = useUserProfile()
    const { data: walletResp } = useQuery(
        user?.uuid
            ? {
                ...getWalletOptions({ path: { userUuid: user.uuid } }),
                enabled: true,
            }
            : {
                queryKey: ["wallet", "disabled"] as const,
                queryFn: async () => undefined,
                enabled: false,
            },
    )
    const wallet = walletResp?.data

    const { data: transactionsResp } = useQuery(
        user?.uuid
            ? {
                ...listTransactions1Options({
                    path: { userUuid: user.uuid },
                    query: { pageable: { size: 20 }, currency_code: "KES" }
                }),
                enabled: true,
            }
            : {
                queryKey: ["wallet-transactions", "disabled"] as const,
                queryFn: async () => undefined,
                enabled: false,
            },
    )
    const transactions = transactionsResp?.data?.content ?? []


    const accounts = useMemo<WalletAccount[]>(() => buildWalletAccounts(wallet), [wallet]);  // seedAccounts

    const [payments, setPayments] = useState<WalletPayment[]>([]); // seedPayments
    const [rewards] = useState<WalletReward[]>([]); // seedRewards
    const [statements] = useState<WalletStatement[]>([]); //seedStatements
    const [audit, setAudit] = useState<AuditEntry[]>([]); // seedAudit
    const [toasts, setToasts] = useState<Toast[]>([]);

    function notify(t: Omit<Toast, "id">) {
        const id = uid("toast");
        setToasts((prev) => [...prev, { ...t, id }]);
        setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4000);
    }

    function pushAudit(entry: Omit<AuditEntry, "id" | "created_at" | "actor_role">) {
        setAudit((prev) => [{ id: uid("aud"), created_at: new Date().toISOString(), actor_role: "student", ...entry }, ...prev]);
    }

    function topUp(amount: number, method: PaymentMethod) {
        pushAudit({
            event_type: "top_up",
            entity_type: "wallet_transaction",
            reason: `Top-up of ${fmtKES(amount)} via ${METHOD_LABEL[method]}`,
            updated_values: { amount_kes: amount, method },
        });
        notify({ type: "success", message: "Top-up received", description: `${fmtKES(amount)} via ${METHOD_LABEL[method]}` });
    }

    function pay(opts: { paymentId: string | null; itemType: string; itemName: string; amount: number; method: PaymentMethod; accountId: string; total?: number; alreadyPaid: number }) {
        const account = accounts.find((a) => a.id === opts.accountId);
        if (!account) return;

        if (opts.paymentId) {
            setPayments((prev) =>
                prev.map((p) => {
                    if (p.id !== opts.paymentId) return p;
                    const newPaid = opts.alreadyPaid + opts.amount;
                    return {
                        ...p,
                        amount_paid_kes: newPaid,
                        status: newPaid >= p.amount_kes ? "completed" : "pending",
                        method: opts.method,
                    };
                }),
            );
        } else {
            setPayments((prev) => [
                {
                    id: uid("pay"),
                    item_name: opts.itemName,
                    item_type: opts.itemType,
                    amount_kes: opts.amount,
                    amount_paid_kes: opts.amount,
                    due_at: new Date().toISOString(),
                    status: "completed",
                    partial_allowed: false,
                    method: opts.method,
                },
                ...prev,
            ]);
        }

        pushAudit({
            event_type: "payment_completed",
            entity_type: "wallet_payment",
            reason: `Paid ${fmtKES(opts.amount)} for ${opts.itemName} from ${account.label}`,
            updated_values: { amount_kes: opts.amount, account: account.label, method: opts.method },
        });
        notify({ type: "success", message: "Payment confirmed", description: `${fmtKES(opts.amount)} from ${account.label}` });
    }

    function refund(txn: WalletTransaction) {
        pushAudit({
            event_type: "refund_issued",
            entity_type: "wallet_transaction",
            reason: `Refund requested for ${txn.description ?? txn.reference ?? txn.uuid ?? "wallet transaction"}`,
            updated_values: {
                transaction_uuid: txn.uuid,
                transaction_type: txn.transaction_type,
                reference: txn.reference,
            },
        });
        notify({
            type: "success",
            message: "Refund recorded",
            description: txn.reference ? `Linked to ${txn.reference}` : undefined,
        });
    }

    const value: WalletState = { wallet, accounts, transactions, payments, rewards, statements, audit, notify, topUp, pay, refund };

    return (
        <WalletContext.Provider value={value}>
            {children}
            <ToastStack toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
        </WalletContext.Provider>
    );
}

function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
    if (toasts.length === 0) return null;
    return (
        <div className="fixed bottom-4 right-4 z-[100] flex w-80 flex-col gap-2">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={`rounded-lg border p-3 shadow-lg text-sm bg-background ${t.type === "success" ? "border-success/30" : "border-destructive/30"
                        }`}
                >
                    <div className="flex items-start justify-between gap-2">
                        <p className={`font-medium ${t.type === "success" ? "text-success" : "text-destructive"}`}>{t.message}</p>
                        <button onClick={() => onDismiss(t.id)} className="text-muted-foreground hover:text-foreground">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                    {t.description && <p className="text-xs text-muted-foreground mt-1">{t.description}</p>}
                </div>
            ))}
        </div>
    );
}

/* =========================================================================
   Shared small components
   ========================================================================= */

function StatusBadge({ status }: { status: string }) {
    return (
        <Badge variant="outline" className={STATUS_TINT[status] ?? ""}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
    );
}

export function TxnRow({ txn, action, tab }: { txn: WalletTransaction; action?: ReactNode, tab?: string }) {
    const transactionType = txn.transaction_type ?? "UNKNOWN";
    const credit = ["DEPOSIT", "PAYMENT", "SALE", "TRANSFER_IN"].includes(transactionType);

    return (
        <div className="flex items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-3 min-w-0">
                <span
                    className={`h-8 w-8 shrink-0 rounded-full grid place-items-center ${credit ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                        }`}
                >
                    {credit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                </span>
                <div className="flex flex-col min-w-0 gap-1.5">
                    <p className="text-sm font-medium truncate">{txn.description ?? transactionType}</p>
                    <p className="text-xs text-muted-foreground truncate">
                        {fmtDateTime(txn.created_date)} · {transactionType.replace(/_/g, " ").toLowerCase()} · {txn.reference ?? "—"}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <div className="flex flex-col gap-1.5 text-right">
                    <p className={`text-sm font-semibold ${credit ? "text-success" : ""}`}>
                        {credit ? "+" : "−"} {fmtMoney(txn.amount ?? 0, txn.currency_code ?? "KES")}
                    </p>
                    <StatusBadge status={transactionType} />
                </div>
                {action}
            </div>
        </div>
    );
}

export interface WalletDashboardTabProps {
    onNavigate: (tab: TabId) => void;
    wallet: Wallet | undefined
    transactions: WalletTransaction[] | undefined
}

export interface WalletTabProps {
    wallet: Wallet | undefined
    transactions: WalletTransaction[] | undefined
}

export function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
    const lines = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export function WalletShell({
    title = "Student Wallet",
    description = "Personal funds, Skills Fund balances, rewards, refunds and marketplace credits",
    initialTab = "dashboard",
}: {
    title?: string;
    description?: string;
    initialTab?: WalletTabId;
}) {
    const [tab, setTab] = useState<WalletTabId>(initialTab);
    const { wallet, accounts, transactions } = useWallet()

    return (
        <div className="p-4 md:p-6 space-y-5">
            <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-xl md:text-2xl font-semibold flex items-center gap-2">
                        <WalletIcon className="h-5 w-5 text-primary" /> {title}
                    </h1>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
            </header>

            <div className="-mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto">
                <div className="flex gap-2 min-w-max pb-1">
                    {TABS.map((t) => {
                        const active = t.id === tab;
                        return (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm whitespace-nowrap transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground hover:bg-muted border-border"
                                    }`}
                            >
                                <t.icon className="h-3.5 w-3.5" />
                                {t.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {tab === "dashboard" && <DashboardTab onNavigate={setTab} wallet={wallet} transactions={transactions} />}
            {tab === "accounts" && <AccountsTab wallet={wallet} transactions={transactions} />}
            {tab === "payments" && <PaymentsTab />}
            {tab === "top-up" && <TopUpTab />}
            {tab === "transactions" && <TransactionsTab />}
            {tab === "refunds" && <RefundsTab />}
            {tab === "rewards" && <RewardsTab />}
            {tab === "statements" && <StatementsTab />}
            {tab === "audit" && <AuditTab />}
        </div>
    );
}

const StudentWalletPage = () => {
    return (
        <WalletProvider>
            <WalletShell />
        </WalletProvider>
    );
};

export default StudentWalletPage;
