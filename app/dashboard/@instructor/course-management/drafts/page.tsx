"use client"

import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { EyeIcon, FilePenIcon, PenIcon, PlusIcon, TrashIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { tanstackClient } from "@/services/api/tanstack-client"
import { formatCourseDate } from "@/lib/format-course-date"

// const draftCourses: any[] = [
//   {
//     id: 1,
//     name: "Introduction to Web Development",
//     description: "A comprehensive course covering the basics of HTML, CSS, and JavaScript.",
//     categories: [{ name: "Web Development" }, { name: "Beginner" }],
//     classLimit: 50,
//     lastUpdated: "2023-10-27",
//   },
//   {
//     id: 2,
//     name: "Advanced React Patterns",
//     description: "Learn advanced patterns and techniques for building scalable React applications.",
//     categories: [{ name: "React" }, { name: "Advanced" }],
//     classLimit: 30,
//     lastUpdated: "2023-10-25",
//   },
//   {
//     id: 3,
//     name: "Data Science with Python",
//     description: "Explore the world of data science using Python, Pandas, and Scikit-learn.",
//     categories: [{ name: "Data Science" }, { name: "Python" }],
//     classLimit: 0,
//     lastUpdated: "2023-10-22",
//   },
// ]

const draftCourses = {
  success: true,
  data: {
    content: [
      {
        uuid: "c1d7fbd9-0c60-4f89-a65d-d7ef2b789314",
        name: "Advanced Java Programming",
        instructor_uuid: "i1s2t3r4-5u6c-7t8o-9r10-abcdefghijkl",
        category_uuid: "c1a2t3e4-5g6o-7r8y-9a10-abcdefghijkl",
        difficulty_uuid: "d1i2f3f4-5i6c-7u8l-9t10-abcdefghijkl",
        description: "Comprehensive course covering advanced Java concepts and enterprise development",
        objectives: "Master advanced Java features, design patterns, and enterprise frameworks",
        prerequisites: "Basic Java knowledge and OOP concepts",
        duration_hours: 40,
        duration_minutes: 30,
        class_limit: 25,
        price: 299.99,
        age_lower_limit: 18,
        age_upper_limit: 65,
        thumbnail_url: "https://cdn.sarafrika.com/courses/java-advanced-thumb.jpg",
        intro_video_url: "https://cdn.sarafrika.com/courses/java-advanced-intro.mp4",
        banner_url: "https://cdn.sarafrika.com/courses/java-advanced-banner.jpg",
        status: "PUBLISHED",
        active: true,
        created_date: "2024-04-01T12:00:00",
        created_by: "instructor@sarafrika.com",
        updated_date: "2024-04-15T15:30:00",
        updated_by: "instructor@sarafrika.com",
        total_duration_display: "40 hours 30 minutes",
        is_free: false,
        is_published: true,
        is_draft: false,
      },
      {
        uuid: "c1d7fbd9-0c60-4f89-a65d-d7ef2b789316",
        name: "Advanced Java Programming",
        instructor_uuid: "i1s2t3r4-5u6c-7t8o-9r10-abcdefghijkl",
        category_uuid: "c1a2t3e4-5g6o-7r8y-9a10-abcdefghijkl",
        difficulty_uuid: "d1i2f3f4-5i6c-7u8l-9t10-abcdefghijkl",
        description: "Comprehensive course covering advanced Java concepts and enterprise development",
        objectives: "Master advanced Java features, design patterns, and enterprise frameworks",
        prerequisites: "Basic Java knowledge and OOP concepts",
        duration_hours: 40,
        duration_minutes: 30,
        class_limit: 25,
        price: 299.99,
        age_lower_limit: 18,
        age_upper_limit: 65,
        thumbnail_url: "https://cdn.sarafrika.com/courses/java-advanced-thumb.jpg",
        intro_video_url: "https://cdn.sarafrika.com/courses/java-advanced-intro.mp4",
        banner_url: "https://cdn.sarafrika.com/courses/java-advanced-banner.jpg",
        status: "PUBLISHED",
        active: true,
        created_date: "2024-04-01T12:00:00",
        created_by: "instructor@sarafrika.com",
        updated_date: "2024-04-15T15:30:00",
        updated_by: "instructor@sarafrika.com",
        total_duration_display: "40 hours 30 minutes",
        is_free: false,
        is_published: true,
        is_draft: false,
      },
      {
        uuid: "c1d7fbd9-0c60-4f89-a65d-d7ef2b789318",
        name: "Advanced Java Programming",
        instructor_uuid: "i1s2t3r4-5u6c-7t8o-9r10-abcdefghijkl",
        category_uuid: "c1a2t3e4-5g6o-7r8y-9a10-abcdefghijkl",
        difficulty_uuid: "d1i2f3f4-5i6c-7u8l-9t10-abcdefghijkl",
        description: "Comprehensive course covering advanced Java concepts and enterprise development",
        objectives: "Master advanced Java features, design patterns, and enterprise frameworks",
        prerequisites: "Basic Java knowledge and OOP concepts",
        duration_hours: 40,
        duration_minutes: 30,
        class_limit: 25,
        price: 299.99,
        age_lower_limit: 18,
        age_upper_limit: 65,
        thumbnail_url: "https://cdn.sarafrika.com/courses/java-advanced-thumb.jpg",
        intro_video_url: "https://cdn.sarafrika.com/courses/java-advanced-intro.mp4",
        banner_url: "https://cdn.sarafrika.com/courses/java-advanced-banner.jpg",
        status: "PUBLISHED",
        active: true,
        created_date: "2024-04-01T12:00:00",
        created_by: "instructor@sarafrika.com",
        updated_date: "2024-04-15T15:30:00",
        updated_by: "instructor@sarafrika.com",
        total_duration_display: "40 hours 30 minutes",
        is_free: false,
        is_published: true,
        is_draft: false,
      },
    ],
    metadata: {
      pageNumber: 1073741824,
      pageSize: 1073741824,
      totalElements: 9007199254740991,
      totalPages: 1073741824,
      hasNext: true,
      hasPrevious: true,
      first: true,
      last: true,
    },
    links: {
      first: "string",
      previous: "string",
      self: "string",
      next: "string",
      last: "string",
    },
  },
  message: "string",
  error: {},
}

export default function CourseDraftsPage() {
  const { data, isPending } = tanstackClient.useQuery("get", "/api/v1/courses", {
    params: {
      query: {
        //@ts-ignore
        page: 0,
        size: 1,
      },
    },
  })

  const deleteCourseMutation = tanstackClient.useMutation("delete", "/api/v1/courses/{courseId}")
  const handleDeleteCourse = (courseId: string) => {
    console.log("deleting.....", courseId)
  }

  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Your Draft Courses</h1>
          <p className="text-muted-foreground mt-1 text-base">
            You have {draftCourses?.data?.content?.length} course
            {draftCourses?.data?.content?.length > 1 ? "s" : ""} waiting to be published.
          </p>
        </div>
        <Button type="button" className="cursor-pointer px-4 py-2 text-sm" asChild>
          <Link href="/dashboard/course-management/create-new-course">
            <PlusIcon className="h-4 w-4" />
            New Course
          </Link>
        </Button>
      </div>

      {draftCourses?.data?.content?.length === 0 ? (
        <div className="bg-muted/20 rounded-md border py-12 text-center">
          <FilePenIcon className="text-muted-foreground mx-auto h-12 w-12" />
          <h3 className="mt-4 text-lg font-medium">No draft courses</h3>
          <p className="text-muted-foreground mt-2">
            You don&apos;t have any draft courses. Start by creating a new course to get started.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/dashboard/course-management/create-new-course">Create Your First Course</Link>
          </Button>
        </div>
      ) : (
        <Table>
          <TableCaption>A list of your course drafts</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Course Name</TableHead>
              <TableHead>Categories</TableHead>
              <TableHead>Class Limit</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {draftCourses?.data?.content?.map((course: any) => (
              <TableRow key={course.uuid}>
                <TableCell className="font-medium">
                  <div>
                    <div>{course.name}</div>
                    <div className="text-muted-foreground max-w-[250px] truncate text-sm">{course.description}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {/* {course.categories.map((category: any, i: any) => (
                      <Badge key={i} variant="outline" className="capitalize">
                        {category.name}
                      </Badge>
                    ))} */}
                    <Badge variant="outline" className="capitalize">
                      xxxx
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>{course.class_limit || "Unlimited"}</TableCell>
                <TableCell>{formatCourseDate(course.updated_date)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <span className="sr-only">Open menu</span>
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 15 15"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                        >
                          <path
                            d="M8.625 2.5C8.625 3.12132 8.12132 3.625 7.5 3.625C6.87868 3.625 6.375 3.12132 6.375 2.5C6.375 1.87868 6.87868 1.375 7.5 1.375C8.12132 1.375 8.625 1.87868 8.625 2.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM7.5 13.625C8.12132 13.625 8.625 13.1213 8.625 12.5C8.625 11.8787 8.12132 11.375 7.5 11.375C6.87868 11.375 6.375 11.8787 6.375 12.5C6.375 13.1213 6.87868 13.625 7.5 13.625Z"
                            fill="currentColor"
                            fillRule="evenodd"
                            clipRule="evenodd"
                          ></path>
                        </svg>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Link
                          href={`/dashboard/course-management/create-new-course?id=${course.uuid}`}
                          className="flex w-full items-center"
                        >
                          <PenIcon className="focus:text-primary-foreground mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Link
                          href={`/dashboard/course-management/preview/${course.uuid}`}
                          className="flex w-full items-center"
                        >
                          <EyeIcon className="focus:text-primary-foreground mr-2 h-4 w-4" />
                          Preview
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={() => handleDeleteCourse(course.uuid)}>
                        <TrashIcon className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
