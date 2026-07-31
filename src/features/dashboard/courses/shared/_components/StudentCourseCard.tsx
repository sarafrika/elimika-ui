import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Users, UserSearch, Star, Clock, Layers, GraduationCap, PiggyBank, UserCheck, CalendarDays, ChevronDown, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CourseDetailsSheet } from "@/components/CourseDetailsSheet";


const searchSchema = z.object({
    q: fallback(z.string(), "").default(""),
    category: fallback(z.string(), "").default(""),
    sub: fallback(z.string(), "").default(""),
    sort: fallback(z.string(), "").default(""),
    filter: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/start-course/")({
    validateSearch: zodValidator(searchSchema),
    component: StartCourseIndex,
});

type CatGroup = {
    key: string; // "" = All
    label: string;
    subs: { label: string; apply: (s: any) => any }[];
};

const setCat = (cat: string, sub = "") => (s: any) => ({ ...s, category: cat, sub, sort: "", filter: "" });
const setExplore = (patch: any) => (s: any) => ({ ...s, category: "", sub: "", sort: "", filter: "", ...patch });

const CATEGORY_GROUPS: CatGroup[] = [
    {
        key: "", label: "All",
        subs: [
            { label: "Programs", apply: setCat("", "program") },
            { label: "Short Courses", apply: setCat("", "short course") },
            { label: "Workshops", apply: setCat("", "workshop") },
            { label: "Certificates", apply: setCat("", "certificate") },
        ],
    },
    {
        key: "Explore", label: "Explore",
        subs: [
            { label: "Newest", apply: setExplore({ sort: "newest" }) },
            { label: "Popular", apply: setExplore({ sort: "popular" }) },
            { label: "Free", apply: setExplore({ filter: "free" }) },
            { label: "Skills Fund", apply: setExplore({ filter: "fund" }) },
        ],
    },
    {
        key: "Music", label: "Music",
        subs: ["Piano", "Guitar", "Violin", "Drums", "Saxophone", "Trumpet", "Vocals"].map((l) => ({ label: l, apply: setCat("Music", l.toLowerCase()) })),
    },
    {
        key: "Sports", label: "Sports",
        subs: ["Football", "Swimming", "Tennis", "Volleyball", "Basketball", "Athletics", "Rugby"].map((l) => ({ label: l, apply: setCat("Sports", l.toLowerCase()) })),
    },
    {
        key: "Dance", label: "Dance",
        subs: ["Ballet", "Opera", "African Cultural Dance", "Indian Dance", "Contemporary", "Hip Hop"].map((l) => ({ label: l, apply: setCat("Dance", l.toLowerCase()) })),
    },
    {
        key: "Technology", label: "Technology",
        subs: ["Web Development", "Mobile Apps", "Data Science", "AI & ML", "Cybersecurity", "Cloud"].map((l) => ({ label: l, apply: setCat("Technology", l.toLowerCase()) })),
    },
    {
        key: "Business", label: "Business",
        subs: ["Entrepreneurship", "Marketing", "Finance", "Accounting", "Management", "Sales"].map((l) => ({ label: l, apply: setCat("Business", l.toLowerCase()) })),
    },
    {
        key: "Creative Arts", label: "Creative Arts",
        subs: ["Drawing", "Painting", "Photography", "Film", "Graphic Design", "Fashion"].map((l) => ({ label: l, apply: setCat("Creative Arts", l.toLowerCase()) })),
    },
    {
        key: "Languages", label: "Languages",
        subs: ["English", "Swahili", "French", "Spanish", "Mandarin", "Arabic"].map((l) => ({ label: l, apply: setCat("Languages", l.toLowerCase()) })),
    },
    {
        key: "Academics", label: "Academics",
        subs: ["Math", "Sciences", "Literature", "History", "Geography", "Economics"].map((l) => ({ label: l, apply: setCat("Academics", l.toLowerCase()) })),
    },
];

