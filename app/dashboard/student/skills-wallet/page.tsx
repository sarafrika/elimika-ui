'use client'

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

import {
    ArrowUpRight,
    Award,
    BadgeCheck,
    BarChart3,
    BookOpen,
    Bookmark,
    Briefcase,
    CheckCircle2,
    ClipboardCheck,
    Clock,
    Cloud,
    Code2,
    Copy,
    Download,
    Eye,
    FileCheck2,
    Filter,
    Flame,
    Globe,
    GraduationCap,
    LayoutDashboard,
    Megaphone,
    Mic,
    MoreHorizontal,
    Palette,
    Plus,
    Rocket,
    Search,
    Share2,
    ShieldCheck,
    Sparkles,
    Star,
    Target,
    Trophy,
    UserCheck,
    Users,
    XCircle,
} from "lucide-react";

// ============================================================================
// NOTE ON THIS FIX
// ----------------------------------------------------------------------------
// The original file referenced `supabase`, `useQuery`, `useQueryClient`, and
// `createFileRoute` without importing them anywhere, and mixed `next/link`
// with a `search` prop that only TanStack Router's <Link> supports. None of
// that would have compiled. This version removes the backend/router
// dependency entirely and drives every tab off local mock data, with tab
// navigation handled by simple local state instead of URL search params.
// Swap the `MOCK_*` constants and the `use*()` hooks below for real data
// fetching whenever you're ready to reconnect a backend.
// ============================================================================

const TABS = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "skills", label: "My Skills", icon: Sparkles },
    { id: "portfolio", label: "Portfolio", icon: Briefcase },
    { id: "credentials", label: "Credentials Vault", icon: ShieldCheck },
    { id: "competencies", label: "Competencies", icon: Target },
    { id: "experience", label: "Experience", icon: GraduationCap },
    { id: "achievements", label: "Achievements", icon: Trophy },
    { id: "verification", label: "Verification", icon: BadgeCheck },
] as const;

type TabId = (typeof TABS)[number]["id"];

const WALLET_ID = "ELM-SW-2026-000245";

