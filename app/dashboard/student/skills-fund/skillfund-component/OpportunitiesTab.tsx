'use client'


import { Building2, CheckCircle2, ChevronLeft, ChevronRight, FileText, Info, Loader2, Search, Send, ShieldCheck, XCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "../../../../../components/ui/badge";
import { Button } from "../../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../../components/ui/dialog";
import { Input } from "../../../../../components/ui/input";
import { Label } from "../../../../../components/ui/label";
import { Textarea } from "../../../../../components/ui/textarea";
import { useUserProfile } from "../../../../../context/profile-context";
import { Donut, TOKEN } from "../../../_components/color-charts";
import { mockEnrollments, mockOpportunities, Opportunity, sampleApplications, SectionHeader } from "../page";

export function OpportunitiesTab() {
    const user = useUserProfile();
    const opportunities = mockOpportunities
    const isLoading = false
    const applications = sampleApplications

    const [category, setCategory] = useState("All");
    const [search, setSearch] = useState("");

    const [applyTo, setApplyTo] = useState<Opportunity | null>(null);
    const [detailsOf, setDetailsOf] = useState<Opportunity | null>(null);
    const tabRowRef = useRef<HTMLDivElement>(null);
    const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

    useEffect(() => {
        const activeBtn = tabRefs.current.get(category);
        if (activeBtn && tabRowRef.current) {
            activeBtn.scrollIntoView({ inline: "center", behavior: "smooth", block: "nearest" });
        }
    }, [category]);

    const scrollTabs = (direction: "left" | "right") => {
        if (tabRowRef.current) {
            const amount = direction === "left" ? -200 : 200;
            tabRowRef.current.scrollBy({ left: amount, behavior: "smooth" });
        }
    };

    const categories = ["All", "Scholarship", "Sponsorship", "Apprenticeship", "Internship", "Bursary", "Grant", "Fund", "Stipend"];

    const appliedIds = useMemo(() => new Set(applications.map((a) => a.opportunity_id).filter(Boolean) as string[]), [applications]);

    const filtered = useMemo(() => {
        const needle = search.trim().toLowerCase();
        return opportunities.filter((o) => {
            if (category !== "All" && o.category !== category) return false;
            if (!needle) return true;
            const haystack = [
                o.title,
                o.funder,
                o.description ?? "",
                o.category,
                o.location ?? "",
                o.badge ?? "",
                o.eligibility ?? "",
                ...(o.tags ?? []),
                ...(o.study_levels ?? []),
                ...(o.requirements ?? []),
            ]
                .join(" ")
                .toLowerCase();
            return haystack.includes(needle);
        });
    }, [opportunities, category, search]);

    const filtersActive = category !== "All" || search.trim().length > 0;

    return (
        <div className="grid gap-6 min-w-0 *:min-w-0 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-4">
                <SectionHeader
                    title="Opportunities"
                    desc="Discover scholarships, bursaries, grants and sponsorships you can apply for."
                />

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
                        {categories.map((t) => (
                            <button
                                key={t}
                                ref={(el) => {
                                    if (el) tabRefs.current.set(t, el);
                                }}
                                onClick={() => setCategory(t)}
                                className={`shrink-0 px-3 py-2 text-sm border-b-2 -mb-px ${t === category ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                            >
                                {t}
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
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={category === "All" ? "Search opportunities..." : `Search ${category.toLowerCase()} listings...`}
                            className="h-9 w-64 pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    {filtersActive && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 text-xs"
                            onClick={() => {
                                setCategory("All");
                                setSearch("");
                            }}
                        >
                            Clear filters
                        </Button>
                    )}
                    <div className="ml-auto text-xs text-muted-foreground">
                        {filtered.length} {category === "All" ? "" : `${category.toLowerCase()} `}opportunit{filtered.length === 1 ? "y" : "ies"} found
                    </div>
                </div>

                {isLoading ? (
                    <div className="py-16 text-center text-sm text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" /> Loading opportunities…
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 text-center text-sm text-muted-foreground border rounded-lg bg-card">
                        No opportunities match your filters.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                        {filtered.map((o) => {
                            const applied = appliedIds.has(o.id);
                            return (
                                <Card key={o.id} className="hover:border-primary transition-colors flex flex-col">
                                    <CardContent className="p-4 flex flex-col flex-1">
                                        <div className="flex items-start justify-between">
                                            {o.badge ? (
                                                <Badge className={o.badge === "Featured" ? "bg-accent text-accent-foreground" : "bg-success text-success-foreground"}>{o.badge}</Badge>
                                            ) : <span />}
                                            {applied && <Badge variant="outline" className="text-[10px]">Applied</Badge>}
                                        </div>
                                        <div className="mt-2 flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-md bg-muted grid place-items-center">
                                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate">{o.funder}</p>
                                        </div>
                                        <p className="mt-2 font-semibold text-foreground">{o.title}</p>
                                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{o.description}</p>
                                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <p className="text-muted-foreground">Award</p>
                                                <p className="font-semibold text-foreground">KES {o.award_amount_kes.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Deadline</p>
                                                <p className="font-medium text-foreground">{o.deadline ? new Date(o.deadline).toLocaleDateString() : "Rolling"}</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-1">
                                            {o.tags.slice(0, 4).map((t) => (
                                                <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{t}</span>
                                            ))}
                                        </div>
                                        <div className="mt-auto pt-3 flex items-center justify-between gap-2">
                                            <Button size="sm" variant="outline" onClick={() => setDetailsOf(o)}>Details</Button>
                                            <Button
                                                size="sm"
                                                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                                onClick={() => setApplyTo(o)}
                                                disabled={applied}
                                            >
                                                {applied ? "Applied" : "Apply"}
                                            </Button>
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
                    <CardHeader className="pb-2"><CardTitle className="text-base">Eligibility Match</CardTitle></CardHeader>

                    <CardContent className="flex items-center gap-3">
                        <Donut segments={[{ value: 85, color: TOKEN.success, label: "Match" }, { value: 15, color: TOKEN.border, label: "" }]} size={100} stroke={12} centerTop="85%" />
                        <div className="text-xs text-muted-foreground">Complete your profile to improve matches. <Link href="/profile" className="text-primary font-medium">Update →</Link></div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base">Tips</CardTitle></CardHeader>
                    <CardContent className="space-y-1.5 text-xs text-muted-foreground">
                        {["Save drafts and complete before deadlines", "Upload clear, valid documents (PDF, JPG, PNG)", "Tailor your personal statement per opportunity", "Track status from the Applications tab"].map((t) => (
                            <div key={t} className="flex items-start gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-success mt-0.5" />{t}</div>
                        ))}
                    </CardContent>
                </Card>
            </aside>

            <OpportunityDetailsDialog
                opportunity={detailsOf}
                open={!!detailsOf}
                onClose={() => setDetailsOf(null)}
                onApply={(o) => { setDetailsOf(null); setApplyTo(o); }}
                applied={detailsOf ? appliedIds.has(detailsOf.id) : false}
            />
            <ApplyDialog opportunity={applyTo} open={!!applyTo} onClose={() => setApplyTo(null)} />
        </div>
    );
}

function OpportunityDetailsDialog({
    opportunity, open, onClose, onApply, applied,
}: { opportunity: Opportunity | null; open: boolean; onClose: () => void; onApply: (o: Opportunity) => void; applied: boolean }) {
    if (!opportunity) return null;
    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{opportunity.title}</DialogTitle>
                    <DialogDescription>{opportunity.funder} • {opportunity.category}</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 text-sm">
                    <p className="text-foreground">{opportunity.description}</p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="rounded-md border p-2">
                            <p className="text-muted-foreground">Award</p>
                            <p className="font-semibold text-foreground">KES {opportunity.award_amount_kes.toLocaleString()}</p>
                        </div>
                        <div className="rounded-md border p-2">
                            <p className="text-muted-foreground">Deadline</p>
                            <p className="font-semibold text-foreground">{opportunity.deadline ? new Date(opportunity.deadline).toLocaleDateString() : "Rolling"}</p>
                        </div>
                    </div>
                    {opportunity.eligibility && (
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Eligibility</p>
                            <p className="text-sm text-foreground mt-1">{opportunity.eligibility}</p>
                        </div>
                    )}
                    {opportunity.requirements?.length > 0 && (
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Required documents</p>
                            <ul className="mt-1 space-y-1">
                                {opportunity.requirements.map((r) => (
                                    <li key={r} className="text-sm text-foreground flex gap-2 items-center">
                                        <FileText className="h-3.5 w-3.5 text-muted-foreground" /> {r}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                    <Button
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        onClick={() => onApply(opportunity)}
                        disabled={applied}
                    >
                        {applied ? "Already applied" : "Start application"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
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

export function EligibilityChecklist({ checks }: { checks: EligibilityCheck[] }) {
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

function ApplyDialog({ opportunity, open, onClose }: { opportunity: Opportunity | null; open: boolean; onClose: () => void }) {
    const user = useUserProfile();
    const [amount, setAmount] = useState<string>("");
    const [statement, setStatement] = useState("");
    // const { data: ctx } = useEligibilityContext(user?.id);
    const ctx = mockEnrollments

    const checks = useMemo(
        () => (opportunity ? evaluateEligibility(opportunity, amount, ctx) : []),
        [opportunity, amount, ctx],
    );
    const blocked = checks.some((c) => c.required && c.status === "fail");

    const handleSubmit = async () => {
        try {
            if (!user) throw new Error("Please sign in to apply.");
            if (!opportunity) throw new Error("No opportunity selected.");
            if (blocked) {
                throw new Error("Resolve blocking eligibility issues before submitting.");
            }

            toast.success("Application submitted");

            setAmount("");
            setStatement("");
            onClose();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to submit application");
        }
    };


    if (!opportunity) return null;

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Apply — {opportunity.title}</DialogTitle>
                    <DialogDescription>{opportunity.funder} • Award KES {opportunity.award_amount_kes.toLocaleString()}</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                    <div>
                        <Label htmlFor="amount">Amount requested (KES)</Label>
                        <Input
                            id="amount"
                            type="number"
                            placeholder={String(opportunity.award_amount_kes)}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label htmlFor="statement">Personal statement</Label>
                        <Textarea
                            id="statement"
                            rows={5}
                            placeholder="Tell the funder why you should be awarded this funding…"
                            value={statement}
                            onChange={(e) => setStatement(e.target.value)}
                        />
                    </div>

                    <EligibilityChecklist checks={checks} />

                    <p className="text-xs text-muted-foreground">
                        You can upload supporting documents after saving. Draft applications can be edited before submission.
                    </p>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>

                    <Button
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        onClick={handleSubmit}
                        disabled={!statement.trim() || blocked}
                        title={blocked ? "Resolve blocking eligibility rules first" : undefined}
                    >
                        <Send className="mr-1 h-4 w-4" />
                        Submit
                    </Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
}