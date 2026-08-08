'use client'

import { Banknote, CheckCircle2, ChevronRight, Filter, GraduationCap } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { Input } from "../../../../../components/ui/input";
import { Progress } from "../../../../../components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../../../../../components/ui/select";
import { Donut, TOKEN } from "../../../_components/color-charts";
import { SectionHeader, StatusBadge } from "../page";

const funding = [
    {
        name: "Digital Skills Scholarship 2026",
        funder: "Tech for Youth Foundation",
        id: "DS-2026-000245",
        program: "For Diploma in Data Analytics at ABC Institute",
        total: 56000,
        available: 38000,
        committed: 15000,
        disbursed: 3000,
        util: 32.1,
        start: "Jan 15, 2026",
        end: "Dec 31, 2026",
        renewable: false,
        status: "active",
    },
    {
        name: "Women in Tech Grant",
        funder: "Women Techmakers Kenya",
        id: "WT-2026-0178",
        program: "For Frontend Development Course at DevHub Academy",
        total: 25000,
        available: 12500,
        committed: 7500,
        disbursed: 5000,
        util: 50,
        start: "Feb 10, 2026",
        end: "Aug 31, 2026",
        renewable: true,
        status: "active",
    },
    {
        name: "Creative Arts Bursary",
        funder: "Kenya Arts Trust",
        id: "CAB-2025-0091",
        program: "",
        total: 20000,
        available: 0,
        committed: 0,
        disbursed: 20000,
        util: 100,
        start: "",
        end: "Dec 12, 2025",
        renewable: false,
        status: "completed",
    },
    {
        name: "STEM Excellence Fund",
        funder: "STEM Africa Initiative",
        id: "STEM-2025-1145",
        program: "",
        total: 30000,
        available: 0,
        committed: 0,
        disbursed: 30000,
        util: 100,
        start: "",
        end: "Nov 30, 2025",
        renewable: false,
        status: "completed",
    },
    {
        name: "Future Leaders Grant",
        funder: "Global Futures Fund",
        id: "FLG-2025-0580",
        program: "",
        total: 15000,
        available: 0,
        committed: 0,
        disbursed: 15000,
        util: 100,
        start: "",
        end: "Oct 18, 2025",
        renewable: false,
        status: "completed",
    },
] as const;


