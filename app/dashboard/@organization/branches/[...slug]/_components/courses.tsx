import { Book } from "lucide-react";
import { Card, CardHeader, CardTitle } from "../../../../../../components/ui/card";
import { Course, getAllCourses } from "../../../../../../services/client";

export default async function Courses({ user_uuid }: { user_uuid: string }) {

    const coursesResp = await getAllCourses({
        query: {
            pageable: {
                page: 0,
                size: 10
            }
        }
    });

    if (coursesResp.error || !coursesResp.data || !coursesResp.data.data || !coursesResp.data.data.content) {
        return (<>No courses</>)
    }

    const courses = coursesResp.data.data.content as Course[];

    return (<>
        {courses.map(course => <Card key={course.uuid}>
            <CardHeader>
                <CardTitle>{course.name}</CardTitle>
            </CardHeader>

            {course.thumbnail_url && course.thumbnail_url.length > 0 ? <img src={course.thumbnail_url} className="w-full object-fit" /> : <Book size={256} color="gray-500" />}
        </Card>)}
    </>);

}