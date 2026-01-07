"use client"

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import React, { useMemo, useState } from 'react';

type LessonProgress = {
    id: string;
    name: string;
    completed: boolean;
    score?: number | null;
    timeMinutes?: number;
    completedAt?: string;
};

type CourseProgress = {
    id: string;
    name: string;
    lessons: LessonProgress[];
};

const SAMPLE_COURSES: CourseProgress[] = [
    {
        id: 'course-001',
        name: 'Course A',
        lessons: [
            { id: 'l-001', name: 'Lesson 1: Introduction', completed: true, score: 85, timeMinutes: 25, completedAt: '2026-01-05T09:00:00Z' },
            { id: 'l-002', name: 'Lesson 2: Advanced Topics', completed: false, score: null, timeMinutes: 15 },
            { id: 'l-003', name: 'Lesson 3: Practice', completed: true, score: 92, timeMinutes: 40, completedAt: '2026-01-10T11:15:00Z' },
        ],
    },
    {
        id: 'course-002',
        name: 'Course B',
        lessons: [
            { id: 'l-101', name: 'Lesson 1: Setup', completed: true, score: 78, timeMinutes: 20, completedAt: '2026-02-01T10:00:00Z' },
            { id: 'l-102', name: 'Lesson 2: Basics', completed: true, score: 88, timeMinutes: 30, completedAt: '2026-02-03T08:30:00Z' },
            { id: 'l-103', name: 'Lesson 3: Project', completed: false, score: null, timeMinutes: 0 },
        ],
    },
];

