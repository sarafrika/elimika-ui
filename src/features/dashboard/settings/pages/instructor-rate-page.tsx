'use client';

import { useQuery } from '@tanstack/react-query';
import { Calendar, CheckSquare, Clock, Info, Mail, MapPin, Monitor, Users } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../../../../../components/ui/button';
import { CourseTrainingApplication } from '../../../../../services/client';
import { getAllCoursesOptions, searchTrainingApplicationsOptions } from '../../../../../services/client/@tanstack/react-query.gen';
import { CourseWithApplication } from '../../../profile/components/instructor/rate-card/types';
import { useUserProfile } from '../../../profile/context/profile-context';
import { useProfileFormMode } from '../../../profile/context/profile-form-mode-context';

interface SessionRate {
    id: string;
    title: string;
    colorClass: string;
    badgeLabel: string;
    badgeType: string;
    rate: number;
    currency: string;
    sessionType: string;
    locationType: string;
    duration: string;
    participants: string;
    platformOrLocation: string;
    platformLabel: string;
    includes: string;
    description: string;
}

function SessionIcon({ colorClass }: { colorClass: string }) {
    const iconMap: Record<string, JSX.Element> = {
        'online-group': (
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="52" height="52">
                <rect x="6" y="10" width="36" height="24" rx="3" stroke="currentColor" strokeWidth="2" />
                <path d="M16 34v4M32 34v4M12 38h24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="17" cy="21" r="4" stroke="currentColor" strokeWidth="2" />
                <circle cx="31" cy="21" r="4" stroke="currentColor" strokeWidth="2" />
                <path d="M9 28c0-2 3-4 8-4M39 28c0-2-3-4-8-4M22 28c0-2 1-4 2-4s2 2 2 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
        ),
        'online-private': (
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="52" height="52">
                <rect x="6" y="10" width="36" height="24" rx="3" stroke="currentColor" strokeWidth="2" />
                <path d="M16 34v4M32 34v4M12 38h24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="24" cy="22" r="5" stroke="currentColor" strokeWidth="2" />
                <path d="M14 32c0-3 4-6 10-6s10 3 10 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
        ),
        'group-inperson': (
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="52" height="52">
                <circle cx="16" cy="18" r="5" stroke="currentColor" strokeWidth="2" />
                <circle cx="32" cy="18" r="5" stroke="currentColor" strokeWidth="2" />
                <circle cx="24" cy="18" r="5" stroke="currentColor" strokeWidth="2" />
                <path d="M6 36c0-5 5-8 10-8M42 36c0-5-5-8-10-8M16 36c0-4 3-8 8-8s8 4 8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
        ),
        'private-inperson': (
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="52" height="52">
                <circle cx="24" cy="18" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M10 40c0-6 6-11 14-11s14 5 14 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
        ),
    };
    return iconMap[colorClass] ?? null;
}

const COLOR_STYLES: Record<string, { icon: string; title: string; badge: string; info: string; iconBg: string }> = {
    'online-group': {
        icon: 'text-[hsl(221,83%,53%)]',
        title: 'text-[hsl(221,83%,48%)]',
        badge: 'bg-[hsl(214,100%,95%)] text-[hsl(221,83%,40%)] border-[hsl(214,100%,85%)]',
        info: 'bg-[hsl(214,100%,97%)] text-[hsl(221,83%,45%)] border-[hsl(214,100%,88%)]',
        iconBg: 'bg-[hsl(214,100%,95%)] text-[hsl(221,83%,48%)]',
    },
    'online-private': {
        icon: 'text-[hsl(152,68%,38%)]',
        title: 'text-[hsl(152,68%,33%)]',
        badge: 'bg-[hsl(152,60%,94%)] text-[hsl(152,68%,28%)] border-[hsl(152,60%,82%)]',
        info: 'bg-[hsl(152,60%,96%)] text-[hsl(152,68%,30%)] border-[hsl(152,60%,85%)]',
        iconBg: 'bg-[hsl(152,60%,94%)] text-[hsl(152,68%,33%)]',
    },
    'group-inperson': {
        icon: 'text-[hsl(258,68%,52%)]',
        title: 'text-[hsl(258,68%,45%)]',
        badge: 'bg-[hsl(258,60%,95%)] text-[hsl(258,68%,38%)] border-[hsl(258,60%,83%)]',
        info: 'bg-[hsl(258,60%,97%)] text-[hsl(258,68%,40%)] border-[hsl(258,60%,86%)]',
        iconBg: 'bg-[hsl(258,60%,95%)] text-[hsl(258,68%,45%)]',
    },
    'private-inperson': {
        icon: 'text-[hsl(28,90%,50%)]',
        title: 'text-[hsl(28,90%,42%)]',
        badge: 'bg-[hsl(28,100%,94%)] text-[hsl(28,90%,35%)] border-[hsl(28,100%,82%)]',
        info: 'bg-[hsl(28,100%,96%)] text-[hsl(28,90%,38%)] border-[hsl(28,100%,85%)]',
        iconBg: 'bg-[hsl(28,100%,94%)] text-[hsl(28,90%,42%)]',
    },
};

