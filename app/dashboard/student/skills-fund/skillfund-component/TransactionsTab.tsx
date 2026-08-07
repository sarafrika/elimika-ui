'use client'

import { CalendarDays, ChevronLeft, ChevronRight, Inbox, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { Input } from "../../../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../components/ui/select";
import { Donut, TOKEN } from "../../../_components/color-charts";
import { SectionHeader, StatusBadge } from "../page";

type Transaction = {
    date: string; // ISO
    desc: string;
    info: string;
    cat: string;
    src: string;
    amount: number; // signed KES, e.g. -20000 or +2000
    type: string;
    status: string;
    ref: string;
};

// Builds an ISO date `daysBack` days before today at a fixed hour/minute, so the
// dataset stays realistic (and date-range filters stay meaningful) no matter when
// this page is viewed.
function relativeDate(daysBack: number, hour: number, minute: number) {
    const d = new Date();
    d.setDate(d.getDate() - daysBack);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
}

function formatAmount(amount: number) {
    const sign = amount >= 0 ? "+" : "-";
    return `${sign}KES ${Math.abs(amount).toLocaleString()}`;
}

// yyyy-mm-dd in local time, for native <input type="date"> values.
function toDateInputValue(d: Date) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

// Default view: current date back to 7 days ago.
const DEFAULT_DATE_TO = toDateInputValue(new Date());
const DEFAULT_DATE_FROM = toDateInputValue(new Date(Date.now() - 28 * 86_400_000));

const transactions: Transaction[] = [
    { date: relativeDate(0, 10, 24), desc: "Tuition Payment - Term 1", info: "ABC Institute", cat: "Payment", src: "Tuition Fees Allocation", amount: -20000, type: "Payment", status: "Completed", ref: "#TXN-2026-1542" },
    { date: relativeDate(0, 9, 15), desc: "Stipend Release - May", info: "Monthly stipend", cat: "Disbursement", src: "Stipend Allocation", amount: 2000, type: "Money In", status: "Completed", ref: "#TXN-2026-1541" },
    { date: relativeDate(2, 14, 40), desc: "Assessments Fee", info: "Exam Board", cat: "Payment", src: "Assessments Allocation", amount: -1500, type: "Payment", status: "Completed", ref: "#TXN-2026-1540" },
    { date: relativeDate(5, 11, 30), desc: "Equipment Purchase", info: "Music Keyboard", cat: "Payment", src: "Equipment Allocation", amount: -3000, type: "Payment", status: "Completed", ref: "#TXN-2026-1539" },
    { date: relativeDate(10, 8, 20), desc: "Interest Earned", info: "Wallet Interest", cat: "Adjustment", src: "Rewards Wallet", amount: 45, type: "Money In", status: "Completed", ref: "#TXN-2026-1538" },
    { date: relativeDate(12, 17, 45), desc: "Refund - Class Cancelled", info: "Private Piano Class", cat: "Refund", src: "Tuition Fees Allocation", amount: 1000, type: "Refund", status: "Completed", ref: "#TXN-2026-1537" },
    { date: relativeDate(15, 12, 10), desc: "Reservation - Class Booking", info: "Guitar Private Class", cat: "Reservation", src: "Tuition Fees Allocation", amount: -1000, type: "Reservation", status: "Held", ref: "#TXN-2026-1536" },
    { date: relativeDate(19, 10, 0), desc: "Funding Award Received", info: "Digital Skills Scholarship", cat: "Disbursement", src: "Programme Award", amount: 56000, type: "Money In", status: "Completed", ref: "#TXN-2026-1535" },
    { date: relativeDate(20, 15, 22), desc: "Withdrawal to Mobile Money", info: "Safaricom **** 1234", cat: "Withdrawal", src: "Stipend Allocation", amount: -1500, type: "Withdrawal", status: "Completed", ref: "#TXN-2026-1534" },
    { date: relativeDate(22, 9, 5), desc: "Referral Reward", info: "Welcome Bonus", cat: "Adjustment", src: "Rewards Wallet", amount: 200, type: "Money In", status: "Completed", ref: "#TXN-2026-1533" },
];

const TXN_TABS = ["All Transactions", "Money In", "Payments", "Refunds", "Adjustments", "Reservations"] as const;
type TxnTab = (typeof TXN_TABS)[number];

function tabMatches(tab: TxnTab, t: Transaction) {
    switch (tab) {
        case "Money In": return t.type === "Money In";
        case "Payments": return t.type === "Payment";
        case "Refunds": return t.type === "Refund";
        case "Adjustments": return t.cat === "Adjustment";
        case "Reservations": return t.type === "Reservation";
        default: return true;
    }
}

const SUMMARY_PERIODS = [
    { key: "7d", label: "7 Days", days: 7 },
    { key: "1m", label: "1 Month", days: 30 },
    { key: "3m", label: "3 Months", days: 90 },
    { key: "4m", label: "4 Months", days: 120 },
    { key: "6m", label: "6 Months", days: 180 },
    { key: "1y", label: "1 Year", days: 365 },
] as const;
type SummaryPeriodKey = (typeof SUMMARY_PERIODS)[number]["key"];

function periodStart(days: number | null) {
    if (days === null) return null;
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
}

export function TransactionsTab() {
    const [activeTab, setActiveTab] = useState<TxnTab>("All Transactions");
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [sourceFilter, setSourceFilter] = useState("All");
    const [dateFrom, setDateFrom] = useState(DEFAULT_DATE_FROM); // yyyy-mm-dd
    const [dateTo, setDateTo] = useState(DEFAULT_DATE_TO); // yyyy-mm-dd
    const [summaryPeriod, setSummaryPeriod] = useState<SummaryPeriodKey>("1m");

    const tabRowRef = useRef<HTMLDivElement>(null);
    const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

    useEffect(() => {
        const activeBtn = tabRefs.current.get(activeTab);
        if (activeBtn && tabRowRef.current) {
            activeBtn.scrollIntoView({ inline: "center", behavior: "smooth", block: "nearest" });
        }
    }, [activeTab]);

    const scrollTabs = (direction: "left" | "right") => {
        if (tabRowRef.current) {
            const amount = direction === "left" ? -200 : 200;
            tabRowRef.current.scrollBy({ left: amount, behavior: "smooth" });
        }
    };

    const categories = useMemo(() => Array.from(new Set(transactions.map((t) => t.cat))).sort(), []);
    const sources = useMemo(() => Array.from(new Set(transactions.map((t) => t.src))).sort(), []);

    const tabCounts = useMemo(() => {
        const c: Record<TxnTab, number> = {
            "All Transactions": transactions.length,
            "Money In": 0,
            Payments: 0,
            Refunds: 0,
            Adjustments: 0,
            Reservations: 0,
        };
        for (const t of transactions) {
            for (const tab of TXN_TABS) {
                if (tab !== "All Transactions" && tabMatches(tab, t)) c[tab]++;
            }
        }
        return c;
    }, []);

    // Manual "from" / "to" boundaries — inclusive of the whole selected day at each end.
    const dateFromObj = useMemo(() => (dateFrom ? new Date(`${dateFrom}T00:00:00`) : null), [dateFrom]);
    const dateToObj = useMemo(() => (dateTo ? new Date(`${dateTo}T23:59:59.999`) : null), [dateTo]);
    const dateRangeInvalid = !!(dateFromObj && dateToObj && dateFromObj > dateToObj);

    const filtered = useMemo(() => {
        const needle = search.trim().toLowerCase();
        return transactions
            .filter((t) => {
                if (!tabMatches(activeTab, t)) return false;
                if (categoryFilter !== "All" && t.cat !== categoryFilter) return false;
                if (sourceFilter !== "All" && t.src !== sourceFilter) return false;
                if (!dateRangeInvalid) {
                    const txnDate = new Date(t.date);
                    if (dateFromObj && txnDate < dateFromObj) return false;
                    if (dateToObj && txnDate > dateToObj) return false;
                }
                if (needle) {
                    const haystack = `${t.desc} ${t.info} ${t.src} ${t.cat} ${t.type} ${t.ref}`.toLowerCase();
                    if (!haystack.includes(needle)) return false;
                }
                return true;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [activeTab, categoryFilter, sourceFilter, dateFromObj, dateToObj, dateRangeInvalid, search]);

    const filtersActive = activeTab !== "All Transactions" || categoryFilter !== "All" || sourceFilter !== "All" || dateFrom !== DEFAULT_DATE_FROM || dateTo !== DEFAULT_DATE_TO || search.trim().length > 0;

    const clearFilters = () => {
        setActiveTab("All Transactions");
        setCategoryFilter("All");
        setSourceFilter("All");
        setDateFrom(DEFAULT_DATE_FROM);
        setDateTo(DEFAULT_DATE_TO);
        setSearch("");
    };

    // ---- Sidebar: driven by the summary period selector, independent of the table filters above ----
    const summaryRows = useMemo(() => {
        const period = SUMMARY_PERIODS.find((p) => p.key === summaryPeriod);
        const start = periodStart(period?.days ?? null);
        return start ? transactions.filter((t) => new Date(t.date) >= start) : transactions;
    }, [summaryPeriod]);

    const summary = useMemo(() => {
        let moneyIn = 0;
        let moneyOut = 0;
        for (const t of summaryRows) {
            if (t.amount >= 0) moneyIn += t.amount;
            else moneyOut += Math.abs(t.amount);
        }
        return { moneyIn, moneyOut, net: moneyIn - moneyOut, count: summaryRows.length };
    }, [summaryRows]);

    const spendingSegments = useMemo(() => {
        const palette = [TOKEN.chart1, TOKEN.chart2, TOKEN.chart3, TOKEN.chart4, TOKEN.chart5];
        const groups = new Map<string, number>();
        for (const t of summaryRows) {
            if (t.amount < 0) {
                const label = t.src.replace(/ Allocation$/, "");
                groups.set(label, (groups.get(label) ?? 0) + Math.abs(t.amount));
            }
        }
        const total = Array.from(groups.values()).reduce((a, b) => a + b, 0);
        return Array.from(groups.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([label, value], i) => ({
                label,
                value,
                color: palette[i % palette.length],
                percentage: total > 0 ? (value / total) * 100 : 0,
            }));
    }, [summaryRows]);

    const totalSpent = spendingSegments.reduce((s, seg) => s + seg.value, 0);

    return (
        <div className="grid gap-6 min-w-0 *:min-w-0 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-4">
                <SectionHeader title="Transactions" desc="View all money in and out of your wallet, including payments, disbursements and refunds." />

                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        aria-label="Scroll tabs left"
                        onClick={() => scrollTabs("left")}
                        className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div ref={tabRowRef} className="flex flex-nowrap gap-2 border-b overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [touch-action:pan-x] [-webkit-overflow-scrolling:touch] flex-1">
                        {TXN_TABS.map((t) => (
                            <button
                                key={t}
                                type="button"
                                ref={(el) => {
                                    if (el) tabRefs.current.set(t, el);
                                    else tabRefs.current.delete(t);
                                }}
                                onClick={() => setActiveTab(t)}
                                aria-current={t === activeTab ? "true" : undefined}
                                className={`shrink-0 px-3 py-2 text-sm border-b-2 -mb-px transition-colors ${t === activeTab ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                            >
                                {t} {tabCounts[t]}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        aria-label="Scroll tabs right"
                        onClick={() => scrollTabs("right")}
                        className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-md border bg-card px-2 h-9">
                        <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            max={dateTo || undefined}
                            aria-label="From date"
                            className="h-full bg-transparent text-sm text-foreground outline-none [color-scheme:light] dark:[color-scheme:dark]"
                        />
                        <span className="text-muted-foreground text-xs shrink-0">to</span>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            min={dateFrom || undefined}
                            aria-label="To date"
                            className="h-full bg-transparent text-sm text-foreground outline-none [color-scheme:light] dark:[color-scheme:dark]"
                        />
                        {(dateFrom || dateTo) && (
                            <button
                                type="button"
                                onClick={() => { setDateFrom(""); setDateTo(""); }}
                                aria-label="Clear date range"
                                className="text-muted-foreground hover:text-foreground shrink-0"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="h-9 w-36"><SelectValue placeholder="All Types" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Types</SelectItem>
                            {categories.map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={sourceFilter} onValueChange={setSourceFilter}>
                        <SelectTrigger className="h-9 w-48"><SelectValue placeholder="All Funding Sources" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Funding Sources</SelectItem>
                            {sources.map((s) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Input placeholder="Search transactions..." className="h-9 w-56" value={search} onChange={(e) => setSearch(e.target.value)} />
                    {filtersActive && (
                        <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={clearFilters}>
                            Clear filters
                        </Button>
                    )}
                    <div className="ml-auto text-xs text-muted-foreground">
                        {filtered.length} transaction{filtered.length === 1 ? "" : "s"} found
                    </div>
                </div>
                {dateRangeInvalid && (
                    <p className="text-xs text-destructive -mt-2">The "from" date is after the "to" date — pick a valid range to filter.</p>
                )}

                <Card>
                    <CardContent className="p-0 overflow-x-auto">
                        {filtered.length === 0 ? (
                            <div className="py-16 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                                <Inbox className="h-6 w-6 text-muted-foreground" />
                                No transactions match your filters.
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="text-xs text-muted-foreground bg-muted/50">
                                    <tr>
                                        {["Date & Time", "Description", "Category", "Funding Source", "Amount", "Type", "Status", "Reference"].map((h) => (
                                            <th key={h} className="text-left px-3 py-2 font-medium whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filtered.map((r) => {
                                        const d = new Date(r.date);
                                        return (
                                            <tr key={r.ref} className="hover:bg-muted/40">
                                                <td className="px-3 py-2 text-xs">
                                                    <p>{d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                                                    <p className="text-muted-foreground">{d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</p>
                                                </td>
                                                <td className="px-3 py-2"><p className="font-medium text-foreground">{r.desc}</p><p className="text-[11px] text-muted-foreground">{r.info}</p></td>
                                                <td className="px-3 py-2"><StatusBadge status={r.cat} /></td>
                                                <td className="px-3 py-2 text-xs text-muted-foreground">{r.src}</td>
                                                <td className={`px-3 py-2 font-semibold whitespace-nowrap ${r.amount >= 0 ? "text-success" : "text-destructive"}`}>{formatAmount(r.amount)}</td>
                                                <td className="px-3 py-2"><StatusBadge status={r.type} /></td>
                                                <td className="px-3 py-2"><StatusBadge status={r.status} /></td>
                                                <td className="px-3 py-2 text-xs font-mono text-muted-foreground">{r.ref}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </CardContent>
                </Card>
            </div>

            <aside className="space-y-4 min-w-0">
                <Card>
                    <CardHeader className="pb-2 flex-row items-center justify-between">
                        <CardTitle className="text-base">Transaction Summary</CardTitle>
                        <Select value={summaryPeriod} onValueChange={(v) => setSummaryPeriod(v as SummaryPeriodKey)}>
                            <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {SUMMARY_PERIODS.map((p) => (
                                    <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Total Money In</span><span className="font-semibold text-success">KES {summary.moneyIn.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Total Money Out</span><span className="font-semibold text-destructive">KES {summary.moneyOut.toLocaleString()}</span></div>
                        <div className="flex justify-between border-t pt-2"><span className="text-muted-foreground">Net Flow</span><span className={`font-semibold ${summary.net >= 0 ? "text-success" : "text-destructive"}`}>{summary.net >= 0 ? "" : "-"}KES {Math.abs(summary.net).toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Total Transactions</span><span className="font-semibold">{summary.count}</span></div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base">Spending by Category</CardTitle></CardHeader>
                    <CardContent className="flex flex-col items-center gap-3">
                        {spendingSegments.length === 0 ? (
                            <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                                <Inbox className="h-5 w-5 text-muted-foreground" />
                                No spending in this period.
                            </div>
                        ) : (
                            <>
                                <Donut segments={spendingSegments} centerTop={totalSpent.toLocaleString()} centerBottom="Total Spent" />
                                <div className="space-y-1 text-xs w-full">
                                    {spendingSegments.map((s) => (
                                        <div key={s.label} className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-sm" style={{ background: s.color }} />
                                            <span className="truncate">{s.label}</span>
                                            <span className="text-muted-foreground ml-auto">{s.value.toLocaleString()} ({s.percentage.toFixed(1)}%)</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </aside>
        </div>
    );
}