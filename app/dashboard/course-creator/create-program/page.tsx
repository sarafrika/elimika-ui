'use client'

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
    Check,
    ImageIcon,
    Layers,
    Plus,
    Search,
    Trash2,
    Video,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

///////////////////////////////////////////////////////////////////////////////////
export const currencyKES = new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
});

export const INITIAL_COURSES: any[] = [
    {
        id: 1,
        name: 'Basic Coding',
        category: 'TVET / Vocational',
        subject: 'Programming',
        programType: 'Diploma programs',
        students: 85,
        classes: 4,
        instructor: 'John Doe',
        instructorThumb: 'https://i.pravatar.cc/150?img=12',
        image:
            'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80',
        status: 'Active',
        description:
            'Introduction to programming fundamentals covering variables, control flow, functions and hands-on projects using Python and JavaScript.',
        createdAt: '2024-08-14',
        duration: '12 weeks',
        level: 'Beginner',
    },

    {
        id: 2,
        name: 'AWS Certification',
        category: 'STEM',
        subject: 'Cloud Computing',
        programType: 'Professional Certificate',
        students: 45,
        classes: 3,
        instructor: 'Jane Smith',
        instructorThumb: 'https://i.pravatar.cc/150?img=47',
        image:
            'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
        status: 'Active',
        description:
            'Prepare learners for AWS Solutions Architect Associate exam with labs on EC2, S3, VPC, IAM and cost optimisation.',
        createdAt: '2024-09-02',
        duration: '10 weeks',
        level: 'Intermediate',
    },

    {
        id: 3,
        name: 'Digital Marketing',
        category: 'TVET / Vocational',
        subject: 'Marketing',
        programType: 'Short courses',
        students: 25,
        classes: 2,
        instructor: 'Michael Lee',
        instructorThumb: 'https://i.pravatar.cc/150?img=11',
        image:
            'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
        status: 'Active',
        description:
            'SEO, paid social, content marketing, and analytics with real campaign simulations.',
        createdAt: '2024-07-19',
        duration: '6 weeks',
        level: 'Beginner',
    },

    {
        id: 4,
        name: '3D Animation',
        category: 'Arts',
        subject: 'Animation',
        programType: 'Diploma programs',
        students: 72,
        classes: 4,
        instructor: 'Alex Patel',
        instructorThumb: 'https://i.pravatar.cc/150?img=33',
        image:
            'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1200&q=80',
        status: 'Completed',
        description:
            'Blender-based character rigging, animation principles, and short-film production.',
        createdAt: '2024-01-10',
        duration: '16 weeks',
        level: 'Intermediate',
    },

    {
        id: 5,
        name: 'Graphic Design',
        category: 'Arts',
        subject: 'Visual Design',
        programType: 'Diploma programs',
        students: 72,
        classes: 4,
        instructor: 'Emily Wang',
        instructorThumb: 'https://i.pravatar.cc/150?img=44',
        image:
            'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=1200&q=80',
        status: 'Completed',
        description:
            'Typography, brand systems, and print/digital layout using the Adobe suite.',
        createdAt: '2024-02-05',
        duration: '12 weeks',
        level: 'Beginner',
    },

    {
        id: 6,
        name: 'Robotics',
        category: 'Arts',
        subject: 'Engineering',
        programType: 'TVET',
        students: 98,
        classes: 5,
        instructor: 'Lily Chen',
        instructorThumb: 'https://i.pravatar.cc/150?img=48',
        image:
            'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80',
        status: 'Completed',
        description:
            'Arduino/RPi microcontroller projects with sensors, actuators and autonomous navigation.',
        createdAt: '2024-03-22',
        duration: '14 weeks',
        level: 'Intermediate',
    },

    {
        id: 7,
        name: 'Basketball',
        category: 'Sports',
        subject: 'Sports',
        programType: 'Short courses',
        students: 82,
        classes: 4,
        instructor: 'Brian Kim',
        instructorThumb: 'https://i.pravatar.cc/150?img=13',
        image:
            'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80',
        status: 'Completed',
        description:
            'Fundamentals, conditioning and team play for youth divisions.',
        createdAt: '2024-04-01',
        duration: '8 weeks',
        level: 'Beginner',
    },

    {
        id: 8,
        name: 'AutoCAD Essentials',
        category: 'TVET / Vocational',
        subject: 'Design',
        programType: 'Professional Certificate',
        students: 125,
        classes: 6,
        instructor: 'Brian Kim',
        instructorThumb: 'https://i.pravatar.cc/150?img=13',
        image:
            'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80',
        status: 'Completed',
        description:
            '2D drafting and 3D modelling for architectural and mechanical drawings.',
        createdAt: '2024-05-14',
        duration: '10 weeks',
        level: 'Beginner',
    },
];
// Mock-only data for the Course Creator flow (no backend).
export type SessionRow = {
    id: string;
    no: number;
    title: string;
    topics: string;
    duration: number;
    type: string;
};

