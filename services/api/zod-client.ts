import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";




const User = z.object({ uuid: z.string().uuid().optional(), first_name: z.string().min(0).max(50), middle_name: z.string().min(0).max(50).optional(), last_name: z.string().min(0).max(50), email: z.string().min(0).max(100).email(), username: z.string().min(0).max(50), dob: z.date().optional(), phone_number: z.string().min(0).max(20).regex(/^(\+254|0)?[17]\d{8}$/), active: z.boolean().default(true), keycloak_id: z.string().min(0).max(255).optional(), gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).optional(), user_domain: z.array(z.unknown()).optional(), profile_image_url: z.string().url().optional(), created_date: z.string().datetime({ offset: true }).optional(), updated_date: z.string().datetime({ offset: true }).optional(), created_by: z.string().optional(), updated_by: z.string().optional(), display_name: z.string().optional(), full_name: z.string().optional() }).passthrough();
const ApiResponseUser = z.object({ success: z.boolean(), data: User, message: z.string(), error: z.object({}).partial().passthrough() }).partial().passthrough();
const TrainingBranch = z.object({ uuid: z.string().uuid().optional(), organisation_uuid: z.string().uuid(), branch_name: z.string().min(0).max(200), address: z.string().optional(), poc_user_uuid: z.string().uuid().optional(), active: z.boolean().default(true), created_date: z.string().datetime({ offset: true }).optional(), updated_date: z.string().datetime({ offset: true }).optional() }).passthrough();
const Student = z.object({ uuid: z.string().uuid().optional(), user_uuid: z.string().uuid(), first_guardian_name: z.string().min(0).max(100).optional(), first_guardian_mobile: z.string().min(0).max(20).optional(), second_guardian_name: z.string().min(0).max(100).optional(), second_guardian_mobile: z.string().min(0).max(20).optional(), secondaryGuardianContact: z.string().optional(), primaryGuardianContact: z.string().optional(), allGuardianContacts: z.array(z.string()).optional(), created_date: z.string().datetime({ offset: true }).optional(), created_by: z.string().optional(), updated_date: z.string().datetime({ offset: true }).optional(), updated_by: z.string().optional() }).passthrough();
const Quiz = z.object({ uuid: z.string().uuid().optional(), lesson_uuid: z.string().uuid(), title: z.string().min(0).max(255), description: z.string().min(0).max(1000).optional(), instructions: z.string().min(0).max(1000).optional(), time_limit_minutes: z.number().int().gte(1).optional(), attempts_allowed: z.number().int().gte(1), passing_score: z.number().gte(0).lte(100), rubric_uuid: z.string().uuid().optional(), status: z.enum(["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"]), active: z.boolean().optional(), created_date: z.string().datetime({ offset: true }).optional(), created_by: z.string().optional(), updated_date: z.string().datetime({ offset: true }).optional(), updated_by: z.string().optional(), is_published: z.boolean().optional(), time_limit_display: z.string().optional(), is_timed: z.boolean().optional(), has_multiple_attempts: z.boolean().optional() }).passthrough();
const QuizQuestion = z.object({ uuid: z.string().uuid().optional(), quiz_uuid: z.string().uuid(), question_text: z.string().min(0).max(2000), question_type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", "ESSAY"]), points: z.number().gte(0.01), display_order: z.number().int().gte(1), created_date: z.string().datetime({ offset: true }).optional(), created_by: z.string().optional(), updated_date: z.string().datetime({ offset: true }).optional(), updated_by: z.string().optional(), requires_options: z.boolean().optional(), question_category: z.string().optional(), points_display: z.string().optional(), question_number: z.string().optional() }).passthrough();
const QuizQuestionOption = z.object({ uuid: z.string().uuid().optional(), question_uuid: z.string().uuid(), option_text: z.string().min(0).max(1000), is_correct: z.boolean().optional(), display_order: z.number().int().gte(1).optional(), created_date: z.string().datetime({ offset: true }).optional(), created_by: z.string().optional(), updated_date: z.string().datetime({ offset: true }).optional(), updated_by: z.string().optional(), option_category: z.string().optional(), is_incorrect: z.boolean().optional(), position_display: z.string().optional(), correctness_status: z.string().optional(), option_summary: z.string().optional() }).passthrough();
const ProgramRequirement = z.object({ uuid: z.string().uuid().optional(), program_uuid: z.string().uuid(), requirement_type: z.enum(["STUDENT", "TRAINING_CENTER", "INSTRUCTOR"]), requirement_text: z.string().min(0).max(2000), is_mandatory: z.boolean().optional(), created_date: z.string().datetime({ offset: true }).optional(), created_by: z.string().optional(), updated_date: z.string().datetime({ offset: true }).optional(), updated_by: z.string().optional(), is_optional: z.boolean().optional(), requirement_category: z.string().optional(), requirement_priority: z.string().optional(), compliance_level: z.string().optional(), requirement_summary: z.string().optional() }).passthrough();
const ProgramCourse = z.object({ uuid: z.string().uuid().optional(), program_uuid: z.string().uuid(), course_uuid: z.string().uuid(), sequence_order: z.number().int().gte(1).optional(), is_required: z.boolean().optional(), prerequisite_course_uuid: z.string().uuid().optional(), created_date: z.string().datetime({ offset: true }).optional(), created_by: z.string().optional(), updated_date: z.string().datetime({ offset: true }).optional(), updated_by: z.string().optional(), association_category: z.string().optional(), has_prerequisites: z.boolean().optional(), sequence_display: z.string().optional(), requirement_status: z.string().optional(), curriculum_summary: z.string().optional() }).passthrough();
const Organisation = z.object({ uuid: z.string().uuid().optional(), name: z.string().min(0).max(50), description: z.string().optional(), active: z.boolean().default(true), code: z.string().optional(), licence_no: z.string().max(100).optional(), domain: z.string().max(255).optional(), user_uuid: z.string().uuid().optional(), location: z.string().max(200).optional(), country: z.string().max(100).optional(), created_date: z.string().datetime({ offset: true }).optional(), updated_date: z.string().datetime({ offset: true }).optional() }).passthrough();
const Instructor = z.object({ uuid: z.string().uuid().optional(), user_uuid: z.string().uuid(), latitude: z.number().gte(-90).lte(90).optional(), longitude: z.number().gte(-180).lte(180).optional(), website: z.string().min(0).max(255).regex(/^https?:\/\/.*/).url().optional(), bio: z.string().min(0).max(2000).optional(), professional_headline: z.string().min(0).max(150).optional(), full_name: z.string().optional(), admin_verified: z.boolean().optional(), created_date: z.string().datetime({ offset: true }).optional(), created_by: z.string().optional(), updated_date: z.string().datetime({ offset: true }).optional(), updated_by: z.string().optional(), has_location_coordinates: z.boolean().optional(), formatted_location: z.string().optional(), is_profile_complete: z.boolean().optional() }).passthrough();
const InstructorSkill = z.object({ uuid: z.string().uuid().optional(), instructor_uuid: z.string().uuid(), skill_name: z.string().min(0).max(100), proficiency_level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]), created_date: z.string().datetime({ offset: true }).optional(), created_by: z.string().optional(), updated_date: z.string().datetime({ offset: true }).optional(), updated_by: z.string().optional(), display_name: z.string().optional(), summary: z.string().optional(), proficiency_description: z.string().optional() }).passthrough();
const InstructorProfessionalMembership = z.object({ uuid: z.string().uuid().optional(), instructor_uuid: z.string().uuid(), organization_name: z.string().min(0).max(255), membership_number: z.string().min(0).max(100).optional(), start_date: z.string().optional(), end_date: z.string().optional(), is_active: z.boolean().optional(), created_date: z.string().datetime({ offset: true }).optional(), created_by: z.string().optional(), updated_date: z.string().datetime({ offset: true }).optional(), updated_by: z.string().optional(), is_valid: z.boolean().optional(), summary: z.string().optional(), membership_duration_months: z.number().int().optional(), formatted_duration: z.string().optional(), is_complete: z.boolean().optional(), membership_status: z.enum(["ACTIVE", "INACTIVE", "EXPIRED", "UNKNOWN"]).optional(), membership_period: z.string().optional(), is_long_standing_member: z.boolean().optional(), has_membership_number: z.boolean().optional(), organization_type: z.enum(["PROFESSIONAL_INSTITUTE", "CERTIFICATION_BODY", "INDUSTRY_ASSOCIATION", "ACADEMIC_SOCIETY", "TRADE_ORGANIZATION", "OTHER"]).optional(), years_of_membership: z.number().optional(), is_recent_membership: z.boolean().optional() }).passthrough();
const InstructorExperience = z.object({ uuid: z.string().uuid().optional(), instructor_uuid: z.string().uuid(), position: z.string().min(0).max(255), organization_name: z.string().min(0).max(255), responsibilities: z.string().min(0).max(2000).optional(), years_of_experience: z.number().gte(0).lte(50).optional(), start_date: z.string().optional(), end_date: z.string().optional(), is_current_position: z.boolean().optional(), created_date: z.string().datetime({ offset: true }).optional(), created_by: z.string().optional(), updated_date: z.string().datetime({ offset: true }).optional(), updated_by: z.string().optional(), summary: z.string().optional(), employment_period: z.string().optional(), is_long_term_position: z.boolean().optional(), has_responsibilities: z.boolean().optional(), experience_level: z.enum(["ENTRY", "JUNIOR", "MID", "SENIOR", "LEAD", "EXECUTIVE"]).optional(), is_recent_experience: z.boolean().optional(), calculated_years: z.number().optional(), duration_in_months: z.number().int().optional(), formatted_duration: z.string().optional(), is_complete: z.boolean().optional() }).passthrough();
const InstructorEducation = z.object({ uuid: z.string().uuid().optional(), instructor_uuid: z.string().uuid(), qualification: z.string().min(0).max(255), school_name: z.string().min(0).max(255), year_completed: z.number().int().gte(1950).lte(2030).optional(), certificate_number: z.string().min(0).max(100).optional(), created_date: z.string().datetime({ offset: true }).optional(), created_by: z.string().optional(), updated_date: z.string().datetime({ offset: true }).optional(), updated_by: z.string().optional(), full_description: z.string().optional(), is_recent_qualification: z.boolean().optional(), years_since_completion: z.number().int().optional(), education_level: z.enum(["CERTIFICATE", "DIPLOMA", "UNDERGRADUATE", "POSTGRADUATE", "DOCTORAL", "OTHER"]).optional(), has_certificate_number: z.boolean().optional(), formatted_completion: z.string().optional(), is_complete: z.boolean().optional() }).passthrough();
const InstructorDocument = z.object({ uuid: z.string().uuid().optional(), instructor_uuid: z.string().uuid(), document_type_uuid: z.string().uuid(), education_uuid: z.string().uuid().optional(), experience_uuid: z.string().uuid().optional(), membership_uuid: z.string().uuid().optional(), original_filename: z.string().min(0).max(255), title: z.string().min(0).max(255), description: z.string().min(0).max(2000).optional(), status: z.enum(["PENDING", "APPROVED", "REJECTED", "EXPIRED", "UNDER_REVIEW"]).optional(), expiry_date: z.string().optional(), stored_filename: z.string().optional(), file_path: z.string().optional(), file_size_bytes: z.number().int().gte(1).optional(), mime_type: z.string().optional(), file_hash: z.string().optional(), upload_date: z.string().datetime({ offset: true }).optional(), is_verified: z.boolean().optional(), verified_by: z.string().optional(), verified_at: z.string().datetime({ offset: true }).optional(), verification_notes: z.string().max(2000).optional(), created_date: z.string().datetime({ offset: true }).optional(), created_by: z.string().optional(), updated_date: z.string().datetime({ offset: true }).optional(), updated_by: z.string().optional(), is_expired: z.boolean().optional(), file_size_formatted: z.string().optional(), days_until_expiry: z.number().int().optional(), is_pending_verification: z.boolean().optional(), has_expiry_date: z.boolean().optional(), verification_status: z.enum(["VERIFIED", "PENDING", "REJECTED"]).optional() }).passthrough();
const Course = z.object({ uuid: z.string().uuid().optional(), name: z.string().min(0).max(255), instructor_uuid: z.string().uuid(), category_uuid: z.string().uuid().optional(), difficulty_uuid: z.string().uuid().optional(), description: z.string().min(0).max(2000).optional(), objectives: z.string().min(0).max(1000).optional(), prerequisites: z.string().min(0).max(1000).optional(), duration_hours: z.number().int().gte(0), duration_minutes: z.number().int().gte(0).lte(59), class_limit: z.number().int().gte(1).optional(), price: z.number().gte(0).optional(), age_lower_limit: z.number().int().gte(1).lte(120).optional(), age_upper_limit: z.number().int().gte(1).lte(120).optional(), thumbnail_url: z.string().min(0).max(500).url().optional(), intro_video_url: z.string().min(0).max(500).url().optional(), banner_url: z.string().min(0).max(500).url().optional(), status: z.enum(["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"]), active: z.boolean().optional(), created_date: z.string().datetime({ offset: true }).optional(), created_by: z.string().optional(), updated_date: z.string().datetime({ offset: true }).optional(), updated_by: z.string().optional(), is_free: z.boolean().optional(), is_published: z.boolean().optional(), total_duration_display: z.string().optional(), is_draft: z.boolean().optional() }).passthrough();
const CourseRequirement = z.object({ uuid: z.string().uuid().optional(), course_uuid: z.string().uuid(), requirement_type: z.enum(["STUDENT", "TRAINING_CENTER", "INSTRUCTOR"]), requirement_text: z.string().min(0).max(1000), is_mandatory: z.boolean().optional(), created_date: z.string().datetime({ offset: true }).optional(), created_by: z.string().optional(), updated_date: z.string().datetime({ offset: true }).optional(), updated_by: z.string().optional() }).passthrough();
const Lesson = z.object({ uuid: z.string().uuid().optional(), course_uuid: z.string().uuid(), lesson_number: z.number().int().gte(1), title: z.string().min(0).max(255), duration_hours: z.number().int().gte(0), duration_minutes: z.number().int().gte(0).lte(59), description: z.string().min(0).max(1000).optional(), learning_objectives: z.string().min(0).max(500).optional(), status: z.enum(["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"]), active: z.boolean().optional(), created_date: z.string().datetime({ offset: true }).optional(), created_by: z.string().optional(), updated_date: z.string().datetime({ offset: true }).optional(), updated_by: z.string().optional(), is_published: z.boolean().optional(), duration_display: z.string().optional(), lesson_sequence: z.string().optional() }).passthrough();
const LessonContent = z.object({ uuid: z.string().uuid().optional(), lesson_uuid: z.string().uuid(), content_type_uuid: z.string().uuid(), title: z.string().min(0).max(255), description: z.string().min(0).max(1000).optional(), content_text: z.string().optional(), file_url: z.string().min(0).max(500).url().optional(), display_order: z.number().int().gte(1), is_required: z.boolean().optional(), file_size_bytes: z.number().int().gte(0).optional(), mime_type: z.string().optional(), created_date: z.string().datetime({ offset: true }).optional(), created_by: z.string().optional(), updated_date: z.string().datetime({ offset: true }).optional(), updated_by: z.string().optional(), content_category: z.string().optional(), file_size_display: z.string().optional() }).passthrough();
const CourseAssessment = z.object({ uuid: z.string().uuid().optional(), course_uuid: z.string().uuid(), assessment_type: z.string().min(0).max(50), title: z.string().min(0).max(255), description: z.string().min(0).max(1000).optional(), weight_percentage: z.number().gte(0).lte(100), rubric_uuid: z.string().uuid().optional(), is_required: z.boolean().optional(), created_date: z.string().datetime({ offset: true }).optional(), created_by: z.string().optional(), updated_date: z.string().datetime({ offset: true }).optional(), updated_by: z.string().optional(), assessment_category: z.string().optional(), weight_display: z.string().optional(), is_major_assessment: z.boolean().optional(), contribution_level: z.string().optional() }).passthrough();
const GradingLevel = z.object({ uuid: z.string().uuid().optional(), name: z.string().min(0).max(50), points: z.number().int().gte(1).lte(10), level_order: z.number().int().gte(1).lte(10), created_date: z.string().datetime({ offset: true }).optional(), created_by: z.string().optional(), updated_date: z.string().datetime({ offset: true }).optional(), updated_by: z.string().optional(), grade_display: z.string().optional() }).passthrough();
const DifficultyLevel = z.object({ uuid: z.string().uuid().optional(), name: z.string().min(0).max(50), level_order: z.number().int().gte(1).lte(10), description: z.string().min(0).max(500).optional(), created_date: z.string().datetime({ offset: true }).optional(), created_by: z.string().optional(), updated_date: z.string().datetime({ offset: true }).optional(), updated_by: z.string().optional(), display_name: z.string().optional(), is_entry_level: z.boolean().optional() }).passthrough();
const ContentType = z.object({ uuid: z.string().uuid().optional(), name: z.string().min(0).max(50), mime_types: z.array(z.string()).min(1).max(2147483647), max_file_size_mb: z.number().int().gte(1).optional(), created_date: z.string().datetime({ offset: true }).optional(), created_by: z.string().optional(), updated_date: z.string().datetime({ offset: true }).optional(), updated_by: z.string().optional(), upload_category: z.string().optional(), is_media_type: z.boolean().optional(), supported_formats: z.string().optional(), size_limit_display: z.string().optional() }).passthrough();
const Category = z.object({ uuid: z.string().uuid().optional(), name: z.string().min(0).max(100), description: z.string().min(0).max(500).optional(), parent_uuid: z.string().uuid().optional(), is_active: z.boolean().optional(), created_date: z.string().datetime({ offset: true }).optional(), created_by: z.string().optional(), updated_date: z.string().datetime({ offset: true }).optional(), updated_by: z.string().optional(), is_root_category: z.boolean().optional(), category_path: z.string().optional() }).passthrough();
const Certificate = z.object({ uuid: z.string().uuid().optional(), student_uuid: z.string().uuid(), course_uuid: z.string().uuid().optional(), program_uuid: z.string().uuid().optional(), template_uuid: z.string().uuid(), completion_date: z.string().datetime({ offset: true }), final_grade: z.number().gte(0).lte(100).optional(), is_valid: z.boolean().optional(), certificate_number: z.string().optional(), issued_date: z.string().datetime({ offset: true }).optional(), certificate_url: z.string().url().optional(), revoked_at: z.string().datetime({ offset: true }).optional(), revoked_reason: z.string().optional(), created_date: z.string().datetime({ offset: true }).optional(), created_by: z.string().optional(), updated_date: z.string().datetime({ offset: true }).optional(), updated_by: z.string().optional(), certificate_type: z.string().optional(), is_downloadable: z.boolean().optional(), grade_letter: z.string().optional(), validity_status: z.string().optional() }).passthrough();
const CertificateTemplate = z.object({ uuid: z.string().uuid().optional(), name: z.string().min(0).max(255), template_type: z.enum(["COURSE_COMPLETION", "PARTICIPATION", "ACHIEVEMENT", "CUSTOM"]), template_html: z.string().min(0).max(20000).optional(), template_css: z.string().min(0).max(50000).optional(), background_image_url: z.string().min(0).max(500).optional(), active: z.boolean().optional(), created_date: z.string().datetime({ offset: true }).optional(), created_by: z.string().optional(), updated_date: z.string().datetime({ offset: true }).optional(), updated_by: z.string().optional(), design_complexity: z.string().optional() }).passthrough();
const Assignment = z.object({ uuid: z.string().uuid().optional(), lesson_uuid: z.string().uuid(), title: z.string().min(0).max(255), description: z.string().min(0).max(2000).optional(), instructions: z.string().min(0).max(5000).optional(), due_date: z.string().datetime({ offset: true }).optional(), max_points: z.number().gte(0).optional(), rubric_uuid: z.string().uuid().optional(), submission_types: z.array(z.string()).optional(), is_published: z.boolean().optional(), created_date: z.string().datetime({ offset: true }).optional(), created_by: z.string().optional(), updated_date: z.string().datetime({ offset: true }).optional(), updated_by: z.string().optional(), assignment_category: z.string().optional(), points_display: z.string().optional(), assignment_scope: z.string().optional(), submission_summary: z.string().optional() }).passthrough();
const pageable = z.object({ page: z.number().int().gte(0), size: z.number().int().gte(1), sort: z.array(z.string()) }).partial().passthrough();