export function MyFundingTab() {
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("All Funding");
    const [statusFilter, setStatusFilter] = useState("All");

    const filteredFunding = useMemo(() => {
        return funding.filter(item => {
            const matchesSearch =
                item.name.toLowerCase().includes(search.toLowerCase()) ||
                item.funder.toLowerCase().includes(search.toLowerCase()) ||
                item.id.toLowerCase().includes(search.toLowerCase());

            const matchesTab =
                activeTab === "All Funding" ||
                item.status === activeTab.replace(/\s\d+$/, "").toLowerCase();

            const matchesFilter =
                statusFilter === "All" ||
                item.status === statusFilter.toLowerCase();

            return matchesSearch && matchesTab && matchesFilter;
        });
    }, [funding, search, activeTab, statusFilter]);

    const completed = useMemo(
        () => filteredFunding.filter((item) => item.status === "completed"),
        [filteredFunding]
    );
    const active = useMemo(
        () => filteredFunding.filter((item) => item.status === "active"),
        [filteredFunding]
    );

    const tabs = [
        "All Funding",
        `Active ${funding.filter(f => f.status === "active").length}`,
        `Pending ${funding.filter(f => f.status === "pending").length}`,
        `Completed ${funding.filter(f => f.status === "completed").length}`,
        `Expired ${funding.filter(f => f.status === "expired").length}`,
        `Cancelled ${funding.filter(f => f.status === "cancelled").length}`,
    ];

    const summary = useMemo(() => ({
        active: funding
            .filter(f => f.status === "active")
            .reduce((s, f) => s + f.total, 0),

        completed: funding
            .filter(f => f.status === "completed")
            .reduce((s, f) => s + f.total, 0),

        pending: funding
            .filter(f => f.status === "pending")
            .reduce((s, f) => s + f.total, 0),

        expired: funding
            .filter(f => f.status === "expired")
            .reduce((s, f) => s + f.total, 0),

        cancelled: funding
            .filter(f => f.status === "cancelled")
            .reduce((s, f) => s + f.total, 0),
    }), [funding]);

    const totalAwarded =
        summary.active +
        summary.completed +
        summary.pending +
        summary.expired +
        summary.cancelled;


    return (
        <div className="grid gap-6 min-w-0 *:min-w-0 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6 min-w-0">
                <SectionHeader
                    title="My Funding"
                    desc="All the scholarships, bursaries, grants and sponsorships you have received."
                    right={
                        <div className="flex items-center gap-2">
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search my funding..."
                                className="h-9 w-[80%]"
                            />

                            <Select
                                value={statusFilter}
                                onValueChange={setStatusFilter}
                            >
                                <SelectTrigger
                                    className="h-9 w-16 p-0 justify-center"
                                    aria-label="Filter funding"
                                >
                                    <Filter className="h-4 w-4" />
                                </SelectTrigger>

                                <SelectContent align="end">
                                    <SelectItem value="All">All</SelectItem>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Pending">Pending</SelectItem>
                                    <SelectItem value="Completed">Completed</SelectItem>
                                    <SelectItem value="Expired">Expired</SelectItem>
                                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>

                        </div>
                    }
                />

                <div className="flex flex-wrap gap-2 border-b">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-3 py-2 text-sm border-b-2 -mb-px ${activeTab === tab
                                ? "border-primary text-primary font-medium"
                                : "border-transparent text-muted-foreground"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}

                </div>

                <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">Active Funding ({filteredFunding.length})</h3>

                    <div className="space-y-3">
                        {filteredFunding.length > 0 ? (
                            filteredFunding.map((a) => (
                                <Card key={a.id}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="h-12 w-12 rounded-lg bg-success/10 text-success grid place-items-center">
                                                <GraduationCap className="h-6 w-6" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-start justify-between gap-2">
                                                    <div>
                                                        <p className="font-semibold text-foreground flex items-center gap-2">
                                                            {a.name} <StatusBadge status="Active" />
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            {a.funder} • Award ID: {a.id}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">{a.program}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-lg font-semibold text-foreground">KES {a.total.toLocaleString()}</p>
                                                        <p className="text-[11px] text-muted-foreground">Total Award</p>
                                                    </div>
                                                </div>
                                                <div className="mt-3 grid gap-3 sm:grid-cols-4 text-sm">
                                                    <div>
                                                        <p className="text-[11px] text-muted-foreground">Available</p>
                                                        <p className="font-medium text-success">KES {a.available.toLocaleString()}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] text-muted-foreground">Committed</p>
                                                        <p className="font-medium text-warning">KES {a.committed.toLocaleString()}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] text-muted-foreground">Disbursed</p>
                                                        <p className="font-medium text-info">KES {a.disbursed.toLocaleString()}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] text-muted-foreground">Utilization</p>
                                                        <div className="flex items-center gap-2">
                                                            <Progress value={a.util} className="h-1.5" />
                                                            <span className="text-xs">{a.util}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                                                        <span>Started: {a.start}</span>
                                                        <span>Ends: {a.end}</span>
                                                        <span>Renewable: {a.renewable ? "Yes" : "No"}</span>
                                                    </div>
                                                    <Button size="sm" variant="outline" className="gap-1">
                                                        View Details <ChevronRight className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))) : (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                    <GraduationCap className="mb-3 h-10 w-10 text-muted-foreground/50" />
                                    <h4 className="text-sm font-semibold text-foreground">
                                        No active funding found
                                    </h4>
                                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                                        There are no active funding awards matching your current search or
                                        filters.
                                    </p>
                                </CardContent>
                            </Card>)
                        }
                    </div>
                </div>

                <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-base">Completed Funding ({completed.length})</CardTitle>
                        <Button variant="link" size="sm">View all</Button>
                    </CardHeader>

                    <CardContent className="p-0">
                        {completed.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 text-xs text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-2 text-left font-medium">Programme</th>
                                            <th className="px-4 py-2 text-left font-medium">Funder</th>
                                            <th className="px-4 py-2 text-left font-medium">Award ID</th>
                                            <th className="px-4 py-2 text-left font-medium">Total</th>
                                            <th className="px-4 py-2 text-left font-medium">Completed On</th>
                                            <th className="px-4 py-2 text-left font-medium">Status</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y">
                                        {completed.map((r) => (
                                            <tr key={r.id} className="hover:bg-muted/40">
                                                <td className="px-4 py-2.5 font-medium text-foreground">
                                                    {r.name}
                                                </td>
                                                <td className="px-4 py-2.5 text-muted-foreground">
                                                    {r.funder}
                                                </td>
                                                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                                                    {r.id}
                                                </td>
                                                <td className="px-4 py-2.5 text-foreground">
                                                    KES {r.total.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-2.5 text-muted-foreground">
                                                    {r.end}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <StatusBadge status={r.status} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <CheckCircle2 className="mb-3 h-10 w-10 text-muted-foreground/50" />
                                <h4 className="text-sm font-semibold text-foreground">
                                    No completed funding
                                </h4>
                                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                                    Completed funding awards will appear here once you've successfully
                                    finished a funded programme.
                                </p>
                            </div>
                        )}
                    </CardContent>

                </Card>
            </div>

            <aside className="space-y-4 min-w-0">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base">Funding Summary</CardTitle></CardHeader>
                    <CardContent className="flex items-center gap-4">
                        <Donut
                            segments={[
                                {
                                    value: summary.active,
                                    color: TOKEN.chart1,
                                    label: "Active",
                                },
                                {
                                    value: summary.completed,
                                    color: TOKEN.chart2,
                                    label: "Completed",
                                },
                                {
                                    value: summary.pending,
                                    color: TOKEN.chart3,
                                    label: "Pending",
                                },
                                {
                                    value: summary.expired,
                                    color: TOKEN.chart4,
                                    label: "Expired",
                                },
                                {
                                    value: summary.cancelled,
                                    color: TOKEN.chart5,
                                    label: "Cancelled",
                                },
                            ]}
                            centerTop={`${totalAwarded.toLocaleString()}`}
                            centerBottom="Total Awarded"
                        />

                        <div className="space-y-1.5 text-sm">
                            <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: TOKEN.chart1 }} />Active</div>
                            <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: TOKEN.chart2 }} />Completed</div>
                            <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: TOKEN.chart3 }} />Pending</div>
                            <div className="flex items-center gap-2 text-muted-foreground"><span className="h-2.5 w-2.5 rounded-sm bg-destructive" />Expired</div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base">Next Disbursement</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-2">
                        <div className="flex items-start gap-3">
                            <Banknote className="h-5 w-5 text-success" />
                            <div>
                                <p className="font-medium">Stipend Release</p>
                                <p className="text-xs text-muted-foreground">Digital Skills Scholarship 2026</p>
                            </div>
                            <span className="ml-auto font-semibold">KES 2,000</span>
                        </div>
                        <div className="rounded-md bg-muted/50 p-2 flex justify-between text-xs">
                            <span>On <b>May 20, 2026</b></span>
                            <span>In <b>5 days</b></span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base">My Obligations</CardTitle></CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        {[
                            ["Maintain 80% attendance", "On track", "text-success"],
                            ["Submit Assignment 2", "Due in 7 days", "text-warning"],
                            ["Mid-Term Exam", "Completed", "text-success"],
                        ].map(([t, s, c]) => (
                            <div key={t} className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-foreground">{t}</p>
                                </div>
                                <span className={`text-xs ${c}`}>{s}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </aside>
        </div>
    );
}