"use server"

import { getEnvironmentVariable } from "@/lib/utils"
import { Instructor } from "@/app/dashboard/instructor/profile/general/page"
import { ApiResponse, ApiResponseWithPagination } from "@/lib/types"

const BASE_URL = getEnvironmentVariable("NEXT_PUBLIC_API_URL")
const DEFAULT_PAGE_SIZE = "10"

export async function createInstructorProfile(instructor: Instructor) {
  try {
    const headers = new Headers()
    headers.set("Content-Type", "application/json")

    const response = await fetch(`${BASE_URL}/instructors`, {
      method: "POST",
      headers,
      body: JSON.stringify(instructor),
    })

    return (await response.json()) as ApiResponse<Instructor>
  } catch (error) {
    console.error("Error creating instructor profile:", error)
    throw new Error(
      "Something went wrong while creating instructor profile. Please contact support.",
    )
  }
}

export async function fetchInstructorProfile(
  page: number = 0,
  searchParams?: string,
) {
  try {
    const headers = new Headers()
    headers.set("Content-Type", "application/json")

    const paginationParams = new URLSearchParams({
      page: page.toString(),
      size: DEFAULT_PAGE_SIZE,
    })

    const endpoint = searchParams ? `/search?${searchParams}&` : `?`
    const url = `${BASE_URL}/instructors${endpoint}${paginationParams}`

    const response = await fetch(url, { headers })

    return (await response.json()) as ApiResponseWithPagination<Instructor>
  } catch (error) {
    console.error("Error fetching instructor profile:", error)
    throw new Error(
      "Something went wrong while fetching instructor profile. Please contact support.",
    )
  }
}