function StartCourseIndex() {
    const { q, category, sub, sort, filter } = Route.useSearch();
    const navigate = Route.useNavigate();
    const [detailsId, setDetailsId] = useState<string | null>(null);


    const { data: courses, isLoading } = useQuery({
        queryKey: ["published-courses-with-stats"],
        queryFn: async () => {
            const { data: cs, error } = await supabase
                .from("courses")
                .select("*")
                .eq("published", true)
                .order("created_at", { ascending: false });
            if (error) throw error;
            const list = cs ?? [];
            const ids = list.map((c: any) => c.id);
            if (ids.length === 0) return [];
            const [modulesRes, classesRes, ciRes] = await Promise.all([
                supabase.from("modules").select("course_id").in("course_id", ids),
                supabase.from("classes").select("id, course_id, enrollment_status, rating").in("course_id", ids),
                supabase.from("course_instructors").select("course_id, instructor_id").in("course_id", ids),
            ]);
            const classIds = (classesRes.data ?? []).map((x: any) => x.id);
            const enrRes = classIds.length
                ? await supabase.from("enrollments").select("class_id").in("class_id", classIds)
                : { data: [] as any[] };
            return list.map((c: any) => {
                const classes = (classesRes.data ?? []).filter((x: any) => x.course_id === c.id);
                const activeClasses = classes.filter((x: any) => x.enrollment_status !== "closed" && x.enrollment_status !== "cancelled");
                const cIds = classes.map((x: any) => x.id);
                const ratedClasses = classes.filter((x: any) => x.rating != null);
                const avgClassRating = ratedClasses.length
                    ? ratedClasses.reduce((a: number, x: any) => a + Number(x.rating), 0) / ratedClasses.length
                    : null;
                return {
                    ...c,
                    rating: avgClassRating ?? c.rating,
                    _units: (modulesRes.data ?? []).filter((m: any) => m.course_id === c.id).length,
                    _activeClasses: activeClasses.length,
                    _instructors: new Set((ciRes.data ?? []).filter((x: any) => x.course_id === c.id).map((x: any) => x.instructor_id)).size,
                    _enrolled: (enrRes.data ?? []).filter((e: any) => cIds.includes(e.class_id)).length,
                };
            });
        },
        staleTime: 0,
        refetchOnWindowFocus: true,
    });

    const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const SUB_ALIASES: Record<string, string[]> = {
        program: ["program", "programme", "degree", "diploma"],
        "short course": ["short course", "short"],
        workshop: ["workshop", "bootcamp"],
        certificate: ["certificate", "certification", "certified"],
        "web development": ["web development", "web", "frontend", "full stack"],
        "mobile apps": ["mobile apps", "mobile", "android", "ios", "app"],
        "data science": ["data science", "data", "analytics"],
        "ai & ml": ["ai ml", "ai", "machine learning", "ml"],
        cybersecurity: ["cybersecurity", "security"],
        finance: ["finance", "financial", "money"],
        marketing: ["marketing", "brand"],
        "graphic design": ["graphic design", "design", "ux", "ui"],
    };

    const matchesSub = (c: any, s: string) => {
        const hay = norm(
            [c.title, c.description, c.category, c.level, c.level_of_study, c.age_group, c.language]
                .filter(Boolean)
                .join(" "),
        );
        const terms = SUB_ALIASES[s.toLowerCase()] ?? [s];
        return terms.some((t) => hay.includes(norm(t)));
    };

    let list = (courses ?? []).filter((c: any) => {
        if (q && !`${c.title} ${c.description ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
        if (category && c.category !== category) return false;
        if (sub && !matchesSub(c, sub)) return false;
        if (filter === "free" && (c.price_kes ?? 0) > 0) return false;
        if (filter === "fund" && !c.skills_fund_eligible) return false;
        return true;
    });
    if (sort === "newest") {
        list = [...list].sort((a: any, b: any) => (a.created_at < b.created_at ? 1 : -1));
    } else if (sort === "popular") {
        list = [...list].sort((a: any, b: any) => (b._enrolled ?? 0) - (a._enrolled ?? 0));
    }

    const activeChip = (g: CatGroup) => {
        if (g.key === "Explore") return !!(sort || filter);
        return g.key === (category || "");
    };


    return (
        <div className="mx-auto max-w-7xl px-4 py-6">
            <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

                <div className="flex w-max gap-2 pb-1">
                    {CATEGORY_GROUPS.map((g) => {
                        const active = activeChip(g);
                        return (
                            <div
                                key={g.label}
                                className={`inline-flex shrink-0 items-stretch rounded-full border transition-colors ${active ? "border-[#0f4c81] bg-[#0f4c81] text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                                    }`}
                            >
                                <button
                                    onClick={() =>
                                        g.key === "Explore"
                                            ? navigate({ search: setExplore({}) })
                                            : navigate({ search: setCat(g.key) })
                                    }
                                    className="rounded-l-full px-4 py-1.5 text-sm font-medium"
                                >
                                    {g.label}
                                </button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger
                                        className={`flex items-center rounded-r-full border-l px-2 ${active ? "border-white/30 hover:bg-white/10" : "border-slate-200 hover:bg-slate-50"
                                            }`}
                                        aria-label={`${g.label} subcategories`}
                                    >
                                        <ChevronDown className="h-4 w-4" />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-56">
                                        <DropdownMenuLabel>{g.label}</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {g.subs.map((s) => {
                                            const next = s.apply({ q, category, sub, sort, filter });
                                            const isActive =
                                                next.sub === sub && next.category === category && next.sort === sort && next.filter === filter &&
                                                !!(sub || sort || filter);
                                            return (
                                                <DropdownMenuItem
                                                    key={s.label}
                                                    onClick={() =>
                                                        navigate({
                                                            search: isActive
                                                                ? () => ({ q, category: "", sub: "", sort: "", filter: "" })
                                                                : s.apply,
                                                        })
                                                    }
                                                    className={isActive ? "font-medium text-[#0f4c81]" : ""}
                                                >
                                                    {s.label}
                                                    {isActive && <Check className="ml-auto h-4 w-4" />}
                                                </DropdownMenuItem>
                                            );
                                        })}

                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        );
                    })}
                </div>
            </div>

            {(category || sub || sort || filter) && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    <span className="text-slate-500">Filters:</span>
                    {category && <Badge variant="secondary">{category}</Badge>}
                    {sub && <Badge variant="secondary" className="capitalize">{sub}</Badge>}
                    {sort && <Badge variant="outline" className="capitalize">Sort: {sort}</Badge>}
                    {filter && <Badge variant="outline" className="capitalize">{filter === "fund" ? "Skills Fund" : filter}</Badge>}
                    <button
                        onClick={() => navigate({ search: () => ({ q, category: "", sub: "", sort: "", filter: "" }) })}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-0.5 hover:border-slate-300"
                    >
                        <X className="h-3 w-3" /> Clear
                    </button>
                </div>
            )}

            {isLoading ? (
                <p className="mt-8 text-muted-foreground">Loading courses…</p>
            ) : list.length === 0 ? (
                <Card className="mt-8"><CardContent className="py-10 text-center text-muted-foreground">No published courses match.</CardContent></Card>
            ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {list.map((c: any) => (
                        <Card
                            key={c.id}
                            onClick={() => setDetailsId(c.id)}
                            className="flex cursor-pointer flex-col overflow-hidden transition hover:border-[#0f4c81]/50 hover:shadow-md"
                        >
                            {c.cover_url ? (
                                <img src={c.cover_url} alt={c.title} className="h-40 w-full object-cover" />
                            ) : (
                                <div className="h-40 w-full bg-gradient-to-br from-slate-100 to-slate-200" />
                            )}
                            <CardHeader className="pb-2">
                                <div className="flex flex-wrap items-center gap-1.5">
                                    {c.category && <Badge variant="secondary">{c.category}</Badge>}
                                    {c.level && <Badge variant="outline">{c.level}</Badge>}
                                    {c.skills_fund_eligible && (
                                        <Badge className="bg-emerald-600 hover:bg-emerald-600">
                                            <PiggyBank className="mr-1 h-3 w-3" /> Skills Fund
                                        </Badge>
                                    )}
                                </div>
                                <CardTitle className="mt-2 text-lg">{c.title}</CardTitle>
                                <CardDescription className="line-clamp-2">{c.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="mt-auto space-y-3">
                                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-slate-600">
                                    {c.rating != null && (
                                        <div className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {Number(c.rating).toFixed(1)}</div>
                                    )}
                                    {c.duration_hours != null && (
                                        <div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {c.duration_hours}h</div>
                                    )}
                                    {c.age_group && (
                                        <div className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" /> {c.age_group}</div>
                                    )}
                                    <div className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> {c._units} units</div>
                                    <div className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {c._enrolled} learners</div>
                                    <div className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {c._activeClasses} classes</div>
                                    <div className="flex items-center gap-1"><UserCheck className="h-3.5 w-3.5" /> {c._instructors} instructors</div>
                                </div>
                                <div className="grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
                                    <Button asChild size="sm" className="bg-[#0f4c81] hover:bg-[#0d3f6c]">
                                        <Link to="/start-course/$courseId/classes" params={{ courseId: c.id }}>
                                            <Users className="mr-1 h-4 w-4" /> Join Class
                                        </Link>
                                    </Button>
                                    <Button asChild size="sm" variant="outline">
                                        <Link to="/start-course/$courseId/instructors" params={{ courseId: c.id }}>
                                            <UserSearch className="mr-1 h-4 w-4" /> Search Instructor
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <CourseDetailsSheet
                courseId={detailsId}
                open={!!detailsId}
                onOpenChange={(o) => !o && setDetailsId(null)}
            />

        </div>
    );
}
