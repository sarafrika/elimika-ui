import { WalletTransaction } from "../../../course-creator/revenue/page";
import { AuditEntry, daysFromNow, WalletAccount, WalletPayment, WalletReward, WalletStatement } from "../page";

export type Bucket = "personal" | "skills_fund" | "rewards" | "marketplace_credits" | "refunds";

export const PAYABLE_ITEMS = [
    "Course",
    "Class",
    "Assessment",
    "Certification",
    "Marketplace Item",
    "Equipment",
    "Competition",
    "Ticket",
] as const;

export const BUCKET_META: Record<Bucket, { label: string; hint: string }> = {
    personal: { label: "Personal Wallet", hint: "Your own funds — no restrictions" },
    skills_fund: { label: "Skills Fund", hint: "Funder-allocated learning credit" },
    rewards: { label: "Rewards", hint: "Earned credits from learning & referrals" },
    marketplace_credits: { label: "Marketplace Credits", hint: "For equipment and marketplace items" },
    refunds: { label: "Refund Balance", hint: "Landed here when the original bucket expired" },
};

export const BUCKET_RULES: Partial<Record<Bucket, { restricted: boolean; purpose: string; allowed: string[] }>> = {
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



/* =========================================================================
   Mock data seed
   ========================================================================= */

export function seedAccounts(): WalletAccount[] {
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

export function seedTransactions(): WalletTransaction[] {
    return [
        {
            id: "txn-1",
            description: "Python for Data Science — course fee",
            amount_kes: 4500,
            direction: "debit",
            transaction_type: "TRANSFER_OUT",
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
            transaction_type: "TRANSFER_IN",
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
            transaction_type: "TRANSFER_OUT",
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
            transaction_type: "TRANSFER_IN",
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
            transaction_type: "TRANSFER_OUT",
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

export function seedPayments(): WalletPayment[] {
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

export function seedRewards(): WalletReward[] {
    return [
        { id: "rw-1", kind: "Learning Reward", title: "Completed 5 courses this quarter", amount_kes: 800, earned_at: daysFromNow(-14) },
        { id: "rw-2", kind: "Referral Bonus", title: "Referred Amina J.", amount_kes: 500, earned_at: daysFromNow(-9) },
        { id: "rw-3", kind: "Competition Prize", title: "2nd place — Regional Hackathon", amount_kes: 1000, earned_at: daysFromNow(-30) },
        { id: "rw-4", kind: "Promotional Credit", title: "New cohort welcome bonus", amount_kes: 250, earned_at: daysFromNow(-60), expires_at: daysFromNow(30) },
        { id: "rw-5", kind: "Cashback", title: "Marketplace purchase cashback", amount_kes: 100, earned_at: daysFromNow(-3) },
    ];
}

export function seedStatements(): WalletStatement[] {
    return [
        { id: "st-1", kind: "Monthly Statement", label: "July 2026", period_start: daysFromNow(-31), period_end: daysFromNow(-1), total_in_kes: 5500, total_out_kes: 10000 },
        { id: "st-2", kind: "Monthly Statement", label: "June 2026", period_start: daysFromNow(-61), period_end: daysFromNow(-31), total_in_kes: 3200, total_out_kes: 6400 },
    ];
}

export function seedAudit(): AuditEntry[] {
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