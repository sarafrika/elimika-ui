"use client"

import { useParams } from "next/navigation"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, Users, Video } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const cls = {
  uuid: "c1o2u3r4-5s6e-7d8a-9t10-abcdefghijkl",
  name: "Advanced Java Programming - July Cohort",
  description: "A focused class for mastering enterprise Java patterns with hands-on support.",
  instructor: {
    name: "Jane Doe",
    title: "Senior Java Instructor",
  },
  class_limit: 25,
  duration_hours: 2,
  duration_minutes: 0,
  total_duration_display: "2 hours 0 minutes",
  thumbnail_url: "https://cdn.sarafrika.com/courses/java-advanced-thumb.jpg",
  banner_url: "https://cdn.sarafrika.com/courses/java-advanced-banner.jpg",
  intro_video_url: "https://cdn.sarafrika.com/courses/java-advanced-intro.mp4",
  objectives: [
    "Understand Java design patterns and when to use them",
    "Work with Spring Boot and Hibernate",
    "Build RESTful APIs and deploy Java apps",
  ],
  lessons: [
    {
      title: "Enterprise Java Basics",
      duration_display: "2 hours",
      description: "Covers JDBC, DAO patterns, and Java EE intro",
    },
    {
      title: "Spring Boot Deep Dive",
      duration_display: "3 hours",
      description: "Configuration, REST APIs, and Dependency Injection",
    },
    {
      title: "Working with Hibernate",
      duration_display: "2.5 hours",
      description: "Entity mapping, lazy loading, and transactions",
    },
  ],
}

export default function ClassPreviewPage() {
  const params = useParams()
  const classId = params?.id
  console.log(classId)

  return (
    <div className="mx-auto mb-10 max-w-5xl space-y-10 sm:p-4">
      {/* Banner */}
      {cls.banner_url && (
        <div className="overflow-hidden rounded-md shadow-md">
          <Image src={cls.banner_url} alt={`${cls.name} banner`} className="h-64 w-full bg-stone-200 object-cover" />
        </div>
      )}

      {/* Header section */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">{cls.name}</h1>
        <p className="text-muted-foreground text-lg">{cls.description}</p>
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <span>Instructor:</span>
          <Badge variant="outline">{cls.instructor.name}</Badge>
          <span className="text-xs text-gray-500">({cls.instructor.title})</span>
        </div>
      </div>

      {/* Right column - no card, clean layout */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <span className="font-medium">Class Size:</span>
          <span className="flex items-center gap-1">
            <Users className="h-5 w-5 text-gray-600" />
            {cls.class_limit === 0 ? "Unlimited students" : `Up to ${cls.class_limit} students`}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-700">
          <span className="font-medium">Duration:</span>
          <span className="flex items-center gap-1">
            <Clock className="h-5 w-5 text-gray-600" />
            Approx. {cls.total_duration_display}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="col-span-1 space-y-6 md:col-span-3">
        {/* Objectives */}
        <Card>
          <CardHeader>
            <CardTitle>What You’ll Learn</CardTitle>
            <CardDescription>Key learning outcomes of this class</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-1 gap-2">
              {cls.objectives.map((item, i) => (
                <li key={i} className="flex items-start">
                  <CheckCircle className="mt-1 mr-2 h-4 w-4 text-green-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Lessons */}
        <Card>
          <CardHeader>
            <CardTitle>Class Content</CardTitle>
            <CardDescription>A breakdown of lessons in this class</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {cls.lessons.map((lesson, i) => (
                <div key={i} className="border-b pb-4 last:border-none last:pb-0">
                  <h3 className="flex items-center gap-2 text-base font-semibold">
                    <Video className="h-4 w-4 text-blue-500" />
                    {lesson.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">{lesson.description}</p>
                  <Badge className="mt-1" variant="secondary">
                    {lesson.duration_display}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
