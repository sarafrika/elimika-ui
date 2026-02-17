'use client';

/**
 * instructor-tabs.tsx
 *
 * All tab components for the INSTRUCTOR domain.
 * Each component receives DomainTabProps and handles its own data fetching.
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import React, { useEffect, useState } from 'react';
import { DomainTabProps, TabDefinition } from './types';

// ─── Shared helpers ───────────────────────────────────────────────────────────

function TabShell({ children }: { children: React.ReactNode }) {
    return <div className="pt-5 space-y-4">{children}</div>;
}

function InfoRow({
    icon,
    label,
    value,
}: {
    icon: string;
    label: string;
    value?: string | null;
}) {
    if (!value) return null;
    return (
        <div className="flex items-center gap-3 py-2 border-b border-border last:border-0">
            <span className="text-base w-5 text-center">{icon}</span>
            <span className="text-muted-foreground text-xs w-24 shrink-0">{label}</span>
            <span className="text-foreground text-sm font-medium">{value}</span>
        </div>
    );
}


function InstructorAboutTab({ sharedProfile, userUuid }: DomainTabProps) {
    // Example: fetch instructor-specific extended data if needed
    // const { data, isLoading } = useInstructorProfile(userUuid);

    return (
        <TabShell>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold">Personal Info</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <InfoRow icon="👤" label="Full Name" value={sharedProfile.full_name} />
                        <InfoRow icon="📍" label="Location" value={sharedProfile.bio?.slice(0, 40)} />
                        <InfoRow icon="🌐" label="Website" value={sharedProfile.website} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold">Contact Details</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <InfoRow icon="📞" label="Phone" value={sharedProfile.phone} />
                        <InfoRow icon="✉️" label="Email" value={sharedProfile.email} />
                    </CardContent>
                </Card>

                {sharedProfile.bio && (
                    <Card className="md:col-span-2">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold">About Me</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <p
                                className="text-muted-foreground text-sm leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: sharedProfile.bio }}
                            />
                        </CardContent>
                    </Card>
                )}
            </div>
        </TabShell>
    );
}

// ─── Skills Tab ───────────────────────────────────────────────────────────────

interface Skill {
    name: string;
    level: number;
    color: string;
}

function SkillBar({ skill }: { skill: Skill }) {
    return (
        <div className="mb-5">
            <div className="flex justify-between mb-1.5">
                <span className="text-sm font-semibold text-foreground">{skill.name}</span>
                <span className="text-xs font-bold" style={{ color: skill.color }}>
                    {skill.level}%
                </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${skill.level}%`, background: skill.color }}
                />
            </div>
        </div>
    );
}

function InstructorSkillsTab({ userUuid }: DomainTabProps) {
    const [skills, setSkills] = useState<Skill[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Replace with: fetch(`/api/instructors/${userUuid}/skills`)
        setTimeout(() => {
            setSkills([
                { name: 'Curriculum Design', level: 92, color: '#6366f1' },
                { name: 'Online Facilitation', level: 85, color: '#ec4899' },
                { name: 'Subject Matter Expertise', level: 95, color: '#06b6d4' },
                { name: 'Assessment Creation', level: 80, color: '#10b981' },
                { name: 'Student Engagement', level: 88, color: '#f59e0b' },
            ]);
            setIsLoading(false);
        }, 600);
    }, [userUuid]);

    if (isLoading)
        return (
            <TabShell>
                <Card>
                    <CardContent className="pt-5 space-y-5">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-1/3" />
                                <Skeleton className="h-2 w-full rounded-full" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </TabShell>
        );

    return (
        <TabShell>
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Instructor Skills</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    {skills.map((s) => (
                        <SkillBar key={s.name} skill={s} />
                    ))}
                </CardContent>
            </Card>
        </TabShell>
    );
}

// ─── Certificates Tab ─────────────────────────────────────────────────────────

interface Certificate {
    uuid: string;
    title: string;
    issuer: string;
    issued_year: string;
    badge_emoji: string;
    verified: boolean;
}

function InstructorCertificatesTab({ userUuid }: DomainTabProps) {
    const [certs, setCerts] = useState<Certificate[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Replace with: fetch(`/api/instructors/${userUuid}/certificates`)
        setTimeout(() => {
            setCerts([
                { uuid: '1', title: 'Google UX Design', issuer: 'Google', issued_year: '2023', badge_emoji: '🏅', verified: true },
                { uuid: '2', title: 'Advanced React', issuer: 'Meta', issued_year: '2022', badge_emoji: '🎖️', verified: true },
                { uuid: '3', title: 'UI Design Fundamentals', issuer: 'Coursera', issued_year: '2021', badge_emoji: '🏆', verified: false },
                { uuid: '4', title: 'Accessibility Standards', issuer: 'W3C', issued_year: '2023', badge_emoji: '✅', verified: true },
            ]);
            setIsLoading(false);
        }, 600);
    }, [userUuid]);

    if (isLoading)
        return (
            <TabShell>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i}>
                            <CardContent className="pt-4 flex gap-4 items-center">
                                <Skeleton className="w-10 h-10 rounded-full" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </TabShell>
        );

    return (
        <TabShell>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {certs.map((cert) => (
                    <Card key={cert.uuid}>
                        <CardContent className="pt-4 flex items-center gap-4">
                            <span className="text-4xl">{cert.badge_emoji}</span>
                            <div className="flex-1">
                                <p className="font-semibold text-foreground text-sm">{cert.title}</p>
                                <p className="text-muted-foreground text-xs">{cert.issuer}</p>
                                <p className="text-muted-foreground/70 text-xs mt-0.5">Issued {cert.issued_year}</p>
                            </div>
                            {cert.verified && (
                                <Badge variant="secondary" className="text-xs shrink-0">
                                    Verified
                                </Badge>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </TabShell>
    );
}

// ─── Career Pathways Tab ──────────────────────────────────────────────────────

interface CareerEntry {
    uuid: string;
    year: string;
    role: string;
    company: string;
    color: string;
}

function InstructorCareerTab({ userUuid }: DomainTabProps) {
    const [career, setCareer] = useState<CareerEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Replace with: fetch(`/api/instructors/${userUuid}/career`)
        setTimeout(() => {
            setCareer([
                { uuid: '1', year: '2019', role: 'Junior Instructor', company: 'LearnHub', color: '#6366f1' },
                { uuid: '2', year: '2021', role: 'Senior Instructor', company: 'EduPlatform', color: '#ec4899' },
                { uuid: '3', year: '2023', role: 'Lead Curriculum Designer', company: 'Spruko Ed', color: '#06b6d4' },
            ]);
            setIsLoading(false);
        }, 600);
    }, [userUuid]);

    if (isLoading)
        return (
            <TabShell>
                <Card>
                    <CardContent className="pt-5 pl-10 space-y-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="space-y-1">
                                <Skeleton className="h-4 w-1/4" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </TabShell>
        );

    return (
        <TabShell>
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Career Timeline</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="relative pl-8">
                        {/* Vertical line */}
                        <div className="absolute left-2.5 top-0 bottom-0 w-px bg-border" />
                        {career.map((item) => (
                            <div key={item.uuid} className="relative mb-7 last:mb-0">
                                {/* Dot */}
                                <span
                                    className="absolute -left-[22px] top-1 w-3.5 h-3.5 rounded-full border-2 border-card ring-4"
                                    style={{ background: item.color, ringColor: `${item.color}33` }}
                                />
                                <div className="flex items-baseline gap-2.5 mb-0.5">
                                    <span
                                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                                        style={{ color: item.color, background: `${item.color}15` }}
                                    >
                                        {item.year}
                                    </span>
                                    <span className="text-sm font-bold text-foreground">{item.role}</span>
                                </div>
                                <p className="text-muted-foreground text-xs">{item.company}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </TabShell>
    );
}

// ─── Gallery Tab ──────────────────────────────────────────────────────────────

interface GalleryItem {
    id: string;
    gradient: string;
    label: string;
}

function InstructorGalleryTab({ userUuid }: DomainTabProps) {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [selected, setSelected] = useState<GalleryItem | null>(null);

    useEffect(() => {
        // Replace with: fetch(`/api/instructors/${userUuid}/gallery`)
        setItems([
            { id: '1', gradient: 'linear-gradient(135deg,#667eea,#764ba2)', label: 'Course Launch' },
            { id: '2', gradient: 'linear-gradient(135deg,#f093fb,#f5576c)', label: 'Workshop' },
            { id: '3', gradient: 'linear-gradient(135deg,#4facfe,#00f2fe)', label: 'Webinar' },
            { id: '4', gradient: 'linear-gradient(135deg,#43e97b,#38f9d7)', label: 'Keynote' },
            { id: '5', gradient: 'linear-gradient(135deg,#fa709a,#fee140)', label: 'Demo Day' },
            { id: '6', gradient: 'linear-gradient(135deg,#a18cd1,#fbc2eb)', label: 'Onboarding' },
        ]);
    }, [userUuid]);

    return (
        <TabShell>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {items.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setSelected(item)}
                        className="relative h-40 rounded-xl overflow-hidden cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        style={{ background: item.gradient }}
                    >
                        <span className="absolute bottom-3 left-3 text-xs font-semibold text-white bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
                            {item.label}
                        </span>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                    </button>
                ))}
            </div>

            {/* Lightbox */}
            {selected && (
                <div
                    className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
                    onClick={() => setSelected(null)}
                >
                    <div
                        className="w-80 h-60 rounded-2xl flex items-center justify-center"
                        style={{ background: selected.gradient }}
                    >
                        <span className="text-white text-xl font-bold">{selected.label}</span>
                    </div>
                </div>
            )}
        </TabShell>
    );
}

