import { Link, createFileRoute } from "@tanstack/react-router";
import {
    ArrowLeft,
    ArrowRight,
    BadgeCheck,
    BookOpen,
    CheckCircle2,
    ClipboardCheck,
    Clock3,
    GraduationCap,
    LayoutGrid,
    Plus,
    ShieldCheck,
    Trash2,
    UserRound,
    Wallet,
} from "lucide-react";
import { useMemo } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import { CourseBuilder } from "@/components/onboarding/CourseBuilder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
    COURSE_CATEGORIES,
    SAMPLE_SARAFRIKA_ACCOUNT,
    WALLET_SECTIONS,
    newId,
    useCreatorJourney,
    walletFilledCount,
} from "@/lib/creator-onboarding";
import type { CourseDraft, WalletField, WalletSectionKey } from "@/lib/creator-onboarding";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
    head: () => ({
        meta: [
            { title: "Course Creator Onboarding | Elimika" },
            {
                name: "description",
                content:
                    "Join the Sarafrika ecosystem, open an Elimika course creator account, build your skills wallet and submit it for verification.",
            },
            { property: "og:title", content: "Course Creator Onboarding | Elimika" },
            {
                property: "og:description",
                content:
                    "Join the Sarafrika ecosystem, open an Elimika course creator account, build your skills wallet and submit it for verification.",
            },
            { property: "og:type", content: "website" },
            { name: "twitter:card", content: "summary_large_image" },
        ],
    }),
    component: OnboardingPage,
});

const STEPS = [
    { key: "connect", label: "Sarafrika account", icon: BadgeCheck },
    { key: "product", label: "Sarafrika products", icon: LayoutGrid },
    { key: "account", label: "Account type", icon: UserRound },
    { key: "categories", label: "Categories", icon: BookOpen },
    { key: "wallet", label: "Skills wallet", icon: Wallet },
    { key: "review", label: "Submit for review", icon: ShieldCheck },
] as const;

const PRODUCTS = [
    { id: "elimika", name: "Elimika", tagline: "Teaching, courses and digital workbooks.", available: true },
    { id: "kazi", name: "Kazi", tagline: "Talent, gigs and creative bookings.", available: false },
    { id: "soko", name: "Soko", tagline: "Marketplace for creative goods.", available: false },
];

const ACCOUNT_TYPES = [
    {
        id: "course-creator",
        name: "Course Creator",
        detail: "Design and publish courses. Creators do not run live classes.",
        available: true,
    },
    { id: "instructor", name: "Instructor", detail: "Deliver live classes from published courses.", available: false },
    { id: "student", name: "Student", detail: "Enrol and learn at your own pace.", available: false },
];

