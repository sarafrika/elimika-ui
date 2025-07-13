"use client"

import { BookOpen, Check, List, Loader } from "lucide-react"
import { StepperContent, StepperList, StepperRoot, StepperTrigger } from "@/components/ui/stepper"
import {
  CourseCreationForm,
  CourseFormRef,
} from "@/app/dashboard/@instructor/course-management/create-new-course/_components/course-creation-form"
import {
  AssessmentDialog,
  EditLessonDialog,
  LessonDialog,
  LessonFormValues,
  LessonList,
} from "@/app/dashboard/@instructor/course-management/create-new-course/_components/lesson-management-form"
import { useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { tanstackClient } from "@/services/api/tanstack-client"
import { deserialize } from "@/hooks/serializeRichText"
import { Button } from "@/components/ui/button"
import Spinner from "@/components/ui/spinner"

const sampleCourseData = {
  success: true,
  data: {
    uuid: "c1o2u3r4-5s6e-7d8a-9t10-abcdefghijkl",
    name: "Advanced Java Programming",
    instructor_uuid: "i1s2t3r4-5u6c-7t8o-9r10-abcdefghijkl",
    category_uuid: "c1a2t3e4-5g6o-7r8y-9a10-abcdefghijkl",
    difficulty_uuid: "d1i2f3f4-5i6c-7u8l-9t10-abcdefghijkl",
    description: "Comprehensive course covering advanced Java concepts and enterprise development",

    // update these 4 data format in course details
    objectives: [
      { objective: "Master advanced Java features, design patterns, and enterprise frameworks" },
      { objective: "Objectives 2" },
    ],
    categories: [{ name: "Programming" }],
    difficulty_level: "Intermediate",
    currency: "KES",

    prerequisites: "Basic Java knowledge and OOP concepts",
    duration_hours: 40,
    duration_minutes: 30,
    class_limit: 25,
    price: 299.99,
    age_lower_limit: 18,
    age_upper_limit: 65,
    thumbnail_url: "https://cdn.sarafrika.com/courses/java-advanced-thumb.jpg",
    intro_video_url: "https://cdn.sarafrika.com/courses/java-advanced-intro.mp4",
    banner_url: "https://cdn.sarafrika.com/courses/java-advanced-banner.jpg",
    status: "PUBLISHED",
    active: true,
    created_date: "2024-04-01T12:00:00",
    created_by: "instructor@sarafrika.com",
    updated_date: "2024-04-15T15:30:00",
    updated_by: "instructor@sarafrika.com",
    total_duration_display: "40 hours 30 minutes",
    is_free: false,
    is_published: true,
    is_draft: false,
  },
  message: "string",
  error: {},
}

const sampleCourseLessons = {
  success: true,
  data: {
    content: [
      {
        uuid: "de305d54-75b4-431b-adb2-eb6b9e546014",
        course_uuid: "5a1b6fa1-8592-4a89-b71e-3ac1150c573d",
        lesson_number: 3,
        title: "Object-Oriented Programming Fundamentals",
        duration_hours: 2,
        duration_minutes: 30,
        description: "Introduction to OOP concepts including classes, objects, inheritance, and polymorphism",
        learning_objectives: "Understand OOP principles, implement classes and objects, apply inheritance concepts",
        status: "PUBLISHED",
        active: true,
        created_date: "2024-04-01T12:00:00",
        created_by: "instructor@sarafrika.com",
        updated_date: "2024-04-15T15:30:00",
        updated_by: "instructor@sarafrika.com",
        duration_display: "2 hours 30 minutes",
        is_published: true,
        lesson_sequence: "Lesson 3",
      },
      {
        uuid: "de305d54-75b4-431b-adb2-eb6b9e546204",
        course_uuid: "5a1b6fa1-8592-4a89-b71e-3ac1120c573d",
        lesson_number: 3,
        title: "Object-Oriented Programming Fundamentals II",
        duration_hours: 2,
        duration_minutes: 30,
        description: "Introduction to OOP concepts including classes, objects, inheritance, and polymorphism",
        learning_objectives: "Understand OOP principles, implement classes and objects, apply inheritance concepts",
        status: "PUBLISHED",
        active: true,
        created_date: "2024-04-01T12:00:00",
        created_by: "instructor@sarafrika.com",
        updated_date: "2024-04-15T15:30:00",
        updated_by: "instructor@sarafrika.com",
        duration_display: "4 hours 30 minutes",
        is_published: true,
        lesson_sequence: "Lesson 4",
      },
    ],
    metadata: {
      pageNumber: 1073741824,
      pageSize: 1073741824,
      totalElements: 9007199254740991,
      totalPages: 1073741824,
      hasNext: true,
      hasPrevious: true,
      first: true,
      last: true,
    },
    links: {
      first: "string",
      previous: "string",
      self: "string",
      next: "string",
      last: "string",
    },
  },
  message: "string",
  error: {},
}

const sampleCourseLesson = {
  success: true,
  data: {
    uuid: "de305d54-75b4-431b-adb2-eb6b9e546014",
    course_uuid: "5a1b6fa1-8592-4a89-b71e-3ac1150c573d",
    lesson_number: 3,
    title: "Object-Oriented Programming Fundamentals",
    duration_hours: 2,
    duration_minutes: 30,
    description: "Introduction to OOP concepts including classes, objects, inheritance, and polymorphism",
    learning_objectives: "Understand OOP principles, implement classes and objects, apply inheritance concepts",
    status: "PUBLISHED",
    active: true,
    created_date: "2024-04-01T12:00:00",
    created_by: "instructor@sarafrika.com",
    updated_date: "2024-04-15T15:30:00",
    updated_by: "instructor@sarafrika.com",
    duration_display: "2 hours 30 minutes",
    is_published: true,
    lesson_sequence: "Lesson 3",
  },
  message: "string",
  error: {},
}

const sampleLessonContent = {
  success: true,
  data: [
    {
      uuid: "l1c2o3n4-5t6e-7n8t-9i10-abcdefghijkl",
      lesson_uuid: "l1e2s3s4-5o6n-7d8a-9t10-abcdefghijkl",
      content_type_uuid: "c1o2n3t4-5e6n-7t8t-9y10-abcdefghijkl",

      // needed fields
      content_type: "AUDIO",

      title: "Introduction to Classes and Objects",
      description: "Comprehensive video explanation of OOP fundamentals with examples",
      content_text: null,
      file_url: "https://cdn.sarafrika.com/lessons/oop-intro.mp4",
      file_size_bytes: 157286400,
      mime_type: "video/mp4",
      display_order: 1,
      is_required: true,
      created_date: "2024-04-01T12:00:00",
      created_by: "instructor@sarafrika.com",
      updated_date: "2024-04-15T15:30:00",
      updated_by: "instructor@sarafrika.com",
      file_size_display: "150 MB",
      content_category: "Video Content",
      is_downloadable: true,
      estimated_duration: "15 minutes",
    },
    {
      uuid: "l1c2o3n4-5t6e-7n8t-9i10-abcdefgsdjkl",
      lesson_uuid: "l1e2s3s4-5o6n-7d8a-9t10-absdfefghijkl",
      content_type_uuid: "c1o2n3t4-5e6n-7t8t-9y10-abcdefghijkl",

      // needed fields
      content_type: "VIDEO",

      title: "Introduction to Classes and Objects",
      description: "Comprehensive video explanation of OOP fundamentals with examples",
      content_text: null,
      file_url: "https://cdn.sarafrika.com/lessons/oop-intro.mp4",
      file_size_bytes: 157286400,
      mime_type: "video/mp4",
      display_order: 1,
      is_required: true,
      created_date: "2024-04-01T12:00:00",
      created_by: "instructor@sarafrika.com",
      updated_date: "2024-04-15T15:30:00",
      updated_by: "instructor@sarafrika.com",
      file_size_display: "150 MB",
      content_category: "Video Content",
      is_downloadable: true,
      estimated_duration: "15 minutes",
    },
    {
      uuid: "l1c2o3n4-5t6e-7n8t-9i10-abcdefgsdjkl",
      lesson_uuid: "l1e2s3s4-5o6n-7d8a-9t10-absdfefghijkl",
      content_type_uuid: "c1o2n3t4-5e6n-7t8t-9y10-abcdefghijkl",

      // needed fields
      content_type: "TEXT",

      title: "Introduction to Classes and Objects",
      description: "Comprehensive video explanation of OOP fundamentals with examples",
      content_text:
        "<p>These are the texts that are being sent in the text editor</p><p>Updating the text here to be sure this is working fine</p>",
      file_url: "https://cdn.sarafrika.com/lessons/oop-intro.mp4",
      file_size_bytes: 157286400,
      mime_type: "video/mp4",
      display_order: 1,
      is_required: true,
      created_date: "2024-04-01T12:00:00",
      created_by: "instructor@sarafrika.com",
      updated_date: "2024-04-15T15:30:00",
      updated_by: "instructor@sarafrika.com",
      file_size_display: "150 MB",
      content_category: "Video Content",
      is_downloadable: true,
      estimated_duration: "15 minutes",
    },
  ],
  message: "string",
  error: {},
}

export default function CourseCreationPage() {
  const searchParams = useSearchParams()
  const courseId = searchParams.get("id")

  console.log("courseID>>>", courseId)
  const newCourseId = "3f4a8d52-9e8f-4aaf-a2db-cf58b75b5b12"

  const formRef = useRef<CourseFormRef>(null)

  const [addLessonModalOpen, setAddLessonModalOpen] = useState(false)
  const openAddLessonModal = () => setAddLessonModalOpen(true)

  const [editLessonModalOpen, setEditLessonModalOpen] = useState(false)
  const openEditLessonModal = () => setEditLessonModalOpen(true)

  const [addAssessmentModalOpen, setAddAssessmentModalOpen] = useState(false)
  const openAddAssessmentModal = () => setAddAssessmentModalOpen(true)

  const { data: courseDetail } = tanstackClient.useQuery("get", "/api/v1/courses/{courseId}", {
    params: {
      path: {
        courseId: courseId ? (courseId as string) : (newCourseId as string),
      },
    },
  })

  const { data: courseLessons } = tanstackClient.useQuery("get", "/api/v1/courses/{courseId}/lessons", {
    params: {
      path: {
        courseId: courseId ? (courseId as string) : (newCourseId as string),
      },
      query: {
        pageable: {},
      },
    },
  })

  console.log("course details", courseDetail)
  console.log("course lessons", courseLessons)

  const publishCourseMutation = tanstackClient.useMutation("post", "/api/v1/courses/{uuid}/publish")

  const deleteourseLessonMutation = tanstackClient.useMutation(
    "delete",
    "/api/v1/courses/{courseId}/lessons/{lessonId}",
  )
  const handleDeleteLesson = async (lessonId: string) => {
    console.log("deleting.....", lessonId)

    if (!course?.uuid) {
      console.error("No course ID available for deletion")
      return
    }

    // deleteourseLessonMutation.mutate({
    //       path: {
    //         courseId: course.uuid,
    //         lessonId: lessonId,
    //       },
    //     });
  }

  const course = sampleCourseData?.data
  const courseInitialValues = courseId
    ? {
        name: course?.name,
        description: course?.description,
        is_free: course?.is_free,
        price: course?.price,
        sale_price: course?.price,
        currency: course?.currency,
        objectives: course.objectives?.map((lo) => ({ value: lo.objective })) ?? [{ value: "" }],
        categories: course.categories?.map((cat) => ({ value: cat.name })) ?? [],
        difficulty: course.difficulty_level?.toLowerCase() ?? "",
        class_limit: course.class_limit ?? 30,
      }
    : undefined

  const courseLessonDetails = sampleCourseLesson?.data

  const courseLessonInitialValues: Partial<LessonFormValues> = {
    title: courseLessonDetails?.title ?? "",
    description: courseLessonDetails?.description ?? "",
    content: sampleLessonContent?.data
      ? sampleLessonContent.data.map((item) => ({
          contentType: item?.content_type as "AUDIO" | "VIDEO" | "TEXT" | "LINK" | "PDF" | "YOUTUBE",
          title: item?.title || "",
          value: item?.content_type === "TEXT" ? deserialize(item?.content_text as string) || "" : item?.file_url || "",
          duration: typeof item?.estimated_duration === "string" ? parseInt(item.estimated_duration) || 0 : 0,
        }))
      : [],
    // resources: [],
  }

  return (
    <div className="container mx-auto">
      <StepperRoot>
        <StepperList>
          <StepperTrigger step={0} title="Course Details" icon={BookOpen} />
          <StepperTrigger step={1} title="Content" icon={List} />
          <StepperTrigger step={2} title="Review" icon={Check} />
        </StepperList>

        <StepperContent
          step={0}
          title="Basic Course Information"
          description="Enter the fundamental details of your course"
          showNavigation
          nextButtonText={"Save & Continue, should be only continue"}
          hideNextButton={false}
          hidePreviousButton={true}
        >
          <CourseCreationForm
            ref={formRef}
            showSubmitButton={true}
            initialValues={courseInitialValues as any}
            courseId={courseId as string}
          />
        </StepperContent>

        <StepperContent
          step={1}
          title="Course Content"
          description="Add lessons and content to your course"
          showNavigation
          nextButtonText="Continue to Review"
          previousButtonText="Back to Details"
        >
          <div className="space-y-4">
            <LessonList
              courseTitle={course?.name}
              lessons={sampleCourseLessons.data.content}
              onAddLesson={openAddLessonModal}
              onEditLesson={openEditLessonModal}
              onDeleteLesson={handleDeleteLesson}
              onAddAssessment={openAddAssessmentModal}
              onEditAssessment={() => {}}
              onReorderLessons={() => {}}
            />

            <LessonDialog
              isOpen={addLessonModalOpen}
              onOpenChange={setAddLessonModalOpen}
              courseId={courseId as string}
            />

            <EditLessonDialog
              isOpen={editLessonModalOpen}
              onOpenChange={setEditLessonModalOpen}
              courseId={courseId as string}
              lessonId={courseLessonDetails?.uuid}
              initialValues={courseLessonInitialValues}
            />

            <AssessmentDialog
              isOpen={addAssessmentModalOpen}
              onOpenChange={setAddAssessmentModalOpen}
              courseId={courseId as string}
            />
          </div>
        </StepperContent>

        <StepperContent
          step={2}
          title="Review Course"
          description="Review your course before publishing"
          showNavigation
          previousButtonText="Back to Content"
          hideNextButton={true}
          customButton={
            <Button
              type={"submit"}
              onClick={() => {
                console.log("publishing course", course)
              }}
              disabled={!course}
              className="min-w-[150px]"
            >
              {publishCourseMutation.isPending ? <Spinner /> : "Publish Course"}
            </Button>
          }
        >
          {course ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-lg font-medium">Course Information</h3>
                  <div className="space-y-2">
                    <p>
                      <span className="font-medium">Name:</span> {course.name}
                    </p>
                    <p>
                      <span className="font-medium">Description:</span> {course.description}
                    </p>
                    <p>
                      <span className="font-medium">Difficulty:</span> {course.difficulty_uuid}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">Pricing</h3>
                  <div className="space-y-2">
                    <p>
                      <span className="font-medium">Free Course:</span> {course.is_free ? "Yes" : "No"}
                    </p>
                    {!course.is_free && (
                      <>
                        <p>
                          <span className="font-medium">Original Price:</span> {course.price} {course.currency}
                        </p>
                        <p>
                          <span className="font-medium">Sale Price:</span> {course.price} {course.currency}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-lg font-medium">Learning Objectives</h3>
                <ul className="list-inside list-disc space-y-1">
                  {course.objectives.map((obj, index) => (
                    <li key={index}>{obj.objective}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-lg font-medium">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {course.categories.map((category, index) => (
                    <span key={index} className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                      {category.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-48 flex-col items-center justify-center text-center">
              <p className="mb-4 text-gray-500">Please complete the course details first</p>
            </div>
          )}
        </StepperContent>
      </StepperRoot>
    </div>
  )
}
