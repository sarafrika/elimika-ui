"use client"

import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { toast } from "sonner"
import { useState } from "react"
import Spinner from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCourseDate } from "@/lib/format-course-date"
import { tanstackClient } from "@/services/api/tanstack-client"
import { EyeIcon, FilePenIcon, PenIcon, PlusIcon, TrashIcon } from "lucide-react"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import RichTextRenderer from "@/components/editors/richTextRenders"

export default function CourseDraftsPage() {
  const instructorUuid = "8369b6a3-d889-4bc7-8520-e5e8605c25d8"

  const [page, setPage] = useState(0)
  const [size, setSize] = useState(50)

  const { data, isFetching, isLoading, refetch } = tanstackClient.useQuery(
    "get",
    "/api/v1/courses/instructor/{instructorUuid}",
    // @ts-ignore
    { params: { path: { instructorUuid }, query: { page, size } } },
  )
  // @ts-ignore
  const draftCourses = data?.data?.content?.filter(
    (course: any) => course.status === "draft" && course.is_published === false,
  )

  const deleteCourseMutation = tanstackClient.useMutation("delete", "/api/v1/courses/{courseId}")
  const handleDeleteCourse = (courseId: string) => {
    deleteCourseMutation.mutate(
      { params: { path: { courseId: courseId as string } } },
      {
        onSuccess: () => {
          toast.success("Success")
          refetch()
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Your Draft Courses</h1>
          <p className="text-muted-foreground mt-1 text-base">
            You have {draftCourses?.length} course
            {draftCourses?.length > 1 ? "s" : ""} waiting to be published.
          </p>
        </div>
        <Button type="button" className="cursor-pointer px-4 py-2 text-sm" asChild>
          <Link href="/dashboard/course-management/create-new-course">
            <PlusIcon className="h-4 w-4" />
            New Course
          </Link>
        </Button>
      </div>

      {draftCourses?.length === 0 ? (
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
              <TableHead>Course Name</TableHead>
              <TableHead>Categories</TableHead>
              <TableHead>Class Limit</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isFetching || isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-6">
                  <div className="flex w-full items-center justify-center">
                    <Spinner />
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <>
                {draftCourses?.map((course: any) => (
                  <TableRow key={course.uuid}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="max-w-[270px] truncate">{course.name}</div>
                        <RichTextRenderer htmlString={course?.description} maxChars={42} />{" "}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex max-w-[250px] flex-wrap gap-1">
                        {course.category_names.map((i: any) => (
                          <Badge key={i} variant="default" className="capitalize">
                            {i}
                          </Badge>
                        ))}
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
              </>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
