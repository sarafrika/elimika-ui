import { Banknote, CalendarDays, CheckCircle2, Clock, Download, Filter, Inbox, RefreshCcw, ShieldCheck, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { Donut, TOKEN } from "../../../_components/color-charts";
import { SectionHeader, StatCard, StatusBadge } from "../page";

type DisbursementStatus = "Upcoming" | "Processing" | "Completed" | "Failed" | "Cancelled";

type Disbursement = {
    id: string;
    name: string;
    funding: string;
    allocationType: string;
    amount: number;
    date: string; // ISO
    to: string;
    status: DisbursementStatus;
};

function daysFromNow(n: number) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString();
}
function daysAgo(n: number) {
    return daysFromNow(-n);
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function relativeLabel(iso: string) {
    const diffDays = Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000);
    if (diffDays === 0) return "Today";
    if (diffDays > 0) return `In ${diffDays} day${diffDays === 1 ? "" : "s"}`;
    return `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"} ago`;
}

// Comprehensive disbursement dataset — every stat card, the summary donut, the
// filterable table and the "recent" panel are all derived from this single list.
const disbursements: Disbursement[] = [
    // Upcoming (5)
    { id: "WTG-2026-004", name: "Equipment Allowance", funding: "Women in Tech Grant", allocationType: "Equipment Support", amount: 3000, date: daysFromNow(19), to: "Approved Vendor", status: "Upcoming" },
    { id: "DSP-2026-006", name: "Stipend Release - June", funding: "Digital Skills Scholarship 2026", allocationType: "Stipend", amount: 2000, date: daysFromNow(5), to: "Student Wallet", status: "Upcoming" },
    { id: "DSP-2026-007", name: "Tuition Payment - Term 2", funding: "Digital Skills Scholarship 2026", allocationType: "Tuition Fees", amount: 20000, date: daysFromNow(9), to: "ABC Institute", status: "Upcoming" },
    { id: "DSP-2026-008", name: "Assessments Fee", funding: "Digital Skills Scholarship 2026", allocationType: "Assessments & Exams", amount: 1500, date: daysFromNow(14), to: "Exam Board", status: "Upcoming" },
    { id: "WTG-2026-005", name: "Transport Stipend", funding: "Women in Tech Grant", allocationType: "Transport", amount: 1500, date: daysFromNow(24), to: "Student Wallet", status: "Upcoming" },

    // Processing (2)
    { id: "DSP-2026-009", name: "Certification Exam Fee", funding: "Digital Skills Scholarship 2026", allocationType: "Assessments & Exams", amount: 2500, date: daysAgo(1), to: "Exam Board", status: "Processing" },
    { id: "WTG-2026-006", name: "Learning Materials Allowance", funding: "Women in Tech Grant", allocationType: "Learning Materials", amount: 1000, date: daysAgo(2), to: "Student Wallet", status: "Processing" },

    // Completed (9)
    { id: "DSP-2026-001", name: "Tuition Payment - Term 1", funding: "Digital Skills Scholarship 2026", allocationType: "Tuition Fees", amount: 20000, date: daysAgo(20), to: "ABC Institute", status: "Completed" },
    { id: "DSP-2026-002", name: "Stipend Release - May", funding: "Digital Skills Scholarship 2026", allocationType: "Stipend", amount: 2000, date: daysAgo(34), to: "Student Wallet", status: "Completed" },
    { id: "DSP-2026-003", name: "Assessments Fee", funding: "Digital Skills Scholarship 2026", allocationType: "Assessments & Exams", amount: 1500, date: daysAgo(37), to: "Exam Board", status: "Completed" },
    { id: "WTG-2026-001", name: "Stipend Release - April", funding: "Women in Tech Grant", allocationType: "Stipend", amount: 2000, date: daysAgo(45), to: "Student Wallet", status: "Completed" },
    { id: "DSP-2026-004", name: "Tuition Payment - Orientation", funding: "Digital Skills Scholarship 2026", allocationType: "Tuition Fees", amount: 5000, date: daysAgo(60), to: "ABC Institute", status: "Completed" },
    { id: "WTG-2026-002", name: "Equipment Purchase - Laptop Bag", funding: "Women in Tech Grant", allocationType: "Equipment Support", amount: 1500, date: daysAgo(50), to: "Approved Vendor", status: "Completed" },
    { id: "DSP-2026-005", name: "Learning Materials - Textbooks", funding: "Digital Skills Scholarship 2026", allocationType: "Learning Materials", amount: 1000, date: daysAgo(55), to: "DevHub Bookstore", status: "Completed" },
    { id: "WTG-2026-007", name: "Stipend Release - March", funding: "Women in Tech Grant", allocationType: "Stipend", amount: 2000, date: daysAgo(75), to: "Student Wallet", status: "Completed" },
    { id: "DSP-2026-010", name: "Assessments Fee - Mock Exam", funding: "Digital Skills Scholarship 2026", allocationType: "Assessments & Exams", amount: 800, date: daysAgo(65), to: "Exam Board", status: "Completed" },

    // Failed (1)
    { id: "WTG-2026-003", name: "Equipment Purchase", funding: "Women in Tech Grant", allocationType: "Equipment Support", amount: 3000, date: daysAgo(15), to: "Approved Vendor", status: "Failed" },

    // Cancelled (1)
    { id: "WTG-2026-008", name: "Transport Stipend - February", funding: "Women in Tech Grant", allocationType: "Transport", amount: 1500, date: daysAgo(90), to: "Student Wallet", status: "Cancelled" },
];