export default function InstructorRateCard() {
    const user = useUserProfile();
    const { disableEditing } = useProfileFormMode();

    const size = 50;
    const [page] = useState(0);

    const { data: allCourses } = useQuery(
        getAllCoursesOptions({
            query: { pageable: { page, size } },
        })
    );

    const { data: appliedCourses } = useQuery({
        ...searchTrainingApplicationsOptions({
            query: {
                pageable: {},
                searchParams: {
                    applicant_uuid_eq: user?.instructor?.uuid as string,
                },
            },
        }),
        enabled: !!user?.instructor?.uuid,
    });

    const combinedCourses = React.useMemo<CourseWithApplication[]>(() => {
        if (!allCourses?.data?.content || !appliedCourses?.data?.content) {
            return [];
        }

        const appliedMap = new Map<string, CourseTrainingApplication>(
            appliedCourses.data.content.flatMap(app =>
                app.course_uuid
                    ? ([[app.course_uuid, app]] as const)
                    : []
            )
        );

        return allCourses.data.content.flatMap(course => {
            if (!course.uuid) return [];

            const application = appliedMap.get(course.uuid);

            return application
                ? [{ ...course, application }]
                : [];
        });
    }, [allCourses, appliedCourses]);

    const courses = useMemo(
        () => combinedCourses ?? [],
        [combinedCourses]
    );

    const [selectedCourse, setSelectedCourse] =
        useState<CourseWithApplication | null>(null);

    useEffect(() => {
        if (courses.length > 0 && !selectedCourse) {
            setSelectedCourse(courses[0]);
        }
    }, [courses, selectedCourse]);

    const sessionRates: SessionRate[] = useMemo(() => {
        if (!selectedCourse?.application?.rate_card) {
            return [];
        }

        const rateCard = selectedCourse.application.rate_card;

        return [
            {
                id: 'online-group',
                title: 'Online Group',
                colorClass: 'online-group',
                badgeLabel: 'Group Session • Online',
                badgeType: 'group-online',
                rate: rateCard.group_online_rate ?? 0,
                currency: 'KSh', //rateCard.currency
                sessionType: 'Group Session',
                locationType: 'Online',
                duration: 'Up to 2 Hours',
                participants: selectedCourse.class_limit,
                platformLabel: 'Platform',
                platformOrLocation: 'Virtual (Zoom, Teams, etc.)',
                includes: 'Preparation, Delivery & Q&A',
                description:
                    'Ideal for virtual training delivered to multiple participants.',
            },
            {
                id: 'online-private',
                title: 'Online Private',
                colorClass: 'online-private',
                badgeLabel: 'Private Session • Online',
                badgeType: 'private-online',
                rate: rateCard.private_online_rate ?? 0,
                currency: 'KSh', //rateCard.currency
                sessionType: 'Private Session',
                locationType: 'Online',
                duration: 'Up to 2 Hours',
                participants: selectedCourse.class_limit,
                platformLabel: 'Platform',
                platformOrLocation: 'Virtual (Zoom, Teams, etc.)',
                includes: 'One-on-one instruction & Q&A',
                description:
                    'Personalized virtual training for individual learners.',
            },
            {
                id: 'group-inperson',
                title: 'Group In-Person',
                colorClass: 'group-inperson',
                badgeLabel: 'Group Session • In-Person',
                badgeType: 'group-inperson',
                rate: rateCard.group_inperson_rate ?? 0,
                currency: 'KSh', //rateCard.currency
                sessionType: 'Group Session',
                locationType: 'In-Person',
                duration: 'Up to 2 Hours',
                participants: selectedCourse.class_limit,
                platformLabel: 'Location',
                platformOrLocation: 'On-site / Classroom',
                includes: 'Preparation, Delivery, Materials & Q&A',
                description:
                    'Face-to-face training for groups at your location.',
            },
            {
                id: 'private-inperson',
                title: 'Private In-Person',
                colorClass: 'private-inperson',
                badgeLabel: 'Private Session • In-Person',
                badgeType: 'private-inperson',
                rate: rateCard.private_inperson_rate ?? 0,
                currency: 'KSh', //rateCard.currency
                sessionType: 'Private Session',
                locationType: 'In-Person',
                duration: 'Up to 2 Hours',
                participants: selectedCourse.class_limit,
                platformLabel: 'Location',
                platformOrLocation: 'On-site / Classroom',
                includes: 'One-on-one instruction & Materials',
                description:
                    'Personalized face-to-face training for individual learners.',
            },
        ];
    }, [selectedCourse]);

    const effectiveDate = selectedCourse?.created_date
        ? new Date(selectedCourse.created_date).toLocaleDateString(
            'en-US',
            {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            }
        )
        : 'May 1, 2025';

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-semibold text-foreground">
                        Instructor Rate Card</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Standardized instructor compensation rates
                        based on session type.
                    </p>
                </div>
            </div>

            <div>
                <h3 className="mb-3 text-[15px] font-semibold text-foreground">                Select Course                </h3>
                <div className="flex flex-wrap gap-2">
                    {courses.map(course => {
                        const isActive =
                            selectedCourse?.uuid === course.uuid;

                        return (
                            <button
                                key={course.uuid}
                                onClick={() =>
                                    setSelectedCourse(course)
                                }
                                className={`
                                    inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-150

                                    ${isActive
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }
                                `}
                            >
                                {course.name}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex flex-wrap flex-col gap-4 rounded-lg border border-border bg-muted/40 px-4 py-4 lg:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

                    <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                            {selectedCourse?.name}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                            Instructor compensation rates for this course.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground sm:text-sm">
                    <span>
                        Currency:{' '}
                        <span className="font-medium text-foreground">
                            {
                                selectedCourse?.application?.rate_card
                                    ?.currency
                            }
                        </span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />

                        <span className="whitespace-nowrap">
                            Effective From:{' '}
                            <span className="font-medium text-foreground">
                                {effectiveDate}
                            </span>
                        </span>
                    </span>
                </div>
            </div>

            <div className="flex flex-wrap justify-start gap-4">
                {sessionRates.map(session => {
                    const colors =
                        COLOR_STYLES[session.colorClass];

                    const isInPerson =
                        session.locationType === 'In-Person';

                    return (
                        <div
                            key={session.id}
                            className="
                                flex flex-col overflow-hidden
                                rounded-xl border border-border bg-card

                                w-full
                                sm:w-[calc(50%-0.5rem)]
                                2xl:w-[calc(25%-0.75rem)]

                                min-w-[280px]
                                max-w-[420px]

                                flex-grow-0
                                flex-shrink
                            "
                        >
                            {/* TOP */}
                            <div className="flex flex-col items-center px-4 pt-5 pb-4 text-center lg:px-5">
                                <h4
                                    className={`mb-3 text-sm font-semibold lg:text-base ${colors.title}`}
                                >
                                    {session.title}
                                </h4>

                                <div
                                    className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full lg:h-16 lg:w-16 ${colors.iconBg}`}
                                >
                                    <SessionIcon
                                        colorClass={
                                            session.colorClass
                                        }
                                    />
                                </div>

                                <p className="mb-1 text-[11px] text-muted-foreground lg:text-xs">
                                    Rate per Session
                                </p>

                                <p className="text-xl font-bold text-foreground lg:text-2xl">
                                    {session.currency}{' '}
                                    {session.rate.toLocaleString()}
                                </p>

                                <span
                                    className={`mt-3 inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium lg:px-3 lg:text-xs ${colors.badge}`}
                                >
                                    {session.badgeLabel}
                                </span>
                            </div>

                            {/* DIVIDER */}
                            <div className="mx-4 border-t border-border lg:mx-5" />

                            {/* DETAILS */}
                            <div className="space-y-2 px-4 py-4 lg:px-5">
                                {[
                                    {
                                        icon: (
                                            <Clock className="h-3.5 w-3.5" />
                                        ),
                                        label: 'Duration',
                                        value: session.duration,
                                    },
                                    {
                                        icon: (
                                            <Users className="h-3.5 w-3.5" />
                                        ),
                                        label: 'Participants',
                                        value: session.participants,
                                    },
                                    {
                                        icon: isInPerson ? (
                                            <MapPin className="h-3.5 w-3.5" />
                                        ) : (
                                            <Monitor className="h-3.5 w-3.5" />
                                        ),
                                        label: session.platformLabel,
                                        value:
                                            session.platformOrLocation,
                                    },
                                    {
                                        icon: (
                                            <CheckSquare className="h-3.5 w-3.5" />
                                        ),
                                        label: 'Includes',
                                        value: session.includes,
                                    },
                                ].map(row => (
                                    <div
                                        key={row.label}
                                        className="flex items-start justify-between gap-2 text-[11px] lg:text-xs"
                                    >
                                        <span className="flex min-w-0 shrink items-center gap-1.5 text-muted-foreground">
                                            {row.icon}
                                            {row.label}
                                        </span>

                                        <span className="max-w-[55%] break-words text-right text-foreground">
                                            {row.value}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* NOTE */}
                            <div
                                className={`mx-3 mb-3 flex items-start gap-2 rounded-lg border px-3 py-2 lg:mx-4 lg:mb-4 lg:py-2.5 ${colors.info}`}
                            >
                                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />

                                <p className="text-[11px] leading-relaxed lg:text-xs">
                                    {session.description}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex flex-wrap items-stretch gap-4">
                <div className="flex min-w-[280px] flex-1 flex-col rounded-lg border border-border bg-card p-4">
                    <div className="mb-3 flex items-center gap-2">
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-muted-foreground"
                        >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <polyline points="10 9 9 9 8 9" />
                        </svg>

                        <span className="text-sm font-semibold text-foreground">
                            Additional Notes
                        </span>
                    </div>

                    <ul className="list-none space-y-1.5 text-xs text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                            Rates are exclusive of applicable taxes.
                        </li>

                        <li className="flex items-start gap-2">
                            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                            Travel expenses are not included and will be billed separately when applicable.
                        </li>

                        <li className="flex items-start gap-2">
                            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                            Rates are subject to review and may change with prior notice.
                        </li>

                        {selectedCourse?.application?.status && (
                            <li className="flex items-start gap-2">
                                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                                Current application status:{' '}
                                <span className="font-medium capitalize text-foreground">
                                    {selectedCourse.application.status}
                                </span>
                            </li>
                        )}
                    </ul>
                </div>

                <div className="flex min-w-[280px] flex-1 flex-col justify-between rounded-lg border border-border bg-card p-4">
                    <div>
                        <p className="mb-1 text-sm font-semibold text-foreground">
                            Need a custom rate?
                        </p>

                        <p className="mb-3 text-xs text-muted-foreground">
                            Contact the Training Administration team for special
                            arrangements or custom instructor pricing.
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        className="mt-auto w-fit gap-2"
                    >
                        <Mail className="h-3.5 w-3.5" />
                        Contact Admin
                    </Button>
                </div>
            </div>
        </div>
    );
}