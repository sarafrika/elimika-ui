'use client'

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeftRight,
    Banknote,
    BarChart3,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    Compass,
    Download,
    FileText,
    FileUp,
    History,
    Info,
    LayoutDashboard,
    Loader2,
    MessageSquare,
    PieChart,
    Plus,
    RefreshCcw,
    Send,
    ShieldCheck,
    Trash2,
    Upload,
    Wallet,
    XCircle
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

/**
 * ---------------------------------------------------------------------------
 * Color tokens
 * ---------------------------------------------------------------------------
 * This file uses semantic Tailwind tokens instead of hardcoded hex/palette
 * classes, so the page follows the app theme (light/dark, brand updates)
 * automatically. It assumes the following CSS variables exist alongside the
 * standard shadcn/ui tokens (background, foreground, card, primary, muted,
 * destructive, border, etc.) in your global stylesheet / tailwind.config:
 *
 *   --success / --success-foreground   (positive / completed / approved)
 *   --warning / --warning-foreground   (pending / in review / caution)
 *   --info    / --info-foreground      (neutral, in-flight states)
 *   --accent  / --accent-foreground    (secondary brand highlight)
 *   --chart-1 .. --chart-5             (categorical data-viz colors)
 *
 * `success`, `warning`, `info`, `accent` and `chart-1..5` are used for
 * *meaning* (status, workflow state) and for *category* (unrelated series in
 * charts), respectively — never for decoration alone.
 * ---------------------------------------------------------------------------
 */

const TABS = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "my-funding", label: "My Funding", icon: Wallet },
    { id: "opportunities", label: "Opportunities", icon: Compass },
    { id: "applications", label: "Applications", icon: ClipboardList },
    { id: "allocations", label: "Allocations", icon: PieChart },
    { id: "disbursements", label: "Disbursements", icon: Banknote },
    { id: "transactions", label: "Transactions", icon: ArrowLeftRight },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "reports", label: "Reports", icon: BarChart3 },
] as const;

type TabId = (typeof TABS)[number]["id"];

const searchSchema = z.object({
    tab: z
        .enum([
            "overview",
            "my-funding",
            "opportunities",
            "applications",
            "allocations",
            "disbursements",
            "transactions",
            "documents",
            "reports",
        ])
        .catch("overview")
        .default("overview"),
    category: z.string().catch("All").default("All"),
    q: z.string().catch("").default(""),
});


import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserProfile } from "../../../../context/profile-context";
import { getWalletOptions } from "../../../../services/client/@tanstack/react-query.gen";
import { Donut, TOKEN } from "../../_components/color-charts";
import { AllocationsTab } from "./skillfund-component/AllocationsTab";
import { ApplicationsTab } from "./skillfund-component/ApplicationsTab";
import { DisbursementsTab } from "./skillfund-component/DisbursementTab";
import { MyFundingTab } from "./skillfund-component/MyFundingTab";
import { OpportunitiesTab } from "./skillfund-component/OpportunitiesTab";
import { OverviewTab } from "./skillfund-component/OverviewTab";
import { TransactionsTab } from "./skillfund-component/TransactionsTab";

export default function SkillsFund() {
    const [tab, setTab] = useState("documents");

    const user = useUserProfile()
    const { data: walletResp } = useQuery({
        ...getWalletOptions({ path: { userUuid: user?.uuid as string } })
    })
    const wallet = walletResp?.data!



    return (
        <div className="min-h-screen bg-muted/30">
            <Tabs value={tab} onValueChange={setTab}>
                <div className="border-b bg-card">
                    <div className="px-4 py-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
                                    Skills Fund
                                    <ShieldCheck className="h-5 w-5 text-accent" />
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Scholarships, bursaries, grants and sponsorships — all in one place.
                                </p>
                            </div>

                            <div className="hidden items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm md:flex">
                                <Wallet className="h-4 w-4 text-primary" />
                                <span className="text-muted-foreground">
                                    Wallet Balance
                                </span>
                                <span className="font-semibold tabular-nums">
                                    {wallet?.currency_code} {wallet?.balance_amount}
                                </span>
                            </div>
                        </div>

                        <div className="mt-4 -mx-4 overflow-x-auto px-4 no-scrollbar">
                            <TabsList className="h-auto w-max gap-2 bg-transparent p-0">
                                {TABS.map((t) => {
                                    const Icon = t.icon;

                                    return (
                                        <TabsTrigger
                                            key={t.id}
                                            value={t.id}
                                            className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm whitespace-nowrap data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                        >
                                            <Icon className="h-3.5 w-3.5" />
                                            {t.label}
                                        </TabsTrigger>
                                    );
                                })}
                            </TabsList>
                        </div>
                    </div>
                </div>

                <div className="px-4 py-6">
                    <TabsContent value="overview">
                        <OverviewTab />
                    </TabsContent>

                    <TabsContent value="my-funding">
                        <MyFundingTab />
                    </TabsContent>

                    <TabsContent value="opportunities">
                        <OpportunitiesTab />
                    </TabsContent>

                    <TabsContent value="applications">
                        <ApplicationsTab />
                    </TabsContent>

                    <TabsContent value="allocations">
                        <AllocationsTab />
                    </TabsContent>

                    <TabsContent value="disbursements">
                        <DisbursementsTab />
                    </TabsContent>

                    <TabsContent value="transactions">
                        <TransactionsTab />
                    </TabsContent>

                    <TabsContent value="documents">
                        <DocumentsTab />
                    </TabsContent>

                    <TabsContent value="reports">
                        <ReportsTab />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}

// ==================== Shared ====================
export function StatCard({
    icon: Icon,
    label,
    value,
    sub,
    tint = "bg-muted text-muted-foreground",
}: {
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    label: string;
    value: string;
    sub?: string;
    tint?: string;
}) {
    return (
        <Card className="min-w-0 h-full rounded-md py-0">
            <CardContent className="flex h-full flex-col gap-3 p-3 sm:p-2 xl:p-4 py-0">
                <div className="flex items-center gap-3">
                    <div
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full sm:h-11 sm:w-11 ${tint}`}
                    >
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>

                    <p className="flex-1 text-xs font-medium text-muted-foreground">
                        {label}
                    </p>
                </div>

                <div className="min-w-0 flex-1">
                    <p className="break-words text-base font-semibold tracking-tight sm:text-xl">
                        {value}
                    </p>

                    {sub && (
                        <p className="mt-1 text-[10px] text-muted-foreground sm:text-[11px]">
                            {sub}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export function SectionHeader({
    title,
    desc,
    right,
}: {
    title: string;
    desc?: string;
    right?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-3 mb-4">
            <div>
                <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                {desc && <p className="text-sm text-muted-foreground">{desc}</p>}
            </div>
            {right}
        </div>
    );
}

// Semantic status → token mapping used across badges, trackers and icons.
export const STATUS_TOKEN: Record<string, "success" | "warning" | "info" | "destructive" | "muted" | "accent"> = {
    Approved: "success",
    Active: "success",
    Completed: "success",
    "Money In": "success",
    Disbursement: "success",
    "Under Review": "warning",
    Pending: "warning",
    Held: "warning",
    Withdrawal: "warning",
    Upcoming: "info",
    Submitted: "info",
    Refund: "info",
    Rejected: "destructive",
    Failed: "destructive",
    Draft: "muted",
    Withdrawn: "muted",
    Cancelled: "muted",
    Payment: "muted",
    Processing: "accent",
    Reservation: "accent",
    Adjustment: "accent",
};

export const STATUS_BADGE_CLASS: Record<string, string> = {
    success: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    info: "bg-info/10 text-info border-info/20",
    destructive: "bg-destructive/10 text-destructive border-destructive/20",
    muted: "bg-muted text-muted-foreground border-border",
    accent: "bg-accent/10 text-accent border-accent/20",
};

export function StatusBadge({ status }: { status: string }) {
    const token = STATUS_TOKEN[status] ?? "muted";
    return (
        <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_BADGE_CLASS[token]}`}
        >
            {status}
        </span>
    );
}


