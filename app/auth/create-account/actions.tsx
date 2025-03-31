"use server"

import { getEnvironmentVariable } from "@/lib/utils"
import { ApiResponse, ApiResponseWithPagination } from "@/lib/types"
import { User } from "@/app/auth/create-account/_components/user-account-form"
import { TrainingCenter } from "@/app/auth/create-account/_components/training-center-form"
import { UserDomain } from "@/context/auth-provider"

const DEFAULT_PAGE_SIZE = 10
const EVERY_THIRTY_MINUTES = 60 * 30 // 1,800 seconds
const BASE_URL = getEnvironmentVariable("NEXT_PUBLIC_API_URL")

export async function createOrUpdateUser(user: User, userDomain: UserDomain) {
  try {
    const headers = new Headers()
    headers.set("Content-Type", "application/json")

    const url = `${BASE_URL}/users${user.uuid ? "/" + user.uuid : ""}?user_domain=${userDomain}`

    const response = await fetch(url, {
      method: user.uuid ? "PUT" : "POST",
      headers,
      body: JSON.stringify(user),
    })

    return response.json()
  } catch (error) {
    console.error("Error occured while creating or updating user", error)
    throw new Error("Something went wrong while creating or updating user")
  }
}

export async function fetchUsers(page: number = 0, searchParams?: string) {
  try {
    const headers = new Headers()
    headers.set("Content-Type", "application/json")

    const paginationParams = new URLSearchParams({
      page: page.toString(),
      size: DEFAULT_PAGE_SIZE.toString(),
    })

    const endpoint = searchParams ? `/search?${searchParams}&` : `?`
    const url = `${BASE_URL}/users${endpoint}${paginationParams}`

    const response = await fetch(url, { headers })

    return (await response.json()) as ApiResponseWithPagination<User>
  } catch (error) {
    console.error("Error fetching users:", error)
    throw new Error(
      "Something went wrong while fetching users. Please contact support.",
    )
  }
}

export async function fetchTrainingCenters(page: number, params?: string) {
  try {
    const headers = new Headers()

    const paginationParams = new URLSearchParams({
      page: page.toString(),
      size: DEFAULT_PAGE_SIZE.toString(),
    })

    const endpoint = params ? `/search?${params}&` : `?`
    const url = `${BASE_URL}/organisations${endpoint}${paginationParams}`

    const response = await fetch(url, { headers })

    return (await response.json()) as ApiResponseWithPagination<TrainingCenter>
  } catch (error) {
    console.error("Error fetching training centers:", error)
    throw new Error(
      "Something went wrong while fetching training centers. Please contact support.",
    )
  }
}

export async function fetchTrainingCenter(trainingCenterId: string) {
  try {
    const headers = new Headers()

    const response = await fetch(
      `${BASE_URL}/organisations/${trainingCenterId}`,
      {
        headers,
        next: { revalidate: EVERY_THIRTY_MINUTES },
      },
    )

    return (await response.json()) as ApiResponse<TrainingCenter>
  } catch (error) {
    console.error("Error fetching training centers:", error)
    throw new Error(
      "Something went wrong while fetching training centers. Please contact support.",
    )
  }
}

export async function createOrUpdateTrainingCenter(
  trainingCenter: TrainingCenter,
) {
  try {
    const headers = new Headers()
    headers.set("Content-Type", "application/json")

    const response = await fetch(
      `${BASE_URL}/organisations${trainingCenter.uuid ? "/" + trainingCenter.uuid : ""}`,
      {
        method: trainingCenter.uuid ? "PUT" : "POST",
        headers,
        body: JSON.stringify(trainingCenter),
      },
    )

    return (await response.json()) as ApiResponse<TrainingCenter>
  } catch (error) {
    console.error("Error creating or updating training center:", error)
    throw new Error(
      "Something went wrong while persisting training center. Please contact support.",
    )
  }
}