function OnboardingPage() {
    const {
        journey,
        hydrated,
        patch,
        setJourney,
        addWalletItem,
        updateWalletItem,
        removeWalletItem,
        reset,
    } = useCreatorJourney();

    const step = journey.step;
    const setStep = (value: number) => patch({ step: value });
    const filled = walletFilledCount(journey);

    const canAdvance = useMemo(() => {
        if (step === 0) return journey.account !== null;
        if (step === 1) return journey.product === "elimika";
        if (step === 2) return journey.accountType === "course-creator";
        if (step === 3) return journey.categories.length > 0;
        if (step === 4) return journey.wallet.skills.length > 0;
        return true;
    }, [journey, step]);

    const connectSarafrika = () => {
        const account = { ...SAMPLE_SARAFRIKA_ACCOUNT, connectedAt: new Date().toISOString() };
        patch({ account, displayName: account.fullName });
        toast.success("Sarafrika account connected.");
    };

    if (!hydrated) {
        return <OnboardingFrame step={0} hideProgress>{null}</OnboardingFrame>;
    }

    if (journey.reviewStatus !== "not_submitted") {
        return (
            <OnboardingFrame step={STEPS.length} hideProgress>
                <ReviewState
                    approved={journey.reviewStatus === "approved"}
                    submittedAt={journey.submittedAt}
                    approvedAt={journey.approvedAt}
                    name={journey.displayName}
                    categories={journey.categories}
                    walletCount={filled}
                    courses={journey.courses}
                    onApprove={() =>
                        patch({ reviewStatus: "approved", approvedAt: new Date().toISOString() })
                    }
                    onCreateCourse={(course) =>
                        setJourney((current) => ({ ...current, courses: [...current.courses, course] }))
                    }
                    onUpdateCourse={(course) =>
                        setJourney((current) => ({
                            ...current,
                            courses: current.courses.map((item) => (item.id === course.id ? course : item)),
                        }))
                    }
                    onSubmitCourse={(id) =>
                        setJourney((current) => ({
                            ...current,
                            courses: current.courses.map((course) =>
                                course.id === id
                                    ? { ...course, status: "submitted", submittedAt: new Date().toISOString() }
                                    : course,
                            ),
                        }))
                    }
                    onReset={reset}
                />
            </OnboardingFrame>
        );
    }

    return (
        <OnboardingFrame step={step}>
            {step === 0 ? (
                <div className="space-y-5">
                    <p className="text-sm leading-6 text-muted-foreground">
                        Elimika is part of the Sarafrika ecosystem. Continue with your Sarafrika account and we will carry your
                        details across — no need to type them again.
                    </p>
                    {journey.account ? (
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 rounded-md border border-primary/40 bg-primary/5 p-4">
                                <BadgeCheck className="mt-0.5 h-5 w-5 text-primary" />
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground">Sarafrika account connected</p>
                                    <p className="text-sm text-muted-foreground">
                                        These details come from your Sarafrika profile and stay in sync.
                                    </p>
                                </div>
                            </div>
                            <dl className="divide-y divide-border overflow-hidden rounded-md border border-border">
                                <SummaryRow label="Full name" value={journey.account.fullName} />
                                <SummaryRow label="Email" value={journey.account.email} />
                            </dl>
                            <Button variant="ghost" size="sm" onClick={() => patch({ account: null, displayName: "" })}>
                                Use a different Sarafrika account
                            </Button>
                        </div>
                    ) : (
                        <div className="rounded-md border border-border p-6 text-center">
                            <BadgeCheck className="mx-auto h-6 w-6 text-primary" />
                            <p className="mt-3 text-sm text-muted-foreground">
                                Your full name and email will be shared with Elimika.
                            </p>
                            <Button className="mt-4" onClick={connectSarafrika}>
                                Continue with Sarafrika
                            </Button>
                        </div>
                    )}
                </div>
            ) : null}

            {step === 1 ? (
                <div className="space-y-4">
                    <p className="text-sm leading-6 text-muted-foreground">
                        Your Sarafrika account gives you access to every product in the ecosystem. Choose the one you want to set up
                        first.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-3">
                        {PRODUCTS.map((product) => (
                            <ChoiceCard
                                key={product.id}
                                title={product.name}
                                detail={product.tagline}
                                selected={journey.product === product.id}
                                disabled={!product.available}
                                onSelect={() => patch({ product: product.id })}
                            />
                        ))}
                    </div>
                </div>
            ) : null}

            {step === 2 ? (
                <div className="space-y-5">
                    <p className="text-sm leading-6 text-muted-foreground">
                        Pick how you want to take part in Elimika. Course creators build and publish courses; teaching is handled by
                        instructors.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-3">
                        {ACCOUNT_TYPES.map((type) => (
                            <ChoiceCard
                                key={type.id}
                                title={type.name}
                                detail={type.detail}
                                selected={journey.accountType === type.id}
                                disabled={!type.available}
                                onSelect={() => patch({ accountType: type.id })}
                            />
                        ))}
                    </div>
                    <dl className="divide-y divide-border overflow-hidden rounded-md border border-border">
                        <SummaryRow label="Full name" value={journey.account?.fullName ?? "—"} />
                        <SummaryRow label="Email" value={journey.account?.email ?? "—"} />
                    </dl>
                    <p className="text-xs text-muted-foreground">
                        Shared from your Sarafrika account. Update it in your Sarafrika profile to change it here.
                    </p>
                </div>
            ) : null}

            {step === 3 ? (
                <div className="space-y-4">
                    <p className="text-sm leading-6 text-muted-foreground">
                        Select the categories you want to offer courses in. You can change these later.
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                        {COURSE_CATEGORIES.map((category) => {
                            const selected = journey.categories.includes(category);
                            return (
                                <button
                                    key={category}
                                    type="button"
                                    aria-pressed={selected}
                                    onClick={() =>
                                        patch({
                                            categories: selected
                                                ? journey.categories.filter((item) => item !== category)
                                                : [...journey.categories, category],
                                        })
                                    }
                                    className={cn(
                                        "flex items-center justify-between rounded-md border px-4 py-3 text-left text-sm transition-colors",
                                        selected
                                            ? "border-primary bg-primary/5 font-medium text-foreground"
                                            : "border-border bg-background text-muted-foreground hover:border-primary/40",
                                    )}
                                >
                                    {category}
                                    {selected ? <CheckCircle2 className="h-4 w-4 text-primary" /> : null}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ) : null}

            {step === 4 ? (
                <div className="space-y-4">
                    <p className="text-sm leading-6 text-muted-foreground">
                        Your skills wallet is what the Elimika admin reviews. Add at least one skill; the richer the evidence, the
                        faster the approval.
                    </p>
                    <Tabs defaultValue={WALLET_SECTIONS[0]!.key}>
                        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
                            {WALLET_SECTIONS.map((section) => (
                                <TabsTrigger key={section.key} value={section.key} className="gap-1.5 text-xs">
                                    {section.label}
                                    {journey.wallet[section.key].length > 0 ? (
                                        <span className="rounded-full bg-primary/15 px-1.5 text-[10px] font-semibold text-primary">
                                            {journey.wallet[section.key].length}
                                        </span>
                                    ) : null}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                        {WALLET_SECTIONS.map((section) => (
                            <TabsContent key={section.key} value={section.key} className="mt-5 space-y-4">
                                <p className="text-sm text-muted-foreground">{section.summary}</p>
                                {journey.wallet[section.key].length === 0 ? (
                                    <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                                        Nothing added yet.
                                    </p>
                                ) : null}
                                {journey.wallet[section.key].map((item, index) => (
                                    <div key={item.id} className="rounded-md border border-border p-4">
                                        <div className="mb-3 flex items-center justify-between">
                                            <p className="text-sm font-semibold text-foreground">
                                                {item.values[section.titleField]?.trim() || `${section.label} ${index + 1}`}
                                            </p>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                aria-label="Remove entry"
                                                onClick={() => removeWalletItem(section.key, item.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            {section.fields.map((field) => (
                                                <WalletFieldInput
                                                    key={field.key}
                                                    field={field}
                                                    value={item.values[field.key] ?? ""}
                                                    onChange={(value) => updateWalletItem(section.key, item.id, field.key, value)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                <Button variant="outline" size="sm" onClick={() => addWalletItem(section.key as WalletSectionKey)}>
                                    <Plus />
                                    {section.addLabel}
                                </Button>
                            </TabsContent>
                        ))}
                    </Tabs>
                </div>
            ) : null}

            {step === 5 ? (
                <div className="space-y-5">
                    <p className="text-sm leading-6 text-muted-foreground">
                        Check your details, then send your skills wallet to the Elimika admin. You can create courses once it is
                        approved.
                    </p>
                    <dl className="divide-y divide-border overflow-hidden rounded-md border border-border">
                        <SummaryRow label="Name" value={journey.account?.fullName || journey.displayName || "—"} />
                        <SummaryRow label="Email" value={journey.account?.email ?? "—"} />
                        <SummaryRow label="Product" value="Elimika" />
                        <SummaryRow label="Account type" value="Course Creator" />
                        <SummaryRow label="Categories" value={journey.categories.join(", ") || "—"} />
                        <SummaryRow
                            label="Skills wallet"
                            value={`${filled} of ${WALLET_SECTIONS.length} sections completed`}
                        />
                    </dl>
                </div>
            ) : null}

            <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
                <Button variant="ghost" size="sm" disabled={step === 0} onClick={() => setStep(Math.max(0, step - 1))}>
                    <ArrowLeft />
                    Back
                </Button>
                {step < STEPS.length - 1 ? (
                    <Button disabled={!canAdvance} onClick={() => setStep(step + 1)}>
                        Continue
                        <ArrowRight />
                    </Button>
                ) : (
                    <Button
                        onClick={() => {
                            patch({ reviewStatus: "submitted", submittedAt: new Date().toISOString() });
                            toast.success("Skills wallet submitted for verification.");
                        }}
                    >
                        <ShieldCheck />
                        Submit for verification
                    </Button>
                )}
            </div>
        </OnboardingFrame>
    );
}

function ReviewState({
    approved,
    submittedAt,
    approvedAt,
    name,
    categories,
    walletCount,
    courses,
    onApprove,
    onCreateCourse,
    onUpdateCourse,
    onSubmitCourse,
    onReset,
}: {
    approved: boolean;
    submittedAt: string | null;
    approvedAt: string | null;
    name: string;
    categories: string[];
    walletCount: number;
    courses: CourseDraft[];
    onApprove: () => void;
    onCreateCourse: (course: CourseDraft) => void;
    onUpdateCourse: (course: CourseDraft) => void;
    onSubmitCourse: (id: string) => void;
    onReset: () => void;
}) {
    const formatted = (value: string | null) =>
        value ? new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";

    return (
        <div className="space-y-8">
            <div className="flex flex-col items-center py-4 text-center">
                <span
                    className={cn(
                        "grid h-16 w-16 place-items-center rounded-full",
                        approved ? "bg-success/15 text-success" : "bg-warning/15 text-warning",
                    )}
                >
                    {approved ? <BadgeCheck className="h-8 w-8" /> : <Clock3 className="h-8 w-8" />}
                </span>
                <h2 className="mt-5 text-2xl font-bold text-foreground">
                    {approved ? `Verified — welcome, ${name.split(" ")[0] || "creator"}` : "Awaiting admin verification"}
                </h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                    {approved
                        ? "Your skills wallet has been verified. You can now create courses and submit each one for approval."
                        : "Your skills wallet is with the Elimika admin. You will be able to create courses once it is verified."}
                </p>
                <dl className="mt-6 w-full divide-y divide-border overflow-hidden rounded-md border border-border text-left">
                    <SummaryRow label="Categories" value={categories.join(", ") || "—"} />
                    <SummaryRow label="Skills wallet" value={`${walletCount} of ${WALLET_SECTIONS.length} sections`} />
                    <SummaryRow label="Submitted" value={formatted(submittedAt)} />
                    <SummaryRow label="Verified" value={approved ? formatted(approvedAt) : "Pending"} />
                </dl>
                {!approved ? (
                    <Button variant="outline" className="mt-6" onClick={onApprove}>
                        <ClipboardCheck />
                        Simulate admin approval
                    </Button>
                ) : null}
            </div>

            {approved ? (
                <CourseBuilder
                    categories={categories}
                    courses={courses}
                    onCreateCourse={onCreateCourse}
                    onUpdateCourse={onUpdateCourse}
                    onSubmitCourse={onSubmitCourse}
                />
            ) : null}

            <div className="flex flex-wrap justify-center gap-3 border-t border-border pt-6">
                <Button asChild variant="outline">
                    <Link to="/">
                        <BookOpen />
                        Back home
                    </Link>
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onReset}>
                    Start over
                </Button>
            </div>
        </div>
    );
}

function WalletFieldInput({
    field,
    value,
    onChange,
}: {
    field: WalletField;
    value: string;
    onChange: (value: string) => void;
}) {
    const id = `${field.key}-${useMemo(newId, [])}`;
    if (field.type === "select") {
        return (
            <Field label={field.label}>
                <Select {...(value ? { value } : {})} onValueChange={onChange}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                        {(field.options ?? []).map((option) => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </Field>
        );
    }
    if (field.type === "textarea") {
        return (
            <div className="sm:col-span-2">
                <Field label={field.label} htmlFor={id}>
                    <Textarea id={id} rows={3} value={value} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />
                </Field>
            </div>
        );
    }
    return (
        <Field label={field.label} htmlFor={id}>
            <Input
                id={id}
                type={field.type === "date" ? "date" : "text"}
                value={value}
                placeholder={field.placeholder}
                onChange={(event) => onChange(event.target.value)}
            />
        </Field>
    );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-4 bg-background px-4 py-3">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="text-right text-sm font-medium text-foreground">{value}</dd>
        </div>
    );
}

function ChoiceCard({
    title,
    detail,
    selected,
    disabled,
    onSelect,
}: {
    title: string;
    detail: string;
    selected: boolean;
    disabled?: boolean;
    onSelect: () => void;
}) {
    return (
        <button
            type="button"
            disabled={disabled}
            aria-pressed={selected}
            onClick={onSelect}
            className={cn(
                "flex h-full flex-col rounded-md border p-4 text-left transition-colors",
                selected ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/40",
                disabled && "cursor-not-allowed opacity-50 hover:border-border",
            )}
        >
            <span className="flex items-center justify-between text-sm font-semibold text-foreground">
                {title}
                {selected ? <CheckCircle2 className="h-4 w-4 text-primary" /> : null}
            </span>
            <span className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</span>
            {disabled ? <span className="mt-2 text-[11px] font-medium uppercase text-muted-foreground">Coming soon</span> : null}
        </button>
    );
}

function OnboardingFrame({
    step,
    hideProgress,
    children,
}: {
    step: number;
    hideProgress?: boolean;
    children: ReactNode;
}) {
    return (
        <div className="min-h-screen bg-muted/40">
            <header className="border-b border-border bg-background">
                <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
                    <Button asChild variant="ghost" size="sm">
                        <Link to="/">
                            <ArrowLeft />
                            Home
                        </Link>
                    </Button>
                    <Badge variant="outline" className="gap-1.5">
                        <GraduationCap className="h-3.5 w-3.5" />
                        Sarafrika · Elimika
                    </Badge>
                </div>
            </header>

            <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-foreground">Course creator onboarding</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        From your Sarafrika account to a verified skills wallet — everything is saved on this device as you go.
                    </p>
                </div>

                {!hideProgress ? (
                    <ol className="mb-8 flex items-center gap-2" aria-label="Onboarding progress">
                        {STEPS.map((item, index) => {
                            const Icon = item.icon;
                            const reached = step >= index;
                            return (
                                <li key={item.key} className="flex flex-1 items-center gap-2">
                                    <span
                                        className={cn(
                                            "grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs font-semibold",
                                            reached
                                                ? "border-primary bg-primary text-primary-foreground"
                                                : "border-border bg-background text-muted-foreground",
                                        )}
                                    >
                                        {step > index ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                                    </span>
                                    <span
                                        className={cn(
                                            "hidden text-sm font-medium lg:block",
                                            reached ? "text-foreground" : "text-muted-foreground",
                                        )}
                                    >
                                        {item.label}
                                    </span>
                                    {index < STEPS.length - 1 ? (
                                        <span className={cn("mx-1 h-px flex-1", step > index ? "bg-primary" : "bg-border")} />
                                    ) : null}
                                </li>
                            );
                        })}
                    </ol>
                ) : null}

                <section className="rounded-lg border border-border bg-background p-6 shadow-sm sm:p-8">
                    {!hideProgress ? (
                        <h2 className="mb-5 text-lg font-semibold text-foreground">{STEPS[step]?.label}</h2>
                    ) : null}
                    {children}
                </section>
            </main>
        </div>
    );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor={htmlFor}>{label}</Label>
            {children}
        </div>
    );
}
