'use client'

import { Bell, CheckCircle2, ClipboardList, Loader2, Pencil, Search, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "../../../../../components/ui/badge";
import { Button } from "../../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { Input } from "../../../../../components/ui/input";
import { useUserProfile } from "../../../../../context/profile-context";
import { Donut, TOKEN } from "../../../_components/color-charts";
import { Application, ManageApplicationDialog, NotificationPreferencesDialog, sampleApplications, SectionHeader, STATUS_BADGE, STATUS_LABEL } from "../page";

export function ApplicationsTab() {
    const user = useUserProfile();
    const applications = sampleApplications
    const isLoading = false

    const [statusFilter, setStatusFilter] = useState<"all" | Application["status"]>("all");
    const [search, setSearch] = useState("");
    const [openApp, setOpenApp] = useState<Application | null>(null);

    const filtered = useMemo(() => {
        return applications.filter((a) => {
            if (statusFilter !== "all" && a.status !== statusFilter) return false;
            if (search) {
                const hay = `${a.opportunity?.title ?? ""} ${a.opportunity?.funder ?? ""} ${a.reference}`.toLowerCase();
                if (!hay.includes(search.toLowerCase())) return false;
            }
            return true;
        });
    }, [applications, statusFilter, search]);

    const counts = useMemo(() => {
        const c: Record<string, number> = { all: applications.length, draft: 0, submitted: 0, under_review: 0, approved: 0, rejected: 0, waitlisted: 0 };
        for (const a of applications) c[a.status]++;
        return c;
    }, [applications]);

    const stageOrder: Application["status"][] = ["draft", "submitted", "under_review", "approved"];
    const stageIndex = (s: Application["status"]) => {
        if (s === "rejected") return 3;
        if (s === "waitlisted") return 2;
        return stageOrder.indexOf(s);
    };
    const stagesLabel = ["Draft", "Submitted", "Under Review", "Decision"];

    const [prefsOpen, setPrefsOpen] = useState(false);

    return (
        <div className="grid gap-6 min-w-0 *:min-w-0 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                    <SectionHeader
                        title="My Applications"
                        desc="Track the status of your funding applications from draft to decision."
                    />
                    <Button variant="outline" size="sm" onClick={() => setPrefsOpen(true)} className="shrink-0">
                        <Bell className="h-4 w-4 mr-2" /> Notifications
                    </Button>
                </div>
                <NotificationPreferencesDialog open={prefsOpen} onClose={() => setPrefsOpen(false)} />

                <div className="flex flex-wrap gap-2 border-b">
                    {([
                        ["all", `All ${counts.all}`],
                        ["draft", `Drafts ${counts.draft}`],
                        ["submitted", `Submitted ${counts.submitted}`],
                        ["under_review", `Under Review ${counts.under_review}`],
                        ["approved", `Approved ${counts.approved}`],
                        ["rejected", `Rejected ${counts.rejected}`],
                        ["waitlisted", `Waitlisted ${counts.waitlisted}`],
                    ] as const).map(([k, label]) => (
                        <button
                            key={k}
                            onClick={() => setStatusFilter(k)}
                            className={`px-3 py-2 text-sm border-b-2 -mb-px ${k === statusFilter ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground"}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search my applications..." className="h-9 w-64 pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                </div>

                {isLoading ? (
                    <div className="py-16 text-center text-sm text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" /> Loading applications…
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 text-center text-sm text-muted-foreground border rounded-lg bg-card">
                        No applications yet. Head to <b>Opportunities</b> to start one.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map((a) => {
                            const idx = stageIndex(a.status);
                            return (
                                <Card key={a.id}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="h-11 w-11 rounded-lg bg-muted grid place-items-center">
                                                <ClipboardList className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-start justify-between gap-2">
                                                    <div>
                                                        <p className="font-semibold text-foreground flex items-center gap-2">
                                                            {a.opportunity?.title ?? "(Opportunity removed)"}
                                                            {a.opportunity?.category && <Badge variant="outline" className="text-[10px]">{a.opportunity.category}</Badge>}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">{a.opportunity?.funder ?? "—"}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Requested: KES {(a.amount_requested_kes ?? 0).toLocaleString()} • Ref: {a.reference}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_BADGE[a.status]}`}>
                                                            {STATUS_LABEL[a.status]}
                                                        </span>
                                                        <p className="text-[11px] text-muted-foreground mt-1">
                                                            {a.submitted_at ? `Submitted ${new Date(a.submitted_at).toLocaleDateString()}` : `Created ${new Date(a.created_at).toLocaleDateString()}`}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="mt-4">
                                                    <div className="flex items-center">
                                                        {stagesLabel.map((s, i) => {
                                                            const done = i < idx || a.status === "approved";
                                                            const current = i === idx && a.status !== "approved";
                                                            const rejected = a.status === "rejected" && i === 3;
                                                            return (
                                                                <div key={s} className="flex-1 flex items-center">
                                                                    <div className={`h-6 w-6 rounded-full grid place-items-center text-[10px] font-medium ${rejected ? "bg-destructive text-destructive-foreground" :
                                                                        done ? "bg-success text-success-foreground" :
                                                                            current ? "bg-warning text-warning-foreground" :
                                                                                "bg-muted text-muted-foreground"
                                                                        }`}>
                                                                        {rejected ? <XCircle className="h-3.5 w-3.5" /> : done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                                                                    </div>
                                                                    {i < stagesLabel.length - 1 && (
                                                                        <div className={`flex-1 h-0.5 mx-1 ${done ? "bg-success" : "bg-muted"}`} />
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                                                        {stagesLabel.map((s) => <span key={s} className="flex-1 text-center">{s}</span>)}
                                                    </div>
                                                </div>
                                                {a.reviewer_notes && (
                                                    <div className="mt-3 rounded-md border bg-muted/40 p-2 text-xs text-foreground">
                                                        <b>Reviewer note:</b> {a.reviewer_notes}
                                                    </div>
                                                )}
                                                <div className="mt-3 flex justify-end gap-2">
                                                    <Button size="sm" variant="outline" onClick={() => setOpenApp(a)}>
                                                        <Pencil className="h-3.5 w-3.5 mr-1" /> Manage
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            <aside className="space-y-4 min-w-0">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base">Application Summary</CardTitle></CardHeader>
                    <CardContent className="flex items-center gap-3">
                        <Donut segments={[
                            { value: Math.max(counts.under_review, 0), color: TOKEN.warning, label: "Under Review" },
                            { value: Math.max(counts.submitted, 0), color: TOKEN.info, label: "Submitted" },
                            { value: Math.max(counts.approved, 0), color: TOKEN.success, label: "Approved" },
                            { value: Math.max(counts.rejected, 0), color: TOKEN.destructive, label: "Rejected" },
                            { value: Math.max(counts.waitlisted, 0), color: TOKEN.accent, label: "Waitlisted" },
                            { value: Math.max(counts.draft, 0), color: TOKEN.muted, label: "Drafts" },
                        ]} centerTop={String(counts.all)} centerBottom="Total" size={130} />
                        <div className="text-xs space-y-1">
                            <Legend color="bg-warning" label={`Under Review (${counts.under_review})`} />
                            <Legend color="bg-info" label={`Submitted (${counts.submitted})`} />
                            <Legend color="bg-success" label={`Approved (${counts.approved})`} />
                            <Legend color="bg-destructive" label={`Rejected (${counts.rejected})`} />
                            <Legend color="bg-accent" label={`Waitlisted (${counts.waitlisted})`} />
                            <Legend color="bg-muted-foreground" label={`Drafts (${counts.draft})`} />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base">Application Tips</CardTitle></CardHeader>
                    <CardContent className="space-y-1.5 text-xs text-muted-foreground">
                        {["Ensure your profile is complete", "Upload clear and valid documents", "Double-check eligibility criteria", "Submit before the deadline", "Respond to reviewer requests promptly"].map((t) => (
                            <div key={t} className="flex items-start gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-success mt-0.5" />{t}</div>
                        ))}
                    </CardContent>
                </Card>
            </aside>

            <ManageApplicationDialog application={openApp} open={!!openApp} onClose={() => setOpenApp(null)} />
        </div>
    );
}

function Legend({ color, label }: { color: string; label: string }) {
    return (
        <div className="flex gap-2 items-center">
            <span className={`h-2 w-2 rounded-sm ${color}`} />
            {label}
        </div>
    );
}