export const schemas = {
	User,
	ApiResponseUser,
	TrainingBranch,
	Student,
	Quiz,
	QuizQuestion,
	QuizQuestionOption,
	ProgramRequirement,
	ProgramCourse,
	Organisation,
	Instructor,
	InstructorSkill,
	InstructorProfessionalMembership,
	InstructorExperience,
	InstructorEducation,
	InstructorDocument,
	Course,
	CourseRequirement,
	Lesson,
	LessonContent,
	CourseAssessment,
	GradingLevel,
	DifficultyLevel,
	ContentType,
	Category,
	Certificate,
	CertificateTemplate,
	Assignment,
	pageable,
};

const endpoints = makeApi([
	{
		method: "get",
		path: "/api/v1/assignments",
		alias: "getAllAssignments",
		description: `Retrieves paginated list of all assignments with filtering support.`,
		requestFormat: "json",
		parameters: [
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/assignments",
		alias: "createAssignment",
		description: `Creates a new assignment with default DRAFT status and inactive state.`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: Assignment
			},
		],
		response: z.void(),
		errors: [
			{
				status: 400,
				description: `Invalid request data`,
				schema: z.void()
			},
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/assignments/:assignmentUuid/analytics",
		alias: "getSubmissionAnalytics",
		description: `Returns analytics data for assignment submissions including category distribution.`,
		requestFormat: "json",
		parameters: [
			{
				name: "assignmentUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/assignments/:assignmentUuid/average-score",
		alias: "getAverageScore",
		description: `Returns the average score for all graded submissions of an assignment.`,
		requestFormat: "json",
		parameters: [
			{
				name: "assignmentUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/assignments/:assignmentUuid/high-performance",
		alias: "getHighPerformanceSubmissions",
		description: `Returns submissions with scores above 85%.`,
		requestFormat: "json",
		parameters: [
			{
				name: "assignmentUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/assignments/:assignmentUuid/submissions",
		alias: "getAssignmentSubmissions",
		description: `Retrieves all submissions for a specific assignment.`,
		requestFormat: "json",
		parameters: [
			{
				name: "assignmentUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/assignments/:assignmentUuid/submissions/:submissionUuid/grade",
		alias: "gradeSubmission",
		description: `Grades a student&#x27;s assignment submission with score and comments.`,
		requestFormat: "json",
		parameters: [
			{
				name: "assignmentUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "submissionUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "score",
				type: "Query",
				schema: z.number()
			},
			{
				name: "maxScore",
				type: "Query",
				schema: z.number()
			},
			{
				name: "comments",
				type: "Query",
				schema: z.string().optional()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/assignments/:assignmentUuid/submissions/:submissionUuid/return",
		alias: "returnSubmission",
		description: `Returns a submission to student with feedback for revision.`,
		requestFormat: "json",
		parameters: [
			{
				name: "assignmentUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "submissionUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "feedback",
				type: "Query",
				schema: z.string()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/assignments/:assignmentUuid/submit",
		alias: "submitAssignment",
		description: `Creates a new submission for an assignment by a student.`,
		requestFormat: "json",
		parameters: [
			{
				name: "assignmentUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "enrollmentUuid",
				type: "Query",
				schema: z.string().uuid()
			},
			{
				name: "content",
				type: "Query",
				schema: z.string()
			},
			{
				name: "fileUrls",
				type: "Query",
				schema: z.array(z.string()).optional()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/assignments/:uuid",
		alias: "getAssignmentByUuid",
		description: `Retrieves a complete assignment including submission statistics.`,
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Assignment not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "put",
		path: "/api/v1/assignments/:uuid",
		alias: "updateAssignment",
		description: `Updates an existing assignment with selective field updates.`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: Assignment
			},
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Assignment not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "delete",
		path: "/api/v1/assignments/:uuid",
		alias: "deleteAssignment",
		description: `Permanently removes an assignment and all associated submissions.`,
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Assignment not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/assignments/instructor/:instructorUuid/pending-grading",
		alias: "getPendingGrading",
		description: `Retrieves all submissions pending grading for a specific instructor.`,
		requestFormat: "json",
		parameters: [
			{
				name: "instructorUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/assignments/search",
		alias: "searchAssignments",
		description: `Advanced assignment search with flexible criteria and operators.

**Common Assignment Search Examples:**
- &#x60;title_like&#x3D;essay&#x60; - Assignments with &quot;essay&quot; in title
- &#x60;lessonUuid&#x3D;uuid&#x60; - Assignments for specific lesson
- &#x60;status&#x3D;PUBLISHED&#x60; - Only published assignments
- &#x60;active&#x3D;true&#x60; - Only active assignments
- &#x60;dueDate_gte&#x3D;2024-12-01T00:00:00&#x60; - Assignments due from Dec 1, 2024
- &#x60;maxPoints_gte&#x3D;50&#x60; - Assignments worth 50+ points
`,
		requestFormat: "json",
		parameters: [
			{
				name: "searchParams",
				type: "Query",
				schema: z.record(z.string())
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/assignments/submissions/search",
		alias: "searchSubmissions",
		description: `Search submissions across all assignments.

**Common Submission Search Examples:**
- &#x60;assignmentUuid&#x3D;uuid&#x60; - All submissions for specific assignment
- &#x60;enrollmentUuid&#x3D;uuid&#x60; - All submissions by specific student
- &#x60;status&#x3D;GRADED&#x60; - Only graded submissions
- &#x60;percentage_gte&#x3D;90&#x60; - Submissions with 90%+ score
- &#x60;submittedAt_gte&#x3D;2024-01-01T00:00:00&#x60; - Submissions from 2024
- &#x60;gradedByUuid&#x3D;uuid&#x60; - Submissions graded by specific instructor
`,
		requestFormat: "json",
		parameters: [
			{
				name: "searchParams",
				type: "Query",
				schema: z.record(z.string())
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/certificates",
		alias: "getAllCertificates",
		description: `Retrieves paginated list of all certificates with filtering support.`,
		requestFormat: "json",
		parameters: [
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/certificates",
		alias: "createCertificate",
		description: `Manually creates a certificate record with automatic number generation.`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: Certificate
			},
		],
		response: z.void(),
		errors: [
			{
				status: 400,
				description: `Invalid request data`,
				schema: z.void()
			},
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/certificates/:uuid",
		alias: "getCertificateByUuid",
		description: `Retrieves a complete certificate including computed properties and verification status.`,
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Certificate not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "put",
		path: "/api/v1/certificates/:uuid",
		alias: "updateCertificate",
		description: `Updates an existing certificate with selective field updates.`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: Certificate
			},
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Certificate not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "delete",
		path: "/api/v1/certificates/:uuid",
		alias: "deleteCertificate",
		description: `Permanently removes a certificate record.`,
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Certificate not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/certificates/:uuid/generate-url",
		alias: "generateCertificateUrl",
		description: `Generates and updates the downloadable URL for a certificate.`,
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "certificateUrl",
				type: "Query",
				schema: z.string()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/certificates/:uuid/revoke",
		alias: "revokeCertificate",
		description: `Revokes a certificate with reason, making it invalid.`,
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "reason",
				type: "Query",
				schema: z.string()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Certificate not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/certificates/course-certificates",
		alias: "getCourseCertificates",
		description: `Retrieves all certificates issued for course completions.`,
		requestFormat: "json",
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/certificates/generate/course",
		alias: "generateCourseCertificate",
		description: `Automatically generates a certificate upon course completion.`,
		requestFormat: "json",
		parameters: [
			{
				name: "studentUuid",
				type: "Query",
				schema: z.string().uuid()
			},
			{
				name: "courseUuid",
				type: "Query",
				schema: z.string().uuid()
			},
			{
				name: "finalGrade",
				type: "Query",
				schema: z.number()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 400,
				description: `Student not eligible for certificate`,
				schema: z.void()
			},
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/certificates/generate/program",
		alias: "generateProgramCertificate",
		description: `Automatically generates a certificate upon program completion.`,
		requestFormat: "json",
		parameters: [
			{
				name: "studentUuid",
				type: "Query",
				schema: z.string().uuid()
			},
			{
				name: "programUuid",
				type: "Query",
				schema: z.string().uuid()
			},
			{
				name: "finalGrade",
				type: "Query",
				schema: z.number()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 400,
				description: `Student not eligible for certificate`,
				schema: z.void()
			},
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/certificates/number/:certificateNumber",
		alias: "getCertificateByNumber",
		description: `Retrieves certificate details using certificate number for public verification.`,
		requestFormat: "json",
		parameters: [
			{
				name: "certificateNumber",
				type: "Path",
				schema: z.string()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/certificates/program-certificates",
		alias: "getProgramCertificates_1",
		description: `Retrieves all certificates issued for program completions.`,
		requestFormat: "json",
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/certificates/revoked",
		alias: "getRevokedCertificates",
		description: `Retrieves all revoked certificates for administrative review.`,
		requestFormat: "json",
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/certificates/search",
		alias: "searchCertificates",
		description: `Advanced certificate search with flexible criteria and operators.

**Common Certificate Search Examples:**
- &#x60;studentUuid&#x3D;uuid&#x60; - All certificates for specific student
- &#x60;courseUuid&#x3D;uuid&#x60; - All certificates for specific course
- &#x60;programUuid&#x3D;uuid&#x60; - All certificates for specific program
- &#x60;isValid&#x3D;true&#x60; - Only valid certificates
- &#x60;isValid&#x3D;false&#x60; - Only revoked certificates
- &#x60;finalGrade_gte&#x3D;85&#x60; - Certificates with grade 85%+
- &#x60;issuedDate_gte&#x3D;2024-01-01T00:00:00&#x60; - Certificates issued from 2024
- &#x60;certificateNumber_like&#x3D;CERT-2024&#x60; - Certificates from 2024

**Certificate Analytics Queries:**
- &#x60;courseUuid_noteq&#x3D;null&amp;isValid&#x3D;true&#x60; - Valid course certificates
- &#x60;programUuid_noteq&#x3D;null&amp;isValid&#x3D;true&#x60; - Valid program certificates
- &#x60;finalGrade_between&#x3D;80,100&amp;isValid&#x3D;true&#x60; - High-grade valid certificates
`,
		requestFormat: "json",
		parameters: [
			{
				name: "searchParams",
				type: "Query",
				schema: z.record(z.string())
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/certificates/student/:studentUuid",
		alias: "getStudentCertificates",
		description: `Retrieves all certificates earned by a specific student.`,
		requestFormat: "json",
		parameters: [
			{
				name: "studentUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/certificates/student/:studentUuid/downloadable",
		alias: "getDownloadableCertificates",
		description: `Retrieves all valid certificates available for download by a student.`,
		requestFormat: "json",
		parameters: [
			{
				name: "studentUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/certificates/templates",
		alias: "getCertificateTemplates",
		description: `Retrieves all available certificate templates.`,
		requestFormat: "json",
		parameters: [
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/certificates/templates",
		alias: "createCertificateTemplate",
		description: `Creates a new certificate template for generating certificates.`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: CertificateTemplate
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "put",
		path: "/api/v1/certificates/templates/:templateUuid",
		alias: "updateCertificateTemplate",
		description: `Updates an existing certificate template.`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: CertificateTemplate
			},
			{
				name: "templateUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "delete",
		path: "/api/v1/certificates/templates/:templateUuid",
		alias: "deleteCertificateTemplate",
		description: `Removes a certificate template.`,
		requestFormat: "json",
		parameters: [
			{
				name: "templateUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/certificates/templates/search",
		alias: "searchCertificateTemplates",
		description: `Search certificate templates with filtering.

**Common Template Search Examples:**
- &#x60;templateType&#x3D;COURSE&#x60; - Course certificate templates
- &#x60;templateType&#x3D;PROGRAM&#x60; - Program certificate templates
- &#x60;status&#x3D;PUBLISHED&#x60; - Published templates
- &#x60;active&#x3D;true&#x60; - Active templates
- &#x60;name_like&#x3D;modern&#x60; - Templates with &quot;modern&quot; in name
`,
		requestFormat: "json",
		parameters: [
			{
				name: "searchParams",
				type: "Query",
				schema: z.record(z.string())
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/certificates/verify/:certificateNumber",
		alias: "verifyCertificate",
		description: `Verifies the authenticity of a certificate using its certificate number.`,
		requestFormat: "json",
		parameters: [
			{
				name: "certificateNumber",
				type: "Path",
				schema: z.string()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/config/categories",
		alias: "getAllCategories",
		description: `Retrieves paginated list of all categories.`,
		requestFormat: "json",
		parameters: [
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/config/categories",
		alias: "createCategory",
		description: `Creates a new category for organizing courses and programs.`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: Category
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/config/categories/:parentUuid/subcategories",
		alias: "getSubCategories",
		description: `Retrieves all subcategories for a specific parent category.`,
		requestFormat: "json",
		parameters: [
			{
				name: "parentUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "put",
		path: "/api/v1/config/categories/:uuid",
		alias: "updateCategory",
		description: `Updates an existing category.`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: Category
			},
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "delete",
		path: "/api/v1/config/categories/:uuid",
		alias: "deleteCategory",
		description: `Removes a category if it has no subcategories or associated courses.`,
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/config/categories/root",
		alias: "getRootCategories",
		description: `Retrieves all top-level categories (no parent).`,
		requestFormat: "json",
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/config/categories/search",
		alias: "searchCategories",
		description: `Search categories with filtering options.

**Common Category Search Examples:**
- &#x60;name_like&#x3D;technology&#x60; - Categories with &quot;technology&quot; in name
- &#x60;parentUuid&#x3D;null&#x60; - Root categories only
- &#x60;parentUuid&#x3D;uuid&#x60; - Subcategories of specific parent
- &#x60;isActive&#x3D;true&#x60; - Only active categories
`,
		requestFormat: "json",
		parameters: [
			{
				name: "searchParams",
				type: "Query",
				schema: z.record(z.string())
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/config/content-types",
		alias: "getAllContentTypes",
		description: `Retrieves paginated list of all content types.`,
		requestFormat: "json",
		parameters: [
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/config/content-types",
		alias: "createContentType",
		description: `Creates a new content type for lesson content classification.`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: ContentType
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "put",
		path: "/api/v1/config/content-types/:uuid",
		alias: "updateContentType",
		description: `Updates an existing content type.`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: ContentType
			},
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "delete",
		path: "/api/v1/config/content-types/:uuid",
		alias: "deleteContentType",
		description: `Removes a content type if no lesson content is using it.`,
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/config/content-types/media",
		alias: "getMediaContentTypes",
		description: `Retrieves content types for media files (video, audio, images).`,
		requestFormat: "json",
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/config/content-types/mime-support/:mimeType",
		alias: "checkMimeTypeSupport",
		description: `Checks if a specific MIME type is supported by the system.`,
		requestFormat: "json",
		parameters: [
			{
				name: "mimeType",
				type: "Path",
				schema: z.string()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/config/content-types/search",
		alias: "searchContentTypes",
		description: `Search content types with filtering options.

**Common Content Type Search Examples:**
- &#x60;name_like&#x3D;video&#x60; - Content types with &quot;video&quot; in name
- &#x60;mimeTypes_like&#x3D;image/&#x60; - Image content types
- &#x60;maxFileSizeMb_gte&#x3D;100&#x60; - Large file content types
`,
		requestFormat: "json",
		parameters: [
			{
				name: "searchParams",
				type: "Query",
				schema: z.record(z.string())
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/config/difficulty-levels",
		alias: "getAllDifficultyLevels",
		description: `Retrieves all difficulty levels in order.`,
		requestFormat: "json",
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/config/difficulty-levels",
		alias: "createDifficultyLevel",
		description: `Creates a new difficulty level for course classification.`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: DifficultyLevel
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "put",
		path: "/api/v1/config/difficulty-levels/:uuid",
		alias: "updateDifficultyLevel",
		description: `Updates an existing difficulty level.`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: DifficultyLevel
			},
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "delete",
		path: "/api/v1/config/difficulty-levels/:uuid",
		alias: "deleteDifficultyLevel",
		description: `Removes a difficulty level if no courses are using it.`,
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/config/difficulty-levels/reorder",
		alias: "reorderDifficultyLevels",
		description: `Updates the order of difficulty levels.`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: z.array(z.string().uuid())
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/config/grading-levels",
		alias: "getAllGradingLevels",
		description: `Retrieves paginated list of all grading levels.`,
		requestFormat: "json",
		parameters: [
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/config/grading-levels",
		alias: "createGradingLevel",
		description: `Creates a new grading level for assessment scoring.`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: GradingLevel
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "put",
		path: "/api/v1/config/grading-levels/:uuid",
		alias: "updateGradingLevel",
		description: `Updates an existing grading level.`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: GradingLevel
			},
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "delete",
		path: "/api/v1/config/grading-levels/:uuid",
		alias: "deleteGradingLevel",
		description: `Removes a grading level.`,
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/courses",
		alias: "getAllCourses",
		description: `Retrieves paginated list of all courses with filtering support.`,
		requestFormat: "json",
		parameters: [
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/courses",
		alias: "createCourse",
		description: `Creates a new course with default DRAFT status and inactive state.`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: Course
			},
		],
		response: z.void(),
		errors: [
			{
				status: 400,
				description: `Invalid request data`,
				schema: z.void()
			},
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/courses/:courseUuid/assessments",
		alias: "getCourseAssessments",
		description: `Retrieves all assessments for a specific course.`,
		requestFormat: "json",
		parameters: [
			{
				name: "courseUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/courses/:courseUuid/assessments",
		alias: "addCourseAssessment",
		description: `Creates a new assessment for the course with optional rubric association.`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: CourseAssessment
			},
			{
				name: "courseUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "put",
		path: "/api/v1/courses/:courseUuid/assessments/:assessmentUuid",
		alias: "updateCourseAssessment",
		description: `Updates a specific assessment within a course.`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: CourseAssessment
			},
			{
				name: "courseUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "assessmentUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "delete",
		path: "/api/v1/courses/:courseUuid/assessments/:assessmentUuid",
		alias: "deleteCourseAssessment",
		description: `Removes an assessment from a course.`,
		requestFormat: "json",
		parameters: [
			{
				name: "courseUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "assessmentUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/courses/:courseUuid/completion-rate",
		alias: "getCourseCompletionRate",
		description: `Returns the completion rate percentage for a course.`,
		requestFormat: "json",
		parameters: [
			{
				name: "courseUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/courses/:courseUuid/enrollments",
		alias: "getCourseEnrollments",
		description: `Retrieves enrollment data for a specific course with analytics.`,
		requestFormat: "json",
		parameters: [
			{
				name: "courseUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/courses/:courseUuid/lessons",
		alias: "getCourseLessons",
		description: `Retrieves all lessons for a specific course in sequence order.`,
		requestFormat: "json",
		parameters: [
			{
				name: "courseUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/courses/:courseUuid/lessons",
		alias: "addCourseLesson",
		description: `Creates a new lesson associated with the specified course.`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: Lesson
			},
			{
				name: "courseUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "put",
		path: "/api/v1/courses/:courseUuid/lessons/:lessonUuid",
		alias: "updateCourseLesson",
		description: `Updates a specific lesson within a course.`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: Lesson
			},
			{
				name: "courseUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "lessonUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "delete",
		path: "/api/v1/courses/:courseUuid/lessons/:lessonUuid",
		alias: "deleteCourseLesson",
		description: `Removes a lesson from a course including all associated content.`,
		requestFormat: "json",
		parameters: [
			{
				name: "courseUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "lessonUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/courses/:courseUuid/lessons/:lessonUuid/content",
		alias: "getLessonContent",
		description: `Retrieves all content for a lesson in display order with computed properties.`,
		requestFormat: "json",
		parameters: [
			{
				name: "courseUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "lessonUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/courses/:courseUuid/lessons/:lessonUuid/content",
		alias: "addLessonContent",
		description: `Adds new content item to a specific lesson with automatic ordering.`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: LessonContent
			},
			{
				name: "courseUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "lessonUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "put",
		path: "/api/v1/courses/:courseUuid/lessons/:lessonUuid/content/:contentUuid",
		alias: "updateLessonContent",
		description: `Updates a specific content item within a lesson.`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: LessonContent
			},
			{
				name: "courseUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "lessonUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "contentUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "delete",
		path: "/api/v1/courses/:courseUuid/lessons/:lessonUuid/content/:contentUuid",
		alias: "deleteLessonContent",
		description: `Removes content from a lesson.`,
		requestFormat: "json",
		parameters: [
			{
				name: "courseUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "lessonUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "contentUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/courses/:courseUuid/lessons/:lessonUuid/content/reorder",
		alias: "reorderLessonContent",
		description: `Updates the display order of content items within a lesson.`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: z.array(z.string().uuid())
			},
			{
				name: "courseUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "lessonUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/courses/:courseUuid/requirements",
		alias: "getCourseRequirements",
		description: `Retrieves all requirements for a specific course.`,
		requestFormat: "json",
		parameters: [
			{
				name: "courseUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/courses/:courseUuid/requirements",
		alias: "addCourseRequirement",
		description: `Adds a new requirement or prerequisite to a course.`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: CourseRequirement
			},
			{
				name: "courseUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "put",
		path: "/api/v1/courses/:courseUuid/requirements/:requirementUuid",
		alias: "updateCourseRequirement",
		description: `Updates a specific requirement for a course.`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: CourseRequirement
			},
			{
				name: "courseUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "requirementUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "delete",
		path: "/api/v1/courses/:courseUuid/requirements/:requirementUuid",
		alias: "deleteCourseRequirement",
		description: `Removes a requirement from a course.`,
		requestFormat: "json",
		parameters: [
			{
				name: "courseUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "requirementUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/courses/:uuid",
		alias: "getCourseByUuid",
		description: `Retrieves a complete course profile including computed properties.`,
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Course not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "put",
		path: "/api/v1/courses/:uuid",
		alias: "updateCourse",
		description: `Updates an existing course with selective field updates.`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: Course
			},
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Course not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "delete",
		path: "/api/v1/courses/:uuid",
		alias: "deleteCourse",
		description: `Permanently removes a course and its associated data.`,
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Course not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/courses/:uuid/publish",
		alias: "publishCourse",
		description: `Publishes a course making it available for enrollment.`,
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 400,
				description: `Course not ready for publishing`,
				schema: z.void()
			},
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/courses/active",
		alias: "getActiveCourses",
		description: `Retrieves all currently active and published courses.`,
		requestFormat: "json",
		parameters: [
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/courses/assessments/search",
		alias: "searchAssessments",
		description: `Search assessments across all courses.

**Common Assessment Search Examples:**
- &#x60;courseUuid&#x3D;uuid&#x60; - All assessments for specific course
- &#x60;assessmentType&#x3D;QUIZ&#x60; - Only quiz assessments
- &#x60;isRequired&#x3D;true&#x60; - Only required assessments
- &#x60;weightPercentage_gte&#x3D;20&#x60; - Assessments worth 20% or more
`,
		requestFormat: "json",
		parameters: [
			{
				name: "searchParams",
				type: "Query",
				schema: z.record(z.string())
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/courses/category/:categoryUuid",
		alias: "getCoursesByCategory",
		description: `Retrieves all courses in a specific category.`,
		requestFormat: "json",
		parameters: [
			{
				name: "categoryUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/courses/content/search",
		alias: "searchLessonContent",
		description: `Search lesson content across all courses.

**Common Content Search Examples:**
- &#x60;lessonUuid&#x3D;uuid&#x60; - All content for specific lesson
- &#x60;contentTypeUuid&#x3D;uuid&#x60; - Content of specific type
- &#x60;isRequired&#x3D;true&#x60; - Only required content
- &#x60;title_like&#x3D;video&#x60; - Content with &quot;video&quot; in title
- &#x60;fileSizeBytes_gt&#x3D;1048576&#x60; - Files larger than 1MB
`,
		requestFormat: "json",
		parameters: [
			{
				name: "searchParams",
				type: "Query",
				schema: z.record(z.string())
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/courses/enrollments/search",
		alias: "searchEnrollments",
		description: `Search enrollment records across all courses.

**Common Enrollment Search Examples:**
- &#x60;courseUuid&#x3D;uuid&#x60; - All enrollments for specific course
- &#x60;studentUuid&#x3D;uuid&#x60; - All enrollments for specific student
- &#x60;status&#x3D;COMPLETED&#x60; - Only completed enrollments
- &#x60;progressPercentage_gte&#x3D;80&#x60; - Students with 80%+ progress
- &#x60;enrollmentDate_gte&#x3D;2024-01-01T00:00:00&#x60; - Enrollments from 2024
`,
		requestFormat: "json",
		parameters: [
			{
				name: "searchParams",
				type: "Query",
				schema: z.record(z.string())
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/courses/free",
		alias: "getFreeCourses",
		description: `Retrieves all courses available at no cost.`,
		requestFormat: "json",
		parameters: [
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/courses/instructor/:instructorUuid",
		alias: "getCoursesByInstructor",
		description: `Retrieves all courses created by a specific instructor.`,
		requestFormat: "json",
		parameters: [
			{
				name: "instructorUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/courses/lessons/search",
		alias: "searchLessons",
		description: `Search course lessons with advanced filtering.

**Common Lesson Search Examples:**
- &#x60;courseUuid&#x3D;uuid&#x60; - All lessons for specific course
- &#x60;status&#x3D;PUBLISHED&#x60; - Only published lessons
- &#x60;active&#x3D;true&#x60; - Only active lessons
- &#x60;lessonNumber_gte&#x3D;5&#x60; - Lessons from lesson 5 onwards
- &#x60;title_like&#x3D;introduction&#x60; - Lessons with &quot;introduction&quot; in title
- &#x60;durationHours_between&#x3D;1,3&#x60; - Lessons between 1-3 hours
`,
		requestFormat: "json",
		parameters: [
			{
				name: "searchParams",
				type: "Query",
				schema: z.record(z.string())
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/courses/published",
		alias: "getPublishedCourses",
		description: `Retrieves all published courses available for enrollment.`,
		requestFormat: "json",
		parameters: [
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/courses/requirements/search",
		alias: "searchRequirements",
		description: `Search course requirements and prerequisites.

**Common Requirement Search Examples:**
- &#x60;courseUuid&#x3D;uuid&#x60; - All requirements for specific course
- &#x60;requirementType&#x3D;PREREQUISITE&#x60; - Only prerequisites
- &#x60;isMandatory&#x3D;true&#x60; - Only mandatory requirements
- &#x60;requirementText_like&#x3D;experience&#x60; - Requirements mentioning &quot;experience&quot;
`,
		requestFormat: "json",
		parameters: [
			{
				name: "searchParams",
				type: "Query",
				schema: z.record(z.string())
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/courses/search",
		alias: "searchCourses",
		description: `Advanced course search with flexible criteria and operators.

**Common Course Search Examples:**
- &#x60;name_like&#x3D;javascript&#x60; - Courses with names containing &quot;javascript&quot;
- &#x60;status&#x3D;PUBLISHED&#x60; - Only published courses
- &#x60;active&#x3D;true&#x60; - Only active courses
- &#x60;status_in&#x3D;PUBLISHED,ACTIVE&#x60; - Published or active courses
- &#x60;price_lte&#x3D;100.00&#x60; - Courses priced at $100 or less
- &#x60;price&#x3D;null&#x60; - Free courses
- &#x60;instructorUuid&#x3D;uuid&#x60; - Courses by specific instructor
- &#x60;categoryUuid&#x3D;uuid&#x60; - Courses in specific category
- &#x60;difficultyUuid&#x3D;uuid&#x60; - Courses of specific difficulty level
- &#x60;durationHours_gte&#x3D;20&#x60; - Courses 20+ hours long
- &#x60;createdDate_gte&#x3D;2024-01-01T00:00:00&#x60; - Courses created after Jan 1, 2024

**Advanced Course Queries:**
- &#x60;status&#x3D;PUBLISHED&amp;active&#x3D;true&amp;price_lte&#x3D;50&#x60; - Published, active courses under $50
- &#x60;name_like&#x3D;python&amp;difficultyUuid&#x3D;beginner-uuid&#x60; - Beginner Python courses
- &#x60;instructorUuid&#x3D;uuid&amp;status&#x3D;PUBLISHED&#x60; - Published courses by specific instructor

For complete operator documentation, see the instructor search endpoint.
`,
		requestFormat: "json",
		parameters: [
			{
				name: "searchParams",
				type: "Query",
				schema: z.record(z.string())
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/instructors",
		alias: "getAllInstructors",
		description: `Fetches a paginated list of instructors.`,
		requestFormat: "json",
		parameters: [
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/instructors",
		alias: "createInstructor",
		description: `Saves a new instructor record in the system.`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: Instructor
			},
		],
		response: z.void(),
		errors: [
			{
				status: 400,
				description: `Invalid request data`,
				schema: z.void()
			},
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/instructors/:instructorUuid/documents",
		alias: "getInstructorDocuments",
		description: `Retrieves all documents for a specific instructor`,
		requestFormat: "json",
		parameters: [
			{
				name: "instructorUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/instructors/:instructorUuid/documents",
		alias: "addInstructorDocument",
		description: `Uploads and associates a document with an instructor`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: InstructorDocument
			},
			{
				name: "instructorUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "put",
		path: "/api/v1/instructors/:instructorUuid/documents/:documentUuid",
		alias: "updateInstructorDocument",
		description: `Updates a specific document`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: InstructorDocument
			},
			{
				name: "instructorUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "documentUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "delete",
		path: "/api/v1/instructors/:instructorUuid/documents/:documentUuid",
		alias: "deleteInstructorDocument",
		description: `Removes a document from an instructor`,
		requestFormat: "json",
		parameters: [
			{
				name: "instructorUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "documentUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/instructors/:instructorUuid/documents/:documentUuid/verify",
		alias: "verifyDocument",
		description: `Marks a document as verified`,
		requestFormat: "json",
		parameters: [
			{
				name: "instructorUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "documentUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "verifiedBy",
				type: "Query",
				schema: z.string()
			},
			{
				name: "verificationNotes",
				type: "Query",
				schema: z.string().optional()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/instructors/:instructorUuid/education",
		alias: "getInstructorEducation",
		description: `Retrieves all education records for a specific instructor`,
		requestFormat: "json",
		parameters: [
			{
				name: "instructorUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/instructors/:instructorUuid/education",
		alias: "addInstructorEducation",
		description: `Adds educational qualification to an instructor`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: InstructorEducation
			},
			{
				name: "instructorUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "put",
		path: "/api/v1/instructors/:instructorUuid/education/:educationUuid",
		alias: "updateInstructorEducation",
		description: `Updates a specific education record`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: InstructorEducation
			},
			{
				name: "instructorUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "educationUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "delete",
		path: "/api/v1/instructors/:instructorUuid/education/:educationUuid",
		alias: "deleteInstructorEducation",
		description: `Removes an education record from an instructor`,
		requestFormat: "json",
		parameters: [
			{
				name: "instructorUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "educationUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/instructors/:instructorUuid/experience",
		alias: "getInstructorExperience",
		description: `Retrieves all experience records for a specific instructor`,
		requestFormat: "json",
		parameters: [
			{
				name: "instructorUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/instructors/:instructorUuid/experience",
		alias: "addInstructorExperience",
		description: `Adds work experience to an instructor`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: InstructorExperience
			},
			{
				name: "instructorUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "put",
		path: "/api/v1/instructors/:instructorUuid/experience/:experienceUuid",
		alias: "updateInstructorExperience",
		description: `Updates a specific experience record`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: InstructorExperience
			},
			{
				name: "instructorUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "experienceUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "delete",
		path: "/api/v1/instructors/:instructorUuid/experience/:experienceUuid",
		alias: "deleteInstructorExperience",
		description: `Removes an experience record from an instructor`,
		requestFormat: "json",
		parameters: [
			{
				name: "instructorUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "experienceUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/instructors/:instructorUuid/memberships",
		alias: "getInstructorMemberships",
		description: `Retrieves all membership records for a specific instructor`,
		requestFormat: "json",
		parameters: [
			{
				name: "instructorUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/instructors/:instructorUuid/memberships",
		alias: "addInstructorMembership",
		description: `Adds professional membership to an instructor`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: InstructorProfessionalMembership
			},
			{
				name: "instructorUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "put",
		path: "/api/v1/instructors/:instructorUuid/memberships/:membershipUuid",
		alias: "updateInstructorMembership",
		description: `Updates a specific membership record`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: InstructorProfessionalMembership
			},
			{
				name: "instructorUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "membershipUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "delete",
		path: "/api/v1/instructors/:instructorUuid/memberships/:membershipUuid",
		alias: "deleteInstructorMembership",
		description: `Removes a membership record from an instructor`,
		requestFormat: "json",
		parameters: [
			{
				name: "instructorUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "membershipUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/instructors/:instructorUuid/skills",
		alias: "getInstructorSkills",
		description: `Retrieves all skills for a specific instructor`,
		requestFormat: "json",
		parameters: [
			{
				name: "instructorUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/instructors/:instructorUuid/skills",
		alias: "addInstructorSkill",
		description: `Adds a skill to an instructor`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: InstructorSkill
			},
			{
				name: "instructorUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "put",
		path: "/api/v1/instructors/:instructorUuid/skills/:skillUuid",
		alias: "updateInstructorSkill",
		description: `Updates a specific skill record`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: InstructorSkill
			},
			{
				name: "instructorUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "skillUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "delete",
		path: "/api/v1/instructors/:instructorUuid/skills/:skillUuid",
		alias: "deleteInstructorSkill",
		description: `Removes a skill from an instructor`,
		requestFormat: "json",
		parameters: [
			{
				name: "instructorUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "skillUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/instructors/:uuid",
		alias: "getInstructorByUuid",
		description: `Fetches an instructor by their UUID.`,
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Instructor not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "put",
		path: "/api/v1/instructors/:uuid",
		alias: "updateInstructor",
		description: `Updates an existing instructor record.`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: Instructor
			},
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Instructor not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "delete",
		path: "/api/v1/instructors/:uuid",
		alias: "deleteInstructor",
		description: `Removes an instructor record from the system.`,
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Instructor not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/instructors/documents/search",
		alias: "searchDocuments",
		description: `Search documents with flexible criteria using advanced operators.

**Common Document Search Examples:**
- &#x60;instructorUuid&#x3D;uuid&#x60; - All documents for specific instructor
- &#x60;isVerified&#x3D;false&#x60; - Unverified documents
- &#x60;status&#x3D;PENDING&#x60; - Documents with pending status
- &#x60;status_in&#x3D;APPROVED,VERIFIED&#x60; - Approved or verified documents
- &#x60;expiryDate_lte&#x3D;2025-12-31&#x60; - Documents expiring by end of 2025
- &#x60;mimeType_like&#x3D;pdf&#x60; - PDF documents
- &#x60;fileSizeBytes_gt&#x3D;1048576&#x60; - Files larger than 1MB
- &#x60;title_startswith&#x3D;Certificate&#x60; - Titles starting with &quot;Certificate&quot;
- &#x60;createdDate_between&#x3D;2024-01-01T00:00:00,2024-12-31T23:59:59&#x60; - Created in 2024

**Special Document Queries:**
- &#x60;isVerified&#x3D;false&amp;expiryDate_lte&#x3D;2025-12-31&#x60; - Unverified expiring documents
- &#x60;status_noteq&#x3D;EXPIRED&amp;expiryDate_lt&#x3D;2025-07-02&#x60; - Non-expired but overdue docs

For complete operator documentation, see the main search endpoint.
`,
		requestFormat: "json",
		parameters: [
			{
				name: "searchParams",
				type: "Query",
				schema: z.record(z.string())
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/instructors/education/search",
		alias: "searchEducation",
		description: `Search education records with flexible criteria.

**Common Education Search Examples:**
- &#x60;instructorUuid&#x3D;uuid&#x60; - All education for specific instructor
- &#x60;qualification_like&#x3D;degree&#x60; - Qualifications containing &quot;degree&quot;
- &#x60;schoolName_startswith&#x3D;University&#x60; - Schools starting with &quot;University&quot;
- &#x60;yearCompleted_gte&#x3D;2020&#x60; - Completed in 2020 or later
- &#x60;yearCompleted_between&#x3D;2015,2020&#x60; - Completed between 2015-2020
- &#x60;certificateNumber_noteq&#x3D;null&#x60; - Has certificate number

For complete operator documentation, see the main search endpoint.
`,
		requestFormat: "json",
		parameters: [
			{
				name: "searchParams",
				type: "Query",
				schema: z.record(z.string())
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/instructors/experience/search",
		alias: "searchExperience",
		description: `Search experience records with flexible criteria.

**Common Experience Search Examples:**
- &#x60;instructorUuid&#x3D;uuid&#x60; - All experience for specific instructor
- &#x60;isCurrentPosition&#x3D;true&#x60; - Current positions only
- &#x60;position_like&#x3D;manager&#x60; - Positions containing &quot;manager&quot;
- &#x60;organizationName_endswith&#x3D;Ltd&#x60; - Organizations ending with &quot;Ltd&quot;
- &#x60;yearsOfExperience_gte&#x3D;5&#x60; - 5+ years experience
- &#x60;startDate_gte&#x3D;2020-01-01&#x60; - Started in 2020 or later
- &#x60;endDate&#x3D;null&#x60; - Ongoing positions (no end date)
- &#x60;responsibilities_like&#x3D;team&#x60; - Responsibilities mentioning &quot;team&quot;

**Experience Analysis Queries:**
- &#x60;isCurrentPosition&#x3D;false&amp;endDate_gte&#x3D;2023-01-01&#x60; - Recent past positions
- &#x60;yearsOfExperience_between&#x3D;3,10&#x60; - Mid-level experience (3-10 years)

For complete operator documentation, see the main search endpoint.
`,
		requestFormat: "json",
		parameters: [
			{
				name: "searchParams",
				type: "Query",
				schema: z.record(z.string())
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/instructors/memberships/search",
		alias: "searchMemberships",
		description: `Search membership records with flexible criteria.

**Common Membership Search Examples:**
- &#x60;instructorUuid&#x3D;uuid&#x60; - All memberships for specific instructor
- &#x60;isActive&#x3D;true&#x60; - Active memberships only
- &#x60;organizationName_like&#x3D;professional&#x60; - Organizations with &quot;professional&quot; in name
- &#x60;startDate_gte&#x3D;2023-01-01&#x60; - Memberships started in 2023 or later
- &#x60;endDate&#x3D;null&#x60; - Ongoing memberships (no end date)
- &#x60;membershipNumber_startswith&#x3D;PRO&#x60; - Numbers starting with &quot;PRO&quot;

**Membership Analysis Queries:**
- &#x60;isActive&#x3D;true&amp;endDate&#x3D;null&#x60; - Currently active ongoing memberships
- &#x60;isActive&#x3D;false&amp;endDate_gte&#x3D;2024-01-01&#x60; - Recently expired memberships
- &#x60;startDate_between&#x3D;2020-01-01,2023-12-31&#x60; - Joined between 2020-2023

For complete operator documentation, see the main search endpoint.
`,
		requestFormat: "json",
		parameters: [
			{
				name: "searchParams",
				type: "Query",
				schema: z.record(z.string())
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/instructors/search",
		alias: "searchInstructors",
		description: ` Search for instructors using flexible criteria with advanced operators.
 
 **Basic Search:**
 - &#x60;field&#x3D;value&#x60; - Exact match (default operation)
 - &#x60;firstName&#x3D;John&#x60; - Find instructors with firstName exactly &quot;John&quot;
 
 **Comparison Operators:**
 - &#x60;field_gt&#x3D;value&#x60; - Greater than
 - &#x60;field_lt&#x3D;value&#x60; - Less than  
 - &#x60;field_gte&#x3D;value&#x60; - Greater than or equal
 - &#x60;field_lte&#x3D;value&#x60; - Less than or equal
 - &#x60;createdDate_gte&#x3D;2024-01-01T00:00:00&#x60; - Created after Jan 1, 2024
 
 **String Operations:**
 - &#x60;field_like&#x3D;value&#x60; - Contains (case-insensitive)
 - &#x60;field_startswith&#x3D;value&#x60; - Starts with (case-insensitive)  
 - &#x60;field_endswith&#x3D;value&#x60; - Ends with (case-insensitive)
 - &#x60;lastName_like&#x3D;smith&#x60; - Last name contains &quot;smith&quot;
 
 **List Operations:**
 - &#x60;field_in&#x3D;val1,val2,val3&#x60; - Field is in list
 - &#x60;field_notin&#x3D;val1,val2&#x60; - Field is not in list
 - &#x60;status_in&#x3D;ACTIVE,PENDING&#x60; - Status is either ACTIVE or PENDING
 
 **Negation:**
 - &#x60;field_noteq&#x3D;value&#x60; - Not equal to value
 - &#x60;isActive_noteq&#x3D;false&#x60; - Is not false (i.e., is true)
 
 **Range Operations:**
 - &#x60;field_between&#x3D;start,end&#x60; - Value between start and end (inclusive)
 - &#x60;createdDate_between&#x3D;2024-01-01T00:00:00,2024-12-31T23:59:59&#x60; - Created in 2024
 
 **Complex Operations:**
 - &#x60;field_notingroup&#x3D;relationshipField,groupId&#x60; - Not in specific group
 
 **Nested Field Access:**
 - &#x60;nestedObject.field&#x3D;value&#x60; - Search in nested objects
 
 **Supported Data Types:**
 - String, UUID, Boolean (true/false or 1/0), Integer, Long, Double, Float, BigDecimal
 - Date (YYYY-MM-DD), Timestamp, LocalDateTime (ISO format)
 
 **Examples:**
 - &#x60;/search?firstName_like&#x3D;john&amp;isActive&#x3D;true&amp;createdDate_gte&#x3D;2024-01-01T00:00:00&#x60;
 - &#x60;/search?experience_gt&#x3D;5&amp;status_in&#x3D;ACTIVE,VERIFIED&#x60;
 - &#x60;/search?email_endswith&#x3D;@company.com&amp;department_noteq&#x3D;IT&#x60;
 `,
		requestFormat: "json",
		parameters: [
			{
				name: "searchParams",
				type: "Query",
				schema: z.record(z.string())
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/instructors/skills/search",
		alias: "searchSkills",
		description: `Search skills with flexible criteria.

**Common Skills Search Examples:**
- &#x60;instructorUuid&#x3D;uuid&#x60; - All skills for specific instructor
- &#x60;skillName_like&#x3D;java&#x60; - Skills containing &quot;java&quot;
- &#x60;proficiencyLevel&#x3D;EXPERT&#x60; - Expert level skills only
- &#x60;proficiencyLevel_in&#x3D;ADVANCED,EXPERT&#x60; - Advanced or expert skills
- &#x60;skillName_startswith&#x3D;Data&#x60; - Skills starting with &quot;Data&quot;
- &#x60;proficiencyLevel_noteq&#x3D;BEGINNER&#x60; - Non-beginner skills

**Skills Analysis Queries:**
- &#x60;skillName_like&#x3D;programming&amp;proficiencyLevel_in&#x3D;ADVANCED,EXPERT&#x60; - Advanced programming skills
- &#x60;createdDate_gte&#x3D;2024-01-01&amp;proficiencyLevel&#x3D;EXPERT&#x60; - Recently added expert skills

**Proficiency Levels:** BEGINNER, INTERMEDIATE, ADVANCED, EXPERT

For complete operator documentation, see the main search endpoint.
`,
		requestFormat: "json",
		parameters: [
			{
				name: "searchParams",
				type: "Query",
				schema: z.record(z.string())
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "delete",
		path: "/api/v1/invitations/maintenance/cleanup",
		alias: "cleanupOldInvitations",
		description: `System maintenance endpoint to delete old invitations that are expired, declined, or cancelled. This helps maintain database cleanliness by removing old invitation records.`,
		requestFormat: "json",
		parameters: [
			{
				name: "daysOld",
				type: "Query",
				schema: z.number().int().optional().default(90)
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/invitations/maintenance/mark-expired",
		alias: "markExpiredInvitations",
		description: `System maintenance endpoint to mark all expired pending invitations as expired. This is typically called by scheduled jobs to clean up expired invitations.`,
		requestFormat: "json",
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/invitations/maintenance/send-reminders",
		alias: "sendExpiryReminders",
		description: `System maintenance endpoint to send reminder emails for invitations expiring soon. This is typically called by scheduled jobs to notify recipients about expiring invitations.`,
		requestFormat: "json",
		parameters: [
			{
				name: "hoursBeforeExpiry",
				type: "Query",
				schema: z.number().int().optional().default(24)
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/invitations/pending",
		alias: "getPendingInvitationsForEmail",
		description: `Retrieves all pending invitations sent to a specific email address across all organizations and branches. This endpoint helps users see all outstanding invitations they have received. Only returns invitations with PENDING status that haven&#x27;t expired.`,
		requestFormat: "json",
		parameters: [
			{
				name: "email",
				type: "Query",
				schema: z.string()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/invitations/token/:token",
		alias: "getInvitationByToken",
		description: `Retrieves complete invitation information using the unique token from the invitation email. This endpoint is typically used by the invitation acceptance/decline pages to display invitation details before the user makes their decision. Includes organization, branch, and role information.`,
		requestFormat: "json",
		parameters: [
			{
				name: "token",
				type: "Path",
				schema: z.string()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Invitation token not found or invalid`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/invitations/validate/:token",
		alias: "validateInvitation",
		description: `Validates whether an invitation token is currently valid and can be accepted or declined. Checks if the invitation exists, is in PENDING status, and has not expired. This endpoint is useful for pre-validation before displaying acceptance/decline forms.`,
		requestFormat: "json",
		parameters: [
			{
				name: "token",
				type: "Path",
				schema: z.string()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/organisations",
		alias: "getAllOrganisations",
		requestFormat: "json",
		parameters: [
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/organisations",
		alias: "createOrganisation",
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: Organisation
			},
		],
		response: z.void(),
		errors: [
			{
				status: 400,
				description: `Invalid input data`,
				schema: z.void()
			},
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/organisations/:uuid",
		alias: "getOrganisationByUuid",
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Organisation not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "put",
		path: "/api/v1/organisations/:uuid",
		alias: "updateOrganisation",
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: Organisation
			},
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 400,
				description: `Invalid input data`,
				schema: z.void()
			},
			{
				status: 404,
				description: `Organisation not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "delete",
		path: "/api/v1/organisations/:uuid",
		alias: "deleteOrganisation",
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Organisation not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/organisations/:uuid/invitations",
		alias: "getOrganizationInvitations",
		description: `Retrieves all invitations (regardless of status) that have been sent for this specific organization. This includes organization-level invitations and branch-specific invitations within the organization. Results are ordered by creation date (most recent first) and include all invitation statuses.`,
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Organization not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/organisations/:uuid/invitations",
		alias: "createOrganizationInvitation",
		description: `Creates and sends an email invitation for a user to join this specific organization with a defined role. If a training branch UUID is provided, the invitation will be branch-specific within the organization. The invitation email will be sent to the recipient with acceptance and decline links containing the unique token.`,
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "recipient_email",
				type: "Query",
				schema: z.string()
			},
			{
				name: "recipient_name",
				type: "Query",
				schema: z.string()
			},
			{
				name: "domain_name",
				type: "Query",
				schema: z.string()
			},
			{
				name: "branch_uuid",
				type: "Query",
				schema: z.string().uuid().optional()
			},
			{
				name: "inviter_uuid",
				type: "Query",
				schema: z.string().uuid()
			},
			{
				name: "notes",
				type: "Query",
				schema: z.string().optional()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 400,
				description: `Invalid input data: duplicate invitation, invalid domain, or branch doesn&#x27;t belong to organization`,
				schema: z.void()
			},
			{
				status: 404,
				description: `Organization, inviter user, or training branch not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "delete",
		path: "/api/v1/organisations/:uuid/invitations/:invitationUuid",
		alias: "cancelInvitation",
		description: `Cancels a pending invitation within this organization, preventing it from being accepted or declined. Only the original inviter or an organization administrator can cancel invitations. This action is irreversible and the invitation cannot be reactivated.`,
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "invitationUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "canceller_uuid",
				type: "Query",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 400,
				description: `Invitation is not pending, or user lacks permission to cancel`,
				schema: z.void()
			},
			{
				status: 404,
				description: `Invitation not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/organisations/:uuid/invitations/:invitationUuid/resend",
		alias: "resendInvitation",
		description: `Resends the invitation email to the recipient with a fresh expiration date. Only pending invitations can be resent. The invitation expiry date will be extended from the current time. Only the original inviter or an organization administrator can resend invitations.`,
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "invitationUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "resender_uuid",
				type: "Query",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 400,
				description: `Invitation is not pending, or user lacks permission to resend`,
				schema: z.void()
			},
			{
				status: 404,
				description: `Invitation not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/organisations/:uuid/training-branches",
		alias: "getTrainingBranchesByOrganisation",
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Organisation not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/organisations/:uuid/training-branches",
		alias: "createTrainingBranch_1",
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: TrainingBranch
			},
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 400,
				description: `Invalid input data`,
				schema: z.void()
			},
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/organisations/:uuid/training-branches/:branchUuid",
		alias: "getTrainingBranchByUuid_1",
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "branchUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Training branch not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "put",
		path: "/api/v1/organisations/:uuid/training-branches/:branchUuid",
		alias: "updateTrainingBranch_1",
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: TrainingBranch
			},
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "branchUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 400,
				description: `Invalid input data`,
				schema: z.void()
			},
			{
				status: 404,
				description: `Training branch not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "delete",
		path: "/api/v1/organisations/:uuid/training-branches/:branchUuid",
		alias: "deleteTrainingBranch_1",
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "branchUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Training branch not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/organisations/:uuid/training-branches/:branchUuid/invitations",
		alias: "getBranchInvitations",
		description: `Retrieves all invitations (regardless of status) that have been sent specifically for this training branch. This only includes branch-specific invitations, not general organization invitations. Results are ordered by creation date (most recent first) and include all invitation statuses.`,
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "branchUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Training branch not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/organisations/:uuid/training-branches/:branchUuid/invitations",
		alias: "createBranchInvitation",
		description: `Creates and sends an email invitation for a user to join a specific training branch with a defined role. This is a specialized invitation that automatically determines the parent organization from the branch. The invitation email will include branch-specific information and location details.`,
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "branchUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "recipient_email",
				type: "Query",
				schema: z.string()
			},
			{
				name: "recipient_name",
				type: "Query",
				schema: z.string()
			},
			{
				name: "domain_name",
				type: "Query",
				schema: z.string()
			},
			{
				name: "inviter_uuid",
				type: "Query",
				schema: z.string().uuid()
			},
			{
				name: "notes",
				type: "Query",
				schema: z.string().optional()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 400,
				description: `Invalid input data: duplicate invitation, invalid domain, or invalid branch`,
				schema: z.void()
			},
			{
				status: 404,
				description: `Training branch, inviter user not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "put",
		path: "/api/v1/organisations/:uuid/training-branches/:branchUuid/poc/:pocUserUuid",
		alias: "updatePointOfContact",
		description: `Updates the point of contact user for a training branch. The POC must be either assigned to the branch or be a member of the parent organization.`,
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "branchUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "pocUserUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 400,
				description: `User is not eligible to be POC`,
				schema: z.void()
			},
			{
				status: 404,
				description: `Training branch or user not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/organisations/:uuid/training-branches/:branchUuid/users",
		alias: "getBranchUsers",
		description: `Retrieves all users that are assigned to a specific training branch within the organization. This includes users with any role/domain within the branch.`,
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "branchUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Training branch not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/organisations/:uuid/training-branches/:branchUuid/users/:userUuid",
		alias: "assignUserToBranch",
		description: `Assigns a user to a specific training branch with a defined role. If the user is not already in the parent organization, creates organization membership first. If the user is already in the organization, updates their branch assignment.`,
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "branchUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "userUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "domain_name",
				type: "Query",
				schema: z.string()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 400,
				description: `Invalid domain name`,
				schema: z.void()
			},
			{
				status: 404,
				description: `Training branch or user not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "delete",
		path: "/api/v1/organisations/:uuid/training-branches/:branchUuid/users/:userUuid",
		alias: "removeUserFromBranch",
		description: `Removes a user from a training branch. The user remains in the parent organization but loses branch-specific assignment.`,
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "branchUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "userUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Training branch or user not found, or user not assigned to branch`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/organisations/:uuid/training-branches/:branchUuid/users/domain/:domainName",
		alias: "getBranchUsersByDomain",
		description: `Retrieves all users in the training branch filtered by their role/domain. This endpoint is useful for getting all instructors, students, or admins within a specific branch.`,
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "branchUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "domainName",
				type: "Path",
				schema: z.string()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 400,
				description: `Invalid domain name`,
				schema: z.void()
			},
			{
				status: 404,
				description: `Training branch not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/organisations/:uuid/users",
		alias: "getUsersByOrganisation",
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/organisations/:uuid/users/domain/:domainName",
		alias: "getUsersByOrganisationAndDomain",
		description: `Retrieves all users in the organisation filtered by their role/domain. This endpoint is useful for getting all instructors, students, or admins within an organisation.`,
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "domainName",
				type: "Path",
				schema: z.string()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 400,
				description: `Invalid domain name`,
				schema: z.void()
			},
			{
				status: 404,
				description: `Organisation not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/organisations/search",
		alias: "search_2",
		description: `Fetches a paginated list of organisations based on optional filters. Supports pagination and sorting.`,
		requestFormat: "json",
		parameters: [
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/programs",
		alias: "getAllTrainingPrograms",
		description: `Retrieves paginated list of all training programs with filtering support.`,
		requestFormat: "json",
		parameters: [
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/programs",
		alias: "createTrainingProgram",
		description: `Creates a new training program with default DRAFT status and inactive state.`,
		requestFormat: "json",
		response: z.void(),
		errors: [
			{
				status: 400,
				description: `Invalid request data`,
				schema: z.void()
			},
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/programs/:programUuid/certificates",
		alias: "getProgramCertificates",
		description: `Retrieves all certificates issued for program completions.`,
		requestFormat: "json",
		parameters: [
			{
				name: "programUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/programs/:programUuid/completion-rate",
		alias: "getProgramCompletionRate",
		description: `Returns the completion rate percentage for a program.`,
		requestFormat: "json",
		parameters: [
			{
				name: "programUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/programs/:programUuid/courses",
		alias: "getProgramCourses",
		description: `Retrieves all courses in a program in sequence order with requirement status.`,
		requestFormat: "json",
		parameters: [
			{
				name: "programUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/programs/:programUuid/courses",
		alias: "addProgramCourse",
		description: `Associates a course with a program, setting sequence and requirement status.`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: ProgramCourse
			},
			{
				name: "programUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "put",
		path: "/api/v1/programs/:programUuid/courses/:courseUuid",
		alias: "updateProgramCourse",
		description: `Updates course association settings within a program.`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: ProgramCourse
			},
			{
				name: "programUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "courseUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "delete",
		path: "/api/v1/programs/:programUuid/courses/:courseUuid",
		alias: "removeProgramCourse",
		description: `Removes the association between a course and program.`,
		requestFormat: "json",
		parameters: [
			{
				name: "programUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "courseUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/programs/:programUuid/courses/optional",
		alias: "getOptionalCourses",
		description: `Retrieves only the optional courses for a program.`,
		requestFormat: "json",
		parameters: [
			{
				name: "programUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/programs/:programUuid/courses/required",
		alias: "getRequiredCourses",
		description: `Retrieves only the required courses for a program.`,
		requestFormat: "json",
		parameters: [
			{
				name: "programUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/programs/:programUuid/enrollments",
		alias: "getProgramEnrollments",
		description: `Retrieves enrollment data for a specific program with completion analytics.`,
		requestFormat: "json",
		parameters: [
			{
				name: "programUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/programs/:programUuid/requirements",
		alias: "getProgramRequirements",
		description: `Retrieves all requirements for a specific program.`,
		requestFormat: "json",
		parameters: [
			{
				name: "programUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/programs/:programUuid/requirements",
		alias: "addProgramRequirement",
		description: `Adds a new requirement or prerequisite to a program.`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: ProgramRequirement
			},
			{
				name: "programUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "put",
		path: "/api/v1/programs/:programUuid/requirements/:requirementUuid",
		alias: "updateProgramRequirement",
		description: `Updates a specific requirement for a program.`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: ProgramRequirement
			},
			{
				name: "programUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "requirementUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "delete",
		path: "/api/v1/programs/:programUuid/requirements/:requirementUuid",
		alias: "deleteProgramRequirement",
		description: `Removes a requirement from a program.`,
		requestFormat: "json",
		parameters: [
			{
				name: "programUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "requirementUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/programs/:uuid",
		alias: "getTrainingProgramByUuid",
		description: `Retrieves a complete program profile including computed properties and analytics.`,
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Program not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "put",
		path: "/api/v1/programs/:uuid",
		alias: "updateTrainingProgram",
		description: `Updates an existing training program with selective field updates.`,
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Program not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "delete",
		path: "/api/v1/programs/:uuid",
		alias: "deleteTrainingProgram",
		description: `Permanently removes a training program and its associated data.`,
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Program not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/programs/:uuid/publish",
		alias: "publishProgram",
		description: `Publishes a program making it available for enrollment.`,
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 400,
				description: `Program not ready for publishing`,
				schema: z.void()
			},
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/programs/active",
		alias: "getActivePrograms",
		description: `Retrieves all currently active and published programs.`,
		requestFormat: "json",
		parameters: [
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/programs/category/:categoryUuid",
		alias: "getProgramsByCategory",
		description: `Retrieves all programs in a specific category.`,
		requestFormat: "json",
		parameters: [
			{
				name: "categoryUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/programs/courses/search",
		alias: "searchProgramCourses",
		description: `Search course associations within programs.

**Common Program Course Search Examples:**
- &#x60;programUuid&#x3D;uuid&#x60; - All courses for specific program
- &#x60;courseUuid&#x3D;uuid&#x60; - All programs containing specific course
- &#x60;isRequired&#x3D;true&#x60; - Only required course associations
- &#x60;sequenceOrder_gte&#x3D;3&#x60; - Courses from sequence 3 onwards
`,
		requestFormat: "json",
		parameters: [
			{
				name: "searchParams",
				type: "Query",
				schema: z.record(z.string())
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/programs/enrollments/search",
		alias: "searchProgramEnrollments",
		description: `Search enrollment records across all programs.

**Common Program Enrollment Search Examples:**
- &#x60;programUuid&#x3D;uuid&#x60; - All enrollments for specific program
- &#x60;studentUuid&#x3D;uuid&#x60; - All program enrollments for specific student
- &#x60;status&#x3D;COMPLETED&#x60; - Only completed program enrollments
- &#x60;progressPercentage_gte&#x3D;90&#x60; - Students with 90%+ program progress
- &#x60;enrollmentDate_gte&#x3D;2024-01-01T00:00:00&#x60; - Program enrollments from 2024
- &#x60;finalGrade_gte&#x3D;85&#x60; - Program completions with grade 85+
`,
		requestFormat: "json",
		parameters: [
			{
				name: "searchParams",
				type: "Query",
				schema: z.record(z.string())
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/programs/free",
		alias: "getFreePrograms",
		description: `Retrieves all programs available at no cost.`,
		requestFormat: "json",
		parameters: [
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/programs/instructor/:instructorUuid",
		alias: "getProgramsByInstructor",
		description: `Retrieves all programs created by a specific instructor.`,
		requestFormat: "json",
		parameters: [
			{
				name: "instructorUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/programs/published",
		alias: "getPublishedPrograms",
		description: `Retrieves all published programs available for enrollment.`,
		requestFormat: "json",
		parameters: [
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/programs/requirements/search",
		alias: "searchProgramRequirements",
		description: `Search program requirements and prerequisites.

**Common Program Requirement Search Examples:**
- &#x60;programUuid&#x3D;uuid&#x60; - All requirements for specific program
- &#x60;requirementType&#x3D;PREREQUISITE&#x60; - Only prerequisites
- &#x60;isMandatory&#x3D;true&#x60; - Only mandatory requirements
- &#x60;requirementText_like&#x3D;certification&#x60; - Requirements mentioning &quot;certification&quot;
`,
		requestFormat: "json",
		parameters: [
			{
				name: "searchParams",
				type: "Query",
				schema: z.record(z.string())
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/programs/search",
		alias: "searchTrainingPrograms",
		description: `Advanced program search with flexible criteria and operators.

**Common Program Search Examples:**
- &#x60;title_like&#x3D;data science&#x60; - Programs with titles containing &quot;data science&quot;
- &#x60;status&#x3D;PUBLISHED&#x60; - Only published programs
- &#x60;active&#x3D;true&#x60; - Only active programs
- &#x60;status_in&#x3D;PUBLISHED,ACTIVE&#x60; - Published or active programs
- &#x60;price_lte&#x3D;500.00&#x60; - Programs priced at $500 or less
- &#x60;price&#x3D;null&#x60; - Free programs
- &#x60;instructorUuid&#x3D;uuid&#x60; - Programs by specific instructor
- &#x60;categoryUuid&#x3D;uuid&#x60; - Programs in specific category
- &#x60;totalDurationHours_gte&#x3D;40&#x60; - Programs 40+ hours long
- &#x60;totalDurationHours_between&#x3D;20,100&#x60; - Programs between 20-100 hours
- &#x60;createdDate_gte&#x3D;2024-01-01T00:00:00&#x60; - Programs created after Jan 1, 2024

**Advanced Program Queries:**
- &#x60;status&#x3D;PUBLISHED&amp;active&#x3D;true&amp;price_lte&#x3D;100&#x60; - Published, active programs under $100
- &#x60;title_like&#x3D;certification&amp;totalDurationHours_gte&#x3D;50&#x60; - Certification programs 50+ hours
- &#x60;instructorUuid&#x3D;uuid&amp;status&#x3D;PUBLISHED&#x60; - Published programs by specific instructor

For complete operator documentation, see the instructor search endpoint.
`,
		requestFormat: "json",
		parameters: [
			{
				name: "searchParams",
				type: "Query",
				schema: z.record(z.string())
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/quizzes",
		alias: "getAllQuizzes",
		description: `Retrieves paginated list of all quizzes with filtering support.`,
		requestFormat: "json",
		parameters: [
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/quizzes",
		alias: "createQuiz",
		description: `Creates a new quiz with default DRAFT status and inactive state.`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: Quiz
			},
		],
		response: z.void(),
		errors: [
			{
				status: 400,
				description: `Invalid request data`,
				schema: z.void()
			},
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/quizzes/:quizUuid/attempts",
		alias: "getQuizAttempts",
		description: `Retrieves all attempts for a specific quiz with scoring data.`,
		requestFormat: "json",
		parameters: [
			{
				name: "quizUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/quizzes/:quizUuid/question-distribution",
		alias: "getQuestionDistribution",
		description: `Returns distribution of question types within a quiz.`,
		requestFormat: "json",
		parameters: [
			{
				name: "quizUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/quizzes/:quizUuid/questions",
		alias: "getQuizQuestions",
		description: `Retrieves all questions for a quiz in display order with computed properties.`,
		requestFormat: "json",
		parameters: [
			{
				name: "quizUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/quizzes/:quizUuid/questions",
		alias: "addQuizQuestion",
		description: `Creates a new question for the specified quiz with automatic ordering.`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: QuizQuestion
			},
			{
				name: "quizUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "put",
		path: "/api/v1/quizzes/:quizUuid/questions/:questionUuid",
		alias: "updateQuizQuestion",
		description: `Updates a specific question within a quiz.`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: QuizQuestion
			},
			{
				name: "quizUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "questionUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "delete",
		path: "/api/v1/quizzes/:quizUuid/questions/:questionUuid",
		alias: "deleteQuizQuestion",
		description: `Removes a question from a quiz including all options and responses.`,
		requestFormat: "json",
		parameters: [
			{
				name: "quizUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "questionUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/quizzes/:quizUuid/questions/:questionUuid/options",
		alias: "getQuestionOptions",
		description: `Retrieves all options for a specific question.`,
		requestFormat: "json",
		parameters: [
			{
				name: "quizUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "questionUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/quizzes/:quizUuid/questions/:questionUuid/options",
		alias: "addQuestionOption",
		description: `Creates a new option for a multiple choice or true/false question.`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: QuizQuestionOption
			},
			{
				name: "quizUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "questionUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "put",
		path: "/api/v1/quizzes/:quizUuid/questions/:questionUuid/options/:optionUuid",
		alias: "updateQuestionOption",
		description: `Updates a specific option for a question.`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: QuizQuestionOption
			},
			{
				name: "quizUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "questionUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "optionUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "delete",
		path: "/api/v1/quizzes/:quizUuid/questions/:questionUuid/options/:optionUuid",
		alias: "deleteQuestionOption",
		description: `Removes an option from a question.`,
		requestFormat: "json",
		parameters: [
			{
				name: "quizUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "questionUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "optionUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/quizzes/:quizUuid/questions/reorder",
		alias: "reorderQuizQuestions",
		description: `Updates the display order of questions within a quiz.`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: z.array(z.string().uuid())
			},
			{
				name: "quizUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/quizzes/:quizUuid/total-points",
		alias: "getQuizTotalPoints",
		description: `Returns the maximum possible points for a quiz.`,
		requestFormat: "json",
		parameters: [
			{
				name: "quizUuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/quizzes/:uuid",
		alias: "getQuizByUuid",
		description: `Retrieves a complete quiz including questions and computed properties.`,
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Quiz not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "put",
		path: "/api/v1/quizzes/:uuid",
		alias: "updateQuiz",
		description: `Updates an existing quiz with selective field updates.`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: Quiz
			},
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Quiz not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "delete",
		path: "/api/v1/quizzes/:uuid",
		alias: "deleteQuiz",
		description: `Permanently removes a quiz and all associated data.`,
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Quiz not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/quizzes/attempts/search",
		alias: "searchAttempts",
		description: `Search quiz attempts across all quizzes.

**Common Attempt Search Examples:**
- &#x60;quizUuid&#x3D;uuid&#x60; - All attempts for specific quiz
- &#x60;enrollmentUuid&#x3D;uuid&#x60; - All attempts by specific student
- &#x60;status&#x3D;COMPLETED&#x60; - Only completed attempts
- &#x60;isPassed&#x3D;true&#x60; - Only passing attempts
- &#x60;percentage_gte&#x3D;85&#x60; - Attempts with 85%+ score
- &#x60;startedAt_gte&#x3D;2024-01-01T00:00:00&#x60; - Attempts from 2024
`,
		requestFormat: "json",
		parameters: [
			{
				name: "searchParams",
				type: "Query",
				schema: z.record(z.string())
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/quizzes/questions/search",
		alias: "searchQuestions",
		description: `Search questions across all quizzes.

**Common Question Search Examples:**
- &#x60;quizUuid&#x3D;uuid&#x60; - All questions for specific quiz
- &#x60;questionType&#x3D;MULTIPLE_CHOICE&#x60; - Only multiple choice questions
- &#x60;points_gte&#x3D;2&#x60; - Questions worth 2+ points
- &#x60;questionText_like&#x3D;calculate&#x60; - Questions containing &quot;calculate&quot;
`,
		requestFormat: "json",
		parameters: [
			{
				name: "searchParams",
				type: "Query",
				schema: z.record(z.string())
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/quizzes/search",
		alias: "searchQuizzes",
		description: `Advanced quiz search with flexible criteria and operators.

**Common Quiz Search Examples:**
- &#x60;title_like&#x3D;midterm&#x60; - Quizzes with &quot;midterm&quot; in title
- &#x60;lessonUuid&#x3D;uuid&#x60; - Quizzes for specific lesson
- &#x60;status&#x3D;PUBLISHED&#x60; - Only published quizzes
- &#x60;active&#x3D;true&#x60; - Only active quizzes
- &#x60;timeLimitMinutes_gte&#x3D;30&#x60; - Quizzes with 30+ minute time limit
- &#x60;attemptsAllowed_lte&#x3D;3&#x60; - Quizzes with 3 or fewer attempts allowed
- &#x60;passingScore_gte&#x3D;70&#x60; - Quizzes with passing score 70%+
`,
		requestFormat: "json",
		parameters: [
			{
				name: "searchParams",
				type: "Query",
				schema: z.record(z.string())
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/students",
		alias: "getAllStudents",
		description: `Fetches a paginated list of students.`,
		requestFormat: "json",
		parameters: [
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/students",
		alias: "createStudent",
		description: `Saves a new student record in the system.`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: Student
			},
		],
		response: z.void(),
		errors: [
			{
				status: 400,
				description: `Invalid request data`,
				schema: z.void()
			},
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/students/:uuid",
		alias: "getStudentById",
		description: `Fetches a student by their UUID.`,
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Student not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "put",
		path: "/api/v1/students/:uuid",
		alias: "updateStudent",
		description: `Updates an existing student record.`,
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: Student
			},
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Student not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "delete",
		path: "/api/v1/students/:uuid",
		alias: "deleteStudent",
		description: `Removes a student record from the system.`,
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Student not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/students/search",
		alias: "searchStudents",
		description: `Search for students based on criteria.`,
		requestFormat: "json",
		parameters: [
			{
				name: "searchParams",
				type: "Query",
				schema: z.record(z.string())
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/training-branches",
		alias: "getAllTrainingBranches",
		requestFormat: "json",
		parameters: [
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/training-branches",
		alias: "createTrainingBranch",
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: TrainingBranch
			},
		],
		response: z.void(),
		errors: [
			{
				status: 400,
				description: `Invalid input data`,
				schema: z.void()
			},
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/training-branches/:uuid",
		alias: "getTrainingBranchByUuid",
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Training branch not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "put",
		path: "/api/v1/training-branches/:uuid",
		alias: "updateTrainingBranch",
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: TrainingBranch
			},
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 400,
				description: `Invalid input data`,
				schema: z.void()
			},
			{
				status: 404,
				description: `Training branch not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "delete",
		path: "/api/v1/training-branches/:uuid",
		alias: "deleteTrainingBranch",
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Training branch not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/training-branches/organisation/:organisationUuid",
		alias: "getTrainingBranchesByOrganisation_1",
		requestFormat: "json",
		parameters: [
			{
				name: "organisationUuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Organisation not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/training-branches/search",
		alias: "search_1",
		description: `Fetches a paginated list of training branches based on optional filters. Supports pagination and sorting.`,
		requestFormat: "json",
		parameters: [
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/users",
		alias: "getAllUsers",
		description: `Fetches a paginated list of all users in the system. Supports pagination and sorting by any user field.`,
		requestFormat: "json",
		parameters: [
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/users/:uuid",
		alias: "getUserByUuid",
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `User not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "put",
		path: "/api/v1/users/:uuid",
		alias: "updateUser",
		requestFormat: "json",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: User
			},
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: ApiResponseUser,
		errors: [
			{
				status: 400,
				description: `Invalid input data`,
				schema: ApiResponseUser
			},
			{
				status: 404,
				description: `User not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "delete",
		path: "/api/v1/users/:uuid",
		alias: "deleteUser",
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `User not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/users/:uuid/invitations/accept",
		alias: "acceptInvitation",
		description: `Accepts a pending invitation for the specified user using the unique token from the invitation email. This creates the user-organization relationship with the specified role and sends confirmation emails. The invitation must be valid (not expired, not already accepted/declined) and the user email must match the invitation recipient.`,
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "token",
				type: "Query",
				schema: z.string()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 400,
				description: `Invalid token, expired invitation, user email mismatch, or user already member of organization`,
				schema: z.void()
			},
			{
				status: 404,
				description: `Invitation token not found or user not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "post",
		path: "/api/v1/users/:uuid/invitations/decline",
		alias: "declineInvitation",
		description: `Declines a pending invitation for the specified user using the unique token from the invitation email. This marks the invitation as declined and sends notification emails to the inviter. The invitation must be valid (not expired, not already accepted/declined) and the user email must match the invitation recipient.`,
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
			{
				name: "token",
				type: "Query",
				schema: z.string()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 400,
				description: `Invalid token, expired invitation, or user email mismatch`,
				schema: z.void()
			},
			{
				status: 404,
				description: `Invitation token not found or user not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/users/:uuid/invitations/pending",
		alias: "getPendingInvitationsForUser",
		description: `Retrieves all pending invitations sent to a specific user&#x27;s email address across all organizations and branches. This endpoint helps users see all outstanding invitations they have received. Only returns invitations with PENDING status that haven&#x27;t expired.`,
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/users/:uuid/invitations/sent",
		alias: "getInvitationsSentByUser",
		description: `Retrieves all invitations that have been sent by a specific user across all organizations and branches. This endpoint helps users track invitations they have created. Results are ordered by creation date (most recent first) and include all invitation statuses.`,
		requestFormat: "json",
		parameters: [
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `User not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "put",
		path: "/api/v1/users/:uuid/profile-image",
		alias: "uploadProfileImage",
		requestFormat: "form-data",
		parameters: [
			{
				name: "body",
				type: "Body",
				schema: z.object({ profile_image: z.instanceof(File) }).passthrough()
			},
			{
				name: "uuid",
				type: "Path",
				schema: z.string().uuid()
			},
		],
		response: ApiResponseUser,
		errors: [
			{
				status: 400,
				description: `Invalid input data`,
				schema: ApiResponseUser
			},
			{
				status: 404,
				description: `User not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/users/profile-image/:fileName",
		alias: "getProfileImage",
		requestFormat: "json",
		parameters: [
			{
				name: "fileName",
				type: "Path",
				schema: z.string()
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Profile image not found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
	{
		method: "get",
		path: "/api/v1/users/search",
		alias: "search",
		description: `Fetches a paginated list of users based on optional filters. Supports pagination and sorting.`,
		requestFormat: "json",
		parameters: [
			{
				name: "pageable",
				type: "Query",
				schema: pageable
			},
		],
		response: z.void(),
		errors: [
			{
				status: 404,
				description: `Not Found`,
				schema: z.void()
			},
			{
				status: 500,
				description: `Internal Server Error`,
				schema: z.void()
			},
		]
	},
]);

export const api = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
	return new Zodios(baseUrl, endpoints, options);
}
