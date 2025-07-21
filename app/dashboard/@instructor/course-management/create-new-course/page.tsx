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
import { useEffect, useRef, useState } from "react"
import { BookOpen, Check, List } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { tanstackClient } from "@/services/api/tanstack-client"
import RichTextRenderer from "@/components/editors/richTextRenders"
import HTMLTextPreview from "@/components/editors/html-text-preview"
import { StepperContent, StepperList, StepperRoot, StepperTrigger } from "@/components/ui/stepper"
import { CourseCreationForm, CourseFormRef } from "@/app/dashboard/@instructor/_components/course-creation-form"
import { useBreadcrumb } from "@/context/breadcrumb-provider"
import { ICourse } from "../../_components/instructor-type"
import { contentTypeList } from "@/lib/content-types"
import { DifficultyLabel } from "@/components/labels/difficulty-label"

export default function CourseCreationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const courseId = searchParams.get("id")
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null)

  const { replaceBreadcrumbs } = useBreadcrumb()

  useEffect(() => {
    replaceBreadcrumbs([
      { id: "dashboard", title: "Dashboard", url: "/dashboard/overview" },
      { id: "course-management", title: "Course-management", url: "/dashboard/course-management/drafts" },
      {
        id: "create-new-course",
        title: "Create New Course",
        url: `/dashboard/course-management/create-new-course?id=id`,
        isLast: true,
      },
    ])
  }, [replaceBreadcrumbs])

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

  const [courseInitialValues, setCourseInitialValues] = useState<ICourse | undefined>(undefined)

  useEffect(() => {
    if (!courseId || !course) return
    setCourseInitialValues({
      name: course?.name,
      description: course?.description,
      instructor: course?.instructor_uuid,
      is_free: course?.is_free,
      price: course?.price,
      sale_price: course?.price,
      currency: "KES",
      objectives: course?.objectives,
      categories: course?.category_uuids || [],
      difficulty: course?.difficulty_uuid as string,
      class_limit: course?.class_limit ?? 0,
      prerequisites: null,
      duration_hours: course?.duration_hours,
      duration_minutes: course?.duration_minutes,
      age_lower_limit: course?.age_lower_limit,
      age_upper_limit: course?.age_upper_limit,
      thumbnail_url: course?.thumbnail_url,
      intro_video_url: course?.intro_video_url,
      banner_url: course?.banner_url,
      status: course?.status,
      active: course?.active,
      created_date: course?.created_date,
      created_by: course?.created_by,
      updated_date: course?.updated_date,
      updated_by: course?.updated_by,
      is_published: course?.is_published,
      total_duration_display: course?.total_duration_display,
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
  const { data: lessonData } = tanstackClient.useQuery("get", "/api/v1/courses/{courseId}/lessons/{lessonId}", {
    params: {
      path: {
        courseId: courseId ? (courseId as string) : (createdCourseId as string),
        lessonId: selectedLesson?.uuid as string,
      },
    },
  })
  const lesson = lessonData?.data

  // get lesson content
  const { data: lessonContentData, refetch: refetchLessonContent } = tanstackClient.useQuery(
    "get",
    "/api/v1/courses/{courseId}/lessons/{lessonId}/content",
    {
      params: {
        path: {
          courseId: courseId ? (courseId as string) : (createdCourseId as string),
          lessonId: selectedLesson?.uuid as string,
        },
      },
    },
  )

  const contentData = lessonContentData?.data || []
  // @ts-ignore
  const lessonContent = contentData?.map((item: any) => ({
    content_type: item.content_type_uuid,
    title: item.title,
    value: item.content_text || item.file_url || "",
    duration_hours: lesson?.duration_hours ?? 0,
    duration_minutes: lesson?.duration_minutes ?? 0,
    content_category: item.content_category,
    uuid: item.uuid,
  }))

  const lessonInitialValues: Partial<LessonFormValues> = {
    // @ts-ignore
    uuid: lesson?.uuid,
    title: lesson?.title,
    description: lesson?.description,
    objectives: lesson?.learning_objectives,
    number: lesson?.lesson_number,
    duration_hours: String(lesson?.duration_hours ?? "0"),
    duration_minutes: String(lesson?.duration_minutes ?? "0"),
    content:
      lesson && lessonContent
        ? lessonContent?.map((item: any) => {
            const matchedType = contentTypeList.find((ct) => ct.uuid === item?.content_type)

            return {
              contentType: matchedType?.name.toUpperCase() as "AUDIO" | "VIDEO" | "TEXT" | "LINK" | "PDF" | "YOUTUBE",
              title: item?.title || "",
              uuid: item?.uuid || "",
              value: matchedType?.name.toUpperCase() === "TEXT" ? item?.value || "" : item?.file_url || "",
              duration: typeof item?.estimated_duration === "string" ? parseInt(item.estimated_duration) || 0 : 0,
              durationHours: item?.duration_hours,
              durationMinutes: item?.duration_minutes,
              contentUuid: item?.content_type,
              contentCategory: matchedType?.upload_category ?? "",
            }
          })
        : [],
    // resources: [],
  }

  const publishCourseMutation = tanstackClient.useMutation("post", "/api/v1/courses/{uuid}/publish")

  const handlePublishCourse = () => {
    if (!course?.uuid) return
    publishCourseMutation.mutate(
      //@ts-ignore
      { params: { path: { uuid: course?.uuid as string } } },
      {
        onSuccess: (data) => {
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
    if (!course?.uuid) return

    deleteCourseLessonMutation.mutate(
      // @ts-ignore
      { params: { path: { courseId: course?.uuid as string, lessonId: lessonId as string } } },
      {
        onSuccess: () => {
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
          description="Enter the fundamental details of your course. You can edit the details later, upload a thumbnail, banner and intro video for the course."
          showNavigation
          nextButtonText={"Continue to Lesson Creation"}
          hideNextButton={true}
          hidePreviousButton={true}
        >
          <CourseCreationForm
            ref={formRef}
            showSubmitButton={true}
            courseId={createdCourseId as string}
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
              courseTitle={course?.name as string}
              courseCategory={course?.category_names}
              // @ts-ignore
              lessons={courseLessons?.data}
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
                  refetchLessonContent()
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
              <div>
                <h3 className="mb-2 text-lg font-medium">Pricing</h3>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Free Course:</span> {course?.is_free ? "Yes" : "No"}
                  </p>
                  {!course?.is_free && (
                    <>
                      <p>
                        <span className="font-medium">Original Price:</span> {course?.price} {"KES"}
                      </p>
                      <p>
                        <span className="font-medium">Sale Price:</span> {course?.price} {"KES"}
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="mb-2 text-lg font-medium">Course Information</h3>
                <div className="space-y-2">
                  <p className="flex flex-col gap-1">
                    <span className="font-medium">Name:</span> {course.name}
                  </p>
                  <div className="html-text-preview flex flex-col gap-2">
                    <div className="font-medium">Description:</div>
                    <RichTextRenderer htmlString={course.description as string} />
                  </div>
                  <p>
                    <span className="font-medium">Difficulty:</span>{" "}
                    <DifficultyLabel difficultyUuid={course.difficulty_uuid as string} />
                  </p>
                </div>
              </div>

              <div className={`html-text-preview`}>
                <h3 className="mb-2 text-lg font-medium">Learning Objectives</h3>
                <HTMLTextPreview htmlContent={course?.objectives as string} />
              </div>

              <div>
                <h3 className="mb-2 text-lg font-medium">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {course?.category_names?.map((index: any) => (
                    <span key={index} className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                      {index}
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
