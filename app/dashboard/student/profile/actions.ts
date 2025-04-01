"use server"

import { ApiResponse, ApiResponseWithPagination } from "@/lib/types"
import { getEnvironmentVariable } from "@/lib/utils"
import { Student } from "./general/page"

const BASE_URL = getEnvironmentVariable("NEXT_PUBLIC_API_URL")
const DEFAULT_PAGE_SIZE = "10"

export async function createStudentProfile(student: Student) {
  try {
    const headers = new Headers()
    headers.set("Content-Type", "application/json")

    const response = await fetch(`${BASE_URL}/students`, {
      method: "POST",
      headers,
      body: JSON.stringify(student),
    })

    return (await response.json()) as ApiResponse<Student>
  } catch (error) {
    console.error("Error creating student profile:", error)
    throw new Error(
      "Something went wrong while creating student profile. Please contact support.",
    )
  }
}

export async function fetchStudents(page: number = 0, searchParams?: string) {
  try {
    const headers = new Headers()
    headers.set("Content-Type", "application/json")

    const paginationParams = new URLSearchParams({
      page: page.toString(),
      size: DEFAULT_PAGE_SIZE.toString(),
    })

    const endpoint = searchParams ? `/search?${searchParams}&` : `?`
    const url = `${BASE_URL}/students${endpoint}${paginationParams}`

    const response = await fetch(url, { headers })

    return (await response.json()) as ApiResponseWithPagination<Student>
  } catch (error) {
    console.error("Error fetching students:", error)
    throw new Error(
      "Something went wrong while fetching students. Please contact support.",
    )
  }
}
