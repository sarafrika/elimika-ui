"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Clock, Users, Video } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

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

const data = {
  success: true,
  data: {
    uuid: "c1o2u3r4-5s6e-7d8a-9t10-abcdefghijkl",
    name: "Advanced Java Programming",
    description: "Comprehensive course covering advanced Java concepts and enterprise development",
    category_uuid: "c1a2t3e4-5g6o-7r8y-9a10-abcdefghijkl",
    instructor_uuid: "i1s2t3r4-5u6c-7t8o-9r10-abcdefghijkl",
    difficulty_uuid: "d1i2f3f4-5i6c-7u8l-9t10-abcdefghijkl",
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
  message: "string",
  error: {},
}

const courseLesson = {
  success: true,
  data: {
    content: [
      {
        uuid: "l1e2s3s4-5o6n-7d8a-9t10-abcdefghijkl",
        course_uuid: "c1o2u3r4-5s6e-7d8a-9t10-abcdefghijkl",
        lesson_number: 3,
        title: "Object-Oriented Programming Fundamentals",
        duration_hours: 2,
        duration_minutes: 30,
        description: "Introduction to OOP concepts including classes, objects, inheritance, and polymorphism",
        learning_objectives: "Understand OOP principles, implement classes and objects, apply inheritance concepts",
        status: "PUBLISHED",
        active: true,
        created_date: "2024-04-01T12:00:00",
        created_by: "instructor@sarafrika.com",
        updated_date: "2024-04-15T15:30:00",
        updated_by: "instructor@sarafrika.com",
        duration_display: "2 hours 30 minutes",
        is_published: true,
        lesson_sequence: "Lesson 3",
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

export default function CoursePreviewPage() {
  const params = useParams()
  const courseId = params?.id

  // const { data: courseDetail } = tanstackClient.useQuery("get", "/api/v1/courses/{courseId}", {
  //   params: {
  //     path: {
  //       courseId: courseId,
  //     },
  //   },
  //   onSuccess: (data: any) => {
  //     if (data.success) {
  //       toast.success("Course details fetched successfully")
  //     } else {
  //       toast.error(data.message || "Failed to fetch course details")
  //     }
  //   },
  // })
  // const course = data?.data

  //   const { data: courseLessons } = tanstackClient.useQuery("get", "/api/v1/courses/{courseId}/lessons", {
  //   params: {
  //     path: {
  //       courseId: courseId,
  //     },
  //     query: {
  //       pageable: {}
  //     }
  //   },

  // })

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
  const course = data?.data
  const lessons = courseLesson?.data

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">{course.name}</h1>
        <p className="text-muted-foreground text-lg">{course.description}</p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Categories:</span>
          {/* {course.categories.map((category, i) => (
            <Badge key={i} variant="outline">
              {category.name}
            </Badge>
          ))} */}
          <Badge variant="outline">xxxxxx</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="col-span-1 space-y-6 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>What You&apos;ll Learn</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {/* {course.whatYouWillLearn.map((item, i) => (
                  <li key={i} className="flex items-start">
                    <CheckCircle className="mt-1 mr-2 h-4 w-4 text-green-500" />
                    <span>{item}</span>
                  </li>
                ))} */}
                <span>xxxx xxxx xxxx xxxxx</span>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Course Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lessons?.content.map((lesson, i) => (
                  <div key={i}>
                    <h3 className="font-semibold">{lesson.title}</h3>
                    {/* <ul className="mt-2 space-y-2">
                      {lesson.lectures.map((lecture, j) => (
                        <li key={j} className="flex items-center">
                          <Video className="mr-2 h-4 w-4" />
                          <span>{lecture.title}</span>
                          <span className="text-muted-foreground ml-auto text-sm">{lecture.duration}</span>
                        </li>
                      ))}
                    </ul> */}
                    <p>xxx xxxx xxxx xxxx</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Course Details</CardTitle>
              {/* <CardDescription>by {course.instructor.name}</CardDescription> */}
              <CardDescription>by Instructor name here</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                <span>{course.class_limit === 0 ? "Unlimited" : `Up to ${course.class_limit} students`}</span>
              </div>
              <div className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                <span>Approx. {course?.total_duration_display} to complete</span>
              </div>
              <Button size="lg" className="w-full">
                Enroll Now
              </Button>
              <Button size="lg" variant="outline" className="w-full" asChild>
                <Link href="/dashboard/course-management/create-new-course">Edit Course</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