export type LessonDraft = {
    id: string;
    no: number;
    title: string;
    duration: string;
    content: string;
    activities: string[];
    assessments: string[];
};

export type AssessmentRow = {
    id: string;
    type: string;
    detail: string;
    purpose: string;
    weight: number;
    required: boolean;
};

export type GradeRow = { id: string; grade: string; min: number; max: number };

export const CATEGORIES = [
    "Music",
    "Programming & Development",
    "Business",
    "Design",
    "Sports",
    "TVET / Vocational",
];

export const COURSE_TYPES = [
    "Short course",
    "Certificate Course",
    "Diploma programme",
    "Bootcamp",
    "Professional Certificate",
];

export const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];
export const LECTURE_TYPES = ["Live Lecture", "Recorded", "Hybrid", "Self-paced"];
export const CERTIFICATIONS = ["None", "Certificate of Completion", "Accredited Certificate"];
export const SESSION_TYPES = ["Live Lecture", "Workshop", "Lab", "Q&A", "Assessment"];
export const ACTIVITY_TYPES = ["Practice drill", "Guided exercise", "Discussion", "Project task"];
export const ASSESSMENT_TYPES = [
    "Quizzes",
    "Assignments",
    "Practice Activities",
    "Final Assessment",
];

export const initialSessions: SessionRow[] = [
    {
        id: "s1",
        no: 1,
        title: "Introduction to the Course",
        topics: "Overview, expectations, and learning path",
        duration: 60,
        type: "Live Lecture",
    },
];

export const initialLessons: LessonDraft[] = [
    {
        id: "l1",
        no: 1,
        title: "Getting started with the fundamentals",
        duration: "20 mins",
        content:
            "Welcome to the course. In this lesson we set up your tools and walk through how the course is structured.",
        activities: ["Warm-up drill: repeat the core pattern 10 times"],
        assessments: ["Knowledge check: 5 auto-graded questions"],
    },
];

export const initialAssessments: AssessmentRow[] = [
    {
        id: "a1",
        type: "Quizzes",
        detail: "Auto-graded quiz questions",
        purpose: "Evaluate understanding of key concepts",
        weight: 20,
        required: true,
    },
    {
        id: "a2",
        type: "Assignments",
        detail: "File upload / submission",
        purpose: "Assess practical application of knowledge",
        weight: 25,
        required: true,
    },
    {
        id: "a3",
        type: "Practice Activities",
        detail: "In-lesson practice & tasks",
        purpose: "Reinforce learning and skills practice",
        weight: 15,
        required: true,
    },
    {
        id: "a4",
        type: "Final Assessment",
        detail: "Final exam or project",
        purpose: "Evaluate overall learning achievement",
        weight: 40,
        required: true,
    },
];

export const initialGrades: GradeRow[] = [
    { id: "g1", grade: "A", min: 90, max: 100 },
    { id: "g2", grade: "B", min: 80, max: 89 },
    { id: "g3", grade: "C", min: 70, max: 79 },
    { id: "g4", grade: "D", min: 60, max: 69 },
    { id: "g5", grade: "F", min: 0, max: 59 },
];

export const uid = () => Math.random().toString(36).slice(2, 9);


// Mock-only data for the Program Creator flow (no backend).

export type ProgramRequirementRow = {
    id: string;
    item: string;
    quantity: number;
    type: string;
    notes: string;
};

export const PROGRAM_TYPES = [
    "Certificate Programme",
    "Diploma Programme",
    "Bootcamp",
    "Professional Pathway",
    "Career Track",
];

