'use client'

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import ConfirmModal from "../../../components/custom-modals/confirm-modal";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { useStudent } from "../../../context/student-context";
import { enrollStudentMutation, getInstructorByUuidOptions, getStudentScheduleQueryKey } from "../../../services/client/@tanstack/react-query.gen";

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, '');

export const ClassCard = ({ classData, course, onViewClass }: { classData: any; course: any, onViewClass: (classData: any) => void }) => {
    const {
        title,
        description,
        default_instructor_uuid,
        location_type,
        default_start_time,
        default_end_time,
        duration_formatted,
        capacity_info,
        is_active,
        uuid
    } = classData;

    const [openEnrollModal, setOpenEnrollModal] = useState(false)

    const student = useStudent()
    const qc = useQueryClient()

    const { data } = useQuery({
        ...getInstructorByUuidOptions({ path: { uuid: default_instructor_uuid } }),
        enabled: !!default_instructor_uuid
    })
    // @ts-ignore
    const instructor = data?.data

    const enrollStudent = useMutation(enrollStudentMutation())
    const handleEnrollStudent = () => {
        if (student?.uuid && uuid) {
            enrollStudent.mutate({
                body: { scheduled_instance_uuid: uuid, student_uuid: student?.uuid }
            }, {
                onSuccess: (data) => {
                    qc.invalidateQueries({
                        queryKey: getStudentScheduleQueryKey({
                            path: { studentUuid: student?.uuid as string },
                            query: {
                                start: new Date('2025-11-02'),
                                end: new Date('2025-12-19'),
                            },
                        }),
                    });
                    setOpenEnrollModal(false);
                    toast.success(data?.message || 'Student enrolled successfully');
                }
            })

        } else {
            toast.error("Student not found")
        }


    }

    return (
        <Card
            className="cursor-pointer hover:shadow-lg transition-shadow w-auto h-auto lg:min-w-[400px]"
            onClick={() => onViewClass(classData)}
        >
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2">{title}</CardTitle>
                        <p className="text-muted-foreground mt-1 line-clamp-2">
                            {stripHtml(description || '')}
                        </p>
                    </div>
                    <Badge variant={is_active ? 'default' : 'secondary'}>
                        {is_active ? 'Published' : 'Inactive'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>
                        {default_start_time} - {default_end_time}
                    </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>Instructor: {instructor?.full_name}</span>
                </div>

                {location_type && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{location_type}</span>
                    </div>
                )}

                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{duration_formatted} session</span>
                    </div>
                </div>

                {capacity_info && (
                    <div className="text-sm text-muted-foreground">
                        {capacity_info}
                    </div>
                )}

                <div className="flex flex-wrap gap-1">
                    {course?.category_names?.map((category: any, index: any) => (
                        <Badge key={index} variant="outline" className="text-xs">
                            {category}
                        </Badge>
                    ))}
                </div>
            </CardContent>
            <CardContent>
                <Button onClick={() => setOpenEnrollModal(true)} >Enroll</Button>
            </CardContent>


            <ConfirmModal
                open={openEnrollModal}
                setOpen={setOpenEnrollModal}
                title="Enroll"
                description="you will enrol for this class/program."
                onConfirm={handleEnrollStudent}
                isLoading={enrollStudent.isPending}
                confirmText="Enroll"
                cancelText="No, cancel"
                variant="destructive"
            />


        </Card>
    );
};
