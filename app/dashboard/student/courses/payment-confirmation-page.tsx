import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    ArrowRight,
    BookOpen,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    CreditCard,
    FileText,
    GraduationCap,
    Languages,
    MapPin,
    PiggyBank, Smartphone,
    Users,
    Wallet,
} from "lucide-react";
import Link from "next/link";
import { formatKES } from "../../../../src/features/dashboard/courses/pages/PaymentMethodPicker";
import { Bucket, METHOD_LABEL, PaymentMethod } from "../wallet/page";

const ICONS: Record<string, React.ElementType> = {
    personal_wallet: Wallet,
    skills_fund: PiggyBank,
    mobile_money: Smartphone,
    card: CreditCard,
};

export function PaymentConfirmationPage() {
    const courseId = 'crs-id'
    const classId = 'cls-id'

    const reference = `PAY-${Date.now().toString().slice(-8)}`;
    const method: PaymentMethod = "personal_wallet";
    const bucket: Bucket = "personal";
    const amount = 25000;
    const status = "confirmed";

    const data = {
        course: {
            uuid: courseId,
            title: "Advanced Data Analytics with Python",
            category: "Data Science",
        },

        cls: {
            uuid: classId,
            title: "Weekend Cohort - August 2026",
            institution_name: "DevHub Academy",
            class_type: "Instructor-led",
            delivery_mode: "Hybrid",
            academic_period: "Aug – Dec 2026",
            weekly_schedule: "Sat & Sun • 9:00 AM – 1:00 PM",
            starts_at: "2026-08-16",
            ends_at: "2026-12-12",
            venue: "DevHub Learning Centre, Nairobi",
            language: "English",
            level_of_study: "Intermediate",

            instructor: {
                name: "Sarah Wanjiku",
                photo_url:
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300",
            },
        },

        enrollment: {
            uuid: "ENR-283847",
            status: "confirmed",
            enrolled_at: "2026-08-05T10:30:00Z",
        },
    };

    const isLoading = false

    const cls = data?.cls as any;
    const course = data?.course as any;
    const enrollment = data?.enrollment;

    const paid = Number(amount ?? 0);
    const paymentMethod = (method as PaymentMethod) ?? "personal_wallet";
    const paymentBucket = (bucket as Bucket) ?? "personal";
    const PaymentIcon = ICONS[paymentMethod] ?? Wallet;

    if (isLoading) {
        return (
            <div className="max-w-6xl px-4 py-10 text-sm text-slate-500">
                Loading confirmation…
            </div>
        );
    }

    if (!cls) {
        return (
            <div className="max-w-6xl px-4 py-10 text-sm text-slate-500">
                Class not found.
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-6">
            {/* Success header */}
            <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <h1 className="mt-4 text-2xl font-semibold text-slate-900">
                    {paid > 0 ? "Payment confirmed" : "Enrolment confirmed"}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    {paid > 0
                        ? `Your payment of ${formatKES(paid)} has been received and your enrolment is active.`
                        : "You have successfully enrolled in this class."}
                </p>
            </div>

            {/* Reservation / payment status */}
            <Card className="mt-6 border-emerald-200 bg-emerald-50/50">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-emerald-700" />
                        <CardTitle className="text-base text-emerald-900">Reservation status</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Status</span>
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 capitalize">
                            {status}
                        </Badge>
                    </div>
                    {reference && (
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">Reference</span>
                            <span className="font-mono text-sm text-slate-900">{reference}</span>
                        </div>
                    )}
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Payment method</span>
                        <span className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                            <PaymentIcon className="h-4 w-4 text-slate-500" />
                            {METHOD_LABEL[paymentMethod] ?? paymentMethod}
                        </span>
                    </div>
                    {paid > 0 && (
                        <>
                            <Separator className="bg-emerald-200/60" />
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">Amount paid</span>
                                <span className="text-base font-semibold text-emerald-800">{formatKES(paid)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">Source bucket</span>
                                <span className="text-sm capitalize text-slate-900">{paymentBucket.replace(/_/g, " ")}</span>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Enrolled class details */}
            <Card className="mt-4">
                <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                        {cls.instructor?.photo_url && (
                            <img
                                src={cls.instructor.photo_url}
                                alt=""
                                className="h-12 w-12 rounded-full object-cover"
                            />
                        )}
                        <div className="flex-1">
                            <CardTitle className="text-lg">{cls.title}</CardTitle>
                            <div className="mt-1 flex flex-wrap gap-2 text-xs">
                                {cls.class_type && (
                                    <Badge variant="secondary" className="capitalize">
                                        {cls.class_type}
                                    </Badge>
                                )}
                                {cls.delivery_mode && (
                                    <Badge variant="outline" className="capitalize">
                                        {cls.delivery_mode}
                                    </Badge>
                                )}
                                {enrollment && (
                                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                                        Enrolled
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                    <div className="inline-flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-slate-400" />
                        {course?.title ?? "—"}
                    </div>
                    <div className="inline-flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        {cls.institution_name ?? "—"}
                    </div>
                    <div className="inline-flex items-center gap-2">
                        <Users className="h-4 w-4 text-slate-400" />
                        {cls.instructor?.name ?? "—"}
                    </div>
                    <div className="inline-flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {cls.academic_period ?? "—"}
                    </div>
                    <div className="inline-flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-400" />
                        {cls.weekly_schedule ?? "—"}
                    </div>
                    <div className="inline-flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {cls.starts_at ? new Date(cls.starts_at).toLocaleDateString() : "TBD"} →{" "}
                        {cls.ends_at ? new Date(cls.ends_at).toLocaleDateString() : "TBD"}
                    </div>
                    <div className="inline-flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        {cls.venue ?? cls.location ?? "Online"}
                    </div>
                    <div className="inline-flex items-center gap-2">
                        <Languages className="h-4 w-4 text-slate-400" />
                        {cls.language ?? "—"}
                    </div>
                    <div className="inline-flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-slate-400" />
                        {cls.level_of_study ?? "—"}
                    </div>
                </CardContent>
            </Card>

            {/* Next steps */}
            <Card className="mt-4">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">What&apos;s next?</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                    {[
                        {
                            title: "Access your class",
                            desc: "Your class is now available in Learning Hub → My Classes.",
                            icon: BookOpen,
                        },
                        {
                            title: "Attend your first session",
                            desc: `Your first class begins ${new Date(cls.starts_at).toLocaleDateString()}.`,
                            icon: Calendar,
                        },
                        {
                            title: "Watch for reminders",
                            desc: "We'll send reminders before every scheduled class.",
                            icon: Clock,
                        },
                    ].map(item => {
                        const Icon = item.icon;

                        return (
                            <div
                                key={item.title}
                                className="flex items-start gap-3"
                            >
                                <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary">
                                    <Icon className="h-4 w-4" />
                                </div>

                                <div>
                                    <p className="font-medium">
                                        {item.title}
                                    </p>

                                    <p className="text-sm text-muted-foreground">
                                        {item.desc}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Link href="/dashboard/student/courses">
                    <Button variant="outline" className="w-full sm:w-auto">
                        Browse More Courses
                    </Button>
                </Link>
                <Link
                    href={{
                        pathname: "/dashboard/student/learning-hub",
                        // query: { tab: "my-classes" },
                    }}
                >
                    <Button className="w-full sm:w-auto">
                        Go to My Classes
                        <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                </Link>
            </div>
        </div>
    );
}