// ==================== TYPES ====================
export type Opportunity = {
    id: string;
    title: string;
    funder: string;
    description: string | null;
    category: string;
    award_amount_kes: number;
    deadline: string | null;
    tags: string[];
    study_levels: string[];
    location: string | null;
    badge: string | null;
    eligibility: string | null;
    requirements: string[];
};

export type Application = {
    id: string;
    user_id: string;
    opportunity_id: string | null;
    reference: string;
    status: "draft" | "submitted" | "under_review" | "approved" | "rejected" | "waitlisted";
    amount_requested_kes: number | null;
    personal_statement: string | null;
    form_data: Record<string, unknown>;
    reviewer_notes: string | null;
    submitted_at: string | null;
    decided_at: string | null;
    created_at: string;
    updated_at: string;
    opportunity?: Opportunity | null;
};

type AppDocument = {
    id: string;
    application_id: string;
    name: string;
    storage_path: string;
    mime_type: string | null;
    size_bytes: number | null;
    kind: string | null;
    created_at: string;
};

export const STATUS_LABEL: Record<Application["status"], string> = {
    draft: "Draft",
    submitted: "Submitted",
    under_review: "Under Review",
    approved: "Approved",
    rejected: "Rejected",
    waitlisted: "Waitlisted",
};

export const STATUS_BADGE: Record<Application["status"], string> = {
    draft: STATUS_BADGE_CLASS.muted!,
    submitted: STATUS_BADGE_CLASS.info!,
    under_review: STATUS_BADGE_CLASS.warning!,
    approved: STATUS_BADGE_CLASS.success!,
    rejected: STATUS_BADGE_CLASS.destructive!,
    waitlisted: STATUS_BADGE_CLASS.accent!,
};

// ==================== MOCK DATA LAYER ====================
// Replaces the Supabase-backed data layer with an in-memory mock "database".
// Hooks below keep the same shape (useQuery / useMutation) so the rest of the
// UI is unaffected — only the data source changed.

const MOCK_USER = { id: "user-demo-001", name: "Joy Achieng" };

function useAuth() {
    return { user: MOCK_USER };
}

function delay<T>(value: T, ms = 350): Promise<T> {
    return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function daysFromNow(n: number) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString();
}

function daysAgo(n: number) {
    return daysFromNow(-n);
}

export const mockOpportunities: Opportunity[] = [
    {
        id: "opp-1",
        title: "Digital Skills Scholarship 2026",
        funder: "Tech for Youth Foundation",
        description: "Full tuition support for learners pursuing diploma-level digital and data skills programmes.",
        category: "Scholarship",
        award_amount_kes: 56000,
        deadline: daysFromNow(21),
        tags: ["Tech", "Data", "Diploma"],
        study_levels: ["diploma"],
        location: "Nairobi",
        badge: "Featured",
        eligibility: "Open to Kenyan citizens aged 18–28 enrolled in an approved diploma programme.",
        requirements: ["National ID", "Academic transcript", "Admission letter"],
    },
    {
        id: "opp-2",
        title: "Women in Tech Grant",
        funder: "Women Techmakers Kenya",
        description: "Grant supporting women entering frontend and product development careers.",
        category: "Grant",
        award_amount_kes: 25000,
        deadline: daysFromNow(45),
        tags: ["Women in Tech", "Frontend"],
        study_levels: ["certificate", "diploma"],
        location: "Remote",
        badge: null,
        eligibility: "Female applicants enrolled in an approved frontend or product course.",
        requirements: ["National ID", "Course enrolment letter"],
    },
    {
        id: "opp-3",
        title: "Creative Arts Bursary",
        funder: "Kenya Arts Trust",
        description: "Bursary for learners pursuing music, design or performing arts training.",
        category: "Bursary",
        award_amount_kes: 20000,
        deadline: daysFromNow(10),
        tags: ["Arts", "Music", "Design"],
        study_levels: ["certificate"],
        location: "Mombasa",
        badge: null,
        eligibility: "Applicants enrolled in an accredited creative arts programme.",
        requirements: ["National ID", "Portfolio or audition recording"],
    },
    {
        id: "opp-4",
        title: "STEM Excellence Fund",
        funder: "STEM Africa Initiative",
        description: "Fund recognising outstanding performance in science and mathematics programmes.",
        category: "Fund",
        award_amount_kes: 30000,
        deadline: null,
        tags: ["STEM", "Mathematics"],
        study_levels: ["diploma", "degree"],
        location: "Nairobi",
        badge: "Featured",
        eligibility: "Top-quartile academic standing in a STEM programme.",
        requirements: ["Academic transcript", "Recommendation letter"],
    },
    {
        id: "opp-5",
        title: "Community Apprenticeship Sponsorship",
        funder: "Sokoni Trust",
        description: "Sponsorship covering fees for hands-on apprenticeship placements with local employers.",
        category: "Sponsorship",
        award_amount_kes: 18000,
        deadline: daysFromNow(60),
        tags: ["Apprenticeship", "Vocational"],
        study_levels: ["certificate"],
        location: "Kisumu",
        badge: null,
        eligibility: "Enrolled apprentices with a confirmed host employer.",
        requirements: ["National ID", "Employer confirmation letter"],
    },
    {
        id: "opp-6",
        title: "Youth Innovation Stipend",
        funder: "Global Futures Fund",
        description: "Monthly stipend for learners building an independent capstone or innovation project.",
        category: "Stipend",
        award_amount_kes: 12000,
        deadline: daysFromNow(30),
        tags: ["Innovation", "Capstone"],
        study_levels: ["diploma", "degree"],
        location: "Remote",
        badge: null,
        eligibility: "Learners with an approved capstone or innovation project proposal.",
        requirements: ["Project proposal", "Course enrolment letter"],
    },
];

