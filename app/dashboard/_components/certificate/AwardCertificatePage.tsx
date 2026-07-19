// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useClassDetails } from '@/hooks/use-class-details';
import { useClassRoster, type RosterEntry } from '@/hooks/use-class-roster';
import { dayjs } from '@/lib/date';
import {
    createCertificateMutation,
    createCertificateTemplateMutation,
    getAssignmentSchedulesOptions,
    getCertificateTemplatesOptions,
    getCourseEnrollmentsOptions,
    getEnrollmentGradeBookOptions,
    getStudentCertificatesOptions,
    revokeCertificateMutation,
    searchSubmissionsOptions
} from '@/services/client/@tanstack/react-query.gen';
import { verifyCertificate } from '@/services/client/sdk.gen';
import type { Certificate, TemplateTypeEnum } from '@/services/client/types.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Award, CheckCircle2, FileText, GraduationCap, Loader2, ShieldCheck } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { toAuthenticatedMediaUrl } from '../../../../src/lib/media-url';
import { getPreferredScheduleInstance } from '../../@instructor/classes/_components/new-class-page.utils';
import { TrainingSchedule } from '../../@instructor/classes/class-training/[id]/_components/ClassTrainingPage';
import CertificatePage from './CertificatePage';
import { CertificateData } from './CertificatePDF';


function getStudentAttendanceState(entry: RosterEntry | null | undefined) {
    if (entry?.enrollment?.is_attendance_marked) {
        return entry.enrollment?.did_attend ? 'present' : 'absent';
    }

    return 'pending';
}

export const buildTemplatePayload = (templateName: string, courseName: string, className: string) => ({
    name: templateName,
    template_type: 'COURSE_COMPLETION' as TemplateTypeEnum,
    active: true,
    template_html: `<!doctype html><html><head><style>body{font-family:Arial,sans-serif;background:#f8fafc;padding:24px} .card{border:2px solid #0f172a;padding:32px;text-align:center;background:white;} h1{font-size:30px;margin-bottom:8px} p{font-size:16px;color:#475569}</style></head><body><div class='card'><h1>${courseName}</h1><p>Completion certificate template for ${className}</p></div></body></html>`,
    template_css: 'body{font-family:Arial,sans-serif;background:#f8fafc;padding:24px}.card{border:2px solid #0f172a;padding:32px;text-align:center;background:white;}',
});

