'use client';

/**
 * student-tabs.tsx
 *
 * All tab components for the STUDENT domain.
 * Completely different content from instructor tabs — same shell, different registry.
 */

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import React, { useEffect, useState } from 'react';
import type { DomainTabProps, StudentProfile, TabDefinition } from './types';

function TabShell({ children }: { children: React.ReactNode }) {
    return <div className="pt-5 space-y-4">{children}</div>;
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value?: string | null }) {
    if (!value) return null;
    return (
        <div className="flex items-center gap-3 py-2 border-b border-border last:border-0">
            <span className="text-base w-5 text-center">{icon}</span>
            <span className="text-muted-foreground text-xs w-28 shrink-0">{label}</span>
            <span className="text-foreground text-sm font-medium">{value}</span>
        </div>
    );
}

// ─── About Tab (uses sharedProfile + student-specific fields) ─────────────────

function StudentAboutTab({ sharedProfile, userUuid }: DomainTabProps) {
    const [student, setStudent] = useState<Partial<StudentProfile> | null>(null);

    useEffect(() => {
        // Replace with: fetch(`/api/students/${userUuid}/profile`)
        setTimeout(() => {
            setStudent({
                full_name: sharedProfile.full_name,
                demographic_tag: 'Youth — 13-17',
                first_guardian_name: 'Parent Instructor Profile 1',
                first_guardian_mobile: '+254700000003',
                second_guardian_name: 'Parent Instructor Profile 2',
                second_guardian_mobile: '+254700000004',
                primaryGuardianContact: 'Parent Instructor Profile 1 (+254700000003)',
                secondaryGuardianContact: 'Parent Instructor Profile 2 (+254700000004)',
            });
        }, 400);
    }, [userUuid]);

    return (
        <TabShell>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold">Student Info</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <InfoRow icon="👤" label="Full Name" value={sharedProfile.full_name} />
                        <InfoRow icon="📞" label="Phone" value={sharedProfile.phone} />
                        <InfoRow icon="✉️" label="Email" value={sharedProfile.email} />
                        {student?.demographic_tag && (
                            <InfoRow icon="🏷️" label="Age Group" value={student.demographic_tag} />
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold">Guardian Contacts</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {student ? (
                            <>
                                <InfoRow icon="👨‍👧" label="Primary" value={student.primaryGuardianContact} />
                                <InfoRow icon="👩‍👦" label="Secondary" value={student.secondaryGuardianContact} />
                            </>
                        ) : (
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </TabShell>
    );
}

// ─── Enrolled Courses Tab ─────────────────────────────────────────────────────

interface EnrolledCourse {
    uuid: string;
    title: string;
    instructor: string;
    progress: number;
    status: 'active' | 'completed' | 'paused';
    thumbnail_color: string;
}

const STATUS_VARIANT: Record<EnrolledCourse['status'], 'default' | 'secondary' | 'outline'> = {
    active: 'default',
    completed: 'secondary',
    paused: 'outline',
};

function StudentCoursesTab({ userUuid }: DomainTabProps) {
    const [courses, setCourses] = useState<EnrolledCourse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Replace with: fetch(`/api/students/${userUuid}/enrollments`)
        setTimeout(() => {
            setCourses([
                { uuid: '1', title: 'Intro to Music Theory', instructor: 'Ayomhi Ayo', progress: 72, status: 'active', thumbnail_color: '#667eea' },
                { uuid: '2', title: 'Guitar Fundamentals', instructor: 'Jane Doe', progress: 100, status: 'completed', thumbnail_color: '#10b981' },
                { uuid: '3', title: 'Digital Audio Production', instructor: 'Mark Bell', progress: 30, status: 'paused', thumbnail_color: '#f59e0b' },
            ]);
            setIsLoading(false);
        }, 600);
    }, [userUuid]);

    if (isLoading)
        return (
            <TabShell>
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardContent className="pt-4 flex gap-4">
                            <Skeleton className="w-14 h-14 rounded-lg shrink-0" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                                <Skeleton className="h-2 w-full rounded-full" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </TabShell>
        );

    return (
        <TabShell>
            {courses.map((course) => (
                <Card key={course.uuid}>
                    <CardContent className="pt-4 flex items-center gap-4">
                        <div
                            className="w-14 h-14 rounded-lg shrink-0 flex items-center justify-center text-white text-lg font-bold"
                            style={{ background: course.thumbnail_color }}
                        >
                            🎵
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <p className="font-semibold text-foreground text-sm truncate">{course.title}</p>
                                <Badge variant={STATUS_VARIANT[course.status]} className="text-xs ml-2 shrink-0 capitalize">
                                    {course.status}
                                </Badge>
                            </div>
                            <p className="text-muted-foreground text-xs mb-2">{course.instructor}</p>
                            <div className="flex items-center gap-2">
                                <Progress value={course.progress} className="h-1.5 flex-1" />
                                <span className="text-xs text-muted-foreground font-medium w-8 text-right">
                                    {course.progress}%
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </TabShell>
    );
}

// ─── Achievements Tab ─────────────────────────────────────────────────────────

interface Achievement {
    uuid: string;
    title: string;
    description: string;
    badge_emoji: string;
    earned_date: string;
}

function StudentAchievementsTab({ userUuid }: DomainTabProps) {
    const [achievements, setAchievements] = useState<Achievement[]>([]);

    useEffect(() => {
        // Replace with: fetch(`/api/students/${userUuid}/achievements`)
        setAchievements([
            { uuid: '1', title: 'First Course Complete', description: 'Completed your first course', badge_emoji: '🎓', earned_date: 'Jan 2026' },
            { uuid: '2', title: '7-Day Streak', description: 'Logged in 7 days in a row', badge_emoji: '🔥', earned_date: 'Feb 2026' },
            { uuid: '3', title: 'Top Performer', description: 'Scored 95%+ on an assessment', badge_emoji: '⭐', earned_date: 'Feb 2026' },
        ]);
    }, [userUuid]);

    return (
        <TabShell>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {achievements.map((a) => (
                    <Card key={a.uuid} className="text-center">
                        <CardContent className="pt-6 pb-5">
                            <div className="text-5xl mb-3">{a.badge_emoji}</div>
                            <p className="font-bold text-foreground text-sm">{a.title}</p>
                            <p className="text-muted-foreground text-xs mt-1">{a.description}</p>
                            <p className="text-muted-foreground/60 text-xs mt-2">{a.earned_date}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </TabShell>
    );
}

// ─── Schedule Tab ─────────────────────────────────────────────────────────────

interface ScheduleItem {
    uuid: string;
    title: string;
    time: string;
    instructor: string;
    color: string;
}

function StudentScheduleTab({ userUuid }: DomainTabProps) {
    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);

    useEffect(() => {
        // Replace with: fetch(`/api/students/${userUuid}/schedule`)
        setSchedule([
            { uuid: '1', title: 'Music Theory — Module 3', time: 'Mon, 10:00 AM', instructor: 'Ayomhi Ayo', color: '#6366f1' },
            { uuid: '2', title: 'Guitar Practice Session', time: 'Wed, 2:00 PM', instructor: 'Jane Doe', color: '#10b981' },
            { uuid: '3', title: 'Audio Production Lab', time: 'Fri, 4:00 PM', instructor: 'Mark Bell', color: '#f59e0b' },
        ]);
    }, [userUuid]);

    return (
        <TabShell>
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Upcoming Sessions</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                    {schedule.map((item) => (
                        <div key={item.uuid} className="flex items-center gap-3">
                            <div
                                className="w-1 self-stretch rounded-full shrink-0"
                                style={{ background: item.color }}
                            />
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                                <p className="text-xs text-muted-foreground">{item.instructor} · {item.time}</p>
                            </div>
                            <Badge variant="outline" className="text-xs shrink-0">Upcoming</Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </TabShell>
    );
}

// ─── Tab Registry Export ──────────────────────────────────────────────────────

export const studentTabs: TabDefinition[] = [
    { id: 'about', label: 'About', component: StudentAboutTab },
    { id: 'courses', label: 'My Courses', component: StudentCoursesTab },
    { id: 'achievements', label: 'Achievements', component: StudentAchievementsTab },
    { id: 'schedule', label: 'Schedule', component: StudentScheduleTab },
];