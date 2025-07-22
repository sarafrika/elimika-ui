"use client"

import { toast } from "sonner"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import Spinner from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { DialogTitle } from "@radix-ui/react-dialog"
import { useParams, useRouter } from "next/navigation"
import { useInstructor } from "@/context/instructor-context"
import { useBreadcrumb } from "@/context/breadcrumb-provider"
import { tanstackClient } from "@/services/api/tanstack-client"
import { CheckCircle, Clock, Users, Video } from "lucide-react"
import RichTextRenderer from "@/components/editors/richTextRenders"
import HTMLTextPreview from "@/components/editors/html-text-preview"
import { Dialog, DialogContent, DialogHeader, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function CoursePreviewPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params?.id
  const instructor = useInstructor()

  const { replaceBreadcrumbs } = useBreadcrumb()
  useEffect(() => {
    replaceBreadcrumbs([
      { id: "dashboard", title: "Dashboard", url: "/dashboard/overview" },
      { id: "course-management", title: "Course-management", url: "/dashboard/course-management/drafts" },
      {
        id: "preview",
        title: "Preview",
        url: `/dashboard/course-management/preview/${courseId}`,
        isLast: true,
      },
    ])
  }, [replaceBreadcrumbs, courseId])

  const [open, setOpen] = useState(false)
  const handleConfirm = () => {
    router.push(`/dashboard/course-management/create-new-course?id=${courseId}`)
  }

  const { data: courseDetail, isLoading } = tanstackClient.useQuery("get", "/api/v1/courses/{uuid}", {
    params: { path: { uuid: courseId as string } },
    onSuccess: (data: any) => {
      toast.success(data?.message)
    },
  })
  const course = courseDetail?.data

  const { data: courseLessons } = tanstackClient.useQuery("get", "/api/v1/courses/{courseUuid}/lessons", {
    params: { path: { courseUuid: courseId as string }, query: { pageable: {} } },
  })

  if (isLoading)
    return (
      <div className="mt-10 flex items-center justify-center">
        <Spinner />
      </div>
    )

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight md:max-w-[90%]">{course?.name}</h1>
        <div className="px-4 py-4">
          <HTMLTextPreview htmlContent={course?.description as string} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Categories:</span>
          {course?.category_names?.map((i: any) => (
            <Badge key={i} variant="outline">
              {i}
            </Badge>
          ))}
        </div>
      </div>

      <div className="">
        <div className="col-span-1 space-y-6 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>What You&apos;ll Learn</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-1">
                <li className="flex items-start gap-2">
                  <span className="min-h-4 min-w-4">
                    🎯
                    {/* <CheckCircle className="mt-1 h-4 w-4 text-green-500" /> */}
                  </span>
                  <div className="-mt-[43px]">
                    <HTMLTextPreview htmlContent={course?.objectives as string} />
                  </div>
                </li>
              </ul>
            </CardContent>

            <CardHeader className="mt-4">
              <CardTitle>Course Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="-mt-2 flex flex-col gap-2 space-y-4">
                {courseLessons?.data?.content
                  ?.slice()
                  ?.sort((a: any, b: any) => a.lesson_number - b.lesson_number)
                  ?.map((lesson: any, i: any) => (
                    <div key={i} className="flex flex-col gap-2">
                      <h3 className="font-semibold">{lesson.title}</h3>
                      <RichTextRenderer htmlString={(lesson?.description as string) || "No lesson provided"} />

                      {/* <ul className="mt-2 space-y-2">
                      {lesson.lectures.map((lecture, j) => (
                        <li key={j} className="flex items-center">
                          <Video className="mr-2 h-4 w-4" />
                          <span>{lecture.title}</span>
                          <span className="text-muted-foreground ml-auto text-sm">{lecture.duration}</span>
                        </li>
                      ))}
                    </ul> */}

                      <h3 className="font-semibold">
                        <span>📅 Duration:</span> {lesson.duration_display}
                      </h3>
                    </div>
                  ))}
              </div>
            </CardContent>

            <div className="mt-4 flex max-w-[300px] flex-col gap-2 self-end">
              <CardHeader className="flex gap-2">
                <CardTitle>Course Details</CardTitle>
                <CardDescription>by {instructor?.full_name}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-2">
                <div className="flex items-center">
                  <Users className="mr-2 h-4 w-4" />
                  <span>{course?.class_limit === 0 ? "Unlimited" : `Up to ${course?.class_limit} students`}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  <span>Approx. {course?.total_duration_display} to complete</span>
                </div>

                <Button size="lg" className="mt-4 w-full">
                  Enroll Now
                </Button>
                <Button size="lg" variant="outline" className="w-full" onClick={() => setOpen(true)}>
                  Edit Course
                </Button>

                {/* Modal */}
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogContent className="sm:max-w-md">
                    <DialogTitle />
                    <DialogHeader>
                      <h3 className="text-xl font-semibold text-gray-900">Edit Course</h3>
                      <p className="text-sm text-gray-500">Are you sure you want to edit this course?</p>
                    </DialogHeader>

                    <div className="mt-4 space-y-3 text-sm text-gray-700">
                      <p>
                        This action will <strong>unpublish</strong> the course. You&apos;`ll need to re-publish it after
                        making your changes.
                      </p>
                      <p>
                        Any currently enrolled students will retain access, but the course will no longer be
                        discoverable publicly until it&apos;`s re-published.
                      </p>
                    </div>

                    <DialogFooter className="pt-6">
                      <Button variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
                        Cancel
                      </Button>
                      <Button onClick={handleConfirm} className="w-full sm:w-auto">
                        Confirm & Continue
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
