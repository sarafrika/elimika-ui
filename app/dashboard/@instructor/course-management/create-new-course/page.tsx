"use client"

import {
  TLesson,
  LessonList,
  LessonDialog,
  AssessmentDialog,
  EditLessonDialog,
  LessonFormValues,
} from "@/app/dashboard/@instructor/_components/lesson-management-form"
import { toast } from "sonner"
import Spinner from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { deserialize } from "@/hooks/serializeRichText"
import { BookOpen, Check, List, Loader } from "lucide-react"
import { tanstackClient } from "@/services/api/tanstack-client"
import { StepperContent, StepperList, StepperRoot, StepperTrigger } from "@/components/ui/stepper"
import { CourseCreationForm, CourseFormRef } from "@/app/dashboard/@instructor/_components/course-creation-form"

export default function CourseCreationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const courseId = searchParams.get("id")
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null)

  const formRef = useRef<CourseFormRef>(null)

  const [addLessonModalOpen, setAddLessonModalOpen] = useState(false)
  const openAddLessonModal = () => setAddLessonModalOpen(true)

  const [selectedLesson, setSelectedLesson] = useState<TLesson | null>(null)
  const [editLessonModalOpen, setEditLessonModalOpen] = useState(false)
  const openEditLessonModal = (lesson: TLesson) => {
    setSelectedLesson(lesson)
    setEditLessonModalOpen(true)
  }

  const [addAssessmentModalOpen, setAddAssessmentModalOpen] = useState(false)
  const openAddAssessmentModal = () => setAddAssessmentModalOpen(true)

  // get course by ID
  const { data: courseData, refetch: refetchCourse } = tanstackClient.useQuery("get", "/api/v1/courses/{courseId}", {
    params: { path: { courseId: courseId ? (courseId as string) : (createdCourseId as string) } },
  })
  const course = courseData?.data

  const [courseInitialValues, setCourseInitialValues] = useState<any>(undefined)

  useEffect(() => {
    if (!courseId || !course) return

    setCourseInitialValues({
      name: course?.name,
      description: course?.description,
      //@ts-ignore
      instructor: course?.instructor_uuid,
      //@ts-ignore
      is_free: course?.is_free,
      //@ts-ignore
      price: course?.price,
      //@ts-ignore
      sale_price: course?.price,
      currency: "KES",
      //@ts-ignore
      objectives: course?.objectives,
      //@ts-ignore
      categories: course?.category_uuid || [],
      //@ts-ignore
      difficulty: course?.difficulty_uuid ?? "",
      class_limit: course?.classLimit ?? 30,
      prerequisites: null,
      //@ts-ignore
      duration_hours: course?.duration_hours,
      //@ts-ignore
      duration_minutes: course?.duration_minutes,
      //@ts-ignore
      class_limit: course?.class_limit,
      //@ts-ignore
      age_lower_limit: course?.age_lower_limit,
      //@ts-ignore
      age_upper_limit: course?.age_upper_limit,
      //@ts-ignore
      thumbnail_url: course?.thumbnail_url,
      //@ts-ignore
      intro_video_url: course?.intro_video_url,
      //@ts-ignore
      banner_url: course?.banner_url,
      //@ts-ignore
      status: course?.status,
      //@ts-ignore
      active: course?.active,
      //@ts-ignore
      created_date: course?.created_date,
      //@ts-ignore
      created_by: course?.created_by,
      //@ts-ignore
      updated_date: course?.updated_date,
      //@ts-ignore
      updated_by: course?.updated_by,
      //@ts-ignore
      is_published: course?.is_published,
      //@ts-ignore
      total_duration_display: course?.total_duration_display,
      //@ts-ignore
      is_draft: course?.is_draft,
    })
  }, [courseId, course])

  // get all lessons
  const { data: courseLessons, refetch: refetchLessons } = tanstackClient.useQuery(
    "get",
    "/api/v1/courses/{courseId}/lessons",
    {
      params: {
        path: { courseId: courseId ? (courseId as string) : (createdCourseId as string) },
        query: { pageable: {} },
      },
    },
  )

  // get lesson by Id
  const { data: lessonData, refetch: refetchLesson } = tanstackClient.useQuery(
    "get",
    "/api/v1/courses/{courseId}/lessons/{lessonId}",
    {
      params: {
        path: {
          // @ts-ignore
          courseId: courseId ? (courseId as string) : (createdCourseId as string),
          // @ts-ignore
          lessonId: selectedLesson?.uuid,
        },
      },
    },
  )
  const lesson = lessonData?.data
  const lessonContent = [
    {
      content_type: "",
      title: "",
      value: "",
      //@ts-ignore
      duration_hours: lesson?.duration_hours,
      //@ts-ignore
      duration_minutes: lesson?.duration_minutes,
    },
  ]

  const lessonInitialValues: Partial<LessonFormValues> = {
    title: lesson?.title,
    description: lesson?.description,
    // @ts-ignore
    number: lesson?.lesson_number,
    // @ts-ignore
    duration_hours: String(lesson?.duration_hours ?? "0"),
    //@ts-ignore
    duration_minutes: String(lesson?.duration_minutes ?? "0"),
    content: lesson
      ? lessonContent?.map((item: any) => ({
          contentType: item?.content_type as "AUDIO" | "VIDEO" | "TEXT" | "LINK" | "PDF" | "YOUTUBE",
          title: item?.title || "",
          value: item?.content_type === "TEXT" ? deserialize(item?.content_text as string) || "" : item?.file_url || "",
          duration: typeof item?.estimated_duration === "string" ? parseInt(item.estimated_duration) || 0 : 0,
          durationHours: item?.duration_hours,
          durationMinutes: item?.duration_minutes,
        }))
      : [],
    // resources: [],
  }

  const publishCourseMutation = tanstackClient.useMutation("post", "/api/v1/courses/{uuid}/publish")

  const handlePublishCourse = () => {
    //@ts-ignore
    if (!course?.uuid) return
    publishCourseMutation.mutate(
      //@ts-ignore
      { params: { path: { uuid: course?.uuid as string } } },
      {
        onSuccess: (data) => {
          // @ts-ignore
          toast.success(data?.message)
          router.push("/dashboard/course-management/published")
          // refetchLessons()
        },
      },
    )
  }

  const deleteCourseLessonMutation = tanstackClient.useMutation(
    "delete",
    "/api/v1/courses/{courseId}/lessons/{lessonId}",
  )
  const handleDeleteLesson = (lessonId: string) => {
    //@ts-ignore
    if (!course?.uuid) return

    deleteCourseLessonMutation.mutate(
      // @ts-ignore
      { params: { path: { courseId: course?.uuid as string, lessonId: lessonId as string } } },
      {
        onSuccess: () => {
          // @ts-ignore
          toast.success("Course lesson deleted successfully")
          refetchLessons()
        },
      },
    )
  }

  if (courseId && !courseInitialValues) {
    return (
      <div className="flex items-center justify-center">
        <Spinner />
      </div>
    )
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
          nextButtonText={"Continue to Lesson Creation"}
          hideNextButton={false}
          hidePreviousButton={true}
        >
          <CourseCreationForm
            ref={formRef}
            showSubmitButton={true}
            editingCourseId={courseId as string}
            initialValues={courseInitialValues as any}
            onSuccess={(data) => {
              console.log("created data here", data)
              setCreatedCourseId(data?.uuid)
              refetchCourse()
            }}
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
              // @ts-ignore
              courseTitle={course?.name}
              // @ts-ignore
              courseCategory={course?.category_uuid}
              //@ts-ignore
              lessons={courseLessons?.data?.content}
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
              courseId={createdCourseId ? createdCourseId : (courseId as string)}
              refetch={refetchLessons}
            />

            {editLessonModalOpen && selectedLesson && lesson && (
              <EditLessonDialog
                isOpen={editLessonModalOpen}
                onOpenChange={setEditLessonModalOpen}
                courseId={courseId as string}
                // @ts-ignore
                lessonId={selectedLesson?.uuid}
                initialValues={lessonInitialValues}
                onSuccess={(data) => {
                  setCreatedCourseId(data?.uuid)
                  refetchLessons()
                }}
              />
            )}

            <AssessmentDialog
              isOpen={addAssessmentModalOpen}
              onOpenChange={setAddAssessmentModalOpen}
              courseId={createdCourseId ? createdCourseId : (courseId as string)}
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
            <Button onClick={handlePublishCourse} disabled={!course} className="min-w-[150px]">
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
                      {/* @ts-ignore */}
                      <span className="font-medium">Difficulty:</span> {course.difficulty_uuid}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">Pricing</h3>
                  <div className="space-y-2">
                    <p>
                      {/* @ts-ignore */}
                      <span className="font-medium">Free Course:</span> {course?.is_free ? "Yes" : "No"}
                    </p>
                    {/* @ts-ignore */}
                    {!course?.is_free && (
                      <>
                        <p>
                          {/* @ts-ignore */}
                          <span className="font-medium">Original Price:</span> {course?.price} {"KES"}
                        </p>
                        <p>
                          {/* @ts-ignore */}
                          <span className="font-medium">Sale Price:</span> {course?.price} {"KES"}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-lg font-medium">Learning Objectives</h3>
                {/* @ts-ignore */}

                <ul className="list-inside list-disc space-y-1">{course?.objectives}</ul>
              </div>

              <div>
                <h3 className="mb-2 text-lg font-medium">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {/* {course?.categories?.map((category, index) => (
                    <span key={index} className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                      {category}
                    </span>
                  ))} */}
                  {/* @ts-ignore */}
                  {course?.category_uuid}
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
