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

type PaymentClass = {
    uuid: string;
    title: string;
    institution_name: string;
    class_type: string;
    delivery_mode: string;
    academic_period: string;
    weekly_schedule: string;
    starts_at: string;
    ends_at: string;
    venue: string;
    language: string;
    level_of_study: string;
    location?: string | null;
    instructor?: {
        name: string;
        photo_url?: string | null;
    } | null;
};

type PaymentCourse = {
    uuid: string;
    title: string;
    category: string;
};

type PaymentEnrollment = {
    uuid: string;
    status: string;
    enrolled_at: string;
};

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

    const data: {
        course: PaymentCourse;
        cls: PaymentClass;
        enrollment: PaymentEnrollment;
    } = {
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

    const isLoading = false;

    const cls = data.cls;
    const course = data.course;
    const enrollment = data?.enrollment;

    const paid = Number(amount ?? 0);
    const paymentMethod = (method as PaymentMethod) ?? "personal_wallet";
    const paymentBucket = (bucket as Bucket) ?? "personal";
    const PaymentIcon = ICONS[paymentMethod] ?? Wallet;

    if (isLoading) {
        return (
            <div className="text-muted-foreground max-w-6xl px-4 py-10 text-sm">
                Loading confirmation…
            </div>
        );
    }

    if (!cls) {
        return (
            <div className="text-muted-foreground max-w-6xl px-4 py-10 text-sm">
                Class not found.
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-6">
            {/* Success header */}
            <div className="text-center">
                <div className="bg-success/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
                    <CheckCircle2 className="text-success h-8 w-8" />
                </div>
                <h1 className="text-foreground mt-4 text-2xl font-semibold">
                    {paid > 0 ? "Payment confirmed" : "Enrolment confirmed"}
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    {paid > 0
                        ? `Your payment of ${formatKES(paid)} has been received and your enrolment is active.`
                        : "You have successfully enrolled in this class."}
                </p>
            </div>

            {/* Reservation / payment status */}
            <Card className="border-success/20 bg-success/5 mt-6">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <FileText className="text-success h-4 w-4" />
                        <CardTitle className="text-foreground text-base">Reservation status</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-sm">Status</span>
                        <Badge className="bg-success/10 text-success hover:bg-success/10 capitalize">
                            {status}
                        </Badge>
                    </div>
                    {reference && (
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-sm">Reference</span>
                            <span className="text-foreground font-mono text-sm">{reference}</span>
                        </div>
                    )}
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-sm">Payment method</span>
                        <span className="text-foreground flex items-center gap-1.5 text-sm font-medium">
                            <PaymentIcon className="text-muted-foreground h-4 w-4" />
                            {METHOD_LABEL[paymentMethod] ?? paymentMethod}
                        </span>
                    </div>
                    {paid > 0 && (
                        <>
                            <Separator className="bg-success/10" />
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground text-sm">Amount paid</span>
                                <span className="text-success text-base font-semibold">{formatKES(paid)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground text-sm">Source bucket</span>
                                <span className="text-foreground text-sm capitalize">{paymentBucket.replace(/_/g, " ")}</span>
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
                                    <Badge className="bg-success/10 text-success hover:bg-success/10">
                                        Enrolled
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="text-foreground grid gap-2 text-sm sm:grid-cols-2">
                    <div className="inline-flex items-center gap-2">
                        <BookOpen className="text-muted-foreground h-4 w-4" />
                        {course?.title ?? "—"}
                    </div>
                    <div className="inline-flex items-center gap-2">
                        <Building2 className="text-muted-foreground h-4 w-4" />
                        {cls.institution_name ?? "—"}
                    </div>
                    <div className="inline-flex items-center gap-2">
                        <Users className="text-muted-foreground h-4 w-4" />
                        {cls.instructor?.name ?? "—"}
                    </div>
                    <div className="inline-flex items-center gap-2">
                        <Calendar className="text-muted-foreground h-4 w-4" />
                        {cls.academic_period ?? "—"}
                    </div>
                    <div className="inline-flex items-center gap-2">
                        <Clock className="text-muted-foreground h-4 w-4" />
                        {cls.weekly_schedule ?? "—"}
                    </div>
                    <div className="inline-flex items-center gap-2">
                        <Calendar className="text-muted-foreground h-4 w-4" />
                        {cls.starts_at ? new Date(cls.starts_at).toLocaleDateString() : "TBD"} →{" "}
                        {cls.ends_at ? new Date(cls.ends_at).toLocaleDateString() : "TBD"}
                    </div>
                    <div className="inline-flex items-center gap-2">
                        <MapPin className="text-muted-foreground h-4 w-4" />
                        {cls.venue ?? cls.location ?? "Online"}
                    </div>
                    <div className="inline-flex items-center gap-2">
                        <Languages className="text-muted-foreground h-4 w-4" />
                        {cls.language ?? "—"}
                    </div>
                    <div className="inline-flex items-center gap-2">
                        <GraduationCap className="text-muted-foreground h-4 w-4" />
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
