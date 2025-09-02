"use client"
import { useQuery } from "@tanstack/react-query";
import { Book } from "lucide-react";
import { Card, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { Course, getAllCourses } from "../../../../../services/client";

export default function Courses({ user_uuid }: { user_uuid: string }) {

    const { data, error } = useQuery({
        queryKey: ["courses"],
        queryFn: () => getAllCourses({
            query: {
                pageable: {
                    page: 0,
                    size: 10
                }
            }
        })
    });

    if (error || !data || !data.data || !data.data.data || !data.data.data.content) {
        return (<>No courses</>)
    }

    const courses = data.data.data.content as Course[];

    return (<>
        {courses.map(course => <Card key={course.uuid}>
            <CardHeader>
                <CardTitle>{course.name}</CardTitle>
            </CardHeader>

            {course.thumbnail_url && course.thumbnail_url.length > 0 ? <img src={course.thumbnail_url} className="w-full object-fit" /> : <Book size={256} color="gray-500" />}
        </Card>)}
    </>);

}