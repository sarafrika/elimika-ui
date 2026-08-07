'use client'


import { Banknote, BookOpen, Building2, CalendarDays, CircleDollarSign, ClipboardList, Clock, GraduationCap, Info, Laptop, PieChart, ShieldCheck, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "../../../../../components/ui/badge";
import { Button } from "../../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { Donut, TOKEN } from "../../../_components/color-charts";
import { SectionHeader, StatCard } from "../page";

const ALLOCATION_TABS = [
    "All Allocations",
    "Tuition Fees",
    "Stipend",
    "Assessments",
    "Equipment",
    "Learning Materials",
    "Transport",
    "Other Support",
] as const;

export function AllocationsTab() {
    const allocations = [
        { name: "Tuition Fees", category: "Tuition Fees", primary: true, desc: "Covers tuition for approved courses and training programmes.", allocated: 50000, available: 32000, committed: 15000, disbursed: 3000, used: 64, color: TOKEN.chart1, tintClass: "bg-chart-1/10 text-chart-1", icon: GraduationCap, note: "Expires on Dec 31, 2026" },
        { name: "Stipend Allocation", category: "Stipend", primary: false, desc: "Monthly stipend for transport, meals, internet and other personal support.", allocated: 6000, available: 4000, committed: 2000, disbursed: 0, used: 33, color: TOKEN.chart2, tintClass: "bg-chart-2/10 text-chart-2", icon: Wallet, note: "Next release: Jun 1, 2026" },
        { name: "Assessments & Exams", category: "Assessments", primary: false, desc: "Fee coverage for tests, exams and assessments.", allocated: 3000, available: 2500, committed: 500, disbursed: 0, used: 17, color: TOKEN.chart3, tintClass: "bg-chart-3/10 text-chart-3", icon: ClipboardList, note: "Expires on Dec 31, 2026" },
        { name: "Equipment Support", category: "Equipment", primary: false, desc: "Purchase or rental of approved equipment.", allocated: 2000, available: 0, committed: 2000, disbursed: 0, used: 100, color: TOKEN.destructive, tintClass: "bg-destructive/10 text-destructive", icon: Laptop, note: "Purchase pending approval" },
        { name: "Learning Materials", category: "Learning Materials", primary: false, desc: "Books, digital resources and learning tools.", allocated: 2000, available: 1500, committed: 500, disbursed: 0, used: 25, color: TOKEN.chart4, tintClass: "bg-chart-4/10 text-chart-4", icon: BookOpen, note: "Expires on Dec 31, 2026" },
        { name: "Other Support", category: "Other Support", primary: false, desc: "Other approved expenses and allowances.", allocated: 0, available: 0, committed: 0, disbursed: 0, used: 0, color: TOKEN.muted, tintClass: "bg-muted text-muted-foreground", icon: Info, note: "No funds allocated" },
    ];

    const [activeCategory, setActiveCategory] = useState<(typeof ALLOCATION_TABS)[number]>("All Allocations");

    const filteredAllocations = useMemo(() => {
        if (activeCategory === "All Allocations") return allocations;
        return allocations.filter((a) => a.category === activeCategory);
    }, [allocations, activeCategory]);

    const overview = useMemo(() => {
        const totalAwarded = allocations.reduce((sum, a) => sum + a.allocated, 0);
        const totalAvailable = allocations.reduce((sum, a) => sum + a.available, 0);
        const totalCommitted = allocations.reduce((sum, a) => sum + a.committed, 0);
        const totalDisbursed = allocations.reduce((sum, a) => sum + a.disbursed, 0);

        const activeAllocations = allocations.filter(a => a.allocated > 0);
        const exhaustedAllocations = allocations.filter(
            a => a.allocated > 0 && a.available === 0
        );

        const utilization =
            totalAwarded > 0
                ? Math.round(((totalCommitted + totalDisbursed) / totalAwarded) * 100)
                : 0;

        return {
            totalAwarded,
            totalAvailable,
            totalCommitted,
            totalDisbursed,
            activeCount: activeAllocations.length,
            exhaustedCount: exhaustedAllocations.length,
            utilization,
        };
    }, [allocations]);

    const allocationSegments = useMemo(() => {
        return allocations
            .filter(a => a.allocated > 0)
            .map(a => ({
                label: a.name,
                value: a.allocated,
                color: a.color,
                percentage:
                    overview.totalAwarded > 0
                        ? (a.allocated / overview.totalAwarded) * 100
                        : 0,
            }));
    }, [allocations, overview.totalAwarded]);

    const restrictions = [
        {
            label: "Approved Courses",
            // value: allocationRules.approved_courses.join(", "),
            value: "Data Analytics, Python Programming, Machine Learning",
            icon: BookOpen,
        },
        {
            label: "Approved Institutions",
            // value: allocationRules.approved_institutions.join(", "),
            value: "ABC Institute, DevHub Academy",
            icon: Building2,
        },
        {
            label: "Delivery Modes",
            // value: allocationRules.delivery_modes.join(", "),
            value: "Online, In-person, Hybrid",
            icon: Laptop,
        },
        {
            label: "Academic Period",
            // value: `${allocationRules.start_date} – ${allocationRules.end_date}`,
            value: "Jan 15, 2026 – Dec 31, 2026",
            icon: CalendarDays,
        },
        {
            label: "Payment Categories",
            value: "Tuition, Assessments, Learning Materials",
            icon: Wallet,
        },
        {
            label: "Funding Limit",
            value: "Up to KES 56,000",
            icon: CircleDollarSign,
        },
        {
            label: "Approval Required",
            value: "Equipment purchases require prior approval",
            icon: ShieldCheck,
        },
        {
            label: "Unused Funds",
            value: "Unused funds expire at the end of the academic period",
            icon: Clock,
        },
    ];

    const [showAllRestrictions, setShowAllRestrictions] = useState(false);

    const visibleRestrictions = showAllRestrictions
        ? restrictions
        : restrictions.slice(0, 4);


    return (
        <div className="grid gap-6 min-w-0 *:min-w-0 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-4">
                <SectionHeader title="Allocations" desc="Breakdown of your funding by category and how you can use them." />
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                    <StatCard
                        icon={GraduationCap}
                        tint="bg-success/10 text-success"
                        label="Total Awarded"
                        value={`KES ${overview.totalAwarded.toLocaleString()}`}
                        sub={`Across ${overview.activeCount} active allocations`}
                    />

                    <StatCard
                        icon={Wallet}
                        tint="bg-info/10 text-info"
                        label="Total Available"
                        value={`KES ${overview.totalAvailable.toLocaleString()}`}
                        sub={`${((overview.totalAvailable / overview.totalAwarded) * 100 || 0).toFixed(1)}% of awarded`}
                    />

                    <StatCard
                        icon={Clock}
                        tint="bg-warning/10 text-warning"
                        label="Total Committed"
                        value={`KES ${overview.totalCommitted.toLocaleString()}`}
                        sub={`${((overview.totalCommitted / overview.totalAwarded) * 100 || 0).toFixed(1)}% of awarded`}
                    />

                    <StatCard
                        icon={Banknote}
                        tint="bg-accent/10 text-accent"
                        label="Total Disbursed"
                        value={`KES ${overview.totalDisbursed.toLocaleString()}`}
                        sub={`${((overview.totalDisbursed / overview.totalAwarded) * 100 || 0).toFixed(1)}% of awarded`}
                    />

                    <StatCard
                        icon={PieChart}
                        tint="bg-primary/10 text-primary"
                        label="Allocations"
                        value={String(overview.activeCount)}
                        sub={`${overview.exhaustedCount} fully utilized`}
                    />
                </div>

                <div className="flex flex-wrap gap-2 border-b">
                    {ALLOCATION_TABS.map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setActiveCategory(t)}
                            aria-current={t === activeCategory ? "true" : undefined}
                            className={`px-3 py-2 text-sm border-b-2 -mb-px transition-colors ${t === activeCategory ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                <div className="rounded-md border border-info/20 bg-info/10 p-3 text-sm text-info flex items-center gap-2">
                    <Info className="h-4 w-4" /> Funds are restricted to approved uses only. Ensure you meet all conditions before making a payment.
                </div>

                <div className="space-y-3">
                    {filteredAllocations.length === 0 ? (
                        <div className="py-10 text-center text-sm text-muted-foreground border rounded-lg bg-card">
                            No allocations in this category yet.
                        </div>
                    ) : (
                        filteredAllocations.map((a) => {
                            const Icon = a.icon;
                            return (
                                <Card key={a.name}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-3">
                                            <div className={`h-11 w-11 rounded-lg grid place-items-center ${a.tintClass}`}>
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-start justify-between gap-2">
                                                    <div>
                                                        <p className="font-semibold text-foreground flex items-center gap-2">
                                                            {a.name}
                                                            {a.primary && <Badge className="bg-accent/10 text-accent border-accent/20" variant="outline">Primary Allocation</Badge>}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">{a.desc}</p>
                                                        <button className="text-xs text-primary mt-1">View restrictions ↓</button>
                                                    </div>
                                                    <div className="grid grid-cols-4 gap-4 text-sm">
                                                        <div className="text-right">
                                                            <p className="text-[11px] text-muted-foreground">Allocated</p>
                                                            <p className="font-medium">KES {a.allocated.toLocaleString()}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[11px] text-muted-foreground">Available</p>
                                                            <p className="font-medium text-success">KES {a.available.toLocaleString()}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[11px] text-muted-foreground">Committed</p>
                                                            <p className="font-medium text-warning">KES {a.committed.toLocaleString()}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[11px] text-muted-foreground">Disbursed</p>
                                                            <p className="font-medium text-info">KES {a.disbursed.toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-3">
                                                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                                                        <div className="h-full" style={{ width: `${a.used}%`, background: a.color }} />
                                                    </div>
                                                    <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
                                                        <span>{a.used}% Used</span>
                                                        <span>{a.note}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>
            </div>

            <aside className="space-y-4 min-w-0">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Allocation Overview</CardTitle>
                    </CardHeader>

                    <CardContent className="flex flex-col gap-4 lg:items-center">
                        <Donut
                            segments={allocationSegments}
                            centerTop={overview.totalAwarded.toLocaleString()}
                            centerBottom="Total Awarded"
                        />

                        <div className="flex-1 space-y-2 text-xs">
                            {allocationSegments.map(segment => (
                                <div
                                    key={segment.label}
                                    className="flex items-center gap-2"
                                >
                                    <span
                                        className="h-2.5 w-2.5 shrink-0 rounded-sm"
                                        style={{ background: segment.color }}
                                    />

                                    <span className="truncate">
                                        {segment.label}
                                    </span>

                                    <span className="ml-auto shrink-0 text-muted-foreground">
                                        {segment.value.toLocaleString()} (
                                        {segment.percentage.toFixed(1)}%)
                                    </span>
                                </div>
                            ))}
                        </div>


                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Restrictions Summary</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-3">
                        <div className="space-y-2 text-xs">
                            {visibleRestrictions.map(({ label, value, icon: Icon }) => (
                                <div key={label} className="flex items-start gap-2">
                                    <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />

                                    <div className="min-w-0">
                                        <p className="font-medium text-foreground">{label}</p>
                                        <p className="text-muted-foreground">{value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {restrictions.length > 4 && (
                            <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-center w-full"
                                onClick={() => setShowAllRestrictions(prev => !prev)}
                            >
                                {showAllRestrictions
                                    ? "Show Less"
                                    : `View ${restrictions.length - 4} More Restriction${restrictions.length - 4 > 1 ? "s" : ""} →`}
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </aside>
        </div>
    );
}