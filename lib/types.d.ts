export type UserDomain =
  | "student"
  | "instructor"
  | "organisation_user"
  | "admin"

export type UserProfile = {
  uuid?: string
  first_name: string
  last_name: string
  gender: "male" | "female" | "other" | "undisclosed"
  date_of_birth?: string
  phone_number?: string
  profile_image_url?: string
  bio?: string
  secondary_email?: string
  secondary_phone_number?: string
  national_id_no?: string
  passport_no?: string
}

export type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}

export type Page<T> = {
  content: T[]
  pageable: {
    pageNumber: number
    pageSize: number
    sort: {
      empty: boolean
      sorted: boolean
      unsorted: boolean
    }
    offset: number
    paged: boolean
    unpaged: boolean
  }
  last: boolean
  totalPages: number
  totalElements: number
  size: number
  number: number
  sort: {
    empty: boolean
    sorted: boolean
    unsorted: boolean
  }
  first: boolean
  numberOfElements: number
  empty: boolean
}

export type ApiResponseWithPagination<T> = {
  success: boolean
  message: string
  data: Page<T>
}
