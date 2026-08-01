import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    BookOpen,
    Calendar,
    Clock,
    GraduationCap,
    Languages,
    MapPin,
    Sparkles,
    Timer,
    Users,
    Wallet,
} from "lucide-react";

interface ClassDetailSheetProps {
    open: boolean;
    detail: any;
    startsAt?: string | Date | null;
    endsAt?: string | Date | null;
    uniqueStudentUuids: string[];
    courseLessons: any[];

    onClose: () => void;
    onEnroll: (detail: any) => void;
    onViewCourse: (detail: any) => void;

    formatSessionSchedule: (sessions: any[]) => string;
    formatScheduleDate: (date: string | Date) => string;
}

export function ClassDetailSheet({
    open,
    detail,
    startsAt,
    endsAt,
    uniqueStudentUuids,
    courseLessons,
    onClose,
    onEnroll,
    onViewCourse,
    formatSessionSchedule,
    formatScheduleDate,
}: ClassDetailSheetProps) {
    return (
        <Sheet open={open} onOpenChange={(value) => !value && onClose()}>
            <SheetContent
                side="right"
                className="w-full overflow-y-auto p-4 sm:max-w-xl"
            >
                {!detail ? null : (
                    <>
                        <SheetHeader className="p-0">
                            <SheetTitle className="text-xl">{detail.title}</SheetTitle>

                            <div className="mt-2 flex flex-wrap gap-2">
                                {detail.session_format && (
                                    <Badge>{detail.session_format}</Badge>
                                )}

                                {detail.location_type && (
                                    <Badge variant="outline">{detail.location_type}</Badge>
                                )}

                                {detail.skills_fund_eligible && (
                                    <Badge className="bg-emerald-100 text-emerald-800">
                                        Fund Eligible
                                    </Badge>
                                )}
                            </div>
                        </SheetHeader>

                        <div className="mt-6 space-y-6">
                            {/* Overview */}
                            <section className="space-y-3">
                                <h3 className="font-semibold">Overview</h3>

                                <div className="grid gap-3 text-sm sm:grid-cols-2">
                                    <InfoRow
                                        icon={<BookOpen className="h-4 w-4" />}
                                        label="Institution"
                                        value={detail.organization?.data?.name}
                                    />

                                    <InfoRow
                                        icon={<Users className="h-4 w-4" />}
                                        label="Instructor"
                                        value={detail.instructor?.data?.full_name}
                                    />

                                    <InfoRow
                                        icon={<GraduationCap className="h-4 w-4" />}
                                        label="Level"
                                        value={detail.level_of_study}
                                    />

                                    <InfoRow
                                        icon={<Languages className="h-4 w-4" />}
                                        label="Language"
                                        value="English"
                                    />

                                    <InfoRow
                                        icon={<Calendar className="h-4 w-4" />}
                                        label="Academic Period"
                                        value={detail.academic_period}
                                    />

                                    <InfoRow
                                        icon={<Clock className="h-4 w-4" />}
                                        label="Schedule"
                                        value={formatSessionSchedule(
                                            detail.session_templates ?? []
                                        )}
                                    />
                                </div>
                            </section>

                            {/* Schedule */}
                            <section className="space-y-3">
                                <h3 className="font-semibold">Class Schedule</h3>

                                <div className="space-y-3 rounded-lg border p-4 text-sm">
                                    <InfoRow
                                        icon={<Calendar className="h-4 w-4" />}
                                        label="Starts"
                                        value={
                                            startsAt
                                                ? formatScheduleDate(startsAt)
                                                : "Not available"
                                        }
                                    />

                                    <InfoRow
                                        icon={<Calendar className="h-4 w-4" />}
                                        label="Ends"
                                        value={
                                            endsAt ? formatScheduleDate(endsAt) : "Not available"
                                        }
                                    />

                                    <InfoRow
                                        icon={<Timer className="h-4 w-4" />}
                                        label="Duration"
                                        value={`${detail.duration_minutes ?? 0} minutes`}
                                    />

                                    <InfoRow
                                        icon={<Calendar className="h-4 w-4" />}
                                        label="Sessions"
                                        value={`${detail.schedule?.length ?? 0}`}
                                    />
                                </div>
                            </section>

                            {/* Capacity */}
                            <section className="space-y-3">
                                <h3 className="font-semibold">Capacity</h3>

                                <div className="space-y-3 rounded-lg border p-4">
                                    <InfoRow
                                        icon={<Users className="h-4 w-4" />}
                                        label="Students"
                                        value={`${uniqueStudentUuids.length} / ${detail.max_participants}`}
                                    />

                                    <InfoRow
                                        icon={<Wallet className="h-4 w-4" />}
                                        label="Training Fee"
                                        value={`KES ${Number(
                                            detail.training_fee ?? 0
                                        ).toLocaleString()}`}
                                    />

                                    <InfoRow
                                        icon={<MapPin className="h-4 w-4" />}
                                        label="Venue"
                                        value={
                                            detail.venue ??
                                            detail.location_name ??
                                            detail.meeting_link ??
                                            "Not provided"
                                        }
                                    />
                                </div>
                            </section>

                            {/* Course */}
                            <section className="space-y-3">
                                <h3 className="font-semibold">Course</h3>

                                <div className="space-y-3 rounded-lg border p-4">
                                    <InfoRow
                                        icon={<BookOpen className="h-4 w-4" />}
                                        label="Units"
                                        value={`${courseLessons.length}`}
                                    />

                                    <InfoRow
                                        icon={<GraduationCap className="h-4 w-4" />}
                                        label="Minimum Age"
                                        value={`${detail.course?.age_lower_limit ?? 0}+`}
                                    />

                                    <InfoRow
                                        icon={<Sparkles className="h-4 w-4" />}
                                        label="Rating"
                                        value={detail.classRating?.average_rating ?? "0"}
                                    />
                                </div>
                            </section>

                            <div className="flex gap-2 pt-2">
                                <Button
                                    className="flex-1 bg-[#0f4c81]"
                                    onClick={() => onEnroll(detail)}
                                >
                                    Join Class
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}

function InfoRow({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value?: React.ReactNode;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 text-[#0f4c81]">
                {icon}
            </div>

            <div className="min-w-0">
                <p className="text-xs text-slate-500">
                    {label}
                </p>

                <p className="font-medium break-words">
                    {value || "Not available"}
                </p>
            </div>
        </div>
    );
}