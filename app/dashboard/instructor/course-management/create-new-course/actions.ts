"use server"

import { getEnvironmentVariable } from "@/lib/utils"
import { PagedResponseTemplate, ResponseTemplate } from "@/lib/types"
import {
  Category, Course
} from "@/app/dashboard/instructor/course-management/create-new-course/_components/course-creation-form"
import {
  Lesson
} from "@/app/dashboard/instructor/course-management/create-new-course/_components/lesson-management-form"

const BASE_URL = getEnvironmentVariable("NEXT_PUBLIC_API_URL")

export async function fetchCourseCategories(params?: string) {
  try {
    const headers = new Headers()
    headers.set("Content-Type", "application/json")

    const response = await fetch(`${BASE_URL}/categories${params ? `?${params}` : ""}`, { headers })

    return (await response.json()) as PagedResponseTemplate<Category>
  } catch (error) {
    console.error("Error fetching categories:", error)
    throw new Error(
      "Something went wrong while fetching categories. Please contact support."
    )
  }
}

export async function createCourse(course: Course) {
  try {
    const formData = new FormData()

    formData.append("thumbnail", course.thumbnail)

    const { thumbnail, ...courseData } = course

    formData.append(
      "course",
      new Blob([JSON.stringify(courseData)], {
        type: "application/json"
      })
    )

    const response = await fetch(`${BASE_URL}/courses`, {
      method: "POST",
      body: formData
    })

    return (await response.json()) as ResponseTemplate<Course>
  } catch (error) {
    console.error("Error creating or updating course:", error)
    throw new Error(
      "Something went wrong while creating or updating course. Please contact support."
    )
  }
}

export async function createLesson(courseId: number, lesson: Lesson, files: { [key: number]: File }) {
  try {
    const formData = new FormData()

    formData.append(
      "lesson",
      new Blob(
        [
          JSON.stringify({
            ...lesson,
            content: lesson.content.map((content, index) => ({
              ...content,
              contentText:
                content.contentType === "Text"
                  ? content.contentText
                  : undefined,
              contentUrl: files[index] ? undefined : content.contentUrl
            }))
          })
        ],
        {
          type: "application/json"
        }
      )
    )

    Object.entries(files).forEach(([_, file]) => {
      formData.append("files", file)
    })

    const response = await fetch(`${BASE_URL}/courses/${courseId}/lessons`, { method: "POST", body: formData })

    return (await response.json()) as ResponseTemplate<Lesson>
  } catch (error) {
    console.error("Error creating lesson:", error)
    throw new Error("Something went wrong while creating lesson. Please contact support.")
  }
}