export default function SkillsWallet() {
    const [tab, setTab] = useState<TabId>("overview");

    return (
        <div className="min-h-screen">
            <div className="border-b">
                <div className="mx-auto  px-4 py-5">
                    <h1 className="text-2xl font-bold text-slate-900">Skills Wallet</h1>
                    <p className="text-sm text-slate-500">
                        Your verified record of skills, competencies, achievements and credentials.
                    </p>
                    <div className="mt-4 -mx-4 overflow-x-auto px-4 no-scrollbar">
                        <div className="flex gap-2 min-w-max">
                            {TABS.map((t) => {
                                const active = t.id === tab;
                                const Icon = t.icon;
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setTab(t.id)}
                                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm whitespace-nowrap transition-colors ${active
                                            ? "bg-[#0f4c81] text-white border-[#0f4c81]"
                                            : "bg-white text-slate-700 border-slate-200 hover:border-[#0f4c81] hover:text-[#0f4c81]"
                                            }`}
                                    >
                                        <Icon className="h-3.5 w-3.5" />
                                        {t.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto px-4 py-6">
                {tab === "overview" && <OverviewTab />}
                {tab === "skills" && <SkillsTab />}
                {tab === "portfolio" && <PortfolioTab />}
                {tab === "credentials" && <CredentialsTab />}
                {tab === "competencies" && <CompetenciesTab />}
                {tab === "experience" && <ExperienceTab />}
                {tab === "achievements" && <AchievementsTab />}
                {tab === "verification" && <VerificationTab />}
            </div>
        </div>
    );
}

// ---------- Shared UI ----------
function WalletIdCard({ label = "Your Skills Wallet ID" }: { label?: string }) {
    return (
        <div className="flex flex-col items-end">
            <p className="text-xs text-slate-500">{label}</p>
            <div className="mt-1 flex items-center gap-2">
                <div className="rounded-md border bg-white px-3 py-1.5 text-sm font-mono">{WALLET_ID}</div>
                <Button size="icon" variant="outline" className="h-8 w-8">
                    <Copy className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );
}

function StatCard({
    icon: Icon,
    label,
    value,
    sub,
    tint = "bg-slate-100 text-slate-700",
}: {
    icon: any;
    label: string;
    value: string | number;
    sub?: React.ReactNode;
    tint?: string;
}) {
    return (
        <Card>
            <CardContent className="p-4 flex items-start gap-3">
                <div className={`h-11 w-11 rounded-full grid place-items-center ${tint}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="text-2xl font-semibold tracking-tight">{value}</p>
                    {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
                </div>
            </CardContent>
        </Card>
    );
}

function Donut({
    value,
    size = 132,
    stroke = 12,
    label,
    sub,
}: {
    value: number;
    size?: number;
    stroke?: number;
    label: string;
    sub?: string;
}) {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const offset = c - (value / 100) * c;
    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--muted))" strokeWidth={stroke} fill="none" />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    stroke="url(#sw-ring)"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={c}
                    strokeDashoffset={offset}
                />
                <defs>
                    <linearGradient id="sw-ring" x1="0" x2="1" y1="0" y2="1">
                        <stop offset="0%" stopColor="#0f4c81" />
                        <stop offset="100%" stopColor="#14b8a6" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
                <div>
                    <div className="text-2xl font-semibold tracking-tight">{value}%</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
                    {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
                </div>
            </div>
        </div>
    );
}

function LegendRow({ color, label, value }: { color: string; label: string; value: string | number }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                {label}
            </span>
            <span className="tabular-nums text-slate-600">{value}</span>
        </div>
    );
}

// ---------- Mock data ----------
const ICON_MAP: Record<string, any> = { Code2, BarChart3, Rocket, Mic, Palette, Cloud, Megaphone, Globe, BookOpen };

function fmtDate(d?: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

const MOCK_SKILLS = [
    { id: "s1", name: "React", level: "Expert", proficiency_pct: 95, category: "Technology", last_used: "2026-07-28", icon_key: "Code2", tint: "bg-blue-100 text-blue-700" },
    { id: "s2", name: "Data Analysis", level: "Advanced", proficiency_pct: 82, category: "Business", last_used: "2026-07-20", icon_key: "BarChart3", tint: "bg-purple-100 text-purple-700" },
    { id: "s3", name: "Public Speaking", level: "Advanced", proficiency_pct: 78, category: "Soft Skills", last_used: "2026-06-30", icon_key: "Mic", tint: "bg-orange-100 text-orange-700" },
    { id: "s4", name: "UI/UX Design", level: "Intermediate", proficiency_pct: 64, category: "Design", last_used: "2026-07-10", icon_key: "Palette", tint: "bg-pink-100 text-pink-700" },
    { id: "s5", name: "Cloud Infrastructure", level: "Intermediate", proficiency_pct: 58, category: "Cloud Computing", last_used: "2026-05-15", icon_key: "Cloud", tint: "bg-sky-100 text-sky-700" },
    { id: "s6", name: "Project Delivery", level: "Expert", proficiency_pct: 90, category: "Engineering", last_used: "2026-07-31", icon_key: "Rocket", tint: "bg-teal-100 text-teal-700" },
    { id: "s7", name: "Digital Marketing", level: "Beginner", proficiency_pct: 30, category: "Business", last_used: "2026-04-02", icon_key: "Megaphone", tint: "bg-amber-100 text-amber-700" },
    { id: "s8", name: "Technical Writing", level: "Intermediate", proficiency_pct: 55, category: "Soft Skills", last_used: "2026-06-18", icon_key: "BookOpen", tint: "bg-emerald-100 text-emerald-700" },
];

const MOCK_PORTFOLIO = [
    { id: "p1", title: "Community Health Tracker", tag: "Web App", description: "A React + Supabase app helping clinics track patient follow-ups.", views: 482, likes: 63, project_date: "2026-07-01", featured: true },
    { id: "p2", title: "Market Trends Dashboard", tag: "Data Viz", description: "Interactive dashboard visualizing regional market pricing trends.", views: 310, likes: 41, project_date: "2026-06-05", featured: false },
    { id: "p3", title: "Elimika Mobile Redesign", tag: "UI/UX", description: "Full redesign of the mobile learning experience.", views: 265, likes: 38, project_date: "2026-05-12", featured: false },
];

const MOCK_CREDENTIALS = [
    { id: "c1", name: "Certified Data Analyst", org: "DataCamp", issued_at: "2026-06-01", credential_code: "DC-2026-8841", status: "Verified" },
    { id: "c2", name: "Advanced React Developer", org: "Elimika Academy", issued_at: "2026-05-15", credential_code: "ELM-RC-2201", status: "Verified" },
    { id: "c3", name: "Cloud Practitioner", org: "AWS", issued_at: "2026-07-20", credential_code: "AWS-CP-9903", status: "Pending" },
    { id: "c4", name: "Scrum Fundamentals", org: "Scrum Alliance", issued_at: "2024-02-10", credential_code: "SA-4471", status: "Expired" },
];

const MOCK_COMPETENCIES = [
    { id: "cm1", competency: "Data Cleaning & ETL", skill: "Data Analysis", level: "Advanced", level_num: "L3", pct: 88, evidence_count: 4, last_updated: "2026-07-22", course_id: "course-101", assessment_id: null },
    { id: "cm2", competency: "Component Architecture", skill: "React", level: "Expert", level_num: "L4", pct: 92, evidence_count: 6, last_updated: "2026-07-29", course_id: "course-204", assessment_id: null },
    { id: "cm3", competency: "Stakeholder Presentations", skill: "Public Speaking", level: "Intermediate", level_num: "L2", pct: 60, evidence_count: 2, last_updated: "2026-06-25", course_id: null, assessment_id: "assess-55" },
    { id: "cm4", competency: "Wireframing", skill: "UI/UX Design", level: "Beginner", level_num: "L1", pct: 25, evidence_count: 1, last_updated: "2026-05-30", course_id: null, assessment_id: null },
];

const MOCK_EXPERIENCES = [
    { id: "e1", role: "Frontend Engineer", org: "Elimika Ltd.", start_date: "2025-01-10", end_date: null, is_current: true, description: "Building learner-facing product features across the platform.", tags: ["React", "TypeScript"], category: "work", sort_order: 1 },
    { id: "e2", role: "Data Analyst Intern", org: "Nairobi Analytics Co.", start_date: "2024-05-01", end_date: "2024-12-01", is_current: false, description: "Supported the analytics team with reporting and dashboards.", tags: ["SQL", "Data Analysis"], category: "internship", sort_order: 2 },
    { id: "e3", role: "Volunteer Tech Mentor", org: "CodeForAll", start_date: "2023-09-01", end_date: "2024-03-01", is_current: false, description: "Mentored high school students in introductory programming.", tags: ["Mentorship"], category: "volunteer", sort_order: 3 },
    { id: "e4", role: "Personal Portfolio Site", org: "Independent", start_date: "2023-01-15", end_date: "2023-03-01", is_current: false, description: "Designed and built a personal portfolio website.", tags: ["Design", "React"], category: "project", sort_order: 4 },
];

const MOCK_ACHIEVEMENTS = [
    { id: "a1", name: "Fast Learner", description: "Completed 5 courses in a single month.", points: 250, achieved_at: "2026-07-15", status: "Completed", color_key: "bg-blue-500", progress: null },
    { id: "a2", name: "Top Contributor", description: "Ranked in the top 10 on the leaderboard.", points: 400, achieved_at: "2026-06-28", status: "Completed", color_key: "bg-purple-500", progress: null },
    { id: "a3", name: "Certification Streak", description: "Earned 3 credentials back to back.", points: 300, achieved_at: "2026-07-01", status: "Completed", color_key: "bg-emerald-500", progress: null },
    { id: "a4", name: "Mentor in Training", description: "Guide 10 peers through course material.", points: 150, achieved_at: null, status: "In Progress", color_key: "bg-orange-500", progress: 60 },
];

const MOCK_VERIFICATION_EVENTS = [
    { id: "v1", source: "assessment", title: "React Fundamentals Final", skill: "React", change: "scored 92% · Passed", date: "2026-07-29", status: "verified" },
    { id: "v2", source: "assessment", title: "Data Analysis Midterm", skill: "Data Analysis", change: "scored 74% · Passed", date: "2026-07-10", status: "verified" },
    { id: "v3", source: "competition", title: "Regional Hackathon", skill: "React", change: "Placed 2nd of 40 teams", date: "2026-06-20", status: "verified" },
    { id: "v4", source: "instructor_evaluation", title: "Public Speaking Practicum", skill: "Public Speaking", change: "Instructor sign-off pending", date: "2026-07-18", status: "pending" },
    { id: "v5", source: "assessment", title: "Cloud Practitioner Practice Exam", skill: "Cloud Infrastructure", change: "scored 48% · Not passed", date: "2026-05-02", status: "failed" },
];

// ---------- Mock data hooks (swap for real fetching later) ----------
function useWalletSkills() {
    return { data: MOCK_SKILLS, isLoading: false };
}
function usePortfolio() {
    return { data: MOCK_PORTFOLIO, isLoading: false };
}
function useCredentials() {
    return { data: MOCK_CREDENTIALS, isLoading: false };
}
function useCompetencies() {
    return { data: MOCK_COMPETENCIES, isLoading: false };
}
function useExperiences() {
    return { data: MOCK_EXPERIENCES, isLoading: false };
}
function useAchievements() {
    return { data: MOCK_ACHIEVEMENTS, isLoading: false };
}
function useVerificationEvents() {
    return { data: MOCK_VERIFICATION_EVENTS, isLoading: false };
}

// ---------- Overview ----------
function OverviewTab() {
    const skillsQ = useWalletSkills();
    const portfolioQ = usePortfolio();
    const credsQ = useCredentials();
    const compsQ = useCompetencies();
    const achQ = useAchievements();

    const skillsRows = skillsQ.data ?? [];
    const stats = [
        { icon: BookOpen, label: "Total Skills", value: skillsRows.length, tint: "bg-teal-100 text-teal-700" },
        { icon: Target, label: "Competencies", value: (compsQ.data ?? []).length, tint: "bg-purple-100 text-purple-700" },
        {
            icon: Award,
            label: "Certificates",
            value: (credsQ.data ?? []).filter((c: any) => c.status === "Verified").length,
            tint: "bg-orange-100 text-orange-700",
        },
        { icon: Briefcase, label: "Projects", value: (portfolioQ.data ?? []).length, tint: "bg-blue-100 text-blue-700" },
        {
            icon: Trophy,
            label: "Achievements",
            value: (achQ.data ?? []).filter((a: any) => a.status === "Completed").length,
            tint: "bg-emerald-100 text-emerald-700",
        },
    ];
    const topSkills = skillsRows.slice(0, 5).map((s: any) => ({
        name: s.name,
        level: s.level,
        pct: s.proficiency_pct,
        icon: ICON_MAP[s.icon_key] ?? Sparkles,
        tint: s.tint ?? "bg-slate-100 text-slate-700",
    }));
    const recent = (achQ.data ?? [])
        .filter((a: any) => a.status === "Completed")
        .slice(0, 4)
        .map((a: any) => ({
            title: a.name,
            desc: a.description ?? "",
            date: fmtDate(a.achieved_at),
        }));

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">Skills Wallet Overview</h2>
                    <Badge className="bg-emerald-100 text-emerald-700 border-0">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Verified
                    </Badge>
                </div>
                <div className="flex items-center gap-3">
                    <WalletIdCard />
                    <Button className="bg-[#0f4c81] hover:bg-[#0f4c81]/90">
                        <Share2 className="h-4 w-4 mr-2" /> Share Wallet
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {stats.map((s) => (
                    <StatCard key={s.label} {...s} sub={<span className="text-[#0f4c81]">View details →</span>} />
                ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Overall Proficiency</CardTitle>
                            <Badge variant="outline">All Skills</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="flex items-center gap-6">
                        <Donut value={78} label="Overall" sub="↑ 12% vs last month" />
                        <div className="flex-1 space-y-2">
                            <LegendRow color="#0f4c81" label="Expert" value="20%" />
                            <LegendRow color="#7c3aed" label="Advanced" value="35%" />
                            <LegendRow color="#f97316" label="Intermediate" value="25%" />
                            <LegendRow color="#14b8a6" label="Beginner" value="20%" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <CardTitle className="text-base">Top Skills</CardTitle>
                        <Button size="sm" variant="ghost" className="text-[#0f4c81]">
                            View all <ArrowUpRight className="h-3 w-3 ml-1" />
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {topSkills.map((s) => (
                            <div key={s.name} className="flex items-center gap-3">
                                <div className={`h-8 w-8 rounded-md grid place-items-center ${s.tint}`}>
                                    <s.icon className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium truncate">{s.name}</p>
                                        <span className="text-xs text-slate-500">{s.level}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Progress value={s.pct} className="flex-1 h-1.5" />
                                        <span className="text-xs tabular-nums w-9 text-right">{s.pct}%</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <CardTitle className="text-base">Recent Achievements</CardTitle>
                        <Button size="sm" variant="ghost" className="text-[#0f4c81]">
                            View all <ArrowUpRight className="h-3 w-3 ml-1" />
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {recent.map((r) => (
                            <div key={r.title} className="flex items-start gap-3">
                                <div className="h-9 w-9 rounded-md bg-emerald-100 text-emerald-700 grid place-items-center">
                                    <ShieldCheck className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">{r.title}</p>
                                    <p className="text-xs text-slate-500 truncate">{r.desc}</p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">{r.date}</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// ---------- Skills ----------
function SkillsTab() {
    const skillsQ = useWalletSkills();
    const rows = skillsQ.data ?? [];
    const total = rows.length || 1;
    const count = (lvl: string) => rows.filter((s: any) => s.level === lvl).length;
    const pct = (n: number) => `${Math.round((n / total) * 100)}% of total`;
    const stats = [
        { icon: BookOpen, label: "Total Skills", value: rows.length, tint: "bg-teal-100 text-teal-700" },
        {
            icon: Star,
            label: "Expert",
            value: count("Expert"),
            tint: "bg-purple-100 text-purple-700",
            sub: pct(count("Expert")),
        },
        {
            icon: BadgeCheck,
            label: "Advanced",
            value: count("Advanced"),
            tint: "bg-blue-100 text-blue-700",
            sub: pct(count("Advanced")),
        },
        {
            icon: Flame,
            label: "Intermediate",
            value: count("Intermediate"),
            tint: "bg-orange-100 text-orange-700",
            sub: pct(count("Intermediate")),
        },
        {
            icon: Target,
            label: "Beginner",
            value: count("Beginner"),
            tint: "bg-emerald-100 text-emerald-700",
            sub: pct(count("Beginner")),
        },
    ];
    const skills = rows.map((s: any) => ({
        name: s.name,
        level: s.level,
        pct: s.proficiency_pct,
        cat: s.category,
        updated: fmtDate(s.last_used),
        icon: ICON_MAP[s.icon_key] ?? Sparkles,
        tint: s.tint ?? "bg-slate-100 text-slate-700",
    }));
    const catMap = new Map<string, number>();
    rows.forEach((s: any) => catMap.set(s.category, (catMap.get(s.category) ?? 0) + 1));
    const catColors: Record<string, string> = {
        Technology: "#0f4c81",
        Engineering: "#f97316",
        Design: "#a855f7",
        "Soft Skills": "#14b8a6",
        Business: "#3b82f6",
        "Cloud Computing": "#0ea5e9",
    };
    const categories = Array.from(catMap.entries()).map(([name, c]) => ({
        name,
        count: c,
        color: catColors[name] ?? "#64748b",
    }));
    const recommended = [
        { name: "Machine Learning", reason: "Based on your interest in Data Analysis" },
        { name: "Leadership", reason: "Popular skill in your field" },
        { name: "Project Management", reason: "Complements your current skills" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <h2 className="text-xl font-semibold">My Skills</h2>
                    <p className="text-sm text-slate-500">Explore and manage the skills you've acquired and are developing.</p>
                </div>
                <div className="flex items-center gap-3">
                    <WalletIdCard label="Skills Wallet ID" />
                    <Button className="bg-[#0f4c81] hover:bg-[#0f4c81]/90">
                        <Plus className="h-4 w-4 mr-2" /> Add Skill
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {stats.map((s) => (
                    <StatCard key={s.label} {...s} />
                ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-4">
                <Card className="lg:col-span-3">
                    <CardHeader className="pb-3">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div className="flex gap-4 text-sm">
                                {["All Skills", "By Category", "In Progress", "Completed", "Bookmarked"].map((t, i) => (
                                    <button
                                        key={t}
                                        className={`pb-1 ${i === 0 ? "border-b-2 border-[#0f4c81] text-[#0f4c81] font-medium" : "text-slate-500"}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <Input className="h-8 pl-8 w-48" placeholder="Search skills…" />
                                </div>
                                <Button variant="outline" size="sm">
                                    <Filter className="h-3.5 w-3.5 mr-1" /> Filters
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {skills.map((s) => (
                            <div
                                key={s.name}
                                className="flex items-center gap-4 rounded-lg border p-3 hover:border-[#0f4c81]/40 transition"
                            >
                                <div className={`h-10 w-10 rounded-md grid place-items-center ${s.tint}`}>
                                    <s.icon className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1 grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 items-center">
                                    <div className="min-w-0">
                                        <p className="font-medium truncate">{s.name}</p>
                                        <Badge variant="outline" className="text-[10px] mt-1">
                                            {s.level}
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-slate-500">Proficiency</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Progress value={s.pct} className="h-1.5 flex-1" />
                                            <span className="text-xs tabular-nums w-9 text-right">{s.pct}%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-slate-500">Category</p>
                                        <p className="text-sm">{s.cat}</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-slate-500">Last Used</p>
                                        <p className="text-sm">{s.updated}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button size="icon" variant="ghost" className="h-8 w-8">
                                        <Bookmark className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">Skills by Category</CardTitle>
                                <Button size="sm" variant="ghost" className="text-[#0f4c81]">
                                    View all
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {categories.map((c) => (
                                <div key={c.name}>
                                    <div className="flex items-center justify-between text-sm">
                                        <span>{c.name}</span>
                                        <span className="text-slate-500">{c.count} skills</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-slate-100 mt-1 overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${c.count * 10}%`, background: c.color }} />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Recommended for You</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {recommended.map((r) => (
                                <div key={r.name} className="flex items-start gap-3">
                                    <div className="h-8 w-8 rounded-md bg-orange-100 text-orange-700 grid place-items-center">
                                        <Sparkles className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium">{r.name}</p>
                                        <p className="text-xs text-slate-500">{r.reason}</p>
                                    </div>
                                    <Button size="sm" variant="outline" className="h-7 text-xs">
                                        Add
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// ---------- Portfolio ----------
function PortfolioTab() {
    const q = usePortfolio();
    const rows = q.data ?? [];
    const totalViews = rows.reduce((a: number, r: any) => a + (r.views ?? 0), 0);
    const totalLikes = rows.reduce((a: number, r: any) => a + (r.likes ?? 0), 0);
    const stats = [
        { icon: Briefcase, label: "Total Projects", value: rows.length, tint: "bg-blue-100 text-blue-700" },
        {
            icon: Eye,
            label: "Profile Views",
            value: totalViews,
            sub: "+18% this month",
            tint: "bg-purple-100 text-purple-700",
        },
        {
            icon: CheckCircle2,
            label: "Endorsements",
            value: totalLikes,
            sub: "+12% this month",
            tint: "bg-emerald-100 text-emerald-700",
        },
        {
            icon: Download,
            label: "Downloads",
            value: Math.round(totalViews * 0.3),
            sub: "+8% this month",
            tint: "bg-slate-100 text-slate-700",
        },
        { icon: Star, label: "Avg. Rating", value: "4.7", sub: "★★★★★", tint: "bg-orange-100 text-orange-700" },
    ];
    const items = rows.map((r: any) => ({
        title: r.title,
        tag: r.tag,
        desc: r.description,
        views: r.views,
        likes: r.likes,
        date: fmtDate(r.project_date),
        featured: r.featured,
    }));

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <h2 className="text-xl font-semibold">My Portfolio</h2>
                    <p className="text-sm text-slate-500">Showcase your best work and track your impact.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-500">Portfolio Visibility</span>
                        <Badge variant="outline">
                            <Eye className="h-3 w-3 mr-1" /> Public
                        </Badge>
                    </div>
                    <Button className="bg-[#0f4c81] hover:bg-[#0f4c81]/90">
                        <Plus className="h-4 w-4 mr-2" /> Add New Project
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {stats.map((s) => (
                    <StatCard key={s.label} {...s} />
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {items.map((p) => (
                    <Card key={p.title} className="overflow-hidden">
                        <div className="relative h-32 bg-gradient-to-br from-slate-100 to-slate-200 grid place-items-center">
                            {p.featured && <Badge className="absolute top-2 left-2 bg-[#0f4c81]">Featured</Badge>}
                            <Button size="icon" variant="secondary" className="absolute top-2 right-2 h-7 w-7">
                                <Bookmark className="h-3.5 w-3.5" />
                            </Button>
                            <Briefcase className="h-10 w-10 text-slate-400" />
                        </div>
                        <CardContent className="p-4">
                            <Badge variant="outline" className="text-[10px]">
                                {p.tag}
                            </Badge>
                            <p className="font-medium mt-2">{p.title}</p>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.desc}</p>
                            <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                                <span className="flex items-center gap-3">
                                    <span className="flex items-center gap-1">
                                        <Eye className="h-3 w-3" /> {p.views}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3" /> {p.likes}
                                    </span>
                                </span>
                                <span>{p.date}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

// ---------- Credentials Vault ----------
function CredentialsTab() {
    const q = useCredentials();
    const rows = q.data ?? [];
    const total = rows.length || 1;
    const verified = rows.filter((c: any) => c.status === "Verified").length;
    const pending = rows.filter((c: any) => c.status === "Pending").length;
    const expired = rows.filter((c: any) => c.status === "Expired").length;
    const orgs = new Set(rows.map((c: any) => c.org)).size;
    const stats = [
        { icon: ShieldCheck, label: "Total Credentials", value: rows.length, tint: "bg-teal-100 text-teal-700" },
        {
            icon: CheckCircle2,
            label: "Verified",
            value: verified,
            sub: `${Math.round((verified / total) * 100)}% of total`,
            tint: "bg-emerald-100 text-emerald-700",
        },
        {
            icon: Clock,
            label: "Pending",
            value: pending,
            sub: `${Math.round((pending / total) * 100)}% of total`,
            tint: "bg-blue-100 text-blue-700",
        },
        {
            icon: AlertBadge,
            label: "Expired",
            value: expired,
            sub: `${Math.round((expired / total) * 100)}% of total`,
            tint: "bg-orange-100 text-orange-700",
        },
        { icon: Trophy, label: "Issuing Orgs", value: orgs, tint: "bg-purple-100 text-purple-700" },
    ];
    const creds = rows.map((c: any) => ({
        name: c.name,
        org: c.org,
        issued: fmtDate(c.issued_at),
        id: c.credential_code,
        status: c.status,
    }));

    // Export is mocked out below — wire up a real PDF export utility when a backend exists.
    const [exporting, setExporting] = useState(false);
    const handleExport = async () => {
        setExporting(true);
        await new Promise((res) => setTimeout(res, 600));
        // eslint-disable-next-line no-console
        console.log("Mock export of credentials PDF for:", rows);
        setExporting(false);
    };

    const StatusBadge = ({ s }: { s: string }) => {
        if (s === "Verified")
            return (
                <Badge className="bg-emerald-100 text-emerald-700 border-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Verified
                </Badge>
            );
        if (s === "Pending")
            return (
                <Badge className="bg-orange-100 text-orange-700 border-0">
                    <Clock className="h-3 w-3 mr-1" /> Pending
                </Badge>
            );
        return (
            <Badge className="bg-red-100 text-red-700 border-0">
                <XCircle className="h-3 w-3 mr-1" /> Expired
            </Badge>
        );
    };
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">Credentials Vault</h2>
                    <ShieldCheck className="h-5 w-5 text-[#0f4c81]" />
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleExport} disabled={exporting || q.isLoading}>
                        <Download className="h-4 w-4 mr-2" />
                        {exporting ? "Preparing…" : "Export PDF"}
                    </Button>
                    <Button className="bg-[#0f4c81] hover:bg-[#0f4c81]/90">
                        <Plus className="h-4 w-4 mr-2" /> Add Credential
                    </Button>
                </div>
            </div>
            <p className="-mt-4 text-sm text-slate-500">
                Store, manage and verify your certificates, licenses, degrees and credentials. Export includes verification
                proofs for sharing.
            </p>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {stats.map((s) => (
                    <StatCard key={s.label} {...s} />
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {creds.map((c) => (
                    <Card key={c.id} className="overflow-hidden">
                        <div className="relative h-28 bg-gradient-to-br from-[#0f4c81]/10 to-[#14b8a6]/10 grid place-items-center">
                            <Award className="h-10 w-10 text-[#0f4c81]" />
                            <div className="absolute top-2 right-2">
                                <StatusBadge s={c.status} />
                            </div>
                        </div>
                        <CardContent className="p-4">
                            <p className="font-medium">{c.name}</p>
                            <p className="text-xs text-slate-500">{c.org}</p>
                            <p className="text-xs text-slate-500 mt-1">Issued: {c.issued}</p>
                            <div className="mt-2">
                                <p className="text-[10px] uppercase tracking-wider text-slate-400">Credential ID</p>
                                <p className="text-xs font-mono">{c.id}</p>
                            </div>
                            <div className="flex items-center gap-1 mt-3">
                                <Button size="sm" variant="ghost" className="h-7 text-xs flex-1">
                                    <Eye className="h-3 w-3 mr-1" /> View
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 text-xs flex-1">
                                    <Share2 className="h-3 w-3 mr-1" /> Share
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 text-xs flex-1">
                                    <Download className="h-3 w-3 mr-1" /> Download
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function AlertBadge(props: any) {
    return <Clock {...props} />;
}

// ---------- Competencies ----------
function CompetenciesTab() {
    const q = useCompetencies();
    const data = q.data ?? [];
    const total = data.length || 1;
    const mastered = data.filter((r: any) => r.pct >= 80).length;
    const inProgress = data.filter((r: any) => r.pct > 0 && r.pct < 80).length;
    const notStarted = data.filter((r: any) => r.pct === 0).length;
    const overall = data.length ? Math.round(data.reduce((s: number, r: any) => s + (r.pct ?? 0), 0) / data.length) : 0;
    const stats = [
        {
            icon: CheckCircle2,
            label: "Mastered",
            value: mastered,
            sub: `${Math.round((mastered / total) * 100)}% of total`,
            tint: "bg-emerald-100 text-emerald-700",
        },
        {
            icon: Clock,
            label: "In Progress",
            value: inProgress,
            sub: `${Math.round((inProgress / total) * 100)}% of total`,
            tint: "bg-orange-100 text-orange-700",
        },
        {
            icon: BookOpen,
            label: "Not Started",
            value: notStarted,
            sub: `${Math.round((notStarted / total) * 100)}% of total`,
            tint: "bg-blue-100 text-blue-700",
        },
        {
            icon: Star,
            label: "Total Competencies",
            value: data.length,
            sub: "Across all skills",
            tint: "bg-purple-100 text-purple-700",
        },
    ];

    const tierOf = (pct: number) =>
        pct >= 80
            ? {
                label: "Mastered",
                ring: "ring-emerald-300",
                grad: "from-emerald-500 to-teal-500",
                bg: "bg-emerald-50",
                text: "text-emerald-700",
                bar: "bg-emerald-500",
            }
            : pct >= 40
                ? {
                    label: "In Progress",
                    ring: "ring-orange-200",
                    grad: "from-orange-500 to-amber-500",
                    bg: "bg-orange-50",
                    text: "text-orange-700",
                    bar: "bg-orange-500",
                }
                : {
                    label: "Getting Started",
                    ring: "ring-slate-200",
                    grad: "from-slate-400 to-slate-500",
                    bg: "bg-slate-50",
                    text: "text-slate-600",
                    bar: "bg-slate-400",
                };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <h2 className="text-xl font-semibold">My Competencies</h2>
                    <p className="text-sm text-slate-500">
                        Earned badges by skill area. Click any badge to open the course or assessment behind it.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button className="bg-[#0f4c81] hover:bg-[#0f4c81]/90">
                        <Plus className="h-4 w-4 mr-2" /> Add Evidence
                    </Button>
                    <Button variant="outline">
                        <Share2 className="h-4 w-4 mr-2" /> Share Profile
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <Donut value={overall} size={96} stroke={10} label="Overall" sub={`${data.length} badges`} />
                        <div>
                            <p className="text-sm text-slate-500">Overall Competency</p>
                            <p className="text-xs text-slate-500 mt-1">avg. across all badges</p>
                        </div>
                    </CardContent>
                </Card>
                {stats.map((s) => (
                    <StatCard key={s.label} {...s} />
                ))}
            </div>

            {q.isLoading ? (
                <div className="text-sm text-slate-500">Loading badges…</div>
            ) : data.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center text-sm text-slate-500">
                        No competencies yet. Complete a course or assessment to earn your first badge.
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {data.map((r: any) => {
                        const tier = tierOf(r.pct ?? 0);
                        const linkLabel = r.course_id ? "Open course" : r.assessment_id ? "Open assessment" : "View details";
                        return (
                            <button key={r.id} type="button" className="group block w-full text-left focus:outline-none">
                                <Card
                                    className={`h-full transition-all group-hover:shadow-md group-hover:-translate-y-0.5 ring-1 ${tier.ring}`}
                                >
                                    <CardContent className="p-5">
                                        <div className="flex items-start gap-4">
                                            <div
                                                className={`relative flex-shrink-0 h-16 w-16 rounded-full bg-gradient-to-br ${tier.grad} flex items-center justify-center shadow-inner`}
                                            >
                                                <Award className="h-8 w-8 text-white" />
                                                {r.pct >= 80 && (
                                                    <span className="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5 shadow">
                                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                    </span>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="font-semibold text-slate-900 truncate">{r.competency}</p>
                                                    <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-[#0f4c81] flex-shrink-0" />
                                                </div>
                                                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                                    <Badge variant="outline" className="text-xs">
                                                        {r.skill}
                                                    </Badge>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${tier.bg} ${tier.text}`}>
                                                        {tier.label}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {r.level} · {r.level_num}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                                                <span>Progress</span>
                                                <span className="tabular-nums font-medium text-slate-700">{r.pct}%</span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                                                <div
                                                    className={`h-full ${tier.bar} transition-all`}
                                                    style={{ width: `${Math.min(100, r.pct ?? 0)}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                                            <span className="inline-flex items-center gap-1">
                                                <FileCheck2 className="h-3.5 w-3.5" /> {r.evidence_count ?? 0} evidence
                                            </span>
                                            <span>{fmtDate(r.last_updated)}</span>
                                        </div>

                                        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-[#0f4c81]">
                                            {r.course_id ? (
                                                <BookOpen className="h-3.5 w-3.5" />
                                            ) : r.assessment_id ? (
                                                <ClipboardCheck className="h-3.5 w-3.5" />
                                            ) : (
                                                <Eye className="h-3.5 w-3.5" />
                                            )}
                                            {linkLabel}
                                        </div>
                                    </CardContent>
                                </Card>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ---------- Experience ----------
function ExperienceTab() {
    const q = useExperiences();
    const data = q.data ?? [];
    const catCount = (c: string) => data.filter((r: any) => r.category === c).length;
    const stats = [
        {
            icon: Briefcase,
            label: "Total Experiences",
            value: data.length,
            sub: "Across all categories",
            tint: "bg-teal-100 text-teal-700",
        },
        {
            icon: FileCheck2,
            label: "Work Experience",
            value: catCount("work"),
            sub: "Professional roles",
            tint: "bg-blue-100 text-blue-700",
        },
        {
            icon: GraduationCap,
            label: "Internships",
            value: catCount("internship"),
            sub: "Career internships",
            tint: "bg-purple-100 text-purple-700",
        },
        {
            icon: Users,
            label: "Volunteering",
            value: catCount("volunteer"),
            sub: "Giving back",
            tint: "bg-orange-100 text-orange-700",
        },
        {
            icon: BookOpen,
            label: "Projects",
            value: catCount("project"),
            sub: "Key projects",
            tint: "bg-emerald-100 text-emerald-700",
        },
    ];
    const fmtRange = (s?: string | null, e?: string | null, cur?: boolean) => {
        const startD = s ? new Date(s).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—";
        const endD = cur
            ? "Present"
            : e
                ? new Date(e).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                : "—";
        return `${startD} – ${endD}`;
    };
    const durOf = (s?: string | null, e?: string | null, cur?: boolean) => {
        if (!s) return "";
        const start = new Date(s);
        const end = cur ? new Date() : e ? new Date(e) : new Date();
        const months = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)));
        const y = Math.floor(months / 12),
            m = months % 12;
        return [y ? `${y} yr${y > 1 ? "s" : ""}` : "", m ? `${m} mo${m > 1 ? "s" : ""}` : ""].filter(Boolean).join(" ");
    };
    const items = data.map((r: any) => ({
        role: r.role,
        org: r.org,
        date: fmtRange(r.start_date, r.end_date, r.is_current),
        duration: durOf(r.start_date, r.end_date, r.is_current),
        current: r.is_current,
        desc: r.description,
        tags: r.tags ?? [],
    }));

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <h2 className="text-xl font-semibold">My Experience</h2>
                    <p className="text-sm text-slate-500">
                        Showcase your work history, internships, volunteering and life experiences.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button className="bg-[#0f4c81] hover:bg-[#0f4c81]/90">
                        <Plus className="h-4 w-4 mr-2" /> Add Experience
                    </Button>
                    <Button variant="outline">
                        <Share2 className="h-4 w-4 mr-2" /> Share Experience
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {stats.map((s) => (
                    <StatCard key={s.label} {...s} />
                ))}
            </div>

            <Card>
                <CardContent className="p-6">
                    <div className="relative pl-8">
                        <div className="absolute left-3 top-2 bottom-2 w-px bg-slate-200" />
                        <div className="space-y-6">
                            {items.map((it) => (
                                <div key={it.role} className="relative">
                                    <div className="absolute -left-6 top-2 h-3 w-3 rounded-full bg-[#0f4c81] ring-4 ring-white" />
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold">{it.role}</p>
                                                {it.current && <Badge className="bg-emerald-100 text-emerald-700 border-0">Current</Badge>}
                                            </div>
                                            <p className="text-sm text-slate-600">{it.org}</p>
                                            <p className="text-sm text-slate-500 mt-1">{it.desc}</p>
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {it.tags.map((t: string) => (
                                                    <Badge key={t} variant="outline" className="text-[10px]">
                                                        {t}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="text-right text-xs text-slate-500 shrink-0">
                                            <div>{it.date}</div>
                                            <div className="mt-1">{it.duration}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// ---------- Achievements ----------
function AchievementsTab() {
    const q = useAchievements();
    const data = q.data ?? [];
    const completed = data.filter((a: any) => a.status === "Completed");
    const totalPts = completed.reduce((a: number, r: any) => a + (r.points ?? 0), 0);
    const stats = [
        {
            icon: Trophy,
            label: "Total Achievements",
            value: data.length,
            sub: "Across all categories",
            tint: "bg-teal-100 text-teal-700",
        },
        {
            icon: Star,
            label: "Milestones Reached",
            value: completed.length,
            sub: "+20% this month",
            tint: "bg-purple-100 text-purple-700",
        },
        { icon: Flame, label: "Streak", value: 15, sub: "Days in a row 🔥", tint: "bg-orange-100 text-orange-700" },
        {
            icon: Award,
            label: "Points Earned",
            value: totalPts.toLocaleString(),
            sub: "+180 this month",
            tint: "bg-blue-100 text-blue-700",
        },
    ];
    const badges = data.map((a: any) => ({
        name: a.name,
        desc: a.description ?? "",
        pts: a.points,
        date: a.status === "In Progress" ? "In progress" : fmtDate(a.achieved_at),
        color: a.color_key ?? "bg-slate-500",
        status: a.status,
        progress: a.progress ?? undefined,
    }));

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <h2 className="text-xl font-semibold">Achievements</h2>
                    <p className="text-sm text-slate-500">
                        Celebrate your milestones and track your progress on your learning journey.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <Share2 className="h-4 w-4 mr-2" /> Share Achievements
                    </Button>
                    <Button className="bg-[#0f4c81] hover:bg-[#0f4c81]/90">
                        <Plus className="h-4 w-4 mr-2" /> Add Achievement
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((s) => (
                    <StatCard key={s.label} {...s} />
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {badges.map((b) => (
                    <Card key={b.name} className="overflow-hidden">
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div className={`h-14 w-14 ${b.color} text-white rounded-xl grid place-items-center`}>
                                    <Trophy className="h-7 w-7" />
                                </div>
                                <Badge
                                    className={
                                        b.status === "Completed"
                                            ? "bg-emerald-100 text-emerald-700 border-0"
                                            : "bg-orange-100 text-orange-700 border-0"
                                    }
                                >
                                    {b.status}
                                </Badge>
                            </div>
                            <p className="font-semibold mt-3">{b.name}</p>
                            <p className="text-xs text-slate-500 mt-1 min-h-8">{b.desc}</p>
                            {b.progress != null && (
                                <div className="mt-2">
                                    <Progress value={b.progress} className="h-1.5" />
                                </div>
                            )}
                            <div className="flex items-center justify-between mt-3 text-xs">
                                <Badge variant="outline" className="text-[10px]">
                                    +{b.pts} Points
                                </Badge>
                                <span className="text-slate-500">{b.date}</span>
                            </div>
                            <Button variant="ghost" size="sm" className="w-full mt-2 text-[#0f4c81]">
                                View Details <ArrowUpRight className="h-3 w-3 ml-1" />
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

// ---------- Verification ----------
const SOURCE_META: Record<string, { icon: any; title: string; desc: string; tint: string }> = {
    assessment: {
        icon: FileCheck2,
        title: "Assessments",
        desc: "Skills automatically updated from graded course assessments.",
        tint: "bg-blue-100 text-blue-700",
    },
    competition: {
        icon: Trophy,
        title: "Competitions",
        desc: "Verified from event organisers when you rank or complete a competition.",
        tint: "bg-orange-100 text-orange-700",
    },
    instructor_evaluation: {
        icon: UserCheck,
        title: "Instructor Evaluations",
        desc: "Instructor sign-off on your practical and observed skills.",
        tint: "bg-purple-100 text-purple-700",
    },
};
const SOURCE_LABEL: Record<string, string> = {
    assessment: "Assessment",
    competition: "Competition",
    instructor_evaluation: "Instructor Evaluation",
};

function StatusBadge({ status }: { status: string }) {
    if (status === "verified")
        return (
            <Badge className="bg-emerald-100 text-emerald-700 border-0">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Verified
            </Badge>
        );
    if (status === "pending")
        return (
            <Badge className="bg-amber-100 text-amber-700 border-0">
                <Clock className="h-3 w-3 mr-1" /> Pending
            </Badge>
        );
    return (
        <Badge className="bg-rose-100 text-rose-700 border-0">
            <XCircle className="h-3 w-3 mr-1" /> Failed
        </Badge>
    );
}

function VerificationTab() {
    const q = useVerificationEvents();
    const [filter, setFilter] = useState<"all" | "assessment" | "competition" | "instructor_evaluation">("all");
    const all = q.data ?? [];
    const events = filter === "all" ? all : all.filter((e) => e.source === filter);

    const sources = (["assessment", "competition", "instructor_evaluation"] as const).map((key) => {
        const meta = SOURCE_META[key];
        const items = all.filter((e) => e.source === key);
        const verified = items.filter((e) => e.status === "verified").length;
        const latest = items[0];
        return {
            key,
            ...meta,
            count: verified,
            total: items.length,
            last: latest
                ? `${latest.title}${latest.change ? " · " + latest.change : ""} · ${fmtDate(latest.date)}`
                : "No activity yet",
        };
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-semibold">Verification</h2>
                        <Badge className="bg-emerald-100 text-emerald-700 border-0">
                            <ShieldCheck className="h-3 w-3 mr-1" /> Auto-updated
                        </Badge>
                    </div>
                    <p className="text-sm text-slate-500">
                        Your Skills Wallet is automatically updated after course completion from three trusted sources.
                    </p>
                </div>
                <WalletIdCard />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {sources.map((s) => (
                    <Card key={s.key}>
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                                <div className={`h-12 w-12 rounded-xl grid place-items-center ${s.tint}`}>
                                    <s.icon className="h-6 w-6" />
                                </div>
                                <Badge variant="outline">
                                    {s.count}/{s.total} verified
                                </Badge>
                            </div>
                            <p className="font-semibold mt-3">{s.title}</p>
                            <p className="text-xs text-slate-500 mt-1">{s.desc}</p>
                            <div className="mt-3 rounded-md bg-slate-50 p-3 text-xs">
                                <p className="text-slate-400 uppercase tracking-wider text-[10px]">Latest</p>
                                <p className="text-slate-700 mt-0.5">{s.last}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                            <CardTitle className="text-base">Verification Activity</CardTitle>
                            <CardDescription>Every automatic update to your Skills Wallet, with source and evidence.</CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-1">
                            {(
                                [
                                    ["all", "All"],
                                    ["assessment", "Assessments"],
                                    ["competition", "Competitions"],
                                    ["instructor_evaluation", "Instructor"],
                                ] as const
                            ).map(([key, label]) => (
                                <Button
                                    key={key}
                                    size="sm"
                                    variant={filter === key ? "default" : "outline"}
                                    className={filter === key ? "bg-[#0f4c81] hover:bg-[#0f4c81]/90" : ""}
                                    onClick={() => setFilter(key)}
                                >
                                    {label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                    <th className="text-left px-4 py-3 font-medium">Source</th>
                                    <th className="text-left px-4 py-3 font-medium">Event</th>
                                    <th className="text-left px-4 py-3 font-medium">Skill</th>
                                    <th className="text-left px-4 py-3 font-medium">Change</th>
                                    <th className="text-left px-4 py-3 font-medium">Date</th>
                                    <th className="text-left px-4 py-3 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {q.isLoading && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                                            Loading…
                                        </td>
                                    </tr>
                                )}
                                {!q.isLoading && events.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                                            No verification events yet.
                                        </td>
                                    </tr>
                                )}
                                {events.map((e) => (
                                    <tr key={e.id} className="border-t hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <Badge variant="outline">{SOURCE_LABEL[e.source]}</Badge>
                                        </td>
                                        <td className="px-4 py-3 font-medium">{e.title}</td>
                                        <td className="px-4 py-3 text-slate-600">{e.skill}</td>
                                        <td className="px-4 py-3 text-slate-600">{e.change}</td>
                                        <td className="px-4 py-3 text-slate-500">{fmtDate(e.date)}</td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={e.status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">How verification works</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3 text-sm">
                    <div className="flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-[#0f4c81]/10 text-[#0f4c81] grid place-items-center text-xs font-semibold">
                            1
                        </div>
                        <div>
                            <p className="font-medium">Complete a course activity</p>
                            <p className="text-slate-500">
                                Submit an assessment, finish a competition, or wrap an instructor-led class.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-[#0f4c81]/10 text-[#0f4c81] grid place-items-center text-xs font-semibold">
                            2
                        </div>
                        <div>
                            <p className="font-medium">Elimika verifies the outcome</p>
                            <p className="text-slate-500">
                                Grades, rankings and instructor sign-off are cross-checked against your enrolment.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-[#0f4c81]/10 text-[#0f4c81] grid place-items-center text-xs font-semibold">
                            3
                        </div>
                        <div>
                            <p className="font-medium">Wallet updates automatically</p>
                            <p className="text-slate-500">
                                Skill levels, competencies and achievements are updated with a verifiable record.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}