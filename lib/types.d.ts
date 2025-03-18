export type ApiResponse<T> = {
  success: boolean
  data: T
  message: string
  error?: Record<string, unknown>
}

export type ApiResponseWithPagination<T> = {
  success: boolean
  data: ApiPagination<T>
  message: string
  error?: Record<string, unknown>
}

export type ApiPagination<T> = {
  content: T[]
  metadata: PageMetadata
  links: PageLinks
}

export type PageMetadata = {
  first: boolean
  hasNext: boolean
  hasPrevious: boolean
  last: boolean
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
}

export type PageLinks = {
  first?: string
  last?: string
  next?: string
  previous?: string
  self?: string
}

export type PagedResponseTemplate<T> = {
  data: T[]
  page: number
  size: number
  totalPages: number
  status: number
  message: string
}

export interface ResponseTemplate<T> {
  data: T
  status: number
  message: string
  errors?: Record<string, string>
  timestamp: string
}