let mockApplications: Application[] = [
    {
        id: "app-1",
        user_id: MOCK_USER.id,
        opportunity_id: "opp-1",
        reference: "SKF-2026-0001",
        status: "under_review",
        amount_requested_kes: 56000,
        personal_statement: "I'm pursuing a Diploma in Data Analytics and this scholarship would cover my remaining tuition for the year.",
        form_data: {},
        reviewer_notes: null,
        submitted_at: daysAgo(6),
        decided_at: null,
        created_at: daysAgo(7),
        updated_at: daysAgo(2),
    },
    {
        id: "app-2",
        user_id: MOCK_USER.id,
        opportunity_id: "opp-2",
        reference: "SKF-2026-0002",
        status: "approved",
        amount_requested_kes: 20000,
        personal_statement: "I'm building my frontend skills through the DevHub Academy course and want to keep growing in this field.",
        form_data: {},
        reviewer_notes: "Great fit — approved for the full requested amount.",
        submitted_at: daysAgo(20),
        decided_at: daysAgo(12),
        created_at: daysAgo(21),
        updated_at: daysAgo(12),
    },
    {
        id: "app-3",
        user_id: MOCK_USER.id,
        opportunity_id: "opp-3",
        reference: "SKF-2026-0003",
        status: "draft",
        amount_requested_kes: 15000,
        personal_statement: "",
        form_data: {},
        reviewer_notes: null,
        submitted_at: null,
        decided_at: null,
        created_at: daysAgo(1),
        updated_at: daysAgo(1),
    },
    {
        id: "app-4",
        user_id: MOCK_USER.id,
        opportunity_id: "opp-5",
        reference: "SKF-2026-0004",
        status: "rejected",
        amount_requested_kes: 18000,
        personal_statement: "Requesting sponsorship for my apprenticeship placement fees.",
        form_data: {},
        reviewer_notes: "No confirmed host employer on file at the time of review — please reapply once confirmed.",
        submitted_at: daysAgo(30),
        decided_at: daysAgo(24),
        created_at: daysAgo(31),
        updated_at: daysAgo(24),
    },
];

export const sampleApplications: Application[] = [
    {
        id: "app-1",
        user_id: MOCK_USER.id,
        opportunity_id: "opp-1",
        reference: "SKF-2026-0001",
        status: "under_review",
        amount_requested_kes: 56000,
        personal_statement: "I'm pursuing a Diploma in Data Analytics and this scholarship would cover my remaining tuition for the year.",
        form_data: {},
        reviewer_notes: null,
        submitted_at: daysAgo(6),
        decided_at: null,
        created_at: daysAgo(7),
        updated_at: daysAgo(2),
    },
    {
        id: "app-2",
        user_id: MOCK_USER.id,
        opportunity_id: "opp-2",
        reference: "SKF-2026-0002",
        status: "approved",
        amount_requested_kes: 20000,
        personal_statement: "I'm building my frontend skills through the DevHub Academy course and want to keep growing in this field.",
        form_data: {},
        reviewer_notes: "Great fit — approved for the full requested amount.",
        submitted_at: daysAgo(20),
        decided_at: daysAgo(12),
        created_at: daysAgo(21),
        updated_at: daysAgo(12),
    },
    {
        id: "app-3",
        user_id: MOCK_USER.id,
        opportunity_id: "opp-3",
        reference: "SKF-2026-0003",
        status: "draft",
        amount_requested_kes: 15000,
        personal_statement: "",
        form_data: {},
        reviewer_notes: null,
        submitted_at: null,
        decided_at: null,
        created_at: daysAgo(1),
        updated_at: daysAgo(1),
    },
    {
        id: "app-4",
        user_id: MOCK_USER.id,
        opportunity_id: "opp-5",
        reference: "SKF-2026-0004",
        status: "rejected",
        amount_requested_kes: 18000,
        personal_statement: "Requesting sponsorship for my apprenticeship placement fees.",
        form_data: {},
        reviewer_notes: "No confirmed host employer on file at the time of review — please reapply once confirmed.",
        submitted_at: daysAgo(30),
        decided_at: daysAgo(24),
        created_at: daysAgo(31),
        updated_at: daysAgo(24),
    },
];

let mockDocuments: AppDocument[] = [
    {
        id: "doc-1",
        application_id: "app-1",
        name: "National-ID.pdf",
        storage_path: "mock/app-1/national-id.pdf",
        mime_type: "application/pdf",
        size_bytes: 312_000,
        kind: "identity",
        created_at: daysAgo(7),
    },
    {
        id: "doc-2",
        application_id: "app-1",
        name: "Academic-Transcript.pdf",
        storage_path: "mock/app-1/transcript.pdf",
        mime_type: "application/pdf",
        size_bytes: 420_000,
        kind: "academic",
        created_at: daysAgo(6),
    },
];

