'use client'

import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import {
    AlertTriangle,
    ArrowDownLeft,
    ArrowLeftRight,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    CreditCard,
    Download,
    FileText,
    Gift,
    Landmark,
    LayoutDashboard,
    Lock,
    PlusCircle,
    ShieldCheck,
    Undo2,
    Wallet as WalletIcon,
    X,
} from "lucide-react";

/* =========================================================================
   Types
   ========================================================================= */

type Bucket = "personal" | "skills_fund" | "rewards" | "marketplace_credits" | "refunds";
type PaymentMethod = "personal_wallet" | "skills_fund" | "rewards" | "mobile_money" | "card" | "bank";
type TxnStatus = "pending" | "completed" | "failed" | "reversed" | "refunded";

interface WalletAccount {
    id: string;
    bucket: Bucket;
    label: string;
    balance_kes: number;
    funder?: string;
    expires_at?: string | null;
    permitted_purpose?: string;
}

interface WalletTransaction {
    id: string;
    description: string;
    amount_kes: number;
    direction: "credit" | "debit";
    bucket: Bucket;
    status: TxnStatus;
    occurred_at: string;
    reference: string;
    source?: string;
    destination?: string;
    funding_source?: string;
    method?: PaymentMethod;
    item_type?: string;
}

interface WalletPayment {
    id: string;
    item_name: string;
    item_type: string;
    amount_kes: number;
    amount_paid_kes: number;
    due_at: string;
    status: TxnStatus;
    partial_allowed: boolean;
    method?: PaymentMethod;
}

interface WalletReward {
    id: string;
    kind: string;
    title: string;
    amount_kes: number;
    earned_at: string;
    expires_at?: string | null;
}

interface WalletStatement {
    id: string;
    kind: string;
    label: string;
    period_start: string;
    period_end: string;
    total_in_kes: number;
    total_out_kes: number;
}

