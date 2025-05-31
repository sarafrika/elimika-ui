import * as ApiTypes from "@/api-client"

// Create global ambient declarations
declare global {
  // Re-export all model types from the API as global types
  // This makes them available without import statements
  type AnswerOptionResponseDTO = ApiTypes.AnswerOptionResponseDTO
  type ApiResponseListPermissionDTO = ApiTypes.ApiResponseListPermissionDTO
  type ApiResponseListRoleDTO = ApiTypes.ApiResponseListRoleDTO
  type ApiResponseOrganisationDTO = ApiTypes.ApiResponseOrganisationDTO
  type ApiResponsePagedDTOInstructor = ApiTypes.ApiResponsePagedDTOInstructor
  type ApiResponsePagedDTOOrganisationDTO =
    ApiTypes.ApiResponsePagedDTOOrganisationDTO
  type ApiResponsePagedDTORoleDTO = ApiTypes.ApiResponsePagedDTORoleDTO
  type ApiResponsePagedDTOStudent = ApiTypes.ApiResponsePagedDTOStudent
  type ApiResponsePagedDTOTrainingSessionDTO =
    ApiTypes.ApiResponsePagedDTOTrainingSessionDTO
  type ApiResponsePagedDTOUser = ApiTypes.ApiResponsePagedDTOUser
  type ApiResponsePagedDTOUserGroupDTO =
    ApiTypes.ApiResponsePagedDTOUserGroupDTO
  type ApiResponseRoleDTO = ApiTypes.ApiResponseRoleDTO
  type ApiResponseTrainingSessionDTO = ApiTypes.ApiResponseTrainingSessionDTO
  type ApiResponseUser = ApiTypes.ApiResponseUser
  type ApiResponseUserGroupDTO = ApiTypes.ApiResponseUserGroupDTO
  type ApiResponseVoid = ApiTypes.ApiResponseVoid
  type AssessmentResponseDTO = ApiTypes.AssessmentResponseDTO
  type CategoryRequestDTO = ApiTypes.CategoryRequestDTO
  type CategoryResponseDTO = ApiTypes.CategoryResponseDTO
  type CourseLearningObjectiveResponseDTO =
    ApiTypes.CourseLearningObjectiveResponseDTO
  type CourseRequestDTO = ApiTypes.CourseRequestDTO
  type CourseResponseDTO = ApiTypes.CourseResponseDTO
  type CreateAnswerOptionRequestDTO = ApiTypes.CreateAnswerOptionRequestDTO
  type CreateAssessmentRequestDTO = ApiTypes.CreateAssessmentRequestDTO
  type CreateCategoryRequestDTO = ApiTypes.CreateCategoryRequestDTO
  type CreateCourseLearningObjectiveRequestDTO =
    ApiTypes.CreateCourseLearningObjectiveRequestDTO
  type CreateCourseRequestDTO = ApiTypes.CreateCourseRequestDTO
  type CreateLessonContentDTO = ApiTypes.CreateLessonContentDTO
  type CreateLessonRequestDTO = ApiTypes.CreateLessonRequestDTO
  type CreateLessonResourceRequestDTO = ApiTypes.CreateLessonResourceRequestDTO
  type CreatePrerequisiteGroupRequestDTO =
    ApiTypes.CreatePrerequisiteGroupRequestDTO
  type CreatePrerequisiteRequestDTO = ApiTypes.CreatePrerequisiteRequestDTO
  type CreatePrerequisiteTypeRequestDTO =
    ApiTypes.CreatePrerequisiteTypeRequestDTO
  type CreateQuestionRequestDTO = ApiTypes.CreateQuestionRequestDTO
  type Instructor = ApiTypes.Instructor
  type LessonContentResponseDTO = ApiTypes.LessonContentResponseDTO
  type LessonResourceResponseDTO = ApiTypes.LessonResourceResponseDTO
  type LessonResponseDTO = ApiTypes.LessonResponseDTO
  type OrganisationDTO = ApiTypes.OrganisationDTO
  type Page = ApiTypes.Page
  type Pageable = ApiTypes.Pageable
  type PageableObject = ApiTypes.PageableObject
  type PagedDTOInstructor = ApiTypes.PagedDTOInstructor
  type PagedDTOOrganisationDTO = ApiTypes.PagedDTOOrganisationDTO
  type PagedDTORoleDTO = ApiTypes.PagedDTORoleDTO
  type PagedDTOStudent = ApiTypes.PagedDTOStudent
  type PagedDTOTrainingSessionDTO = ApiTypes.PagedDTOTrainingSessionDTO
  type PagedDTOUser = ApiTypes.PagedDTOUser
  type PagedDTOUserGroupDTO = ApiTypes.PagedDTOUserGroupDTO
  type PageLinks = ApiTypes.PageLinks
  type PageMetadata = ApiTypes.PageMetadata
  type PermissionDTO = ApiTypes.PermissionDTO
  type PrerequisiteRequestDTO = ApiTypes.PrerequisiteRequestDTO
  type PrerequisiteResponseDTO = ApiTypes.PrerequisiteResponseDTO
  type PrerequisiteTypeResponseDTO = ApiTypes.PrerequisiteTypeResponseDTO
  type PricingRequestDTO = ApiTypes.PricingRequestDTO
  type PricingResponseDTO = ApiTypes.PricingResponseDTO
  type ProfessionalBodyDTO = ApiTypes.ProfessionalBodyDTO
  type QuestionResponseDTO = ApiTypes.QuestionResponseDTO
  type ResponseDTOAssessmentResponseDTO =
    ApiTypes.ResponseDTOAssessmentResponseDTO
  type ResponseDTOCategoryResponseDTO = ApiTypes.ResponseDTOCategoryResponseDTO
  type ResponseDTOCourseResponseDTO = ApiTypes.ResponseDTOCourseResponseDTO
  type ResponseDTOLessonResponseDTO = ApiTypes.ResponseDTOLessonResponseDTO
  type ResponseDTOQuestionResponseDTO = ApiTypes.ResponseDTOQuestionResponseDTO
  type ResponseDTOVoid = ApiTypes.ResponseDTOVoid
  type ResponsePageableDTOAssessmentResponseDTO =
    ApiTypes.ResponsePageableDTOAssessmentResponseDTO
  type ResponsePageableDTOCategoryResponseDTO =
    ApiTypes.ResponsePageableDTOCategoryResponseDTO
  type ResponsePageableDTOCourseResponseDTO =
    ApiTypes.ResponsePageableDTOCourseResponseDTO
  type ResponsePageableDTOLessonResponseDTO =
    ApiTypes.ResponsePageableDTOLessonResponseDTO
  type ResponsePageableDTOPrerequisiteResponseDTO =
    ApiTypes.ResponsePageableDTOPrerequisiteResponseDTO
  type ResponsePageableDTOPrerequisiteTypeResponseDTO =
    ApiTypes.ResponsePageableDTOPrerequisiteTypeResponseDTO
  type ResponsePageableDTOQuestionResponseDTO =
    ApiTypes.ResponsePageableDTOQuestionResponseDTO
  type RoleDTO = ApiTypes.RoleDTO
  type SortObject = ApiTypes.SortObject
  type Student = ApiTypes.Student
  type TrainingExperienceDTO = ApiTypes.TrainingExperienceDTO
  type TrainingSessionDTO = ApiTypes.TrainingSessionDTO
  type UpdateAnswerOptionRequestDTO = ApiTypes.UpdateAnswerOptionRequestDTO
  type UpdateAssessmentRequestDTO = ApiTypes.UpdateAssessmentRequestDTO
  type UpdateCategoryRequestDTO = ApiTypes.UpdateCategoryRequestDTO
  type UpdateCourseCategoryRequestDTO = ApiTypes.UpdateCourseCategoryRequestDTO
  type UpdateCourseLearningObjectiveRequestDTO =
    ApiTypes.UpdateCourseLearningObjectiveRequestDTO
  type UpdateCourseRequestDTO = ApiTypes.UpdateCourseRequestDTO
  type UpdateLessonRequestDTO = ApiTypes.UpdateLessonRequestDTO
  type UpdatePrerequisiteGroupRequestDTO =
    ApiTypes.UpdatePrerequisiteGroupRequestDTO
  type UpdatePrerequisiteRequestDTO = ApiTypes.UpdatePrerequisiteRequestDTO
  type UpdateQuestionRequestDTO = ApiTypes.UpdateQuestionRequestDTO
  type User = ApiTypes.User
  type UserCertificationDTO = ApiTypes.UserCertificationDTO
  type UserGroupDTO = ApiTypes.UserGroupDTO

  // Backward compatibility aliases for renamed types
  type InstructorDTO = Instructor
  type StudentDTO = Student
  type UserDTO = User
  type ApiResponseUserDTO = ApiResponseUser
  type ApiResponsePagedDTOInstructorDTO = ApiResponsePagedDTOInstructor
  type ApiResponsePagedDTOStudentDTO = ApiResponsePagedDTOStudent
  type ApiResponsePagedDTOUserDTO = ApiResponsePagedDTOUser
  type PagedDTOInstructorDTO = PagedDTOInstructor
  type PagedDTOStudentDTO = PagedDTOStudent
  type PagedDTOUserDTO = PagedDTOUser
}

// This export is needed to make TypeScript treat this as a module
export {}