type AuditEvent = {
    id: string;
    application_id: string;
    actor_id: string | null;
    actor_role: string;
    event_type: string;
    from_status: string | null;
    to_status: string | null;
    note: string | null;
    metadata: unknown | null;
    created_at: string;
};

let mockEvents: AuditEvent[] = [
    {
        id: "evt-1",
        application_id: "app-1",
        actor_id: MOCK_USER.id,
        actor_role: "student",
        event_type: "created",
        from_status: null,
        to_status: "draft",
        note: null,
        metadata: null,
        created_at: daysAgo(7),
    },
    {
        id: "evt-2",
        application_id: "app-1",
        actor_id: MOCK_USER.id,
        actor_role: "student",
        event_type: "document_uploaded",
        from_status: null,
        to_status: null,
        note: "National-ID.pdf",
        metadata: null,
        created_at: daysAgo(7),
    },
    {
        id: "evt-3",
        application_id: "app-1",
        actor_id: MOCK_USER.id,
        actor_role: "student",
        event_type: "status_changed",
        from_status: "draft",
        to_status: "submitted",
        note: null,
        metadata: null,
        created_at: daysAgo(6),
    },
    {
        id: "evt-4",
        application_id: "app-1",
        actor_id: "reviewer-01",
        actor_role: "reviewer",
        event_type: "status_changed",
        from_status: "submitted",
        to_status: "under_review",
        note: null,
        metadata: null,
        created_at: daysAgo(2),
    },
];

type Pref = { event_key: string; in_app: boolean; email: boolean };
let mockPrefs: Pref[] = [
    { event_key: "submitted", in_app: true, email: true },
    { event_key: "approved", in_app: true, email: true },
];

// Mock course-enrolment context, used to evaluate eligibility rules.
export const mockEnrollments = [
    {
        id: "enr-1",
        status: "active",
        class_id: "class-1",
        course_id: "course-1",
        class: { id: "class-1", instructor_id: "instr-1", level_of_study: "diploma", ends_at: daysFromNow(180) },
        course: { id: "course-1", title: "Diploma in Data Analytics", category: "Data", level_of_study: "diploma" },
    },
    {
        id: "enr-2",
        status: "active",
        class_id: "class-2",
        course_id: "course-2",
        class: { id: "class-2", instructor_id: null, level_of_study: "certificate", ends_at: daysFromNow(90) },
        course: { id: "course-2", title: "Frontend Development Bootcamp", category: "Frontend", level_of_study: "certificate" },
    },
];

let referenceCounter = mockApplications.length + 1;
let idCounter = 100;

function nextId(prefix: string) {
    idCounter += 1;
    return `${prefix}-${idCounter}`;
}

// ---- Query hooks ----

function useOpportunities() {
    return useQuery({
        queryKey: ["funding-opportunities"],
        queryFn: () =>
            delay(
                [...mockOpportunities].sort((a, b) => {
                    if (!a.deadline) return 1;
                    if (!b.deadline) return -1;
                    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
                }),
            ),
    });
}

function useMyApplications(userId?: string) {
    return useQuery({
        queryKey: ["funding-applications", userId],
        enabled: !!userId,
        queryFn: () =>
            delay(
                mockApplications
                    .filter((a) => a.user_id === userId)
                    .map((a) => ({ ...a, opportunity: mockOpportunities.find((o) => o.id === a.opportunity_id) ?? null }))
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
            ),
    });
}

function useAppDocuments(applicationId?: string) {
    return useQuery({
        queryKey: ["funding-app-docs", applicationId],
        enabled: !!applicationId,
        queryFn: () =>
            delay(
                mockDocuments
                    .filter((d) => d.application_id === applicationId)
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
            ),
    });
}

function useEligibilityContext(userId?: string) {
    return useQuery({
        queryKey: ["funding-eligibility-ctx", userId],
        enabled: !!userId,
        queryFn: () => delay({ enrollments: mockEnrollments }, 150),
    });
}

function useAuditEvents(applicationId?: string) {
    return useQuery({
        queryKey: ["funding-app-events", applicationId],
        enabled: !!applicationId,
        queryFn: () =>
            delay(
                mockEvents
                    .filter((e) => e.application_id === applicationId)
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
            ),
    });
}

type EligibilityCheck = {
    key: "allocation" | "course" | "instructor" | "budget" | "period";
    label: string;
    status: "pass" | "fail" | "warn";
    detail: string;
    required: boolean;
};

function evaluateEligibility(
    opportunity: Opportunity,
    amountStr: string,
    ctx: { enrollments: unknown[] } | undefined,
): EligibilityCheck[] {
    const enrollments = ctx?.enrollments ?? [];
    const activeEnrollments = enrollments.filter((e) => e.status === "active" || e.status === "invited");
    const amount = parseInt(amountStr || String(opportunity.award_amount_kes), 10);

    const allocationOk = activeEnrollments.length > 0;

    const oppLevels = (opportunity.study_levels ?? []).map((s) => s.toLowerCase());
    const myLevels = activeEnrollments
        .map((e) => (e.class?.level_of_study ?? e.course?.level_of_study ?? "").toLowerCase())
        .filter(Boolean);
    const courseOk = oppLevels.length === 0 || myLevels.some((l) => oppLevels.includes(l));

    const instructorOk = activeEnrollments.some((e) => !!e.class?.instructor_id);

    const budgetOk = amount > 0 && amount <= opportunity.award_amount_kes;
    const budgetDetail = amount > opportunity.award_amount_kes
        ? `Requested KES ${amount.toLocaleString()} exceeds award ceiling KES ${opportunity.award_amount_kes.toLocaleString()}.`
        : amount <= 0
            ? "Enter a requested amount greater than zero."
            : `KES ${amount.toLocaleString()} is within the KES ${opportunity.award_amount_kes.toLocaleString()} ceiling.`;

    const now = new Date();
    const deadline = opportunity.deadline ? new Date(opportunity.deadline) : null;
    const periodOk = !deadline || deadline.getTime() > now.getTime();
    const daysLeft = deadline ? Math.ceil((deadline.getTime() - now.getTime()) / 86_400_000) : null;

    return [
        {
            key: "allocation",
            label: "Allocation eligibility",
            required: true,
            status: allocationOk ? "pass" : "fail",
            detail: allocationOk
                ? `${activeEnrollments.length} active enrolment${activeEnrollments.length === 1 ? "" : "s"} available for funding.`
                : "You need at least one active course enrolment before applying.",
        },
        {
            key: "course",
            label: "Course level match",
            required: oppLevels.length > 0,
            status: oppLevels.length === 0 ? "warn" : courseOk ? "pass" : "fail",
            detail: oppLevels.length === 0
                ? "This opportunity has no course-level restrictions."
                : courseOk
                    ? `Your level (${myLevels.join(", ")}) matches ${oppLevels.join(", ")}.`
                    : `Requires ${oppLevels.join(", ")}. Your enrolments: ${myLevels.join(", ") || "none"}.`,
        },
        {
            key: "instructor",
            label: "Instructor assigned",
            required: false,
            status: instructorOk ? "pass" : "warn",
            detail: instructorOk
                ? "At least one enrolled class has a confirmed instructor."
                : "No instructor assigned yet — funding can still be applied for.",
        },
        {
            key: "budget",
            label: "Budget within ceiling",
            required: true,
            status: budgetOk ? "pass" : "fail",
            detail: budgetDetail,
        },
        {
            key: "period",
            label: "Application period open",
            required: true,
            status: periodOk ? "pass" : "fail",
            detail: !deadline
                ? "Rolling deadline — always open."
                : periodOk
                    ? `Closes ${deadline.toLocaleDateString()} (${daysLeft} day${daysLeft === 1 ? "" : "s"} left).`
                    : `Deadline passed on ${deadline.toLocaleDateString()}.`,
        },
    ];
}

