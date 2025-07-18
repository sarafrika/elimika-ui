"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Spinner from "@/components/ui/spinner"
import { tanstackClient } from "@/services/api/tanstack-client"
import { CheckCircle, Clock, Users, Video } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { toast } from "sonner"

// const course = {
//   name: "Introduction to Web Development",
//   description:
//     "A comprehensive course covering the basics of HTML, CSS, and JavaScript, designed to take you from a complete beginner to a capable front-end developer.",
//   categories: [{ name: "Web Development" }, { name: "Beginner" }],
//   classLimit: 50,
//   instructor: {
//     name: "John Doe",
//     title: "Senior Web Developer",
//   },
//   lessons: [
//     {
//       title: "Module 1: Getting Started with HTML",
//       lectures: [
//         { title: "Introduction to HTML", duration: "15 mins" },
//         { title: "HTML Tags and Attributes", duration: "25 mins" },
//         { title: "Creating Your First Web Page", duration: "30 mins" },
//       ],
//     },
//     {
//       title: "Module 2: Styling with CSS",
//       lectures: [
//         { title: "Introduction to CSS", duration: "20 mins" },
//         { title: "Selectors and Properties", duration: "35 mins" },
//         { title: "The Box Model", duration: "25 mins" },
//       ],
//     },
//     {
//       title: "Module 3: Interactive JavaScript",
//       lectures: [
//         { title: "Introduction to JavaScript", duration: "30 mins" },
//         { title: "Variables, Data Types, and Functions", duration: "40 mins" },
//         { title: "DOM Manipulation", duration: "45 mins" },
//       ],
//     },
//   ],
//   whatYouWillLearn: [
//     "Build a complete website from scratch.",
//     "Understand the core concepts of web development.",
//     "Style web pages with modern CSS techniques.",
//     "Add interactivity to your websites with JavaScript.",
//   ],
// }

export default function CoursePreviewPage() {
  const params = useParams()
  const courseId = params?.id

  const { data: courseDetail, isLoading } = tanstackClient.useQuery("get", "/api/v1/courses/{courseId}", {
    params: { path: { courseId: courseId as string } },
    onSuccess: (data: any) => {
      if (data.success) {
        toast.success("Course details fetched successfully")
      } else {
        toast.error(data.message || "Failed to fetch course details")
      }
    },
  })
  const course = courseDetail?.data

  const { data: instructorDetail } = tanstackClient.useQuery("get", "/api/v1/instructors/{uuid}", {
    // @ts-ignore
    params: { path: { uuid: course?.instructor_uuid as string } },
  })

  const { data: category } = tanstackClient.useQuery("get", "/api/v1/config/categories/{uuid}", {
    // @ts-ignore
    params: { path: { uuid: course?.category_uuid as string } },
  })

  const { data: courseLessons } = tanstackClient.useQuery("get", "/api/v1/courses/{courseId}/lessons", {
    //@ts-ignore
    params: { path: { courseId: courseId }, query: { pageable: {} } },
  })

  // const { data: courseCategory } = tanstackClient.useQuery("get", "/api/v1/courses/category/{categoryUuid}", {
  //   params: {
  //     path: {
  //       categoryId: course?.category_uuid,
  //     },
  //     query: {
  //       categoryId: course?.category_uuid,
  //     }
  //   },
  // })

  if (isLoading)
    return (
      <div className="mt-10 flex items-center justify-center">
        <Spinner />
      </div>
    )

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">{course?.name}</h1>
        <p className="text-muted-foreground text-lg">{course?.description}</p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Categories:</span>
          {/* {course.categories.map((category, i) => (
            <Badge key={i} variant="outline">
              {category.name}
            </Badge>
          ))} */}
          {/* @ts-ignore */}
          <Badge variant="outline">{category?.data?.name}</Badge>
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
                    <CheckCircle className="mt-[2px] h-4 w-4 text-green-500" />
                  </span>
                  {/* @ts-ignore */}
                  <span>{course?.objectives}</span>
                </li>
              </ul>
            </CardContent>

            <CardHeader>
              <CardTitle>Course Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h3 className="font-semibold">Lessons</h3>

                {/* @ts-ignore */}
                {courseLessons?.data?.content
                  ?.slice() // create a copy so you don't mutate original data
                  ?.sort((a: any, b: any) => a.lesson_number - b.lesson_number)
                  ?.map((lesson: any, i: any) => (
                    <div key={i}>
                      <h3 className="font-semibold">{lesson.title}</h3>
                      <h3 className="font-semibold">{lesson.description}</h3>
                      {/* <ul className="mt-2 space-y-2">
                      {lesson.lectures.map((lecture, j) => (
                        <li key={j} className="flex items-center">
                          <Video className="mr-2 h-4 w-4" />
                          <span>{lecture.title}</span>
                          <span className="text-muted-foreground ml-auto text-sm">{lecture.duration}</span>
                        </li>
                      ))}
                    </ul> */}
                      <h3 className="font-semibold">{lesson.duration_display}</h3>
                    </div>
                  ))}
              </div>
            </CardContent>

            <div className="flex max-w-[300px] flex-col gap-2 self-end">
              <CardHeader className="flex gap-2">
                <CardTitle>Course Details</CardTitle>
                {/* @ts-ignore */}
                <CardDescription>by {instructorDetail?.data?.full_name}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  {/* @ts-ignore */}
                  <span>{course?.classLimit === 0 ? "Unlimited" : `Up to ${course?.class_limit} students`}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  {/* @ts-ignore */}
                  <span>Approx. {course?.total_duration_display} to complete</span>
                </div>
                <Button size="lg" className="w-full">
                  Enroll Now
                </Button>
                <Button size="lg" variant="outline" className="w-full" asChild>
                  <Link href={`/dashboard/course-management/create-new-course?id=${courseId}`}>Edit Course</Link>
                </Button>
              </CardContent>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