interface AuditEntry {
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

const PAYABLE_ITEMS = [
    "Course",
    "Class",
    "Assessment",
    "Certification",
    "Marketplace Item",
    "Equipment",
    "Competition",
    "Ticket",
] as const;

const BUCKET_META: Record<Bucket, { label: string; hint: string }> = {
    personal: { label: "Personal Wallet", hint: "Your own funds — no restrictions" },
    skills_fund: { label: "Skills Fund", hint: "Funder-allocated learning credit" },
    rewards: { label: "Rewards", hint: "Earned credits from learning & referrals" },
    marketplace_credits: { label: "Marketplace Credits", hint: "For equipment and marketplace items" },
    refunds: { label: "Refund Balance", hint: "Landed here when the original bucket expired" },
};

const BUCKET_RULES: Partial<Record<Bucket, { restricted: boolean; purpose: string; allowed: string[] }>> = {
    skills_fund: {
        restricted: true,
        purpose: "Courses, assessments & certifications only",
        allowed: ["Course", "Assessment", "Certification"],
    },
    marketplace_credits: {
        restricted: true,
        purpose: "Marketplace items & equipment only",
        allowed: ["Marketplace Item", "Equipment"],
    },
};

const METHOD_LABEL: Record<PaymentMethod, string> = {
    personal_wallet: "Personal Wallet",
    skills_fund: "Skills Fund",
    rewards: "Rewards",
    mobile_money: "Mobile Money",
    card: "Card",
    bank: "Bank Transfer",
};

const PAY_METHODS: PaymentMethod[] = ["personal_wallet", "skills_fund", "rewards"];
const TOPUP_METHODS: PaymentMethod[] = ["mobile_money", "card", "bank"];

const STATUS_TINT: Record<string, string> = {
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

type TabId = (typeof TABS)[number]["id"];

/* =========================================================================
   Formatting helpers
   ========================================================================= */

function fmtKES(value: number | string) {
    const n = Number(value ?? 0);
    return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);
}
function fmtDate(iso?: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}
function fmtDateTime(iso?: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("en-KE", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}
function daysFromNow(days: number) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString();
}
function uid(prefix: string) {
    return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function balanceBreakdown(accounts: WalletAccount[]) {
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

function checkBucketRule(bucket: Bucket, itemType: string, account?: WalletAccount) {
    const rule = BUCKET_RULES[bucket];
    if (!rule) return { allowed: true, reason: "Usable for any Elimika payment" };
    const isExpired = !!account?.expires_at && new Date(account.expires_at).getTime() < Date.now();
    if (isExpired) return { allowed: false, reason: "This allocation has expired" };
    const allowed = rule.allowed.includes(itemType);
    return { allowed, reason: allowed ? rule.purpose : `Not permitted for ${itemType.toLowerCase()} — ${rule.purpose}` };
}

function validatePayment(opts: { itemType: string; method: PaymentMethod; amount: number; available: number; account: WalletAccount | null }) {
    const { amount, available, account, itemType } = opts;
    if (!amount || amount <= 0) return { ok: false, message: "Enter an amount greater than zero." };
    if (!account) return { ok: false, message: "Choose a source account with a permitted balance." };
    const rule = checkBucketRule(account.bucket, itemType, account);
    if (!rule.allowed) return { ok: false, message: rule.reason };
    if (amount > available) return { ok: false, message: `Insufficient balance — only ${fmtKES(available)} available.` };
    return { ok: true, message: `Ready to pay ${fmtKES(amount)} from ${account.label}.` };
}

/* =========================================================================
   Mock data seed
   ========================================================================= */

function seedAccounts(): WalletAccount[] {
    return [
        { id: "acc-personal", bucket: "personal", label: "Personal Wallet", balance_kes: 8400 },
        {
            id: "acc-skillsfund-1",
            bucket: "skills_fund",
            label: "County Skills Fund — 2026 Cohort",
            balance_kes: 24000,
            funder: "Nairobi County Government",
            expires_at: daysFromNow(120),
            permitted_purpose: "Courses, assessments & certifications only",
        },
        {
            id: "acc-skillsfund-2",
            bucket: "skills_fund",
            label: "Elimika Bootcamp Grant",
            balance_kes: 3200,
            funder: "Mastercard Foundation",
            expires_at: daysFromNow(-10),
            permitted_purpose: "Courses, assessments & certifications only",
        },
        { id: "acc-marketplace", bucket: "marketplace_credits", label: "Marketplace Credits", balance_kes: 1500 },
        { id: "acc-rewards", bucket: "rewards", label: "Rewards Balance", balance_kes: 2650 },
        { id: "acc-refunds", bucket: "refunds", label: "Refund Balance", balance_kes: 0 },
    ];
}

function seedTransactions(): WalletTransaction[] {
    return [
        {
            id: "txn-1",
            description: "Python for Data Science — course fee",
            amount_kes: 4500,
            direction: "debit",
            bucket: "skills_fund",
            status: "completed",
            occurred_at: daysFromNow(-2),
            reference: "TXN-88213",
            source: "County Skills Fund — 2026 Cohort",
            destination: "Elimika Courses",
            funding_source: "Nairobi County Government",
            method: "skills_fund",
            item_type: "Course",
        },
        {
            id: "txn-2",
            description: "Top-up via M-Pesa",
            amount_kes: 5000,
            direction: "credit",
            bucket: "personal",
            status: "completed",
            occurred_at: daysFromNow(-5),
            reference: "TXN-88190",
            destination: "Personal Wallet",
            funding_source: "M-Pesa",
            method: "mobile_money",
        },
        {
            id: "txn-3",
            description: "UX Design Certification exam fee",
            amount_kes: 1800,
            direction: "debit",
            bucket: "personal",
            status: "completed",
            occurred_at: daysFromNow(-7),
            reference: "TXN-88102",
            source: "Personal Wallet",
            destination: "Elimika Assessments",
            funding_source: "Personal Wallet",
            method: "personal_wallet",
            item_type: "Certification",
        },
        {
            id: "txn-4",
            description: "Referral bonus — Amina J.",
            amount_kes: 500,
            direction: "credit",
            bucket: "rewards",
            status: "completed",
            occurred_at: daysFromNow(-9),
            reference: "TXN-88066",
            destination: "Rewards Balance",
            funding_source: "Elimika Rewards",
        },
        {
            id: "txn-5",
            description: "Robotics starter kit",
            amount_kes: 3200,
            direction: "debit",
            bucket: "marketplace_credits",
            status: "pending",
            occurred_at: daysFromNow(-1),
            reference: "TXN-88240",
            source: "Marketplace Credits",
            destination: "Elimika Marketplace",
            funding_source: "Marketplace Credits",
            method: "personal_wallet",
            item_type: "Equipment",
        },
    ];
}

function seedPayments(): WalletPayment[] {
    return [
        {
            id: "pay-1",
            item_name: "Advanced React Bootcamp",
            item_type: "Course",
            amount_kes: 12000,
            amount_paid_kes: 4000,
            due_at: daysFromNow(6),
            status: "pending",
            partial_allowed: true,
        },
        {
            id: "pay-2",
            item_name: "National Coding Competition — entry ticket",
            item_type: "Ticket",
            amount_kes: 1500,
            amount_paid_kes: 0,
            due_at: daysFromNow(3),
            status: "pending",
            partial_allowed: false,
        },
        {
            id: "pay-3",
            item_name: "AWS Cloud Practitioner Certification",
            item_type: "Certification",
            amount_kes: 6000,
            amount_paid_kes: 6000,
            due_at: daysFromNow(-4),
            status: "completed",
            partial_allowed: false,
            method: "skills_fund",
        },
    ];
}

function seedRewards(): WalletReward[] {
    return [
        { id: "rw-1", kind: "Learning Reward", title: "Completed 5 courses this quarter", amount_kes: 800, earned_at: daysFromNow(-14) },
        { id: "rw-2", kind: "Referral Bonus", title: "Referred Amina J.", amount_kes: 500, earned_at: daysFromNow(-9) },
        { id: "rw-3", kind: "Competition Prize", title: "2nd place — Regional Hackathon", amount_kes: 1000, earned_at: daysFromNow(-30) },
        { id: "rw-4", kind: "Promotional Credit", title: "New cohort welcome bonus", amount_kes: 250, earned_at: daysFromNow(-60), expires_at: daysFromNow(30) },
        { id: "rw-5", kind: "Cashback", title: "Marketplace purchase cashback", amount_kes: 100, earned_at: daysFromNow(-3) },
    ];
}

function seedStatements(): WalletStatement[] {
    return [
        { id: "st-1", kind: "Monthly Statement", label: "July 2026", period_start: daysFromNow(-31), period_end: daysFromNow(-1), total_in_kes: 5500, total_out_kes: 10000 },
        { id: "st-2", kind: "Monthly Statement", label: "June 2026", period_start: daysFromNow(-61), period_end: daysFromNow(-31), total_in_kes: 3200, total_out_kes: 6400 },
    ];
}

function seedAudit(): AuditEntry[] {
    return [
        {
            id: "aud-1",
            event_type: "payment_completed",
            entity_type: "wallet_payment",
            actor_role: "student",
            reason: "Paid AWS Cloud Practitioner Certification from Skills Fund",
            created_at: daysFromNow(-4),
            previous_values: { status: "pending" },
            updated_values: { status: "completed" },
        },
        {
            id: "aud-2",
            event_type: "top_up",
            entity_type: "wallet_transaction",
            actor_role: "student",
            reason: "Top-up via M-Pesa",
            created_at: daysFromNow(-5),
            previous_values: { balance_kes: 3400 },
            updated_values: { balance_kes: 8400 },
        },
    ];
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
function useWallet() {
    const ctx = useContext(WalletContext);
    if (!ctx) throw new Error("useWallet must be used within WalletProvider");
    return ctx;
}

function WalletProvider({ children }: { children: ReactNode }) {
    const [accounts, setAccounts] = useState<WalletAccount[]>(seedAccounts);
    const [transactions, setTransactions] = useState<WalletTransaction[]>(seedTransactions);
    const [payments, setPayments] = useState<WalletPayment[]>(seedPayments);
    const [rewards] = useState<WalletReward[]>(seedRewards);
    const [statements] = useState<WalletStatement[]>(seedStatements);
    const [audit, setAudit] = useState<AuditEntry[]>(seedAudit);
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
        const ref = `TXN-${Math.floor(Math.random() * 90000 + 10000)}`;
        setAccounts((prev) => prev.map((a) => (a.bucket === "personal" ? { ...a, balance_kes: a.balance_kes + amount } : a)));
        setTransactions((prev) => [
            {
                id: uid("txn"),
                description: `Top-up via ${METHOD_LABEL[method]}`,
                amount_kes: amount,
                direction: "credit",
                bucket: "personal",
                status: "completed",
                occurred_at: new Date().toISOString(),
                reference: ref,
                destination: "Personal Wallet",
                funding_source: METHOD_LABEL[method],
                method,
            },
            ...prev,
        ]);
        pushAudit({
            event_type: "top_up",
            entity_type: "wallet_transaction",
            reason: `Top-up of ${fmtKES(amount)} via ${METHOD_LABEL[method]}`,
            updated_values: { amount_kes: amount, method },
        });
        notify({ type: "success", message: `Top-up received — ${ref}` });
    }

    function pay(opts: { paymentId: string | null; itemType: string; itemName: string; amount: number; method: PaymentMethod; accountId: string; total?: number; alreadyPaid: number }) {
        const account = accounts.find((a) => a.id === opts.accountId);
        if (!account) return;
        const ref = `TXN-${Math.floor(Math.random() * 90000 + 10000)}`;

        setAccounts((prev) => prev.map((a) => (a.id === account.id ? { ...a, balance_kes: a.balance_kes - opts.amount } : a)));

        setTransactions((prev) => [
            {
                id: uid("txn"),
                description: `${opts.itemName} — ${opts.itemType.toLowerCase()} fee`,
                amount_kes: opts.amount,
                direction: "debit",
                bucket: account.bucket,
                status: "completed",
                occurred_at: new Date().toISOString(),
                reference: ref,
                source: account.label,
                destination: "Elimika",
                funding_source: account.label,
                method: opts.method,
                item_type: opts.itemType,
            },
            ...prev,
        ]);

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
            updated_values: { amount_kes: opts.amount, account: account.label, reference: ref },
        });
        notify({ type: "success", message: `Payment confirmed — ${ref}` });
    }

    function refund(txn: WalletTransaction) {
        const originAccount = accounts.find((a) => a.label === txn.source || a.bucket === txn.bucket);
        const isExpired = !!originAccount?.expires_at && new Date(originAccount.expires_at).getTime() < Date.now();
        const routeAccount = isExpired ? accounts.find((a) => a.bucket === "refunds") : originAccount;
        if (!routeAccount) return;
        const ref = `RFD-${Math.floor(Math.random() * 90000 + 10000)}`;
        const restricted = !!BUCKET_RULES[routeAccount.bucket]?.restricted;

        setAccounts((prev) => prev.map((a) => (a.id === routeAccount.id ? { ...a, balance_kes: a.balance_kes + txn.amount_kes } : a)));
        setTransactions((prev) => [
            {
                id: uid("txn"),
                description: `Refund — ${txn.description}`,
                amount_kes: txn.amount_kes,
                direction: "credit",
                bucket: routeAccount.bucket,
                status: "refunded",
                occurred_at: new Date().toISOString(),
                reference: ref,
                destination: routeAccount.label,
                funding_source: routeAccount.label,
            },
            ...prev.map((t) => (t.id === txn.id ? { ...t, status: "refunded" as TxnStatus } : t)),
        ]);

        pushAudit({
            event_type: "refund_issued",
            entity_type: "wallet_transaction",
            reason: `Refunded ${fmtKES(txn.amount_kes)} to ${routeAccount.label}${isExpired ? " (re-routed — original allocation expired)" : ""}`,
            updated_values: { reference: ref, to_bucket: routeAccount.bucket, restricted },
        });
        notify({
            type: "success",
            message: `Refunded ${fmtKES(txn.amount_kes)} to ${routeAccount.label}`,
            description: isExpired ? "Original allocation had expired, so funds were re-routed." : undefined,
        });
    }

    const value: WalletState = { accounts, transactions, payments, rewards, statements, audit, notify, topUp, pay, refund };

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

function TxnRow({ txn, action }: { txn: WalletTransaction; action?: ReactNode }) {
    const credit = txn.direction === "credit";
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
                    <p className="text-sm font-medium truncate">{txn.description}</p>
                    <p className="text-xs text-muted-foreground truncate">
                        {fmtDate(txn.occurred_at)} · {BUCKET_META[txn.bucket]?.label} · {txn.reference}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <div className="flex flex-col gap-1.5 text-right">
                    <p className={`text-sm font-semibold ${credit ? "text-success" : ""}`}>
                        {credit ? "+" : "−"} {fmtKES(txn.amount_kes)}
                    </p>
                    <StatusBadge status={txn.status} />
                </div>
                {action}
            </div>
        </div>
    );
}

/* =========================================================================
   Dashboard tab
   ========================================================================= */
function DashboardTab({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
    const { accounts, transactions, payments } = useWallet();
    const breakdown = balanceBreakdown(accounts);
    const rewardsTotal = accounts.filter((a) => a.bucket === "rewards").reduce((s, a) => s + a.balance_kes, 0);
    const pendingPayments = payments.filter((p) => p.status === "pending");
    const pendingTotal = pendingPayments.reduce((s, p) => s + (p.amount_kes - p.amount_paid_kes), 0);
    const lowBalance = breakdown.available < 5000;

    const stats = [
        { label: "Available balance", value: fmtKES(breakdown.available), hint: "Spendable on anything", tone: "primary" },
        { label: "Restricted balance", value: fmtKES(breakdown.restricted), hint: "Skills Fund & marketplace credits — permitted purposes only", tone: "muted" },
        { label: "Rewards", value: fmtKES(rewardsTotal), hint: "Earned credits", tone: "muted" },
        { label: "Pending payments", value: fmtKES(pendingTotal), hint: `${pendingPayments.length} awaiting settlement`, tone: "muted" },
    ];

    return (
        <div className="space-y-5">
            {lowBalance && (
                <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>Low balance alert — your unrestricted balance is below KES 5,000. Top up to avoid missed payments.</span>
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((s) => (
                    <Card key={s.label} className={s.tone === "primary" ? "rounded-md bg-gradient-to-br from-primary to-accent text-primary-foreground border-0" : "rounded-md"}>
                        <CardHeader className="pb-0">
                            <CardDescription className={s.tone === "primary" ? "text-primary-foreground/80" : ""}>{s.label}</CardDescription>
                            <CardTitle className="text-2xl">{s.value}</CardTitle>
                        </CardHeader>
                        <CardContent className={`text-[11px] ${s.tone === "primary" ? "text-primary-foreground/85" : "text-muted-foreground"}`}>{s.hint}</CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader className="w-full flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-base">Recent transactions</CardTitle>
                        <button onClick={() => onNavigate("transactions")} className="text-xs text-primary">View all</button>
                    </CardHeader>
                    <CardContent className="divide-y">
                        {transactions.slice(0, 6).map((t) => (
                            <TxnRow key={t.id} txn={t} />
                        ))}
                        {transactions.length === 0 && <p className="py-6 text-sm text-muted-foreground">No transactions yet.</p>}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-base">Upcoming payments</CardTitle>
                        <button onClick={() => onNavigate("payments")} className="text-xs text-primary">Manage</button>
                    </CardHeader>
                    <CardContent className="divide-y">
                        {pendingPayments.slice(0, 6).map((p) => (
                            <div key={p.id} className="flex items-center justify-between gap-3 py-3">
                                <div className="flex flex-col gap-1.5 min-w-0">
                                    <p className="text-sm font-medium truncate">{p.item_name}</p>
                                    <p className="text-xs text-muted-foreground">{p.item_type} · due {fmtDate(p.due_at)}</p>
                                </div>
                                <div className="flex flex-col gap-1.5 text-right">
                                    <p className="text-sm font-semibold">{fmtKES(p.amount_kes - p.amount_paid_kes)}</p>
                                    <p className="text-[11px] text-muted-foreground">{p.method ? METHOD_LABEL[p.method] : "Method not set"}</p>
                                </div>
                            </div>
                        ))}
                        {pendingPayments.length === 0 && <p className="py-6 text-sm text-muted-foreground">Nothing due — you're all settled.</p>}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

/* =========================================================================
   Accounts tab
   ========================================================================= */
function AccountsTab() {
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
                        <p className="text-2xl font-semibold text-success">{fmtKES(breakdown.available)}</p>
                        <p className="text-xs text-muted-foreground">No purpose restrictions</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="-mb-2">
                        <CardDescription>Restricted</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold text-warning">{fmtKES(breakdown.restricted)}</p>
                        <p className="text-xs text-muted-foreground">Usable only for permitted purposes</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="-mb-2">
                        <CardDescription>Total wallet value</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold">{fmtKES(breakdown.total)}</p>
                        <p className="text-xs text-muted-foreground">
                            {breakdown.expired > 0 ? `${fmtKES(breakdown.expired)} expired` : "Nothing expired"}
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
                                <p className={`text-2xl font-semibold ${expired ? "line-through text-muted-foreground" : ""}`}>{fmtKES(a.balance_kes)}</p>
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

/* =========================================================================
   Payments tab
   ========================================================================= */

function PaymentsTab() {
    const { payments, accounts } = useWallet();
    const [target, setTarget] = useState<WalletPayment | null>(null);
    const [adhoc, setAdhoc] = useState(false);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                    Pay for courses, classes, assessments, certifications, marketplace items, equipment, competitions and tickets.
                </p>
                <Button size="sm" onClick={() => setAdhoc(true)}>
                    <CreditCard className="h-4 w-4 mr-1.5" /> New payment
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {payments.map((p) => {
                    const outstanding = p.amount_kes - p.amount_paid_kes;
                    const pct = Math.round((p.amount_paid_kes / p.amount_kes) * 100);
                    return (
                        <Card key={p.id}>
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <CardDescription>{p.item_type}</CardDescription>
                                        <CardTitle className="text-base truncate">{p.item_name}</CardTitle>
                                    </div>
                                    <StatusBadge status={p.status} />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Outstanding</span>
                                    <span className="font-semibold">{fmtKES(outstanding)}</span>
                                </div>
                                {p.amount_paid_kes > 0 && (
                                    <div className="space-y-1">
                                        <Progress value={pct} className="h-1.5" />
                                        <p className="text-[11px] text-muted-foreground">{fmtKES(p.amount_paid_kes)} of {fmtKES(p.amount_kes)} paid</p>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Due {fmtDate(p.due_at)}</span>
                                    {p.partial_allowed && <Badge variant="outline">Partial payments allowed</Badge>}
                                </div>
                                <Button size="sm" className="w-full" disabled={p.status === "completed"} onClick={() => setTarget(p)}>
                                    {p.status === "completed" ? (<><CheckCircle2 className="h-4 w-4 mr-1.5" /> Settled</>) : "Pay now"}
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <PayDialog
                open={!!target || adhoc}
                payment={target}
                accounts={accounts}
                onClose={() => { setTarget(null); setAdhoc(false); }}
            />
        </div>
    );
}

function PayDialog({ open, payment, accounts, onClose }: { open: boolean; payment: WalletPayment | null; accounts: WalletAccount[]; onClose: () => void }) {
    const { pay } = useWallet();
    const outstanding = payment ? payment.amount_kes - payment.amount_paid_kes : 0;
    const [amount, setAmount] = useState("");
    const [method, setMethod] = useState<PaymentMethod>("personal_wallet");
    const [itemType, setItemType] = useState<string>("Course");
    const [itemName, setItemName] = useState("");
    const [accountId, setAccountId] = useState<string>("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!open) return;
        setAmount(payment ? String(outstanding) : "");
        setMethod(payment?.method ?? "personal_wallet");
        setItemType(payment?.item_type ?? "Course");
        setItemName(payment?.item_name ?? "");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, payment?.id]);

    const byMethodBuckets: Partial<Record<PaymentMethod, Bucket[]>> = {
        personal_wallet: ["personal", "refunds", "marketplace_credits"],
        skills_fund: ["skills_fund"],
        rewards: ["rewards"],
    };

    const eligible = useMemo(() => {
        const buckets = byMethodBuckets[method];
        if (!buckets) return [];
        return accounts.filter((a) => buckets.includes(a.bucket) && checkBucketRule(a.bucket, itemType, a).allowed);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accounts, method, itemType]);

    const blockedSources = useMemo(
        () => accounts.map((a) => ({ a, rule: checkBucketRule(a.bucket, itemType, a) })).filter((x) => !x.rule.allowed && x.a.balance_kes > 0),
        [accounts, itemType],
    );

    useEffect(() => {
        setAccountId(eligible[0]?.id ?? "");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [method, itemType, eligible.length]);

    const account = accounts.find((a) => a.id === accountId) ?? null;
    const available = account ? account.balance_kes : Infinity;
    const numeric = Number(amount || 0);
    const check = validatePayment({ itemType, method, amount: numeric, available, account });
    const partial = payment ? numeric < outstanding : false;

    async function submit() {
        if (!check.ok || !account) return;
        if (partial && !payment?.partial_allowed) return;
        setBusy(true);
        pay({
            paymentId: payment?.id ?? null,
            itemType,
            itemName: itemName || itemType,
            amount: numeric,
            method,
            accountId: account.id,
            total: payment?.amount_kes,
            alreadyPaid: payment?.amount_paid_kes ?? 0,
        });
        setBusy(false);
        onClose();
    }

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Make a payment</DialogTitle>
                    <DialogDescription>The rules engine validates Skills Fund restrictions before funds are reserved.</DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                    {!payment && (
                        <>
                            <div className="space-y-1.5">
                                <Label>What are you paying for?</Label>
                                <Select value={itemType} onValueChange={setItemType}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {PAYABLE_ITEMS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Item name</Label>
                                <Input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g. Python for Data Science" />
                            </div>
                        </>
                    )}

                    <div className="space-y-1.5">
                        <Label>Payment method</Label>
                        <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {PAY_METHODS.map((m) => <SelectItem key={m} value={m}>{METHOD_LABEL[m]}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    {eligible.length > 0 ? (
                        <div className="space-y-1.5">
                            <Label>Source account</Label>
                            <Select value={accountId} onValueChange={setAccountId}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {eligible.map((a) => <SelectItem key={a.id} value={a.id}>{a.label} — {fmtKES(a.balance_kes)}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            {account && (
                                <p className="text-[11px] text-muted-foreground">{checkBucketRule(account.bucket, itemType, account).reason}</p>
                            )}
                        </div>
                    ) : (
                        <p className="rounded-lg border border-warning/30 bg-warning/10 p-2.5 text-xs text-warning">
                            No {METHOD_LABEL[method].toLowerCase()} balance may be used for {itemType.toLowerCase()}.
                        </p>
                    )}

                    {blockedSources.length > 0 && (
                        <div className="rounded-lg border p-2.5 text-[11px] space-y-1">
                            <p className="font-medium text-muted-foreground">Not usable for {itemType.toLowerCase()}</p>
                            {blockedSources.map(({ a, rule }) => (
                                <p key={a.id} className="text-muted-foreground">
                                    <Lock className="inline h-3 w-3 mr-1 -mt-0.5" />
                                    {a.label} ({fmtKES(a.balance_kes)}) — {rule.reason}
                                </p>
                            ))}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label>Amount (KES)</Label>
                        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
                        {payment && (
                            <p className="text-[11px] text-muted-foreground">
                                Outstanding {fmtKES(outstanding)}{payment.partial_allowed ? " · partial payments allowed" : " · full payment required"}
                            </p>
                        )}
                    </div>

                    <div className={`rounded-lg border p-2.5 text-xs ${check.ok ? "border-success/30 bg-success/10 text-success" : "border-destructive/30 bg-destructive/10 text-destructive"}`}>
                        {check.message}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={submit} disabled={!check.ok || busy}>{busy ? "Processing…" : `Pay ${fmtKES(numeric)}`}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/* =========================================================================
   Top-up tab
   ========================================================================= */

function TopUpTab() {
    const { topUp } = useWallet();
    const [amount, setAmount] = useState("2000");
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
                            <Button key={v} variant="outline" size="sm" onClick={() => setAmount(String(v))}>{fmtKES(v)}</Button>
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

/* =========================================================================
   Transactions tab
   ========================================================================= */

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

function TransactionsTab() {
    const { transactions, notify } = useWallet();
    const [status, setStatus] = useState("all");
    const [bucket, setBucket] = useState("all");

    const rows = transactions.filter((t) => (status === "all" || t.status === status) && (bucket === "all" || t.bucket === bucket));

    function exportCsv() {
        downloadCsv(
            "elimika-wallet-transactions.csv",
            ["Date", "Description", "Amount", "Direction", "Source", "Destination", "Bucket", "Funding source", "Status", "Reference"],
            rows.map((t) => [
                fmtDateTime(t.occurred_at), t.description, t.amount_kes, t.direction, t.source ?? "", t.destination ?? "",
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
                    <div key={t.id} className="py-3 space-y-1">
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

/* =========================================================================
   Refunds tab
   ========================================================================= */

function RefundsTab() {
    const { transactions, accounts, refund } = useWallet();
    const candidates = transactions.filter((t) => t.direction === "debit" && t.status !== "refunded");
    const refunded = transactions.filter((t) => t.status === "refunded" && t.direction === "credit");
    const breakdown = balanceBreakdown(accounts);
    const [preview, setPreview] = useState<WalletTransaction | null>(null);

    function routeFor(txn: WalletTransaction) {
        const originAccount = accounts.find((a) => a.label === txn.source || a.bucket === txn.bucket);
        const isExpired = !!originAccount?.expires_at && new Date(originAccount.expires_at).getTime() < Date.now();
        const routeAccount = isExpired ? accounts.find((a) => a.bucket === "refunds") : originAccount;
        return {
            account: routeAccount,
            restricted: !!(routeAccount && BUCKET_RULES[routeAccount.bucket]?.restricted),
            rerouted: isExpired,
            reason: isExpired
                ? `${originAccount?.label ?? "The original allocation"} has expired — funds go to your Refund Balance instead.`
                : `Returns to the exact source it was paid from.`,
        };
    }

    return (
        <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2"><CardDescription>Available balance</CardDescription><CardTitle className="text-xl text-success">{fmtKES(breakdown.available)}</CardTitle></CardHeader>
                    <CardContent className="pt-0 text-xs text-muted-foreground">Refunds of unrestricted spend land here</CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardDescription>Restricted balance</CardDescription><CardTitle className="text-xl text-warning">{fmtKES(breakdown.restricted)}</CardTitle></CardHeader>
                    <CardContent className="pt-0 text-xs text-muted-foreground">Skills Fund & marketplace credits keep their funder rules after a refund</CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardDescription>Expired funder balance</CardDescription><CardTitle className="text-xl text-muted-foreground">{fmtKES(breakdown.expired)}</CardTitle></CardHeader>
                    <CardContent className="pt-0 text-xs text-muted-foreground">Refunds to an expired allocation are re-routed to your Refund Balance</CardContent>
                </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Request a refund</CardTitle>
                        <CardDescription>Money always returns to the bucket it was spent from, unless that allocation has expired.</CardDescription>
                    </CardHeader>
                    <CardContent className="divide-y">
                        {candidates.map((t) => {
                            const route = routeFor(t);
                            return (
                                <div key={t.id}>
                                    <TxnRow
                                        txn={t}
                                        action={
                                            <Button size="sm" variant="outline" onClick={() => setPreview(t)}>Preview & refund</Button>
                                        }
                                    />
                                    <div className="flex flex-wrap items-center gap-2 pb-3 text-xs text-muted-foreground">
                                        <Badge variant="outline" className="font-normal">Returns to {route.account?.label ?? "Refund Balance"}</Badge>
                                        <Badge variant="outline" className={route.restricted ? "border-warning/30 bg-warning/10 font-normal text-warning" : "border-success/30 bg-success/10 font-normal text-success"}>
                                            {route.restricted ? "Stays restricted" : "Available to spend"}
                                        </Badge>
                                        {route.rerouted && <span>{route.reason}</span>}
                                    </div>
                                </div>
                            );
                        })}
                        {candidates.length === 0 && <p className="py-6 text-sm text-muted-foreground">No payments available for refund.</p>}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Refund history</CardTitle>
                        <CardDescription>Each refund shows the bucket it was restored to.</CardDescription>
                    </CardHeader>
                    <CardContent className="divide-y">
                        {refunded.map((t) => (
                            <div key={t.id}>
                                <TxnRow txn={t} />
                                <div className="flex flex-wrap items-center gap-2 pb-3 text-xs">
                                    <Badge variant="outline" className="font-normal">{BUCKET_META[t.bucket]?.label ?? t.bucket}</Badge>
                                    <Badge variant="outline" className={BUCKET_RULES[t.bucket]?.restricted ? "border-warning/30 bg-warning/10 font-normal text-warning" : "border-success/30 bg-success/10 font-normal text-success"}>
                                        {BUCKET_RULES[t.bucket]?.restricted ? "Restricted" : "Available"}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                        {refunded.length === 0 && <p className="py-6 text-sm text-muted-foreground">No refunds yet.</p>}
                    </CardContent>
                </Card>
            </div>

            <RefundPreviewDialog txn={preview} onClose={() => setPreview(null)} routeFor={routeFor} onConfirm={(t) => { refund(t); setPreview(null); }} />
        </div>
    );
}

function RefundPreviewDialog({
    txn,
    onClose,
    onConfirm,
    routeFor,
}: {
    txn: WalletTransaction | null;
    onClose: () => void;
    onConfirm: (txn: WalletTransaction) => void;
    routeFor: (txn: WalletTransaction) => { account?: WalletAccount; restricted: boolean; rerouted: boolean; reason: string };
}) {
    if (!txn) return null;
    const route = routeFor(txn);
    return (
        <Dialog open={!!txn} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Refund routing preview</DialogTitle>
                    <DialogDescription>Review exactly which wallet bucket this refund of {fmtKES(txn.amount_kes)} will restore before you confirm.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                    <div className="rounded-lg border p-3 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{txn.description}</p>
                                <p className="text-[11px] text-muted-foreground">Paid from {txn.source ?? BUCKET_META[txn.bucket].label}</p>
                            </div>
                            <span className="text-sm font-semibold text-success whitespace-nowrap">+ {fmtKES(txn.amount_kes)}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            <Badge variant="outline" className="font-normal">{route.account ? BUCKET_META[route.account.bucket].label : "Refund Balance"}</Badge>
                            <Badge variant="outline" className={route.restricted ? "border-warning/30 bg-warning/10 font-normal text-warning" : "border-success/30 bg-success/10 font-normal text-success"}>
                                {route.restricted ? "Restricted" : "Available"}
                            </Badge>
                            {route.rerouted && <Badge variant="outline" className="border-primary/30 bg-primary/10 font-normal text-primary">Re-routed</Badge>}
                        </div>
                        <p className="text-[11px] text-muted-foreground">{route.reason}</p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => onConfirm(txn)}>Confirm refund</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/* =========================================================================
   Rewards tab
   ========================================================================= */

function RewardsTab() {
    const { rewards } = useWallet();
    const total = rewards.reduce((s, r) => s + r.amount_kes, 0);
    const kinds = ["Learning Reward", "Referral Bonus", "Competition Prize", "Promotional Credit", "Cashback"];

    return (
        <div className="space-y-4">
            <Card className="bg-gradient-to-br from-primary to-accent text-primary-foreground border-0">
                <CardHeader className="pb-2">
                    <CardDescription className="text-primary-foreground/80">Total rewards earned</CardDescription>
                    <CardTitle className="text-2xl">{fmtKES(total)}</CardTitle>
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
                                    <Badge variant="secondary">{fmtKES(rows.reduce((s, r) => s + r.amount_kes, 0))}</Badge>
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
                                        <span className="text-sm font-semibold text-success">+ {fmtKES(r.amount_kes)}</span>
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

/* =========================================================================
   Statements tab
   ========================================================================= */

function StatementsTab() {
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
                            <span className="text-success">In {fmtKES(st.total_in_kes)}</span>
                            <span className="text-warning">Out {fmtKES(st.total_out_kes)}</span>
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

/* =========================================================================
   Audit tab
   ========================================================================= */

function AuditTab() {
    const { audit, notify } = useWallet();

    function exportCsv() {
        downloadCsv(
            "elimika-wallet-audit.csv",
            ["Timestamp", "User role", "Event", "Entity", "Reason", "Previous", "Updated"],
            audit.map((r) => [
                fmtDateTime(r.created_at), r.actor_role, r.event_type, r.entity_type ?? "", r.reason ?? "",
                JSON.stringify(r.previous_values ?? {}), JSON.stringify(r.updated_values ?? {}),
            ]),
        );
        notify({ type: "success", message: "Export ready", description: "elimika-wallet-audit.csv downloaded." });
    }

    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                    <CardTitle className="text-base">Financial audit trail</CardTitle>
                    <CardDescription>Immutable log of every wallet event.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4 mr-1.5" /> Export</Button>
            </CardHeader>
            <CardContent className="divide-y">
                {audit.map((r) => (
                    <div key={r.id} className="py-3 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">
                                {r.event_type.replace(/_/g, " ")}{r.entity_type ? ` · ${r.entity_type.replace(/_/g, " ")}` : ""}
                            </p>
                            <span className="text-xs text-muted-foreground">{fmtDateTime(r.created_at)}</span>
                        </div>
                        {r.reason && <p className="text-xs text-muted-foreground">{r.reason}</p>}
                        <p className="text-[11px] text-muted-foreground break-all">
                            Role: {r.actor_role} · Previous: {JSON.stringify(r.previous_values ?? {})} · Updated: {JSON.stringify(r.updated_values ?? {})}
                        </p>
                    </div>
                ))}
                {audit.length === 0 && <p className="py-6 text-sm text-muted-foreground">No audit events yet.</p>}
            </CardContent>
        </Card>
    );
}

/* =========================================================================
   Page shell
   ========================================================================= */

function WalletShell() {
    const [tab, setTab] = useState<TabId>("accounts");

    return (
        <div className="p-4 md:p-6 space-y-5">
            <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-xl md:text-2xl font-semibold flex items-center gap-2">
                        <WalletIcon className="h-5 w-5 text-primary" /> Student Wallet
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Personal funds, Skills Fund balances, rewards, refunds and marketplace credits
                    </p>
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

            {tab === "dashboard" && <DashboardTab onNavigate={setTab} />}
            {tab === "accounts" && <AccountsTab />}
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