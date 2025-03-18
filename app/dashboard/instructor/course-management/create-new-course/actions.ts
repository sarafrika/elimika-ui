"use server"

import { getEnvironmentVariable } from "@/lib/utils"
import { PagedResponseTemplate, ResponseTemplate } from "@/lib/types"
import {
  Category, Course
} from "@/app/dashboard/instructor/course-management/create-new-course/_components/course-creation-form"

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