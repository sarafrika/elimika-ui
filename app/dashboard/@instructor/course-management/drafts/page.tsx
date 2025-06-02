"use client"

import { useEffect, useState } from "react"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  EyeIcon,
  FilePenIcon,
  PenIcon,
  PlusIcon,
  TrashIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { fetchCourses } from "@/app/dashboard/instructor/course-management/create-new-course/actions"
import { PagedResponseTemplate } from "@/lib/types"
import {
  Category,
  Course,
} from "@/app/dashboard/instructor/course-management/create-new-course/_components/course-creation-form"

export default function CourseDraftsPage() {
  const [draftCourses, setDraftCourses] =
    useState<PagedResponseTemplate<Course>>()
  const [isLoading, setIsLoading] = useState(true)
  const [courseToDelete, setCourseToDelete] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    const loadDrafts = async () => {
      try {
        const drafts = await fetchCourses()
        setDraftCourses(drafts)
      } catch (error) {
        console.error("Error loading draft courses:", error)
        toast.error("Failed to load draft courses")
      } finally {
        setIsLoading(false)
      }
    }

    loadDrafts()
  }, [])

  const handleEdit = (courseId: number) => {
    router.push(
      `/dashboard/instructor/course-management/create-new-course?id=${courseId}`,
    )
  }

  const handleView = (courseId: number) => {
    router.push(`/dashboard/instructor/course-management/preview/${courseId}`)
  }

  const handleDelete = async () => {
    if (courseToDelete) {
      try {
        /** TODO: Implement course deletion */
      } catch (error) {
        console.error("Error deleting course:", error)
        toast.error("Failed to delete course draft")
      }
      setCourseToDelete(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-medium">Draft Courses</h1>
        <div className="space-y-2">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="flex items-center space-x-4 rounded-md border p-4"
              >
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-10 w-20" />
              </div>
            ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Your Draft Courses</h1>
          <p className="text-muted-foreground mt-1 text-base">
            You have {draftCourses?.data.length} course
            {(draftCourses?.data.length ?? 0 > 1) ? "s" : ""} waiting to be
            published.
          </p>
        </div>
        <Button
          type="button"
          className="cursor-pointer px-4 py-2 text-sm"
          onClick={() =>
            router.push(
              "/dashboard/instructor/course-management/create-new-course",
            )
          }
        >
          <PlusIcon className="h-4 w-4" />
          New Course
        </Button>
      </div>

      {draftCourses?.data?.length === 0 ? (
        <div className="bg-muted/20 rounded-md border py-12 text-center">
          <FilePenIcon className="text-muted-foreground mx-auto h-12 w-12" />
          <h3 className="mt-4 text-lg font-medium">No draft courses</h3>
          <p className="text-muted-foreground mt-2">
            You don&lsquo;t have any draft courses. Start by creating a new
            course to get started.
          </p>
          <Button
            className="mt-4"
            onClick={() =>
              router.push(
                "/dashboard/instructor/course-management/create-new-course",
              )
            }
          >
            Create Your First Course
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
            {draftCourses?.data?.map((course) => (
              <TableRow key={course.id}>
                <TableCell className="font-medium">
                  <div>
                    <div>{course.name}</div>
                    <div className="text-muted-foreground max-w-[250px] truncate text-sm">
                      {course.description}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {course.categories.map((category: Category, i: number) => (
                      <Badge key={i} variant="outline" className="capitalize">
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{course.classLimit || "Unlimited"}</TableCell>
                <TableCell>
                  {course.updated_date
                    ? formatDate(course.updated_date)
                    : course.created_date}
                </TableCell>
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
                      <DropdownMenuItem onClick={() => handleEdit(course.id!)}>
                        <PenIcon className="focus:text-primary-foreground mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleView(course.id!)}>
                        <EyeIcon className="focus:text-primary-foreground mr-2 h-4 w-4" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setCourseToDelete(course.id!)}
                      >
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

      <AlertDialog
        open={courseToDelete !== null}
        onOpenChange={(open) => !open && setCourseToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this draft course. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
