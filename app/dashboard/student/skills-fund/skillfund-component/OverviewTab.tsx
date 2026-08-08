import { ArrowUpRight, Banknote, BarChart3, CalendarDays, ChevronDown, ChevronRight, Download, GraduationCap, PieChart, Wallet } from "lucide-react";
import { Badge } from "../../../../../components/ui/badge";
import { Button } from "../../../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { Donut, TOKEN, TrendChart } from "../../../_components/color-charts";
import { SectionHeader, StatCard } from "../page";

export function OverviewTab() {
    const segments = [
        { value: 0, color: TOKEN.chart1, label: "Tuition Fees" },
        { value: 0, color: TOKEN.chart2, label: "Stipend" },
        { value: 0, color: TOKEN.chart3, label: "Assessments" },
        { value: 0, color: TOKEN.chart4, label: "Equipment" },
        { value: 0, color: TOKEN.chart5, label: "Learning Materials" },
    ];

    const totalAwarded = segments.reduce((sum, segment) => sum + segment.value, 0);

    return (
        <div className="grid min-w-0 gap-6 *:min-w-0 [@media(min-width:1350px)]:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6 min-w-0">
                <SectionHeader
                    title="Reports"
                    desc="Generate and download detailed reports about your funding, spending and performance."
                    right={
                        <div className="flex w-full items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-xs sm:w-auto sm:text-sm">
                            <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="truncate">May 1, 2026 – May 31, 2026</span>
                            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </div>
                    }
                />

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                    <StatCard icon={GraduationCap} tint="bg-success/10 text-success" label="Total Awarded" value="KES 0" sub="Across 2 awards" />
                    <StatCard icon={Banknote} tint="bg-info/10 text-info" label="Total Disbursed" value="KES 0" sub="33% of awarded" />
                    <StatCard icon={ArrowUpRight} tint="bg-warning/10 text-warning" label="Total Spent" value="KES 0" sub="0% of disbursed" />
                    <StatCard icon={Wallet} tint="bg-primary/10 text-primary" label="Available Balance" value="KES 0" sub="0% of awarded" />
                    <StatCard icon={BarChart3} tint="bg-accent/10 text-accent" label="Total Transactions" value="0" sub="This period" />
                </div>

                <div className="grid gap-4 min-w-0 lg:grid-cols-2">
                    <Card className="min-w-0 overflow-hidden">
                        <CardHeader className="pb-2 flex-row items-center justify-between gap-2">
                            <CardTitle className="text-base">Funding &amp; Spending Trend</CardTitle>
                            <Badge variant="outline" className="shrink-0 text-[11px]">Monthly</Badge>
                        </CardHeader>
                        <CardContent className="min-w-0 px-3 sm:px-6">
                            <TrendChart />
                        </CardContent>
                    </Card>
                    <Card className="min-w-0 overflow-hidden">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Allocation Utilization</CardTitle>
                        </CardHeader>
                        <CardContent className="flex min-w-0 flex-col items-center gap-4 sm:flex-row sm:gap-6">
                            <div className="shrink-0">
                                <Donut
                                    segments={segments}
                                    centerTop={`${totalAwarded.toLocaleString()}`}
                                    centerBottom="Total Awarded"
                                />
                            </div>
                            <div className="w-full min-w-0 space-y-1.5 text-sm">
                                {segments.map((s) => (
                                    <div key={s.label} className="flex items-center gap-2">
                                        <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: s.color }} />
                                        <span className="truncate text-foreground">{s.label}</span>
                                        <span className="ml-auto shrink-0 tabular-nums text-muted-foreground">KES {s.value.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Recent Reports</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs text-muted-foreground bg-muted/50">
                                <tr>
                                    <th className="text-left px-4 py-2 font-medium">Report Name</th>
                                    <th className="text-left px-4 py-2 font-medium">Type</th>
                                    <th className="text-left px-4 py-2 font-medium">Period</th>
                                    <th className="text-left px-4 py-2 font-medium">Format</th>
                                    <th className="text-right px-4 py-2 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {[
                                    ["Funding Summary Report", "Funding Report", "May 2026", "PDF"],
                                    ["Disbursement Report", "Disbursement Report", "May 2026", "Excel"],
                                    ["Spending Report", "Spending Report", "May 2026", "PDF"],
                                    ["Transaction Report", "Transaction Report", "May 2026", "Excel"],
                                    ["Allocation Utilization", "Allocation Report", "May 2026", "PDF"],
                                ].map(([n, t, p, f]) => (
                                    <tr key={n} className="hover:bg-muted/40">
                                        <td className="px-4 py-2.5 font-medium text-foreground">{n}</td>
                                        <td className="px-4 py-2.5 text-muted-foreground">{t}</td>
                                        <td className="px-4 py-2.5 text-muted-foreground">{p}</td>
                                        <td className="px-4 py-2.5">
                                            <Badge variant="outline" className="text-[10px]">{f}</Badge>
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                            <Button size="icon" variant="ghost" className="h-8 w-8">
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>

            <aside className="space-y-4 min-w-0">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Quick Report Generator</CardTitle>
                        <CardDescription>Choose a report type and generate instantly.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {[
                            ["Funding Summary", "Overview of all awards and balances"],
                            ["Disbursement Report", "Details of all fund releases"],
                            ["Spending Report", "How your funds were spent"],
                            ["Transaction Report", "All money in and out activities"],
                            ["Allocation Report", "Breakdown by allocation category"],
                            ["Utilization Report", "Funding utilization and remaining balance"],
                            ["Tax Report", "Download tax related documents"],
                        ].map(([t, d]) => (
                            <button
                                key={t}
                                className="w-full flex items-center justify-between gap-3 rounded-lg border bg-card p-3 text-left hover:border-primary"
                            >
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{t}</p>
                                    <p className="text-[11px] text-muted-foreground truncate">{d}</p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </button>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Report Insights</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex gap-2">
                            <ArrowUpRight className="h-4 w-4 text-success mt-0.5" />
                            <p className="text-foreground">
                                Your available balance increased by <b>KES 2,500</b> compared to last month.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <PieChart className="h-4 w-4 text-warning mt-0.5" />
                            <p className="text-foreground">
                                Tuition Fees allocation has the highest utilization at <b>78%</b>.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <CalendarDays className="h-4 w-4 text-info mt-0.5" />
                            <p className="text-foreground">Next stipend disbursement scheduled for <b>Jun 1, 2026</b>.</p>
                        </div>
                    </CardContent>
                </Card>
            </aside>
        </div>
    );
}