const STATUS_TABS: { key: "All" | DisbursementStatus; label: string }[] = [
    { key: "All", label: "All" },
    { key: "Upcoming", label: "Upcoming" },
    { key: "Processing", label: "Processing" },
    { key: "Completed", label: "Completed" },
    { key: "Failed", label: "Failed" },
    { key: "Cancelled", label: "Cancelled" },
];

export function DisbursementsTab() {
    const [activeStatus, setActiveStatus] = useState<(typeof STATUS_TABS)[number]["key"]>("All");

    const counts = useMemo(() => {
        const c: Record<"All" | DisbursementStatus, number> = {
            All: disbursements.length,
            Upcoming: 0,
            Processing: 0,
            Completed: 0,
            Failed: 0,
            Cancelled: 0,
        };
        for (const d of disbursements) c[d.status]++;
        return c;
    }, []);

    const totals = useMemo(() => {
        const sum = (list: Disbursement[]) => list.reduce((s, d) => s + d.amount, 0);
        const completed = disbursements.filter((d) => d.status === "Completed");
        const upcoming = disbursements.filter((d) => d.status === "Upcoming");
        const processing = disbursements.filter((d) => d.status === "Processing");
        const failed = disbursements.filter((d) => d.status === "Failed");

        const totalDisbursed = sum(completed);
        const totalUpcoming = sum(upcoming);
        const totalProcessing = sum(processing);
        const totalFailed = sum(failed);
        // Scheduled = everything that has (or will have) moved money — excludes cancelled.
        const totalScheduled = totalDisbursed + totalUpcoming + totalProcessing + totalFailed;

        return { totalDisbursed, totalUpcoming, totalProcessing, totalFailed, totalScheduled };
    }, []);

    const summarySegments = useMemo(() => {
        const raw = [
            { label: "Completed", value: totals.totalDisbursed, color: TOKEN.success },
            { label: "Upcoming", value: totals.totalUpcoming, color: TOKEN.info },
            { label: "Processing", value: totals.totalProcessing, color: TOKEN.warning },
            { label: "Failed", value: totals.totalFailed, color: TOKEN.destructive },
        ];
        return raw.map((s) => ({
            ...s,
            percentage: totals.totalScheduled > 0 ? (s.value / totals.totalScheduled) * 100 : 0,
        }));
    }, [totals]);

    const filtered = useMemo(() => {
        const list = activeStatus === "All" ? disbursements : disbursements.filter((d) => d.status === activeStatus);
        // Upcoming/processing first by soonest date, everything else most-recent-first.
        return [...list].sort((a, b) => {
            const aFuture = a.status === "Upcoming" || a.status === "Processing";
            const bFuture = b.status === "Upcoming" || b.status === "Processing";
            if (aFuture && bFuture) return new Date(a.date).getTime() - new Date(b.date).getTime();
            if (!aFuture && !bFuture) return new Date(b.date).getTime() - new Date(a.date).getTime();
            return aFuture ? -1 : 1;
        });
    }, [activeStatus]);

    const recent = useMemo(() => {
        return disbursements
            .filter((d) => d.status === "Completed" || d.status === "Failed")
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 6);
    }, []);

    const tableTitle = activeStatus === "All" ? `All Disbursements (${counts.All})` : `${activeStatus} Disbursements (${counts[activeStatus]})`;

    return (
        <div className="grid gap-6 min-w-0 *:min-w-0 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-4">
                <SectionHeader
                    title="Disbursements"
                    desc="Track all funding releases, upcoming payments and disbursement history."
                    right={<div className="flex gap-2"><Button variant="outline" size="sm" className="gap-1"><Filter className="h-4 w-4" /> Filters</Button><Button size="sm" className="gap-1 bg-primary hover:bg-primary/90 text-primary-foreground"><Download className="h-4 w-4" /> Export</Button></div>}
                />
                <div className="flex flex-wrap gap-2 border-b">
                    {STATUS_TABS.map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => setActiveStatus(t.key)}
                            aria-current={t.key === activeStatus ? "true" : undefined}
                            className={`px-3 py-2 text-sm border-b-2 -mb-px transition-colors ${t.key === activeStatus ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                        >
                            {t.label} {counts[t.key]}
                        </button>
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <StatCard icon={CalendarDays} tint="bg-success/10 text-success" label="Total Disbursed" value={`KES ${totals.totalDisbursed.toLocaleString()}`} sub={`Across ${counts.Completed} payments`} />
                    <StatCard icon={Clock} tint="bg-accent/10 text-accent" label="Upcoming Disbursements" value={`KES ${totals.totalUpcoming.toLocaleString()}`} sub={`Across ${counts.Upcoming} payments`} />
                    <StatCard icon={RefreshCcw} tint="bg-warning/10 text-warning" label="Processing" value={`KES ${totals.totalProcessing.toLocaleString()}`} sub={`Across ${counts.Processing} payments`} />
                    <StatCard icon={Banknote} tint="bg-info/10 text-info" label="Total Scheduled" value={`KES ${totals.totalScheduled.toLocaleString()}`} sub="This year" />
                </div>

                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base">{tableTitle}</CardTitle></CardHeader>
                    <CardContent className="p-0 overflow-x-auto">
                        {filtered.length === 0 ? (
                            <div className="py-12 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                                <Inbox className="h-6 w-6 text-muted-foreground" />
                                No {activeStatus === "All" ? "" : activeStatus.toLowerCase() + " "}disbursements to show.
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="text-xs text-muted-foreground bg-muted/50">
                                    <tr>{["Disbursement", "Funding", "Allocation Type", "Amount", "Date", "To", "Status", "Action"].map((h) => (<th key={h} className="text-left px-3 py-2 font-medium">{h}</th>))}</tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filtered.map((d) => (
                                        <tr key={d.id} className="hover:bg-muted/40">
                                            <td className="px-3 py-2"><p className="font-medium text-foreground">{d.name}</p><p className="text-[10px] text-muted-foreground font-mono">#{d.id}</p></td>
                                            <td className="px-3 py-2 text-muted-foreground text-xs">{d.funding}</td>
                                            <td className="px-3 py-2 text-muted-foreground text-xs">{d.allocationType}</td>
                                            <td className="px-3 py-2 font-medium">KES {d.amount.toLocaleString()}</td>
                                            <td className="px-3 py-2 text-xs"><p>{formatDate(d.date)}</p><p className="text-muted-foreground">{relativeLabel(d.date)}</p></td>
                                            <td className="px-3 py-2 text-xs">{d.to}</td>
                                            <td className="px-3 py-2"><StatusBadge status={d.status} /></td>
                                            <td className="px-3 py-2">
                                                {d.status === "Completed" ? (
                                                    <Button size="sm" variant="link" className="p-0 h-auto"><Download className="h-3.5 w-3.5 mr-1" />Download</Button>
                                                ) : d.status === "Upcoming" || d.status === "Processing" ? (
                                                    <Button size="sm" variant="outline">View</Button>
                                                ) : (
                                                    "—"
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base">Recent Disbursements</CardTitle></CardHeader>
                    <CardContent className="p-0 overflow-x-auto">
                        {recent.length === 0 ? (
                            <div className="py-12 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                                <Inbox className="h-6 w-6 text-muted-foreground" />
                                No disbursements have been processed yet.
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="text-xs text-muted-foreground bg-muted/50">
                                    <tr>{["Disbursement", "Allocation", "Amount", "To", "Date", "Status", "Receipt"].map((h) => (<th key={h} className="text-left px-3 py-2 font-medium">{h}</th>))}</tr>
                                </thead>
                                <tbody className="divide-y">
                                    {recent.map((d) => (
                                        <tr key={d.id} className="hover:bg-muted/40">
                                            <td className="px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    {d.status === "Completed" ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-destructive" />}
                                                    <div><p className="font-medium text-foreground">{d.name}</p><p className="text-[10px] text-muted-foreground font-mono">#{d.id}</p></div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-muted-foreground text-xs">{d.allocationType}</td>
                                            <td className="px-3 py-2 font-medium">KES {d.amount.toLocaleString()}</td>
                                            <td className="px-3 py-2 text-xs">{d.to}</td>
                                            <td className="px-3 py-2 text-xs">{formatDate(d.date)}</td>
                                            <td className="px-3 py-2"><StatusBadge status={d.status} /></td>
                                            <td className="px-3 py-2">{d.status === "Completed" ? <Button size="sm" variant="link" className="p-0 h-auto"><Download className="h-3.5 w-3.5 mr-1" />Download</Button> : "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </CardContent>
                </Card>
            </div>

            <aside className="space-y-4 min-w-0">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base">Disbursement Summary</CardTitle></CardHeader>
                    <CardContent className="flex flex-col items-center gap-3">
                        <Donut segments={summarySegments} centerTop={totals.totalScheduled.toLocaleString()} centerBottom="Total Scheduled" />

                        <div className="space-y-1 text-xs w-full">
                            {summarySegments.map((s) => (
                                <div key={s.label} className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-sm" style={{ background: s.color }} />
                                    {s.label}
                                    <span className="text-muted-foreground ml-auto">
                                        {s.value.toLocaleString()} ({s.percentage.toFixed(1)}%)
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base">About Disbursements</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-xs text-muted-foreground">
                        {["Funds are released according to the terms of your award.", "Some payments go directly to institutions or service providers.", "Stipends and allowances are paid to your Student Wallet.", "Ensure you meet all conditions to avoid delays."].map((t) => (
                            <div key={t} className="flex gap-2"><ShieldCheck className="h-3.5 w-3.5 text-success mt-0.5" />{t}</div>
                        ))}
                    </CardContent>
                </Card>
            </aside>
        </div>
    );
}