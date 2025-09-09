'use client'

import { getClassDefinitionOptions, previewRecurringClassScheduleOptions } from "@/services/client/@tanstack/react-query.gen";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

export default function ClassPreviewPage() {
    const params = useParams();
    const classId = params?.id as string;

    const { data } = useQuery({ ...getClassDefinitionOptions({ path: { uuid: classId as string } }), enabled: !!classId })
    const classData = data?.data

    const { data: schedule } = useQuery(previewRecurringClassScheduleOptions({
        path: { uuid: classId },
        query: {
            startDate: classData?.default_start_time as Date,
            endDate: classData?.default_end_time as Date
        }
    }))


    return (
        <div>class preview</div>
    )
}