// ─── Friends Tab ──────────────────────────────────────────────────────────────

interface Connection {
    uuid: string;
    name: string;
    role: string;
    avatar_url?: string;
}

function InstructorFriendsTab({ userUuid }: DomainTabProps) {
    const [connections, setConnections] = useState<Connection[]>([]);

    useEffect(() => {
        // Replace with: fetch(`/api/instructors/${userUuid}/connections`)
        setConnections([
            { uuid: '1', name: 'Alex Kim', role: 'Product Designer', avatar_url: 'https://i.pravatar.cc/60?img=11' },
            { uuid: '2', name: 'Maria Lopez', role: 'Front-end Dev', avatar_url: 'https://i.pravatar.cc/60?img=5' },
            { uuid: '3', name: 'Jake Russel', role: 'Motion Designer', avatar_url: 'https://i.pravatar.cc/60?img=12' },
            { uuid: '4', name: 'Priya Nair', role: 'UX Researcher', avatar_url: 'https://i.pravatar.cc/60?img=9' },
            { uuid: '5', name: 'Tom Chen', role: 'Brand Designer', avatar_url: 'https://i.pravatar.cc/60?img=15' },
            { uuid: '6', name: 'Sara Wells', role: 'Visual Designer', avatar_url: 'https://i.pravatar.cc/60?img=16' },
        ]);
    }, [userUuid]);

    return (
        <TabShell>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {connections.map((c) => (
                    <Card key={c.uuid}>
                        <CardContent className="pt-4 flex items-center gap-3">
                            <Avatar className="w-12 h-12 shrink-0">
                                <AvatarImage src={c.avatar_url} alt={c.name} />
                                <AvatarFallback>{c.name.split(' ').map((n) => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-foreground text-sm truncate">{c.name}</p>
                                <p className="text-muted-foreground text-xs truncate">{c.role}</p>
                            </div>
                            <Button variant="outline" size="sm" className="shrink-0 text-xs">
                                Follow
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </TabShell>
    );
}

// ─── Tab Registry Export ──────────────────────────────────────────────────────

export const instructorTabs: TabDefinition[] = [
    { id: 'about', label: 'About', component: InstructorAboutTab },
    { id: 'skills', label: 'Skills Card', component: InstructorSkillsTab },
    { id: 'certs', label: 'Certificates', component: InstructorCertificatesTab },
    { id: 'career', label: 'Career Pathways', component: InstructorCareerTab },
    { id: 'gallery', label: 'Gallery', component: InstructorGalleryTab },
    { id: 'friends', label: 'Connections', component: InstructorFriendsTab },
];