const StudentProgressAnalytics: React.FC = () => {
    const [courses] = useState<CourseProgress[]>(SAMPLE_COURSES);
    const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
    const [lessonQuery, setLessonQuery] = useState('');
    const [goal, setGoal] = useState('Complete all lessons by next month');
    const [goalInput, setGoalInput] = useState('');

    // flatten lessons when needed
    const allLessons = useMemo(() => courses.flatMap(c => c.lessons.map(l => ({ ...l, courseId: c.id, courseName: c.name }))), [courses]);

    // determine view list
    const visibleLessons = useMemo(() => {
        const base = selectedCourseId === 'all' ? allLessons : allLessons.filter(l => l.courseId === selectedCourseId);
        if (!lessonQuery.trim()) return base;
        const q = lessonQuery.toLowerCase();
        return base.filter(l => `${l.name} ${l.courseName} ${l.id}`.toLowerCase().includes(q));
    }, [allLessons, selectedCourseId, lessonQuery]);

    // aggregated totals across selected scope (all or selected course)
    const totals = useMemo(() => {
        const sourceLessons = selectedCourseId === 'all' ? allLessons : allLessons.filter(l => l.courseId === selectedCourseId);
        const totalLessons = sourceLessons.length;
        const completed = sourceLessons.filter(l => l.completed).length;
        const totalTime = sourceLessons.reduce((s, l) => s + (l.timeMinutes ?? 0), 0);
        const avgTime = completed ? Math.round(totalTime / Math.max(1, completed)) : 0;
        const completionRate = totalLessons ? Math.round((completed / totalLessons) * 100) : 0;
        const avgScore = Math.round(
            (sourceLessons.filter(l => l.score != null).reduce((s, l) => s + (l.score ?? 0), 0) / Math.max(1, sourceLessons.filter(l => l.score != null).length)) || 0
        );
        return { totalLessons, completed, totalTime, avgTime, completionRate, avgScore };
    }, [allLessons, selectedCourseId]);

    const handleSaveGoal = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (goalInput.trim()) {
            setGoal(goalInput.trim());
            setGoalInput('');
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                </div>

                <div className="flex gap-2">
                    <Button variant="secondary" size="sm">Export Report</Button>
                    <Button size="sm">Download Progress</Button>
                </div>
            </div>

            {/* Top controls */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground">Course</label>
                    <select
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                        className="rounded-md border px-2 py-1 bg-background text-foreground"
                    >
                        <option value="all">All courses</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                <div className="ml-auto w-full sm:w-auto">
                    <Input placeholder="Search lessons or ids…" value={lessonQuery} onChange={(e) => setLessonQuery(e.target.value)} />
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-4 bg-card rounded-xl shadow-md">
                    <div className="text-sm text-muted-foreground">Lessons in scope</div>
                    <div className="mt-2 text-2xl font-semibold text-foreground">{totals.totalLessons}</div>
                    <div className="mt-3 text-xs text-muted-foreground">Completed: {totals.completed}</div>
                </Card>

                <Card className="p-4 bg-card rounded-xl shadow-md">
                    <div className="text-sm text-muted-foreground">Average Time / Completed Lesson</div>
                    <div className="mt-2 text-2xl font-semibold text-foreground">{totals.avgTime}m</div>
                    <div className="mt-3 text-xs text-muted-foreground">Total time: {totals.totalTime} minutes</div>
                </Card>

                <Card className="p-4 bg-card rounded-xl shadow-md">
                    <div className="text-sm text-muted-foreground">Overall Completion</div>
                    <div className="mt-2 text-2xl font-semibold text-foreground">{totals.completionRate}%</div>
                    <div className="mt-3 text-xs text-muted-foreground">Avg score: {totals.avgScore}%</div>
                </Card>
            </div>

            {/* Lesson level table */}
            <section>
                <Card className="p-4 bg-card rounded-xl shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-medium text-foreground">
                                {selectedCourseId === 'all' ? 'All Lessons' : `Lessons — ${courses.find(c => c.id === selectedCourseId)?.name}`}
                            </h2>
                            <p className="text-sm text-muted-foreground">Detailed status for each lesson in the selected scope</p>
                        </div>

                        <div className="hidden sm:flex items-center gap-2">
                            <Button variant="ghost" size="sm">Export CSV</Button>
                        </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] text-sm">
                            <thead>
                                <tr className="text-left text-xs uppercase text-muted-foreground">
                                    <th className="py-2 pr-4">Course</th>
                                    <th className="py-2 pr-4">Lesson</th>
                                    <th className="py-2 pr-4">Status</th>
                                    <th className="py-2 pr-4">Score</th>
                                    <th className="py-2 pr-4">Time</th>
                                    <th className="py-2 pr-4">Completed At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleLessons.map(l => (
                                    <tr key={l.id} className="border-t border-border">
                                        <td className="py-3 pr-4 text-muted-foreground" style={{ minWidth: 160 }}>{l.courseName}</td>
                                        <td className="py-3 pr-4 text-foreground">{l.name}</td>
                                        <td className="py-3 pr-4">
                                            {l.completed ? <Badge variant="success">Completed</Badge> : <Badge variant="secondary">In Progress</Badge>}
                                        </td>
                                        <td className="py-3 pr-4 text-foreground">{l.score != null ? `${l.score}%` : '—'}</td>
                                        <td className="py-3 pr-4 text-muted-foreground">{l.timeMinutes ? `${l.timeMinutes}m` : '—'}</td>
                                        <td className="py-3 pr-4 text-muted-foreground">{l.completedAt ? new Date(l.completedAt).toLocaleDateString() : '—'}</td>
                                    </tr>
                                ))}

                                {visibleLessons.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No lessons found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </section>

            {/* Analytics + Goal setting */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="p-4 bg-card rounded-xl shadow-md lg:col-span-2">
                    <h3 className="text-lg font-medium text-foreground">Learning Analytics</h3>
                    <p className="text-sm text-muted-foreground mt-2">Insights to help you focus your study time effectively</p>

                    <div className="grid grid-cols-1 gap-3 mt-4">
                        <div className="p-3 bg-muted/40 rounded">
                            <div className="text-xs text-muted-foreground">Avg score</div>
                            <div className="text-lg font-medium text-foreground">{totals.avgScore}%</div>
                        </div>

                        <div className="p-3 bg-muted/40 rounded">
                            <div className="text-xs text-muted-foreground">Top Lessons</div>
                            <div className="text-sm text-foreground mt-1">
                                {allLessons.filter(l => l.score != null).sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 3).map(l => `${l.name} (${l.courseName})`).join(', ') || '—'}
                            </div>
                        </div>

                        <div className="p-3 bg-muted/40 rounded">
                            <div className="text-xs text-muted-foreground">Needs attention</div>
                            <div className="text-sm text-foreground mt-1">
                                {allLessons.filter(l => !l.completed).slice(0, 3).map(l => `${l.name} (${l.courseName})`).join(', ') || '—'}
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="p-4 bg-card rounded-xl shadow-md">
                    <h3 className="text-lg font-medium text-foreground">Goal Setting</h3>
                    <p className="text-sm text-muted-foreground mt-2">Set a study goal to stay on track</p>

                    <form onSubmit={handleSaveGoal} className="mt-4 space-y-3">
                        <div>
                            <label className="text-sm text-muted-foreground block mb-1">Your Goal</label>
                            <Input value={goalInput} onChange={(e) => setGoalInput(e.target.value)} placeholder="e.g., Finish lessons by end of month" />
                        </div>

                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={() => { setGoalInput(''); }} type="button">Reset</Button>
                            <Button size="sm" type="submit">Save Goal</Button>
                        </div>
                    </form>

                    <Separator className="my-4" />

                    <div className="text-sm text-muted-foreground">
                        <div className="mb-2">Current goal</div>
                        <div className="p-3 rounded bg-muted/40 text-foreground">{goal}</div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default StudentProgressAnalytics;