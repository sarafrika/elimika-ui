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

export type ApiResponseWithPagination<T> = ApiResponse<PagedData<T>>
