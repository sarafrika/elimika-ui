import { Card, CardHeader, CardTitle } from "../../../../../../components/ui/card";
import { Course, getAllCourses } from "../../../../../../services/client";

export default async function Courses() {

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
        {courses.map(course => <Card>
            <CardHeader>
                <CardTitle>{course.name}</CardTitle>
            </CardHeader>

            <img src={course.thumbnail_url} className="w-full object-fit" />
        </Card>)}
    </>);

}