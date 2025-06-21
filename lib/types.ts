import { z } from "zod"

export type UserDomain =
  | "student"
  | "instructor"
  | "admin"
  | "organisation_user"

export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
  error?: any
}

export interface PageMetadata {
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
  first: boolean
  last: boolean
}

export interface PagedData<T> {
  content: T[]
  metadata: PageMetadata
}

export interface ApiResponseWithPagination<T>
  extends ApiResponse<PagedData<T>> {}