export const REQUIREMENT_TYPES = [
    "Equipment",
    "Classroom / Space",
    "Software",
    "Materials",
    "Instructor skill",
];

export const DELIVERY_MODES = ["In-person", "Virtual", "Hybrid", "Self-paced"];

export const initialProgramRequirements: ProgramRequirementRow[] = [
    {
        id: "pr1",
        item: "Training classroom",
        quantity: 1,
        type: "Classroom / Space",
        notes: "Dedicated room with board or digital screen",
    },
];

export const programUid = () => Math.random().toString(36).slice(2, 9);
///////////////////////////////////////////////////////////////////////////////////

const STEPS = ["Program Details", "Training Requirements", "Select Courses", "Review & Publish"];

export default function CreateProgramPage() {
    const [step, setStep] = useState(0);

    // Step 1 — details
    const [title, setTitle] = useState("");
    const [code, setCode] = useState("");
    const [category, setCategory] = useState("");
    const [programType, setProgramType] = useState("");
    const [difficulty, setDifficulty] = useState("");
    const [delivery, setDelivery] = useState("");
    const [duration, setDuration] = useState("");
    const [prerequisite, setPrerequisite] = useState("");
    const [classLimit, setClassLimit] = useState("");
    const [price, setPrice] = useState("");
    const [videoLink, setVideoLink] = useState("");
    const [description, setDescription] = useState("");
    const [objectives, setObjectives] = useState<string[]>(["", "", ""]);

    // Step 2 — training requirements
    const [requirements, setRequirements] = useState<ProgramRequirementRow[]>(
        initialProgramRequirements,
    );
    const [requirementNotes, setRequirementNotes] = useState("");

    // Step 3 — courses
    const [selected, setSelected] = useState<number[]>([]);
    const [query, setQuery] = useState("");
    const [courseFilter, setCourseFilter] = useState("All");

    const [publishStatus, setPublishStatus] = useState("draft");

    const selectedCourses = useMemo(
        () => INITIAL_COURSES.filter((c) => selected.includes(c.id)),
        [selected],
    );

    const filteredCourses = useMemo(() => {
        const q = query.trim().toLowerCase();
        return INITIAL_COURSES.filter((c) => {
            const matchQ =
                !q ||
                c.name.toLowerCase().includes(q) ||
                c.subject.toLowerCase().includes(q) ||
                c.instructor.toLowerCase().includes(q);
            const matchCat = courseFilter === "All" || c.category === courseFilter;
            return matchQ && matchCat;
        });
    }, [query, courseFilter]);

    const courseCategories = useMemo(
        () => ["All", ...Array.from(new Set(INITIAL_COURSES.map((c) => c.category)))],
        [],
    );

    const stepError = useMemo(() => {
        if (step === 0) {
            if (!title.trim()) return "Add a program title to continue.";
            if (!category) return "Select a category / department.";
            if (!programType) return "Select a program type.";
            if (!description.trim()) return "Add a program description.";
            return null;
        }
        if (step === 1) {
            if (requirements.length === 0) return "Add at least one training requirement.";
            if (requirements.some((r) => !r.item.trim())) return "Every requirement needs an item name.";
            return null;
        }
        if (step === 2 && selected.length < 2) {
            return "Select at least two courses to bundle into a program.";
        }
        return null;
    }, [step, title, category, programType, description, requirements, selected]);

    const next = () => {
        if (stepError) {
            toast.error(stepError);
            return;
        }
        setStep((s) => Math.min(s + 1, STEPS.length - 1));
    };

    const saveDraft = () =>
        toast.success("Saved as draft", {
            description: title.trim() ? title : "Untitled program",
        });

    const setReq = (id: string, patch: Partial<ProgramRequirementRow>) =>
        setRequirements((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

    const toggleCourse = (id: number) =>
        setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

    return (
        <div className="space-y-6 pb-24 py-6">
            <PageHeader
                eyebrow="Program Creator"
                title="Create New Program"
                description="Bundle existing courses into a structured program with its own requirements, pricing and outcomes."
                action={
                    <Button variant="outline" onClick={saveDraft}>
                        Save as Draft
                    </Button>
                }
            />

            <Stepper step={step} onStep={setStep} />

            {step === 0 && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Basic Information</CardTitle>
                            <CardDescription>Identity, pricing and media for this program.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Program Title *" className="sm:col-span-2">
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                                        placeholder="e.g. Digital Creative Professional Pathway"
                                    />
                                    <Counter value={title.length} max={100} />
                                </Field>
                                <Field label="Program Code">
                                    <Input
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.slice(0, 20))}
                                        placeholder="e.g. PRG-101"
                                    />
                                </Field>
                                <Field label="Category / Department *">
                                    <Picker
                                        value={category}
                                        onChange={setCategory}
                                        options={CATEGORIES}
                                        placeholder="Select category"
                                    />
                                </Field>
                                <Field label="Program Type *">
                                    <Picker
                                        value={programType}
                                        onChange={setProgramType}
                                        options={PROGRAM_TYPES}
                                        placeholder="Select program type"
                                    />
                                </Field>
                                <Field label="Difficulty Level">
                                    <Picker
                                        value={difficulty}
                                        onChange={setDifficulty}
                                        options={DIFFICULTIES}
                                        placeholder="Select difficulty"
                                    />
                                </Field>
                                <Field label="Delivery Mode">
                                    <Picker
                                        value={delivery}
                                        onChange={setDelivery}
                                        options={DELIVERY_MODES}
                                        placeholder="Select delivery mode"
                                    />
                                </Field>
                                <Field label="Program Duration">
                                    <Input
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                        placeholder="e.g. 24 weeks"
                                    />
                                </Field>
                                <Field label="Pre-requisite" className="sm:col-span-2">
                                    <Input
                                        value={prerequisite}
                                        onChange={(e) => setPrerequisite(e.target.value)}
                                        placeholder="Prior knowledge, courses or certification required"
                                    />
                                </Field>
                                <Field label="Class Limit">
                                    <Input
                                        type="number"
                                        min={0}
                                        value={classLimit}
                                        onChange={(e) => setClassLimit(e.target.value)}
                                        placeholder="Maximum number of students"
                                    />
                                </Field>
                                <Field label="Program Price (KES)">
                                    <Input
                                        type="number"
                                        min={0}
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        placeholder="Enter amount"
                                    />
                                </Field>
                            </div>

                            <div className="space-y-4">
                                <Field label="Program Thumbnail">
                                    <UploadBox
                                        icon={<ImageIcon className="h-5 w-5" />}
                                        hint="Recommended size 1280×720 (16:9). JPG, PNG or WEBP (max 2MB)."
                                    />
                                </Field>
                                <Field label="Preview Video">
                                    <UploadBox icon={<Video className="h-5 w-5" />} hint="MP4, MOV or WEBM (max 100MB)." />
                                    <p className="py-2 text-center text-xs text-muted-foreground">or</p>
                                    <Input
                                        value={videoLink}
                                        onChange={(e) => setVideoLink(e.target.value)}
                                        placeholder="Enter YouTube or Vimeo link"
                                    />
                                    <p className="mt-1 text-xs text-muted-foreground">Link will be embedded as preview.</p>
                                </Field>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Program Description *</CardTitle>
                            <CardDescription>
                                Explain who this program is for and what the bundled courses achieve together.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                rows={6}
                                value={description}
                                onChange={(e) => setDescription(e.target.value.slice(0, 5000))}
                                placeholder="Write a detailed description of your program…"
                            />
                            <Counter value={description.length} max={5000} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Program Objectives</CardTitle>
                            <CardDescription>What learners will achieve by completing the whole program.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ListEditor
                                label="Objectives"
                                hint="List the key objectives of this program."
                                items={objectives}
                                onChange={setObjectives}
                                placeholder="Enter objective"
                            />
                        </CardContent>
                    </Card>
                </div>
            )}

            {step === 1 && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Training Requirements</CardTitle>
                            <CardDescription>
                                Equipment, spaces and resources needed to deliver this program. All items are assumed to be
                                in use at the same time during training.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="overflow-x-auto rounded-lg border">
                                <Table className="min-w-[720px]">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-14">#</TableHead>
                                            <TableHead>Item</TableHead>
                                            <TableHead className="w-32">Quantity</TableHead>
                                            <TableHead className="w-48">Type</TableHead>
                                            <TableHead>Notes</TableHead>
                                            <TableHead className="w-12" />
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {requirements.map((r, i) => (
                                            <TableRow key={r.id}>
                                                <TableCell className="font-mono text-sm">{i + 1}</TableCell>
                                                <TableCell>
                                                    <Input
                                                        value={r.item}
                                                        placeholder="e.g. Piano"
                                                        onChange={(e) => setReq(r.id, { item: e.target.value })}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        value={r.quantity}
                                                        onChange={(e) => setReq(r.id, { quantity: Number(e.target.value) || 0 })}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Picker
                                                        value={r.type}
                                                        onChange={(v) => setReq(r.id, { type: v })}
                                                        options={REQUIREMENT_TYPES}
                                                        placeholder="Type"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        value={r.notes}
                                                        placeholder="Optional notes"
                                                        onChange={(e) => setReq(r.id, { notes: e.target.value })}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        aria-label="Remove requirement"
                                                        onClick={() => setRequirements((rows) => rows.filter((x) => x.id !== r.id))}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setRequirements((rows) => [
                                        ...rows,
                                        { id: programUid(), item: "", quantity: 1, type: "Equipment", notes: "" },
                                    ])
                                }
                            >
                                <Plus className="mr-1 h-4 w-4" /> Add Requirement
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Additional Requirements</CardTitle>
                            <CardDescription>
                                Knowledge, skills, tools or resources learners need before joining this program.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                rows={4}
                                value={requirementNotes}
                                onChange={(e) => setRequirementNotes(e.target.value.slice(0, 1000))}
                                placeholder="Enter student requirements"
                            />
                            <Counter value={requirementNotes.length} max={1000} />
                        </CardContent>
                    </Card>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="gap-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <CardTitle className="text-base">Select Courses</CardTitle>
                                    <CardDescription>
                                        Add already-created courses to this program. {selected.length} selected.
                                    </CardDescription>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                            placeholder="Search courses"
                                            className="w-56 pl-8"
                                        />
                                    </div>
                                    <div className="w-48">
                                        <Picker
                                            value={courseFilter}
                                            onChange={setCourseFilter}
                                            options={courseCategories}
                                            placeholder="Category"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {filteredCourses.map((c) => {
                                    const isSelected = selected.includes(c.id);
                                    return (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => toggleCourse(c.id)}
                                            className={`flex gap-3 rounded-lg border p-3 text-left transition ${isSelected ? "border-primary bg-primary/5" : "hover:border-primary/40"
                                                }`}
                                        >
                                            <img
                                                src={c.image}
                                                alt={`${c.name} course thumbnail`}
                                                loading="lazy"
                                                className="h-16 w-24 shrink-0 rounded-md object-cover"
                                            />
                                            <div className="min-w-0 flex-1 space-y-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="truncate text-sm font-semibold">{c.name}</p>
                                                    <Checkbox checked={isSelected} aria-label={`Select ${c.name}`} />
                                                </div>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {c.subject} · {c.instructor}
                                                </p>
                                                <div className="flex flex-wrap gap-1">
                                                    <Badge variant="secondary" className="text-[10px]">
                                                        {c.category}
                                                    </Badge>
                                                    {c.duration && (
                                                        <Badge variant="outline" className="text-[10px]">
                                                            {c.duration}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            {filteredCourses.length === 0 && (
                                <p className="py-8 text-center text-sm text-muted-foreground">
                                    No courses match your search.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Program Structure</CardTitle>
                            <CardDescription>Order the selected courses as learners will take them.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {selectedCourses.length === 0 ? (
                                <div className="flex flex-col items-center gap-1 rounded-md border border-dashed py-10 text-center">
                                    <Layers className="h-5 w-5 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">No courses added yet.</p>
                                </div>
                            ) : (
                                selected.map((id, i) => {
                                    const c = INITIAL_COURSES.find((x) => x.id === id);
                                    if (!c) return null;
                                    return (
                                        <div key={id} className="flex items-center gap-3 rounded-md border px-3 py-2">
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                                                {i + 1}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">{c.name}</p>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {c.subject} · {c.duration ?? "—"}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                disabled={i === 0}
                                                onClick={() =>
                                                    setSelected((s) => {
                                                        const copy = [...s];
                                                        //@ts-ignore
                                                        [copy[i - 1], copy[i]] = [copy[i], copy[i - 1]];
                                                        return copy;
                                                    })
                                                }
                                            >
                                                Up
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                disabled={i === selected.length - 1}
                                                onClick={() =>
                                                    setSelected((s) => {
                                                        const copy = [...s];
                                                        //@ts-ignore
                                                        [copy[i + 1], copy[i]] = [copy[i], copy[i + 1]];
                                                        return copy;
                                                    })
                                                }
                                            >
                                                Down
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label={`Remove ${c.name}`}
                                                onClick={() => toggleCourse(id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    );
                                })
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {step === 3 && (
                <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">{title || "Untitled program"}</CardTitle>
                                <CardDescription>{description || "No description added yet."}</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                <SummaryRow label="Program code" value={code || "—"} />
                                <SummaryRow label="Category" value={category || "—"} />
                                <SummaryRow label="Program type" value={programType || "—"} />
                                <SummaryRow label="Difficulty" value={difficulty || "—"} />
                                <SummaryRow label="Delivery" value={delivery || "—"} />
                                <SummaryRow label="Duration" value={duration || "—"} />
                                <SummaryRow label="Pre-requisite" value={prerequisite || "—"} />
                                <SummaryRow label="Class limit" value={classLimit || "—"} />
                                <SummaryRow
                                    label="Price"
                                    value={price ? currencyKES.format(Number(price) || 0) : "—"}
                                />
                                <SummaryRow label="Preview video" value={videoLink ? "Linked" : "—"} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Objectives</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <SummaryList
                                    title=""
                                    items={objectives.filter((o) => o.trim())}
                                    empty="No objectives added yet."
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Training Requirements</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {requirements.filter((r) => r.item.trim()).length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No requirements added yet.</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {requirements
                                            .filter((r) => r.item.trim())
                                            .map((r) => (
                                                <li key={r.id} className="flex items-center justify-between gap-3 text-sm">
                                                    <span>
                                                        {r.item}
                                                        {r.notes ? (
                                                            <span className="text-muted-foreground"> — {r.notes}</span>
                                                        ) : null}
                                                    </span>
                                                    <span className="shrink-0 text-muted-foreground">
                                                        {r.quantity} · {r.type}
                                                    </span>
                                                </li>
                                            ))}
                                    </ul>
                                )}
                                {requirementNotes.trim() && (
                                    <>
                                        <Separator className="my-3" />
                                        <p className="text-sm text-muted-foreground">{requirementNotes}</p>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Bundled Courses ({selectedCourses.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {selectedCourses.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No courses added yet.</p>
                                ) : (
                                    <ol className="space-y-2">
                                        {selected.map((id, i) => {
                                            const c = INITIAL_COURSES.find((x) => x.id === id);
                                            if (!c) return null;
                                            return (
                                                <li key={id} className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
                                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                                                        {i + 1}
                                                    </span>
                                                    <span className="flex-1 truncate font-medium">{c.name}</span>
                                                    <span className="text-xs text-muted-foreground">{c.duration ?? "—"}</span>
                                                </li>
                                            );
                                        })}
                                    </ol>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Publish Status</CardTitle>
                                <CardDescription>Choose the status of your program.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <RadioGroup
                                    value={publishStatus}
                                    onValueChange={setPublishStatus}
                                    className="grid gap-3 md:grid-cols-2"
                                >
                                    {[
                                        { v: "draft", t: "Draft", d: "Save as draft and continue editing later." },
                                        { v: "published", t: "Published", d: "Make this program live and visible to students." },
                                    ].map((o) => (
                                        <Label
                                            key={o.v}
                                            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${publishStatus === o.v ? "border-primary bg-primary/5" : ""
                                                }`}
                                        >
                                            <RadioGroupItem value={o.v} className="mt-0.5" />
                                            <span>
                                                <span className="block text-sm font-medium">{o.t}</span>
                                                <span className="block text-xs text-muted-foreground">{o.d}</span>
                                            </span>
                                        </Label>
                                    ))}
                                </RadioGroup>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="h-fit lg:sticky lg:top-20">
                        <CardHeader>
                            <CardTitle className="text-base">Program Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <SummaryRow label="Courses" value={String(selectedCourses.length)} />
                            <SummaryRow
                                label="Total course classes"
                                value={String(selectedCourses.reduce((s, c) => s + c.classes, 0))}
                            />
                            <SummaryRow label="Requirements" value={String(requirements.length)} />
                            <SummaryRow label="Objectives" value={String(objectives.filter((o) => o.trim()).length)} />
                            <SummaryRow label="Class limit" value={classLimit || "—"} />
                            <SummaryRow
                                label="Price"
                                value={price ? currencyKES.format(Number(price) || 0) : "—"}
                            />
                            <SummaryRow label="Status" value={publishStatus} />
                            <Separator className="my-3" />
                            <Button
                                className="w-full"
                                onClick={() =>
                                    toast.success(
                                        publishStatus === "published" ? "Program published" : "Program saved",
                                        { description: `${title || "Untitled program"} · mock data only` },
                                    )
                                }
                            >
                                <Check className="mr-1 h-4 w-4" />
                                {publishStatus === "published" ? "Publish program" : "Save program"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="sticky bottom-0 -mx-4 flex items-center justify-between gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
                <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
                    Back
                </Button>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={saveDraft}>
                        Save as Draft
                    </Button>
                    {step < STEPS.length - 1 && <Button onClick={next}>Next: {STEPS[step + 1]}</Button>}
                </div>
            </div>
        </div>
    );
}

function Stepper({ step, onStep }: { step: number; onStep: (n: number) => void }) {
    return (
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <ol className="flex min-w-max items-center gap-3">
                {STEPS.map((s, i) => (
                    <li key={s} className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => onStep(i)}
                            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${i === step
                                ? "border-primary bg-primary text-primary-foreground"
                                : i < step
                                    ? "border-primary/40 text-primary"
                                    : "text-muted-foreground"
                                }`}
                        >
                            <span
                                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold ${i === step ? "bg-primary-foreground/20" : "bg-muted"
                                    }`}
                            >
                                {i < step ? <Check className="h-3 w-3" /> : i + 1}
                            </span>
                            {s}
                        </button>
                        {i < STEPS.length - 1 && <span className="h-px w-6 bg-border" />}
                    </li>
                ))}
            </ol>
        </div>
    );
}

function Field({
    label,
    children,
    className,
}: {
    label: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`space-y-1.5 ${className ?? ""}`}>
            <Label className="text-xs font-medium">{label}</Label>
            {children}
        </div>
    );
}

function Counter({ value, max }: { value: number; max: number }) {
    return (
        <p className="text-right text-[11px] text-muted-foreground">
            {value}/{max}
        </p>
    );
}

function Picker({
    value,
    onChange,
    options,
    placeholder,
}: {
    value: string;
    onChange: (v: string) => void;
    options: string[];
    placeholder: string;
}) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {options.map((o) => (
                    <SelectItem key={o} value={o}>
                        {o}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

function UploadBox({ icon, hint }: { icon: React.ReactNode; hint: string }) {
    return (
        <button
            type="button"
            onClick={() => toast.info("Upload is mocked in this prototype.")}
            className="flex w-full flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center hover:border-primary"
        >
            <span className="text-primary">{icon}</span>
            <span className="text-sm font-medium">Click to upload or drag and drop</span>
            <span className="text-xs text-muted-foreground">{hint}</span>
        </button>
    );
}

function ListEditor({
    label,
    hint,
    items,
    onChange,
    placeholder,
}: {
    label: string;
    hint: string;
    items: string[];
    onChange: (v: string[]) => void;
    placeholder: string;
}) {
    return (
        <div className="space-y-3">
            <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{hint}</p>
            </div>
            {items.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                    <span className="w-6 text-xs text-muted-foreground">{i + 1}</span>
                    <Input
                        value={v}
                        placeholder={placeholder}
                        onChange={(e) => onChange(items.map((it, idx) => (idx === i ? e.target.value : it)))}
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Remove"
                        onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => onChange([...items, ""])}>
                <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
        </div>
    );
}

function SummaryList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
    return (
        <div>
            {title && <p className="mb-2 text-sm font-semibold">{title}</p>}
            {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">{empty}</p>
            ) : (
                <ul className="space-y-1.5">
                    {items.map((it, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            {it}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium capitalize">{value}</span>
        </div>
    );
}
