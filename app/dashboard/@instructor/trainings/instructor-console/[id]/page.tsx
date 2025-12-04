"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useBreadcrumb } from "@/context/breadcrumb-provider";
import { useClassRoster } from "@/hooks/use-class-roster";
import { useCourseLessonsWithContent } from "@/hooks/use-courselessonwithcontent";
import { useInstructorInfo } from "@/hooks/use-instructor-info";
import {
    getClassDefinitionOptions,
    getCourseAssessmentsOptions,
    getCourseByUuidOptions,
    getInstructorCalendarOptions,
    getInstructorScheduleOptions,
    markAttendanceMutation,
} from "@/services/client/@tanstack/react-query.gen";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronRight, FileText, Search, View } from "lucide-react";
import moment from "moment";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { toast } from "sonner";

const localizer = momentLocalizer(moment);

export default function ClassPreviewPage() {
    const router = useRouter();
    const params = useParams();
    const classId = params?.id as string;
    const { replaceBreadcrumbs } = useBreadcrumb();

    useEffect(() => {
        if (!classId) return;

        replaceBreadcrumbs([
            { id: "dashboard", title: "Dashboard", url: "/dashboard/overview" },
            {
                id: "trainings",
                title: "Training Classes",
                url: "/dashboard/trainings",
            },
            {
                id: "instructor-console",
                title: "Training Dashboard",
                url: `/dashboard/trainings/instructor-console/${classId}`,
                isLast: true,
            },
        ]);
    }, [replaceBreadcrumbs, classId]);

    // --- Fetch class definition
    const { data, isLoading: classIsLoading } = useQuery({
        ...getClassDefinitionOptions({ path: { uuid: classId as string } }),
        enabled: !!classId,
    });
    const classData = data?.data;

    // --- Fetch course detail (for title/desc, etc.)
    const {
        data: courseDetail,
        isLoading,
        isFetched,
    } = useQuery({
        ...getCourseByUuidOptions({ path: { uuid: classData?.course_uuid as string } }),
        enabled: !!classData?.course_uuid,
    });
    const course = courseDetail?.data;

    // --- other queries/hooks
    const { data: cAssesssment } = useQuery({
        ...getCourseAssessmentsOptions({
            path: { courseUuid: classData?.course_uuid as string },
            query: { pageable: {} },
        }),
        enabled: !!classData?.course_uuid,
    });

    const { instructorInfo } = useInstructorInfo({
        instructorUuid: classData?.default_instructor_uuid as string,
    });
    // @ts-ignore
    const instructor = instructorInfo?.data;

    const {
        isLoading: isAllLessonsDataLoading,
        lessons: lessonsWithContent,
        contentTypeMap,
    } = useCourseLessonsWithContent({ courseUuid: classData?.course_uuid as string });

    const [registrationLink] = useState(
        `https://elimika.sarafrika.com/trainings/${classData?.uuid}/register`
    );
    const [copied, setCopied] = useState(false);

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) { }
    };

    const shareToSocial = (platform: string) => {
        const url = encodeURIComponent(registrationLink);
        const text = encodeURIComponent(`Check out this class: ${classData?.title}`);

        const urls = {
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
            twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
            whatsapp: `https://wa.me/?text=${text}%20${url}`,
            email: `mailto:?subject=${encodeURIComponent(classData?.title as string)}&body=${text}%20${url}`,
        };

        if (urls[platform as keyof typeof urls]) {
            window.open(urls[platform as keyof typeof urls], "_blank", "width=600,height=400");
        }
    };

    const { data: timetable } = useQuery({
        ...getInstructorScheduleOptions({
            path: { instructorUuid: classData?.default_instructor_uuid as string },
            query: {
                start: "2026-11-02" as any,
                end: "2026-12-19" as any,
            },
        }),
        enabled: !!classData?.default_instructor_uuid,
    });

    // --- UI state for the 3-column page
    const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
    const [grade, setGrade] = useState<number | "">("");
    const [status, setStatus] = useState<"Submitted" | "Excused" | "Missing">("Submitted");
    const [attendance, setAttendance] = useState<Record<string, boolean>>({});
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
    const [showQR, setShowQR] = useState(false);

    const markAttendance = useMutation(markAttendanceMutation());
    const { roster, uniqueEnrollments, isLoading: rosterLoading } = useClassRoster(classId);

    const { data: classSchedule } = useQuery({
        ...getInstructorCalendarOptions({
            path: { instructorUuid: classData?.default_instructor_uuid as string },
            query: { start_date: "2025-09-11" as any, end_date: "2026-11-11" as any },
        }),
        enabled: !!classData?.default_instructor_uuid,
    });

    // fallback students array (if roster not loaded yet)
    const studentsFallback = [
        { name: "Dianne Russel", section: "A" },
        { name: "Eleanor Pena", section: "A" },
        { name: "Jacob Jones", section: "B" },
        { name: "Brooklyn Simmons", section: "C" },
        { name: "Leslie Alexander", section: "C" },
        { name: "Floyd Miles", section: "B" },
        { name: "Theresa Webb", section: "A" },
    ];

    // prefer roster data from hook if available
    const students = useMemo(() => {
        if (roster && Array.isArray(roster) && roster.length > 0) {
            return roster.map((r: any) => ({
                name: r?.learner?.fullName || `${r?.learner?.firstName || ""} ${r?.learner?.lastName || ""}`,
                uuid: r?.learner?.uuid,
            }));
        }
        return studentsFallback;
    }, [roster]);

    // activity / rubric / performance (you can replace with your fetched ones)
    const activityLog = [
        { name: "Dianne Russel", action: "Checked in via QR", time: "8:35 AM" },
        { name: "Jacob Jones", action: "Submitted Assignment 2", time: "9:15 AM" },
        { name: "Leslie Alexander", action: "Downloaded Lecture Slides", time: "10:02 AM" },
    ];

    const rubric = [
        { criteria: "Attendance", weight: "20%", description: "Consistency and punctuality" },
        { criteria: "Participation", weight: "25%", description: "Engagement during sessions" },
        { criteria: "Assignments", weight: "35%", description: "Completion and quality" },
        { criteria: "Exam", weight: "20%", description: "Final test performance" },
    ];

    const performance = [
        { name: "Dianne Russel", participation: 95, score: 88, progress: 92 },
        { name: "Jacob Jones", participation: 78, score: 70, progress: 75 },
        { name: "Leslie Alexander", participation: 85, score: 90, progress: 88 },
    ];

    const toggleAttendance = (studentName: string) => {
        setAttendance((prev) => ({ ...prev, [studentName]: !prev[studentName] }));
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const names = Array.from(e.target.files).map((f) => f.name);
            setUploadedFiles((prev) => [...prev, ...names]);
        }
    };

    const handleSaveGrade = () => {
        // wire this to your API: save grade for selectedStudent/class/assignment
        // console.log("Saving grade", { classId, selectedStudent, grade, status });
        // You might want to call a mutation here that saves grade to backend
        // show a toast/notification on success
    };

    if (isLoading || isAllLessonsDataLoading || classIsLoading || rosterLoading) {
        return (
            <div className="flex flex-col gap-6 space-y-2 p-6">
                <Skeleton className="h-[150px] w-full" />
                <div className="flex flex-row items-center justify-between gap-4">
                    <Skeleton className="h-[450px] w-2/3" />
                    <Skeleton className="h-[450px] w-1/3" />
                </div>
                <Skeleton className="h-[100px] w-full" />
            </div>
        );
    }

    // get "featured" content (first content from lessonsWithContent or placeholder)
    const featuredContent = lessonsWithContent && lessonsWithContent.length > 0 ? lessonsWithContent[0] : null;
    const featuredImage = "/placeholder.png";

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            {/* LEFT SIDEBAR — STUDENT LIST */}
            <aside className="w-72 bg-card border-r border">
                {/* Search */}
                <div className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search Student"
                            className="pl-10 pr-3 py-2 border-input border rounded-lg w-full text-sm focus:ring focus:ring-primary/20 bg-background"
                        />
                    </div>
                </div>

                {/* Student list */}
                <div className="flex-1 overflow-y-auto px-2 py-1">
                    {studentsFallback.map((s: any, idx: number) => {
                        const name = typeof s === "string" ? s : s.name;
                        return (
                            <button
                                key={name + idx}
                                onClick={() => {
                                    setSelectedStudent(name);
                                    toast.message(name);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-left mb-1 text-sm transition-colors ${selectedStudent === name
                                    ? "bg-muted text-primary font-medium"
                                    : "hover:bg-muted"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary grid place-items-center text-xs">
                                        {name
                                            ?.split(" ")
                                            .map((n: string) => n?.[0])
                                            .slice(0, 2)
                                            .join("")}
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-sm">{name}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {(s as any)?.section ?? ""}
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight className="text-muted-foreground" />
                            </button>
                        );
                    })}
                </div>
            </aside>

            {/* MAIN CENTER — RESOURCE / CONTENT VIEW */}
            <main className="flex-1 overflow-y-auto px-10 py-6">
                <div className="flex items-center gap-2 text-sm text-primary mb-4">
                    <span className="font-semibold">Final Exam</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-muted-foreground">Speed Grade</span>
                </div>

                <div className="bg-card rounded-xl shadow-sm border p-6">
                    {/* Assignment header */}
                    <div className="flex items-start justify-between gap-6 mb-6">
                        <div className="flex-1">
                            <h1 className="text-2xl font-semibold">
                                {classData?.title || course?.name || "Final Exam"}
                            </h1>
                            <p className="text-muted-foreground text-sm mt-1">
                                Submission Date:{" "}
                                <span className="text-foreground font-medium">10/02/2024</span>
                            </p>
                        </div>

                        <div className="w-48 text-right">
                            <p className="text-sm text-muted-foreground">Assignment Point</p>
                            <p className="font-semibold text-green-600 text-lg">
                                80/100 (80%)
                            </p>
                        </div>
                    </div>

                    {/* Thumbnail */}
                    <div className="w-full rounded-xl overflow-hidden mb-5">
                        <img
                            src={featuredImage}
                            alt="Preview"
                            className="w-full h-64 object-cover"
                        />
                    </div>

                    {/* Description */}
                    <p className="text-foreground/80 leading-7 text-sm mb-6">
                        {classData?.description ||
                            course?.description ||
                            "Lorem ipsum…"}
                    </p>

                    {/* Secondary content */}
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                        <button className="text-white bg-primary hover:bg-primary/90 px-4 py-3 rounded-full shadow">
                            ▶ Play
                        </button>
                    </div>
                </div>
            </main>

            {/* RIGHT PANEL — SUBMISSION + DETAILS */}
            <aside className="w-80 bg-card border-l border p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-muted-foreground">
                        Graded:{" "}
                        <span className="font-semibold text-foreground">20/50</span>
                    </p>
                    <button className="text-sm text-primary font-medium">View Rubric</button>
                </div>

                {/* Submission card */}
                <div className="border rounded-xl p-4 mb-6">
                    <p className="text-muted-foreground text-sm mb-2">Submission</p>

                    <div className="mb-3 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Due Date</span>
                            <span className="font-medium text-foreground">02/10/2024</span>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm text-muted-foreground">Grade</label>
                        <input
                            className="w-full border-input border rounded-lg px-3 py-2 mt-1 text-sm bg-background"
                            type="number"
                            value={grade === "" ? "" : grade}
                            onChange={(e) =>
                                setGrade(e.target.value === "" ? "" : Number(e.target.value))
                            }
                            placeholder="e.g. 80"
                        />
                    </div>

                    {/* Status */}
                    <div className="mb-4">
                        <p className="text-muted-foreground text-sm mb-2">Status</p>

                        <div className="flex items-center gap-4 text-sm">
                            {/* Submitted */}
                            <label
                                className={`flex items-center gap-2 cursor-pointer ${status === "Submitted" ? "text-green-700" : ""
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="status"
                                    className="hidden"
                                    checked={status === "Submitted"}
                                    onChange={() => setStatus("Submitted")}
                                />
                                <span
                                    className={`w-3 h-3 rounded-full ${status === "Submitted" ? "bg-green-600" : "bg-muted"
                                        }`}
                                />
                                Submitted
                            </label>

                            {/* Excused */}
                            <label
                                className={`flex items-center gap-2 cursor-pointer ${status === "Excused" ? "text-yellow-600" : ""
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="status"
                                    className="hidden"
                                    checked={status === "Excused"}
                                    onChange={() => setStatus("Excused")}
                                />
                                <span
                                    className={`w-3 h-3 rounded-full ${status === "Excused" ? "bg-yellow-500" : "bg-muted"
                                        }`}
                                />
                                Excused
                            </label>

                            {/* Missing */}
                            <label
                                className={`flex items-center gap-2 cursor-pointer ${status === "Missing" ? "text-destructive" : ""
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="status"
                                    className="hidden"
                                    checked={status === "Missing"}
                                    onChange={() => setStatus("Missing")}
                                />
                                <span
                                    className={`w-3 h-3 rounded-full ${status === "Missing" ? "bg-destructive" : "bg-muted"
                                        }`}
                                />
                                Missing
                            </label>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm hover:bg-primary/90">
                            Save Grade
                        </button>
                        <button className="text-sm px-3 py-2 rounded-lg border">
                            Toggle Present
                        </button>
                    </div>
                </div>

                {/* Submission details */}
                <div>
                    <p className="text-muted-foreground text-sm mb-2">
                        Submission Details
                    </p>

                    <p className="text-sm text-foreground mb-3">
                        <span className="font-medium">Word Count:</span> 500 Words
                    </p>

                    <div className="mb-3">
                        <p className="text-foreground font-medium text-sm mb-2">
                            Files Uploaded
                        </p>
                        <ul className="text-sm space-y-2">
                            {uploadedFiles.length === 0 && (
                                <li className="text-muted-foreground">No files uploaded yet</li>
                            )}

                            {uploadedFiles.map((file, i) => (
                                <li
                                    key={i}
                                    className="flex items-center gap-2 text-primary cursor-pointer hover:underline"
                                >
                                    <FileText /> {file}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="mb-4">
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                            Upload file
                        </label>
                        <input
                            type="file"
                            multiple
                            onChange={handleFileUpload}
                            className="text-sm"
                        />
                    </div>

                    <button className="mt-3 flex items-center gap-2 text-primary text-sm font-medium">
                        <View /> View Comments (50)
                    </button>
                </div>

                {/* Quick Stats */}
                <div className="mt-8 border-t border pt-4">
                    <p className="text-xs text-muted-foreground mb-2">Quick Stats</p>
                    <div className="text-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-muted-foreground">Enrolled</span>
                            <span className="font-medium text-foreground">
                                {uniqueEnrollments?.length ?? students.length}
                            </span>
                        </div>

                        <div className="flex items-center justify-between mb-2">
                            <span className="text-muted-foreground">Upcoming Sessions</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Instructor</span>
                            <span className="font-medium text-foreground">
                                {instructor?.fullName || instructor?.name || "—"}
                            </span>
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    );
}
