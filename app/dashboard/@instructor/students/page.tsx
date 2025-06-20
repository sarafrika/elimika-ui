import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

const studentsData = [
  {
    id: "user_1",
    name: "Alice Johnson",
    email: "alice@example.com",
    avatarUrl: "/avatars/01.png",
    enrolledCourses: [
      {
        name: "Mastering Next.js",
        progress: 85,
      },
    ],
  },
  {
    id: "user_2",
    name: "Bob Williams",
    email: "bob@example.com",
    avatarUrl: "/avatars/02.png",
    enrolledCourses: [
      {
        name: "GraphQL for Beginners",
        progress: 100,
      },
      {
        name: "Introduction to Web Development",
        progress: 45,
      },
    ],
  },
  {
    id: "user_3",
    name: "Charlie Brown",
    email: "charlie@example.com",
    avatarUrl: "/avatars/03.png",
    enrolledCourses: [
      {
        name: "Mastering Next.js",
        progress: 20,
      },
    ],
  },
]

export default function StudentsPage() {
  return (
    <div className="space-y-6 p-4 md:p-10">
      <h2 className="text-2xl font-bold tracking-tight">Your Students</h2>
      <Card>
        <CardHeader>
          <CardTitle>Enrolled Students</CardTitle>
          <CardDescription>
            A list of students currently enrolled in your courses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Enrolled Courses</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentsData.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={student.avatarUrl} />
                        <AvatarFallback>
                          {student.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-muted-foreground text-sm">
                          {student.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      {student.enrolledCourses.map((course, index) => (
                        <div key={index}>
                          <div className="flex justify-between">
                            <p className="font-medium">{course.name}</p>
                            <p className="text-muted-foreground text-sm">
                              {course.progress}%
                            </p>
                          </div>
                          <Progress value={course.progress} />
                        </div>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