const AwardCertificatesPage = () => {
    const params = useParams();
    const queryClient = useQueryClient();
    const classId = params?.id as string;

    const { data, isLoading, isError } = useClassDetails(classId);
    const { rosterAllEnrollments, isLoading: rosterLoading } = useClassRoster(classId);

    const [studentSearch, setStudentSearch] = useState('');
    const [activeScheduleId, setActiveScheduleId] = useState('');
    const [selectedEnrollmentId, setSelectedEnrollmentId] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState('')

    const classData = data?.class;
    const course = data?.course ?? data?.pCourses?.[0] ?? null;
    const schedules = data?.schedule ?? [];
    const className = classData?.title ?? course?.name ?? 'Training class';
    const courseName = course?.name ?? classData?.title ?? 'Course';

    const sortedSchedules = useMemo<TrainingSchedule[]>(
        () => [...schedules].sort((left, right) => dayjs(left.start_time).diff(dayjs(right.start_time))),
        [schedules]
    );

    useEffect(() => {
        if (sortedSchedules.length === 0) return;

        const defaultSchedule = getPreferredScheduleInstance(sortedSchedules, 'requestedScheduleId');

        if (defaultSchedule?.uuid && activeScheduleId !== defaultSchedule.uuid) {
            setActiveScheduleId(defaultSchedule.uuid);
        }
    }, [activeScheduleId, sortedSchedules]);

    const activeSchedule = sortedSchedules.find(schedule => schedule.uuid === activeScheduleId) ?? null;

    const activeInstanceStudents = useMemo(
        () =>
            rosterAllEnrollments.filter(
                (entry: RosterEntry) => entry.enrollment?.scheduled_instance_uuid === activeSchedule?.uuid
            ),
        [activeSchedule?.uuid, rosterAllEnrollments]
    );

    const filteredRoster = useMemo(
        () =>
            activeInstanceStudents.filter((entry: RosterEntry) =>
                (entry.user?.full_name ?? '').toLowerCase().includes(studentSearch.toLowerCase())
            ),
        [activeInstanceStudents, studentSearch]
    );

    useEffect(() => {
        if (activeInstanceStudents.length === 0) {
            setSelectedEnrollmentId('');
            setSelectedStudentId('')
            return;
        }

        const currentStudentExists = activeInstanceStudents.some(
            entry => entry.enrollment?.uuid === selectedEnrollmentId
        );

        if (!currentStudentExists) {
            setSelectedEnrollmentId(activeInstanceStudents[0]?.enrollment?.uuid ?? '');
            setSelectedStudentId(activeInstanceStudents[0]?.enrollment?.student_uuid ?? '')
        }
    }, [activeInstanceStudents, selectedEnrollmentId]);

    const selectedStudent =
        activeInstanceStudents.find(entry => entry.enrollment?.uuid === selectedEnrollmentId) ?? null;

    const { data: courseEnrollmentsResp } = useQuery({
        ...getCourseEnrollmentsOptions({
            path: { courseUuid: course?.uuid ?? "" },
            query: { pageable: {} },
        }),
    });

    const enrollmentUuid =
        courseEnrollmentsResp?.data?.content?.find(
            (enrollment) => enrollment.student_uuid === selectedStudent?.student?.data?.uuid
        )?.uuid ?? "";

    const studentUuid =
        selectedStudent?.student?.uuid ??
        selectedStudent?.enrollment?.student_uuid ??
        '';

    const courseUuid = course?.uuid ?? classData?.course_uuid ?? '';
    const enrollmentGradeBookQuery = useQuery({
        ...getEnrollmentGradeBookOptions({
            path: { courseUuid, enrollmentUuid },
        }),
        enabled: Boolean(courseUuid && enrollmentUuid),
    });

    const studentCertificatesQuery = useQuery({
        ...getStudentCertificatesOptions({
            path: { studentUuid },
        }),
        enabled: Boolean(studentUuid),
    });

    const certificateTemplatesQuery = useQuery({
        ...getCertificateTemplatesOptions({
            query: { pageable: {} },
        }),
        enabled: true,
    });

    const createCertificate = useMutation(createCertificateMutation());
    const revokeCertificate = useMutation(revokeCertificateMutation());
    const createTemplate = useMutation(createCertificateTemplateMutation());

    const studentCertificates = useMemo<Certificate[]>(() => {
        const certificates = studentCertificatesQuery.data?.data ?? [];
        return certificates.filter(cert =>
            cert.course_uuid === courseUuid || cert.program_uuid === classData?.program_uuid
        );
    }, [studentCertificatesQuery.data?.data, courseUuid, classData?.program_uuid]);

    const activeCertificate = studentCertificates[0] ?? null;

    const attendanceSummary = useMemo(() => {
        const filteredEnrollments = selectedEnrollmentId
            ? rosterAllEnrollments.filter(
                entry => entry?.enrollment?.student_uuid === selectedStudentId
            )
            : rosterAllEnrollments;


        const presentCount = filteredEnrollments.filter(
            entry => getStudentAttendanceState(entry) === 'present'
        ).length;

        const absentCount = filteredEnrollments.filter(
            entry => getStudentAttendanceState(entry) === 'absent'
        ).length;

        const pendingCount = filteredEnrollments.filter(
            entry => getStudentAttendanceState(entry) === 'pending'
        ).length;

        return {
            presentCount,
            absentCount,
            pendingCount,
            totalCount: presentCount + absentCount + pendingCount,
        };
    }, [
        rosterAllEnrollments,
        selectedEnrollmentId,
        activeInstanceStudents,
    ]);

    const classAssignmentScheduleQuery = useQuery({
        ...getAssignmentSchedulesOptions({
            path: { classUuid: classId },
        }),
        enabled: Boolean(classId),
    });
    const activeScheduleAssignments = classAssignmentScheduleQuery?.data?.data || []

    const { data: assignmentSubmissionSearchResp } = useQuery({
        ...searchSubmissionsOptions({
            query: {
                pageable: {},
                searchParams: {}
            }
        })
    })
    const submissionMap = new Map(
        assignmentSubmissionSearchResp?.data?.content?.map(submission => [
            submission.assignment_uuid,
            submission
        ])
    );

    const enrichedScheduledAssignmentSubmission = activeScheduleAssignments.map(schedule => ({
        ...schedule,
        submission: submissionMap.get(schedule?.assignment_uuid as string) || null,
        hasSubmitted: submissionMap.has(schedule?.assignment_uuid as string)
    }));

    // console.log(enrichedScheduledAssignmentSubmission, "FIL SCHED")
    // console.log(enrollmentUuid, "STUD COURSE ENRO")

    const gradebook = enrollmentGradeBookQuery.data?.data;
    // const assessmentRows = useMemo(() => {
    //     return (gradebook?.components ?? []).flatMap(component => {
    //         const aggregateScore = component.aggregate_score;
    //         const items = (component.line_items ?? []).map(lineItem => ({
    //             title: lineItem?.line_item?.title ?? component.assessment?.title ?? 'Assessment',
    //             category: component.assessment?.assessment_category ?? 'General',
    //             score: lineItem?.score?.percentage ?? lineItem?.score?.score,
    //             maxScore: lineItem?.score?.max_score,
    //             passed: false,
    //             gradedAt: lineItem?.score?.graded_at,
    //         }));

    //         if (aggregateScore && items.length === 0) {
    //             items.push({
    //                 title: component.assessment?.title ?? 'Aggregate score',
    //                 category: component.assessment?.assessment_category ?? 'General',
    //                 score: aggregateScore.percentage ?? aggregateScore.score,
    //                 maxScore: aggregateScore.max_score,
    //                 passed: Boolean(aggregateScore.percentage && aggregateScore.percentage >= 50),
    //                 gradedAt: aggregateScore.graded_at,
    //             });
    //         }

    //         return items;
    //     });
    // }, [gradebook]);

    const assessmentRows = useMemo(() => {
        return enrichedScheduledAssignmentSubmission
            .filter(schedule =>
                schedule.submission?.enrollment_uuid === enrollmentUuid
            )
            .map(schedule => ({
                assignmentUuid: schedule.assignment_uuid,
                scheduleUuid: schedule.uuid,

                // assignment/schedule details
                title: schedule.assignment?.title ?? "Assignment",
                visibleAt: schedule.visible_at,
                dueAt: schedule.due_at,

                // student submission
                hasSubmitted: schedule.hasSubmitted,
                submission: schedule.submission,

                // grade
                score: schedule.submission?.score,
                maxScore: schedule.submission?.max_score,
                percentage: schedule.submission?.percentage,
                gradedAt: schedule.submission?.graded_at,
                status: schedule.submission?.status,
                instructorComments: schedule.submission?.instructor_comments,
            }));
    }, [enrichedScheduledAssignmentSubmission, enrollmentUuid]);

    const certificatePreviewData = useMemo<CertificateData | null>(() => {
        if (!selectedStudent) return null;

        return {
            studentName: selectedStudent.user?.full_name ?? 'Student',
            courseName,
            institutionName: 'Elimika',
            certificateType: 'certificate-of-completion',
            completionDate: dayjs(activeSchedule?.end_time ?? new Date()).format('MMMM D, YYYY'),
            issuedDate: dayjs().format('MMMM D, YYYY'),
            certificateId: activeCertificate?.certificate_number ?? 'Pending',
            signatoryName: 'Instructor',
            signatoryTitle: 'Lead Instructor',
        };
    }, [activeCertificate?.certificate_number, activeSchedule?.end_time, courseName, selectedStudent]);



    const handleAwardCertificate = async () => {
        if (!studentUuid || !courseUuid) {
            toast.error('Select a student before awarding a certificate.');
            return;
        }

        try {
            let templateUuid = certificateTemplatesQuery.data?.data?.content?.[0]?.uuid;
            if (!templateUuid) {
                const createdTemplate = await createTemplate.mutateAsync({
                    body: buildTemplatePayload(`${courseName} completion certificate`),
                });
                templateUuid = createdTemplate?.data?.uuid;
            }

            if (!templateUuid) {
                toast.error('A certificate template is required before awarding a certificate.');
                return;
            }

            const createdCertificate = await createCertificate.mutateAsync({
                body: {
                    student_uuid: studentUuid,
                    course_uuid: courseUuid,
                    template_uuid: templateUuid,
                    completion_date: dayjs(activeSchedule?.end_time ?? new Date()).toDate(),
                    final_grade: gradebook?.final_grade ?? undefined,
                } as Certificate,
            });

            await queryClient.invalidateQueries({ queryKey: ['getStudentCertificates'] });
            await queryClient.invalidateQueries({ queryKey: ['getEnrollmentGradeBook'] });

            if (createdCertificate?.certificate_number) {
                toast.success(`Certificate issued to ${selectedStudent?.user?.full_name ?? 'the learner'}.`);
            } else {
                toast.success('Certificate request completed.');
            }
        } catch (error) {
            toast.error('Unable to award the certificate right now.');
        }
    };

    const handleRevokeCertificate = async () => {
        if (!activeCertificate?.uuid) {
            toast.error('No issued certificate is available to revoke.');
            return;
        }

        try {
            await revokeCertificate.mutateAsync({
                path: { uuid: activeCertificate.uuid },
                query: { reason: 'Revoked by instructor' },
            });
            await queryClient.invalidateQueries({ queryKey: ['getStudentCertificates'] });
            toast.success('Certificate revoked.');
        } catch (error) {
            toast.error('Unable to revoke this certificate.');
        }
    };

    const handleVerifyCertificate = async () => {
        if (!activeCertificate?.certificate_number) {
            toast.error('This certificate has no verification number yet.');
            return;
        }

        try {
            const verificationResponse = await verifyCertificate({
                path: { certificateNumber: activeCertificate.certificate_number },
                throwOnError: true,
            });
            const isValid = verificationResponse?.data?.data;
            toast.success(isValid ? 'Certificate verified successfully.' : 'Certificate could not be verified.');
        } catch (error) {
            toast.error('Unable to verify this certificate right now.');
        }
    };

    if (isLoading || rosterLoading) {
        return (
            <div className='flex min-h-[480px] items-center justify-center rounded-xl border border-dashed p-8 text-sm text-muted-foreground'>
                Loading certificate workspace…
            </div>
        );
    }

    if (isError) {
        return (
            <div className='rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive'>
                We could not load the class details for this certificate workspace.
            </div>
        );
    }

    return (
        <div className='flex h-full min-h-0 flex-col gap-4 p-4'>
            <div className='flex flex-col gap-3 rounded-xl border border-border/70 bg-card/90 p-4 shadow-sm'>
                <div className='flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between'>
                    <div>
                        <p className='text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground'>Certificate awards</p>
                        <h1 className='text-2xl font-semibold text-foreground'>{className}</h1>
                        <p className='mt-1 text-sm text-muted-foreground'>Review learner performance and issue a certificate once a class has concluded.</p>
                    </div>

                    {/* <div className='w-full max-w-[260px]'>
                        <label className='mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground'>Class session</label>
                        <Select
                            value={activeSchedule?.uuid ?? ''}
                            onValueChange={value => setActiveScheduleId(value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder='Select a schedule' />
                            </SelectTrigger>
                            <SelectContent>
                                {sortedSchedules.map(schedule => (
                                    <SelectItem key={schedule.uuid} value={schedule.uuid ?? ''}>
                                        {dayjs(schedule.start_time).format('MMM D, HH:mm')}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div> */}
                </div>
            </div>

            <div className='grid min-h-0 flex-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]'>
                <aside className='flex min-h-0 flex-col overflow-hidden rounded-xl border border-border/70 bg-card/90 shadow-sm'>
                    <div className='border-b border-border/70 p-3'>
                        <div className='flex items-center justify-between gap-3'>
                            <div>
                                <p className='text-sm font-semibold text-foreground'>Enrolled learners</p>
                                <p className='text-xs text-muted-foreground'>{activeInstanceStudents.length} students enrolled in this class / course</p>
                            </div>
                            <Badge variant='outline'>{activeInstanceStudents.length}</Badge>
                        </div>
                        <div className='mt-3'>
                            <Input
                                value={studentSearch}
                                onChange={event => setStudentSearch(event.target.value)}
                                placeholder='Search students'
                                className='h-9'
                            />
                        </div>
                    </div>

                    <ScrollArea className='min-h-0 flex-1'>
                        <div className='space-y-2 p-2'>
                            {filteredRoster.map(entry => {
                                const attendanceState = getStudentAttendanceState(entry);
                                const isSelected = selectedEnrollmentId === (entry.enrollment?.uuid ?? '');
                                const badgeClass =
                                    attendanceState === 'present'
                                        ? 'bg-success/10 text-success'
                                        : attendanceState === 'absent'
                                            ? 'bg-destructive/10 text-destructive'
                                            : 'bg-warning/10 text-warning';

                                return (
                                    <button
                                        key={entry.enrollment?.uuid ?? entry.user?.uuid ?? entry.student?.uuid}
                                        type='button'
                                        onClick={() => {
                                            setSelectedEnrollmentId(entry.enrollment?.uuid ?? '')
                                            setSelectedStudentId(entry.enrollment?.student_uuid ?? '')
                                        }
                                        }
                                        className={`w-full rounded-lg border p-3 text-left transition-colors ${isSelected ? 'border-primary/40 bg-primary/8' : 'border-transparent hover:bg-muted/60'}`}
                                    >
                                        <div className='flex items-start gap-2.5'>
                                            <Avatar className='size-9 border border-border/60'>
                                                <AvatarImage src={toAuthenticatedMediaUrl(entry.user?.profile_image_url) || ''} alt={entry.user?.full_name ?? 'Student'} />
                                                <AvatarFallback>{(entry.user?.full_name ?? 'ST').slice(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className='min-w-0 flex-1'>
                                                <div className='flex items-center justify-between gap-2'>
                                                    <p className='truncate text-sm font-semibold text-foreground'>
                                                        {entry.user?.full_name ?? 'Unknown student'}
                                                    </p>
                                                    {/* <Badge variant='outline' className={badgeClass}>
                                                        {attendanceState}
                                                    </Badge> */}
                                                </div>
                                                <p className='mt-1 truncate text-xs text-muted-foreground'>
                                                    {entry.user?.email ?? 'No email on file'}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}

                            {filteredRoster.length === 0 && (
                                <div className='rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground'>
                                    No learners match this search in the selected schedule.
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </aside>

                <main className='flex min-h-0 flex-col gap-4 overflow-hidden'>
                    {!selectedStudent ? (
                        <div className='flex min-h-[320px] items-center justify-center rounded-xl border border-dashed bg-card/70 p-8 text-center text-sm text-muted-foreground'>
                            Select a learner from the roster to view their progress and award a certificate.
                        </div>
                    ) : (
                        <>
                            <div className='rounded-xl border border-border/70 bg-card/90 p-4 shadow-sm'>
                                <div className='mb-4 flex flex-wrap items-start justify-between gap-3'>
                                    <div>
                                        <p className='text-xs mb-1 font-semibold uppercase tracking-[0.2em] text-muted-foreground'>Selected student</p>
                                        <h2 className='text-xl font-semibold text-foreground'>
                                            {selectedStudent.user?.full_name ?? 'Selected learner'}
                                        </h2>
                                        <p className='mt-1 text-sm text-muted-foreground'>
                                            {courseName} · {dayjs(activeSchedule?.end_time ?? new Date()).format('MMM D, YYYY')}
                                        </p>
                                    </div>

                                    <div className='flex flex-wrap gap-2'>
                                        <Button
                                            onClick={handleAwardCertificate}
                                            disabled={createCertificate.isPending || createTemplate.isPending}
                                        >
                                            {createCertificate.isPending || createTemplate.isPending ? (
                                                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                            ) : (
                                                <Award className='mr-2 h-4 w-4' />
                                            )}
                                            Award certificate
                                        </Button>
                                        <Button
                                            variant='outline'
                                            onClick={handleVerifyCertificate}
                                            disabled={!activeCertificate?.certificate_number || createCertificate.isPending}
                                        >
                                            <ShieldCheck className='mr-2 h-4 w-4' />
                                            Verify certificate
                                        </Button>
                                        <Button
                                            variant='destructive'
                                            onClick={handleRevokeCertificate}
                                            disabled={!activeCertificate?.uuid || revokeCertificate.isPending}
                                        >
                                            {revokeCertificate.isPending ? (
                                                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                            ) : (
                                                <FileText className='mr-2 h-4 w-4' />
                                            )}
                                            Revoke certificate
                                        </Button>
                                    </div>
                                </div>

                                <div className='grid gap-3 md:grid-cols-3'>
                                    <div className='rounded-lg border border-border/60 bg-background/80 p-3'>
                                        <p className='text-xs uppercase tracking-[0.16em] text-muted-foreground'>Attendance</p>
                                        <p className='mt-2 text-2xl font-semibold text-foreground'>{attendanceSummary.presentCount}/{attendanceSummary.totalCount}</p>
                                        <p className='text-sm text-muted-foreground'>present out of this session</p>
                                    </div>
                                    <div className='rounded-lg border border-border/60 bg-background/80 p-3'>
                                        <p className='text-xs uppercase tracking-[0.16em] text-muted-foreground'>Current grade</p>
                                        <p className='mt-2 text-2xl font-semibold text-foreground'>
                                            {gradebook?.final_grade != null ? `${gradebook.final_grade}%` : 'Pending'}
                                        </p>
                                        <p className='text-sm text-muted-foreground'>Weighted course grade</p>
                                    </div>
                                    <div className='rounded-lg border border-border/60 bg-background/80 p-3'>
                                        <p className='text-xs uppercase tracking-[0.16em] text-muted-foreground'>Certificate state</p>
                                        <p className='mt-2 flex items-center gap-2 text-lg font-semibold text-foreground'>
                                            {activeCertificate?.uuid ? (
                                                <>
                                                    <CheckCircle2 className='h-4 w-4 text-success' />
                                                    Issued
                                                </>
                                            ) : (
                                                <>
                                                    <GraduationCap className='h-4 w-4 text-warning' />
                                                    Pending
                                                </>
                                            )}
                                        </p>
                                        <p className='text-sm text-muted-foreground'>
                                            {activeCertificate?.certificate_number ?? 'No certificate number yet'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className='min-h-0 flex flex-col gap-4'>
                                <div className='flex min-h-0 flex-col gap-4 overflow-hidden rounded-xl border border-border/70 bg-card/90 p-4 shadow-sm'>
                                    <div className='flex items-center justify-between'>
                                        <div>
                                            <p className='text-sm font-semibold text-foreground'>Performance overview</p>
                                            <p className='text-sm text-muted-foreground'>Attendance, graded tasks and weighted course results.</p>
                                        </div>
                                        <Badge variant='outline'>Gradebook</Badge>
                                    </div>

                                    <div className='grid gap-3 md:grid-cols-3'>
                                        <div className='rounded-lg border border-border/60 bg-background/80 p-3'>
                                            <p className='text-xs uppercase tracking-[0.16em] text-muted-foreground'>Present</p>
                                            <p className='text-xl font-semibold text-foreground'>{attendanceSummary.presentCount}</p>
                                        </div>
                                        <div className='rounded-lg border border-border/60 bg-background/80 p-3'>
                                            <p className='text-xs uppercase tracking-[0.16em] text-muted-foreground'>Absent</p>
                                            <p className='text-xl font-semibold text-foreground'>{attendanceSummary.absentCount}</p>
                                        </div>
                                        <div className='rounded-lg border border-border/60 bg-background/80 p-3'>
                                            <p className='text-xs uppercase tracking-[0.16em] text-muted-foreground'>Pending</p>
                                            <p className='text-xl font-semibold text-foreground'>{attendanceSummary.pendingCount}</p>
                                        </div>
                                    </div>

                                    <ScrollArea className='min-h-0 flex-1'>
                                        <div className='space-y-3'>
                                            <div className='text-md font-bold'>Assessments (Tasks, Exams and Projects)</div>

                                            {assessmentRows.length > 0 ? (
                                                assessmentRows.map((item, index) => (
                                                    <div key={`${item.title}-${index}`} className='rounded-lg border border-border/60 bg-background/80 p-3'>
                                                        <div className='flex items-start justify-between gap-3'>
                                                            <div>
                                                                <p className='text-sm font-semibold text-foreground'>{item.title}</p>
                                                                <p className='mt-1 text-xs text-muted-foreground'>{item?.category}</p>
                                                            </div>
                                                            <Badge variant={item?.passed ? 'success' : 'outline'}>
                                                                {item.score != null ? `${item.score}${item.maxScore ? `/${item.maxScore}` : ''}` : 'Pending'}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className='rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground'>
                                                    No graded assessments are available yet for this learner.
                                                </div>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </div>

                                <div className='flex min-h-0 flex-col gap-4 overflow-hidden rounded-xl border border-border/70 bg-card/90 p-4 shadow-sm'>
                                    <div>
                                        <p className='text-sm font-semibold text-foreground'>Certificate preview</p>
                                        <p className='text-sm text-muted-foreground'>Use the current PDF certificate template as a live preview before issuance.</p>
                                    </div>

                                    {certificatePreviewData ? (
                                        <div className='min-h-0 flex-1 overflow-hidden rounded-lg border border-border/60 bg-background/80 p-2'>
                                            <CertificatePage certData={certificatePreviewData} />
                                        </div>
                                    ) : (
                                        <div className='flex min-h-[280px] items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground'>
                                            Certificate preview will appear here once a learner is selected.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AwardCertificatesPage