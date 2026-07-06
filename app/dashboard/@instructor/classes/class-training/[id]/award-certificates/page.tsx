'use client'

import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useUserProfile } from "../../../../../../../context/profile-context";
import { useClassDetails } from "../../../../../../../hooks/use-class-details";
import { useClassLessonContent } from "../../../../../../../hooks/use-class-lesson-content";
import { RosterEntry, useClassRoster } from "../../../../../../../hooks/use-class-roster";
import { getPreferredScheduleInstance } from "../../../_components/new-class-page.utils";
import { RosterPanel, TrainingSchedule } from "../_components/ClassTrainingPage";

const AwardCertificatesPage = () => {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const queryClient = useQueryClient();
    const classId = (params?.id as string);
    const userProfile = useUserProfile();
    const { data, isLoading, isError } = useClassDetails(classId);
    const { rosterAllEnrollments, isLoading: rosterLoading } = useClassRoster(classId);
    const [studentSearch, setStudentSearch] = useState('');
    const [selectedContentId, setSelectedContentId] = useState('');
    const [activeScheduleId, setActiveScheduleId] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const appliedRouteContentSelectionRef = useRef('');

    const [activeTab, setActiveTab] = useState<'content' | 'practice' | 'assessment'>('content');
    const [activeLefTab, setActiveLeftTab] = useState<'students' | 'evaluation'>('students');
    // const [activeLefTab, setActiveLeftTab] = useState<'students' | 'lessons' | 'evaluation'>('students');

    const classData = data.class;
    const course = data.course ?? data?.pCourses?.[0] ?? null;
    const programCourses = data.pCourses ?? [];
    const schedules = data.schedule ?? [];

    const {
        isLoading: lessonsLoading,
        lessonModules: lessonsWithContent,
        contentTypeDetailsMap,
    } = useClassLessonContent({
        courseUuid: classData?.course_uuid,
        programUuid: classData?.program_uuid,
    });

    const sortedSchedules = useMemo<TrainingSchedule[]>(
        () =>
            [...schedules].sort((left, right) => dayjs(left.start_time).diff(dayjs(right.start_time))),
        [schedules]
    );

    useEffect(() => {
        if (sortedSchedules.length === 0) return;

        const defaultSchedule = getPreferredScheduleInstance(sortedSchedules, "requestedScheduleId");

        if (defaultSchedule?.uuid && activeScheduleId !== defaultSchedule.uuid) {
            setActiveScheduleId(defaultSchedule.uuid);
        }
    }, [activeScheduleId, "requestedScheduleId", sortedSchedules]);

    const activeSchedule =
        sortedSchedules.find(schedule => schedule.uuid === activeScheduleId) ?? null;


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
            setSelectedStudentId('');
            return;
        }

        const currentStudentExists = activeInstanceStudents.some(
            entry => entry.enrollment?.uuid === selectedStudentId
        );

        if (!currentStudentExists) {
            setSelectedStudentId(activeInstanceStudents[0]?.enrollment?.uuid ?? '');
        }
    }, [activeInstanceStudents, selectedStudentId]);

    const selectedStudent =
        activeInstanceStudents.find(entry => entry.enrollment?.uuid === selectedStudentId) ?? null;


    return (
        <div>AwardCertificatesPage {classId}

            <div className='min-h-0 flex-1'>
                <RosterPanel
                    activeInstanceStudentsCount={activeInstanceStudents.length}
                    activeInstanceStudents={activeInstanceStudents}
                    filteredRoster={filteredRoster}
                    activeSchedule={activeSchedule}
                    studentSearch={studentSearch}
                    setStudentSearch={setStudentSearch}
                    selectedStudentId={selectedStudentId}
                    onSelectStudent={entry => setSelectedStudentId(entry.enrollment?.uuid ?? '')}
                    onMarkAllPresent={() => { }}
                    isMarkingAllAttendance={false}
                    onMarkAttendance={() => { }}
                    isMarkingAttendance={false}
                    markingStudentId={''}
                />
            </div>

        </div>
    )
}

export default AwardCertificatesPage