import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CheckCircle, Clock, Users, Video } from "lucide-react"
import Link from "next/link"

const course = {
  name: "Introduction to Web Development",
  description:
    "A comprehensive course covering the basics of HTML, CSS, and JavaScript, designed to take you from a complete beginner to a capable front-end developer.",
  categories: [{ name: "Web Development" }, { name: "Beginner" }],
  classLimit: 50,
  instructor: {
    name: "John Doe",
    title: "Senior Web Developer",
  },
  lessons: [
    {
      title: "Module 1: Getting Started with HTML",
      lectures: [
        { title: "Introduction to HTML", duration: "15 mins" },
        { title: "HTML Tags and Attributes", duration: "25 mins" },
        { title: "Creating Your First Web Page", duration: "30 mins" },
      ],
    },
    {
      title: "Module 2: Styling with CSS",
      lectures: [
        { title: "Introduction to CSS", duration: "20 mins" },
        { title: "Selectors and Properties", duration: "35 mins" },
        { title: "The Box Model", duration: "25 mins" },
      ],
    },
    {
      title: "Module 3: Interactive JavaScript",
      lectures: [
        { title: "Introduction to JavaScript", duration: "30 mins" },
        { title: "Variables, Data Types, and Functions", duration: "40 mins" },
        { title: "DOM Manipulation", duration: "45 mins" },
      ],
    },
  ],
  whatYouWillLearn: [
    "Build a complete website from scratch.",
    "Understand the core concepts of web development.",
    "Style web pages with modern CSS techniques.",
    "Add interactivity to your websites with JavaScript.",
  ],
}

export default function CoursePreviewPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">{course.name}</h1>
        <p className="text-muted-foreground text-lg">{course.description}</p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Categories:</span>
          {course.categories.map((category, i) => (
            <Badge key={i} variant="outline">
              {category.name}
            </Badge>
          ))}
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
                {course.whatYouWillLearn.map((item, i) => (
                  <li key={i} className="flex items-start">
                    <CheckCircle className="mt-1 mr-2 h-4 w-4 text-green-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Course Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {course.lessons.map((lesson, i) => (
                  <div key={i}>
                    <h3 className="font-semibold">{lesson.title}</h3>
                    <ul className="mt-2 space-y-2">
                      {lesson.lectures.map((lecture, j) => (
                        <li key={j} className="flex items-center">
                          <Video className="mr-2 h-4 w-4" />
                          <span>{lecture.title}</span>
                          <span className="text-muted-foreground ml-auto text-sm">
                            {lecture.duration}
                          </span>
                        </li>
                      ))}
                    </ul>
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
              <CardDescription>by {course.instructor.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                <span>
                  {course.classLimit === 0
                    ? "Unlimited"
                    : `Up to ${course.classLimit} students`}
                </span>
              </div>
              <div className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                <span>Approx. 4 hours to complete</span>
              </div>
              <Button size="lg" className="w-full">
                Enroll Now
              </Button>
              <Button size="lg" variant="outline" className="w-full" asChild>
                <Link href="/dashboard/instructor/course-management/create-new-course">
                  Edit Course
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