function EligibilityChecklist({ checks }: { checks: EligibilityCheck[] }) {
    const failing = checks.filter((c) => c.required && c.status === "fail").length;
    return (
        <div className="rounded-md border bg-muted/40 p-3">
            <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Eligibility checks</p>
                <span className={`ml-auto text-[11px] rounded-full px-2 py-0.5 ${failing === 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                    {failing === 0 ? "All required rules pass" : `${failing} blocking issue${failing === 1 ? "" : "s"}`}
                </span>
            </div>
            <ul className="space-y-1.5">
                {checks.map((c) => {
                    const Icon = c.status === "pass" ? CheckCircle2 : c.status === "warn" ? Info : XCircle;
                    const tint = c.status === "pass" ? "text-success" : c.status === "warn" ? "text-warning" : "text-destructive";
                    return (
                        <li key={c.key} className="flex items-start gap-2 text-xs">
                            <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${tint}`} />
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-foreground">{c.label}</span>
                                    {!c.required && <span className="text-[10px] text-muted-foreground uppercase tracking-wide">optional</span>}
                                </div>
                                <p className="text-muted-foreground">{c.detail}</p>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

const EVENT_META: Record<string, { label: string; token: "muted" | "info" | "warning" | "success" | "destructive" | "accent"; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }> = {
    created: { label: "Application created", token: "muted", icon: Plus },
    status_changed: { label: "Status changed", token: "info", icon: RefreshCcw },
    reviewer_note: { label: "Reviewer note", token: "warning", icon: MessageSquare },
    document_uploaded: { label: "Document uploaded", token: "success", icon: FileUp },
    document_removed: { label: "Document removed", token: "destructive", icon: Trash2 },
    note_added: { label: "Note added", token: "accent", icon: MessageSquare },
};

export function AuditTrail({ applicationId, ownerId }: { applicationId: string; ownerId: string }) {
    const { user } = useAuth();
    const qc = useQueryClient();
    const { data: events = [], isLoading } = useAuditEvents(applicationId);
    const [note, setNote] = useState("");

    const addNote = useMutation({
        mutationFn: async () => {
            if (!user || !note.trim()) return;
            mockEvents = [
                {
                    id: nextId("evt"),
                    application_id: applicationId,
                    actor_id: user.id,
                    actor_role: "student",
                    event_type: "note_added",
                    from_status: null,
                    to_status: null,
                    note: note.trim(),
                    metadata: null,
                    created_at: new Date().toISOString(),
                },
                ...mockEvents,
            ];
            return delay(null, 200);
        },
        onSuccess: () => {
            setNote("");
            qc.invalidateQueries({ queryKey: ["funding-app-events", applicationId] });
            toast.success("Note added to audit trail");
        },
        onError: (e) => toast.error(e.message ?? "Could not add note"),
    });

    return (
        <div>
            <div className="flex items-center gap-2 mb-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Audit trail</p>
                <span className="text-[11px] text-muted-foreground">({events.length})</span>
            </div>

            <div className="flex gap-2 mb-3">
                <Input
                    placeholder="Add a note to the audit trail…"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && note.trim()) {
                            e.preventDefault();
                            addNote.mutate();
                        }
                    }}
                />
                <Button size="sm" variant="outline" disabled={!note.trim() || addNote.isPending} onClick={() => addNote.mutate()}>
                    {addNote.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Add"}
                </Button>
            </div>

            {isLoading ? (
                <p className="text-xs text-muted-foreground">Loading history…</p>
            ) : events.length === 0 ? (
                <p className="text-xs text-muted-foreground border rounded-md p-3 bg-muted/40">No activity yet.</p>
            ) : (
                <ol className="relative border-l border-border pl-4 space-y-3 max-h-72 overflow-y-auto">
                    {events.map((ev) => {
                        const meta = EVENT_META[ev.event_type] ?? { label: ev.event_type, token: "muted" as const, icon: Info };
                        const Icon = meta.icon;
                        const tintClass = `bg-${meta.token}/10 text-${meta.token}`;
                        return (
                            <li key={ev.id} className="relative">
                                <span className={`absolute -left-[22px] top-0.5 h-4 w-4 rounded-full ring-2 ring-background flex items-center justify-center ${tintClass}`}>
                                    <Icon className="h-2.5 w-2.5" />
                                </span>
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <span className="font-medium text-foreground">{meta.label}</span>
                                    {ev.event_type === "status_changed" && (
                                        <span className="text-muted-foreground">
                                            {ev.from_status ? STATUS_LABEL[ev.from_status as Application["status"]] ?? ev.from_status : "—"} →{" "}
                                            <span className="font-medium text-foreground">
                                                {ev.to_status ? STATUS_LABEL[ev.to_status as Application["status"]] ?? ev.to_status : "—"}
                                            </span>
                                        </span>
                                    )}
                                    <span className="text-muted-foreground">•</span>
                                    <span className="text-muted-foreground">{new Date(ev.created_at).toLocaleString()}</span>
                                    <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${tintClass}`}>
                                        {ev.actor_role}
                                    </span>
                                </div>
                                {ev.note && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{ev.note}</p>}
                            </li>
                        );
                    })}
                </ol>
            )}
        </div>
    );
}

export function ManageApplicationDialog({ application, open, onClose }: { application: Application | null; open: boolean; onClose: () => void }) {
    const { user } = useAuth();
    const qc = useQueryClient();
    const fileRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [amount, setAmount] = useState<string>(application?.amount_requested_kes?.toString() ?? "");
    const [statement, setStatement] = useState(application?.personal_statement ?? "");

    useMemo(() => {
        if (application) {
            setAmount(application.amount_requested_kes?.toString() ?? "");
            setStatement(application.personal_statement ?? "");
        }
    }, [application?.id]);

    const { data: docs = [], refetch: refetchDocs } = useAppDocuments(application?.id);
    const { data: eligibilityCtx } = useEligibilityContext(user?.id);
    const eligibilityChecks = useMemo(
        () => (application?.opportunity ? evaluateEligibility(application.opportunity, amount, eligibilityCtx) : []),
        [application?.opportunity, amount, eligibilityCtx],
    );
    const submitBlocked = eligibilityChecks.some((c) => c.required && c.status === "fail");

    const isDraft = application?.status === "draft";
    const canWithdraw = application && ["submitted", "under_review", "waitlisted"].includes(application.status);

    const saveDraft = useMutation({
        mutationFn: async () => {
            if (!application) return;
            mockApplications = mockApplications.map((a) =>
                a.id === application.id
                    ? { ...a, amount_requested_kes: amount ? parseInt(amount, 10) : null, personal_statement: statement || null, updated_at: new Date().toISOString() }
                    : a,
            );
            return delay(null, 200);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["funding-applications"] });
            toast.success("Draft saved");
        },
        onError: (e) => toast.error(e.message ?? "Failed to save"),
    });

    const transition = useMutation({
        mutationFn: async (next: Application["status"]) => {
            if (!application) return;
            const now = new Date().toISOString();
            const from = application.status;
            mockApplications = mockApplications.map((a) =>
                a.id === application.id
                    ? {
                        ...a,
                        status: next,
                        submitted_at: next === "submitted" ? now : a.submitted_at,
                        decided_at: ["approved", "rejected"].includes(next) ? now : a.decided_at,
                        updated_at: now,
                    }
                    : a,
            );
            mockEvents = [
                {
                    id: nextId("evt"),
                    application_id: application.id,
                    actor_id: user?.id ?? null,
                    actor_role: "student",
                    event_type: "status_changed",
                    from_status: from,
                    to_status: next,
                    note: null,
                    metadata: null,
                    created_at: now,
                },
                ...mockEvents,
            ];
            return delay(null, 200);
        },
        onSuccess: (_d, next) => {
            qc.invalidateQueries({ queryKey: ["funding-applications"] });
            qc.invalidateQueries({ queryKey: ["funding-app-events"] });
            toast.success(`Application ${STATUS_LABEL[next].toLowerCase()}`);
            onClose();
        },
        onError: (e) => toast.error(e.message ?? "Failed to update"),
    });

    const uploadDoc = async (file: File) => {
        if (!application || !user) return;
        setUploading(true);
        try {
            await delay(null, 500);
            const doc: AppDocument = {
                id: nextId("doc"),
                application_id: application.id,
                name: file.name,
                storage_path: `mock/${application.id}/${Date.now()}-${file.name}`,
                mime_type: file.type,
                size_bytes: file.size,
                kind: null,
                created_at: new Date().toISOString(),
            };
            mockDocuments = [doc, ...mockDocuments];
            mockEvents = [
                {
                    id: nextId("evt"),
                    application_id: application.id,
                    actor_id: user.id,
                    actor_role: "student",
                    event_type: "document_uploaded",
                    from_status: null,
                    to_status: null,
                    note: file.name,
                    metadata: null,
                    created_at: new Date().toISOString(),
                },
                ...mockEvents,
            ];
            toast.success("Document uploaded");
            refetchDocs();
        } catch (e) {
            toast.error(e.message ?? "Upload failed");
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    };

    const deleteDoc = async (doc: AppDocument) => {
        try {
            mockDocuments = mockDocuments.filter((d) => d.id !== doc.id);
            toast.success("Document removed");
            refetchDocs();
        } catch (e) {
            toast.error(e.message ?? "Failed to remove");
        }
    };

    const downloadDoc = async (doc: AppDocument) => {
        toast.info(`"${doc.name}" is a demo document — no file storage is attached in this preview.`);
    };

    if (!application) return null;

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {application.opportunity?.title ?? "Application"}
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_BADGE[application.status]}`}>
                            {STATUS_LABEL[application.status]}
                        </span>
                    </DialogTitle>
                    <DialogDescription>
                        {application.opportunity?.funder} • Ref {application.reference}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <Label htmlFor="m-amount">Amount requested (KES)</Label>
                            <Input
                                id="m-amount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                disabled={!isDraft}
                            />
                        </div>
                        <div className="flex items-end">
                            <div className="text-xs text-muted-foreground">
                                Created {new Date(application.created_at).toLocaleString()}
                                {application.submitted_at && <div>Submitted {new Date(application.submitted_at).toLocaleString()}</div>}
                                {application.decided_at && <div>Decided {new Date(application.decided_at).toLocaleString()}</div>}
                            </div>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="m-statement">Personal statement</Label>
                        <Textarea
                            id="m-statement"
                            rows={5}
                            value={statement}
                            onChange={(e) => setStatement(e.target.value)}
                            disabled={!isDraft}
                        />
                    </div>

                    {application.reviewer_notes && (
                        <div className="rounded-md border bg-warning/10 border-warning/20 p-3 text-sm text-warning-foreground">
                            <b>Reviewer note:</b> {application.reviewer_notes}
                        </div>
                    )}

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium">Supporting documents</p>
                            <div>
                                <input
                                    ref={fileRef}
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => e.target.files?.[0] && uploadDoc(e.target.files[0])}
                                />
                                <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading || application.status === "approved" || application.status === "rejected"}>
                                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
                                    Upload
                                </Button>
                            </div>
                        </div>
                        {docs.length === 0 ? (
                            <p className="text-xs text-muted-foreground border rounded-md p-3 bg-muted/40">No documents uploaded yet.</p>
                        ) : (
                            <ul className="space-y-1.5">
                                {docs.map((d) => (
                                    <li key={d.id} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <button className="flex-1 text-left truncate hover:underline" onClick={() => downloadDoc(d)}>{d.name}</button>
                                        <span className="text-[11px] text-muted-foreground">{d.size_bytes ? `${Math.round(d.size_bytes / 1024)} KB` : ""}</span>
                                        {isDraft && (
                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteDoc(d)}>
                                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                            </Button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <AuditTrail applicationId={application.id} ownerId={application.user_id} />

                    {isDraft && application.opportunity && (
                        <EligibilityChecklist checks={eligibilityChecks} />
                    )}
                </div>

                <DialogFooter className="flex-wrap gap-2">
                    <Button variant="ghost" onClick={onClose}>Close</Button>
                    {isDraft && (
                        <>
                            <Button variant="outline" onClick={() => saveDraft.mutate()} disabled={saveDraft.isPending}>
                                {saveDraft.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save draft"}
                            </Button>
                            <Button
                                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                onClick={async () => { await saveDraft.mutateAsync(); transition.mutate("submitted"); }}
                                disabled={transition.isPending || !statement.trim() || submitBlocked}
                                title={submitBlocked ? "Resolve blocking eligibility rules first" : undefined}
                            >
                                <Send className="h-4 w-4 mr-1" /> Submit
                            </Button>
                        </>
                    )}
                    {canWithdraw && (
                        <Button variant="outline" onClick={() => transition.mutate("draft")} disabled={transition.isPending}>
                            Withdraw to draft
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ==================== DOCUMENTS ====================
function DocumentsTab() {
    const docs = [
        ["Funding Agreement", "Official funding terms and conditions", "Agreement", "Digital Skills Scholarship 2026", "May 15, 2026", "System", "245 KB", "PDF"],
        ["Award Letter", "Letter of award", "Certificate", "Digital Skills Scholarship 2026", "May 15, 2026", "System", "189 KB", "PDF"],
        ["Stipend Schedule", "Monthly stipend disbursement plan", "Other", "Digital Skills Scholarship 2026", "May 15, 2026", "System", "132 KB", "PDF"],
        ["Tuition Fees Allocation Breakdown", "Detailed tuition allocation", "Other", "Digital Skills Scholarship 2026", "May 16, 2026", "System", "210 KB", "PDF"],
        ["Eligibility Confirmation", "Eligibility verification document", "Certificate", "Digital Skills Scholarship 2026", "May 14, 2026", "System", "98 KB", "Excel"],
        ["National ID Copy", "Identity verification", "Form", "—", "May 10, 2026", "You", "312 KB", "PDF"],
        ["Academic Transcript", "Latest academic transcript", "Form", "—", "May 10, 2026", "You", "420 KB", "PDF"],
        ["Receipt - Assessment Fee", "Payment receipt", "Receipt", "Digital Skills Scholarship 2026", "May 18, 2026", "System", "176 KB", "PDF"],
        ["Code of Conduct", "Student code of conduct", "Agreement", "Digital Skills Scholarship 2026", "May 12, 2026", "System", "158 KB", "PDF"],
        ["Course Enrollment Confirmation", "Proof of enrollment", "Other", "Digital Skills Scholarship 2026", "May 11, 2026", "System", "95 KB", "Excel"],
    ];
    return (
        <div className="grid gap-6 min-w-0 *:min-w-0 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-4">
                <SectionHeader title="Documents" desc="Access all your funding related documents, agreements and receipts." />
                <div className="flex flex-wrap gap-2 border-b">
                    {["All Documents 24", "Agreements 6", "Certificates 5", "Receipts 7", "Forms 3", "Other 3"].map((t, i) => (
                        <button key={t} className={`px-3 py-2 text-sm border-b-2 -mb-px ${i === 0 ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground"}`}>{t}</button>
                    ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Input placeholder="Search documents..." className="h-9 w-56" />
                    <Select defaultValue="all"><SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Document Types</SelectItem></SelectContent></Select>
                    <Select defaultValue="all"><SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Funding Programs</SelectItem></SelectContent></Select>
                    <div className="ml-auto text-xs text-muted-foreground">Sort by: <span className="font-medium text-foreground">Newest</span></div>
                </div>
                <Card>
                    <CardContent className="p-0 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs text-muted-foreground bg-muted/50">
                                <tr>{["Document Name", "Type", "Funding Program", "Uploaded", "Size", "Action"].map((h) => (<th key={h} className="text-left px-3 py-2 font-medium">{h}</th>))}</tr>
                            </thead>
                            <tbody className="divide-y">
                                {docs.map((d) => (
                                    <tr key={d[0]} className="hover:bg-muted/40">
                                        <td className="px-3 py-2">
                                            <div className="flex items-start gap-2">
                                                <FileText className="h-4 w-4 text-primary mt-0.5" />
                                                <div><p className="font-medium text-foreground">{d[0]}</p><p className="text-[11px] text-muted-foreground">{d[1]}</p></div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2"><Badge variant="outline" className="text-[10px]">{d[2]}</Badge></td>
                                        <td className="px-3 py-2 text-xs text-muted-foreground">{d[3]}</td>
                                        <td className="px-3 py-2 text-xs"><p>{d[4]}</p><p className="text-muted-foreground">by {d[5]}</p></td>
                                        <td className="px-3 py-2 text-xs">{d[6]}</td>
                                        <td className="px-3 py-2"><Button size="icon" variant="ghost" className="h-8 w-8"><Download className="h-4 w-4" /></Button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>

            <aside className="space-y-4 min-w-0">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base">Documents Summary</CardTitle></CardHeader>
                    <CardContent className="flex items-center gap-3">
                        <Donut segments={[
                            { value: 6, color: TOKEN.chart1, label: "Agreements" },
                            { value: 5, color: TOKEN.chart2, label: "Certificates" },
                            { value: 7, color: TOKEN.chart3, label: "Receipts" },
                            { value: 3, color: TOKEN.chart4, label: "Forms" },
                            { value: 3, color: TOKEN.chart5, label: "Other" },
                        ]} centerTop="24" centerBottom="Total" />
                        <div className="space-y-1 text-xs">
                            {[["Agreements", "6 (25%)", TOKEN.chart1], ["Certificates", "5 (21%)", TOKEN.chart2], ["Receipts", "7 (29%)", TOKEN.chart3], ["Forms", "3 (13%)", TOKEN.chart4], ["Other", "3 (12%)", TOKEN.chart5]].map(([l, v, c]) => (
                                <div key={l} className="flex items-center gap-2"><span className="h-2 w-2 rounded-sm" style={{ background: c as string }} />{l} <span className="text-muted-foreground ml-auto">{v}</span></div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base">Storage Usage</CardTitle></CardHeader>
                    <CardContent>
                        <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">1.8 GB of 5 GB used</span><span className="font-medium">36%</span></div>
                        <Progress value={36} className="h-2" />
                        <Button variant="outline" className="w-full mt-3" size="sm">Manage Storage</Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base">Important Reminders</CardTitle></CardHeader>
                    <CardContent className="space-y-3 text-xs text-muted-foreground">
                        <div className="flex gap-2"><CalendarDays className="h-4 w-4 text-primary mt-0.5" /><div><p>Your funding agreement was signed on May 15, 2026 and is active.</p><Button variant="link" size="sm" className="p-0 h-auto text-primary">View Agreement →</Button></div></div>
                        <div className="flex gap-2"><ShieldCheck className="h-4 w-4 text-success mt-0.5" /><div><p>Stipend release is scheduled for June 1, 2026.</p><Button variant="link" size="sm" className="p-0 h-auto text-primary">View Schedule →</Button></div></div>
                        <div className="flex gap-2"><Plus className="h-4 w-4 text-warning mt-0.5" /><div><p>Keep your documents up to date to avoid any delays.</p><Button variant="link" size="sm" className="p-0 h-auto text-primary">Upload New Document →</Button></div></div>
                    </CardContent>
                </Card>
            </aside>
        </div>
    );
}

// ==================== REPORTS ====================
function ReportsTab() {
    return <OverviewTab />;
}

// ==================== NOTIFICATION PREFERENCES ====================
const STATUS_EVENTS: { key: string; label: string; desc: string }[] = [
    { key: "draft", label: "Application created (Draft)", desc: "When a new application is saved as a draft." },
    { key: "submitted", label: "Submitted", desc: "When your application is submitted for review." },
    { key: "under_review", label: "Under Review", desc: "When a reviewer starts assessing your application." },
    { key: "approved", label: "Approved", desc: "When your application is approved for funding." },
    { key: "rejected", label: "Rejected", desc: "When your application is not approved." },
    { key: "waitlisted", label: "Waitlisted", desc: "When your application is placed on a waitlist." },
];

export function NotificationPreferencesDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { user } = useAuth();
    const qc = useQueryClient();
    const { data: prefs = [], isLoading } = useQuery({
        queryKey: ["notification_preferences", user?.id],
        enabled: !!user?.id && open,
        queryFn: () => delay([...mockPrefs], 200),
    });

    const prefsMap = useMemo(() => {
        const m = new Map<string, Pref>();
        for (const p of prefs) m.set(p.event_key, p);
        return m;
    }, [prefs]);

    const upsert = useMutation({
        mutationFn: async ({ event_key, in_app, email }: Pref) => {
            if (!user?.id) throw new Error("Not signed in");
            const existing = mockPrefs.find((p) => p.event_key === event_key);
            if (existing) {
                mockPrefs = mockPrefs.map((p) => (p.event_key === event_key ? { event_key, in_app, email } : p));
            } else {
                mockPrefs = [...mockPrefs, { event_key, in_app, email }];
            }
            return delay(null, 150);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["notification_preferences", user?.id] }),
        onError: (e) => toast.error(e?.message ?? "Failed to update preference"),
    });

    const toggle = (event_key: string, field: "in_app" | "email", value: boolean) => {
        const current = prefsMap.get(event_key) ?? { event_key, in_app: true, email: false };
        upsert.mutate({ ...current, [field]: value });
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Notification preferences</DialogTitle>
                    <DialogDescription>
                        Choose how you'd like to be notified when your funding application changes status.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                    <div className="grid grid-cols-[1fr_80px_80px] gap-2 px-3 pb-2 text-xs font-medium text-muted-foreground border-b">
                        <span>Event</span>
                        <span className="text-center">In-app</span>
                        <span className="text-center">Email</span>
                    </div>
                    {isLoading ? (
                        <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                    ) : (
                        STATUS_EVENTS.map((ev) => {
                            const p = prefsMap.get(ev.key);
                            const inApp = p?.in_app ?? true;
                            const email = p?.email ?? false;
                            return (
                                <div key={ev.key} className="grid grid-cols-[1fr_80px_80px] gap-2 items-center px-3 py-2 rounded-md hover:bg-muted/40">
                                    <div>
                                        <p className="text-sm font-medium">{ev.label}</p>
                                        <p className="text-xs text-muted-foreground">{ev.desc}</p>
                                    </div>
                                    <div className="flex justify-center">
                                        <Switch checked={inApp} onCheckedChange={(v) => toggle(ev.key, "in_app", v)} />
                                    </div>
                                    <div className="flex justify-center">
                                        <Switch checked={email} onCheckedChange={(v) => toggle(ev.key, "email", v)} />
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <p className="text-xs text-muted-foreground px-3 pt-2 border-t">
                        Email delivery activates once a verified sender domain is configured for the workspace. Your email preferences are saved and will apply automatically.
                    </p>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Done</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}