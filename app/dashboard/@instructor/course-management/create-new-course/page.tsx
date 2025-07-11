"use client"

import { BookOpen, Check, List } from "lucide-react"
import {
  StepperContent,
  StepperList,
  StepperRoot,
  StepperTrigger,
} from "@/components/ui/stepper"
import { CourseCreationForm } from "@/app/dashboard/@instructor/course-management/create-new-course/_components/course-creation-form"
import {
  LessonDialog,
  LessonList,
} from "@/app/dashboard/@instructor/course-management/create-new-course/_components/lesson-management-form"
import { useState } from "react"
import { useRouter } from "next/router"

export default function CourseCreationPage() {
  const router = useRouter()
  const { id } = router.query

  console.log("editing course id", id)

  const course = {
    name: "Introduction to Programming",
    description: "A beginner's course on programming fundamentals.",
    difficultyLevel: "BEGINNER",
    pricing: {
      free: true,
      originalPrice: 0,
      salePrice: 0,
      currency: "KES",
    },
    learningObjectives: [{ objective: "Learn to code" }],
    categories: [{ name: "Programming" }],
  }

  const lessons = [
    {
      id: 1,
      title: "Welcome",
      description: "Introduction to the course",
      content: [
        { title: "Introduction Video", contentType: "VIDEO", duration: 5 },
        {
          title: "Introduction to programming ",
          contentType: "TEXT",
          duration: 60,
        },
      ],
      resources: [],
    },
  ]

  const [isDialogOpen, setDialogOpen] = useState(false)
  const handleOpenDialog = () => setDialogOpen(true)
  const handleCloseDialog = () => setDialogOpen(false)

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
          nextButtonText={"Save & Continue"}
          hideNextButton={false}
          hidePreviousButton={true}
        >
          <CourseCreationForm showSubmitButton={false} />
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
              lessons={lessons}
              onAddLesson={handleOpenDialog}
              onEditLesson={() => {}}
              onDeleteLesson={() => {}}
              onReorderLessons={() => {}}
              onAddAssessment={() => {}}
              onEditAssessment={() => {}}
            />

            <LessonDialog isOpen={isDialogOpen} onOpenChange={setDialogOpen} />
          </div>
        </StepperContent>

        <StepperContent
          step={2}
          title="Review Course"
          description="Review your course before publishing"
          showNavigation
          nextButtonText="Publish Course"
          previousButtonText="Back to Content"
        >
          {course ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-lg font-medium">
                    Course Information
                  </h3>
                  <div className="space-y-2">
                    <p>
                      <span className="font-medium">Name:</span> {course.name}
                    </p>
                    <p>
                      <span className="font-medium">Description:</span>{" "}
                      {course.description}
                    </p>
                    <p>
                      <span className="font-medium">Difficulty:</span>{" "}
                      {course.difficultyLevel}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">Pricing</h3>
                  <div className="space-y-2">
                    <p>
                      <span className="font-medium">Free Course:</span>{" "}
                      {course.pricing?.free ? "Yes" : "No"}
                    </p>
                    {!course.pricing?.free && (
                      <>
                        <p>
                          <span className="font-medium">Original Price:</span>{" "}
                          {course.pricing?.originalPrice}{" "}
                          {course.pricing?.currency}
                        </p>
                        <p>
                          <span className="font-medium">Sale Price:</span>{" "}
                          {course.pricing?.salePrice} {course.pricing?.currency}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-lg font-medium">
                  Learning Objectives
                </h3>
                <ul className="list-inside list-disc space-y-1">
                  {course.learningObjectives.map((obj, index) => (
                    <li key={index}>{obj.objective}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-lg font-medium">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {course.categories.map((category, index) => (
                    <span
                      key={index}
                      className="rounded-full bg-gray-100 px-3 py-1 text-sm"
                    >
                      {category.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-48 flex-col items-center justify-center text-center">
              <p className="mb-4 text-gray-500">
                Please complete the course details first
              </p>
            </div>
          )}
        </StepperContent>
      </StepperRoot>
    </div>
  )
}
