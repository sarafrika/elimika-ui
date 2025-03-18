"use client"

import { BookOpen, Check, List } from "lucide-react"
import { toast } from "sonner"
import { useState } from "react"
import { StepperContent, StepperList, StepperRoot, StepperTrigger } from "@/components/ui/stepper"
import {
  Course,
  CourseCreationForm,
  useCourseCreationForm
} from "@/app/dashboard/instructor/course-management/create-new-course/_components/course-creation-form"

export default function CourseCreationPage() {
  const [course, setCourse] = useState<Course | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { formRef, submitForm } = useCourseCreationForm()

  const handleStepperNext = async (): Promise<void> => {
    if (!course) {
      setIsSubmitting(true)

      try {
        await submitForm()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "An unexpected error occurred")
        throw error
      } finally {
        setIsSubmitting(false)
      }
    }
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
          onNext={handleStepperNext}
          nextButtonText={isSubmitting ? "Saving..." : "Save & Continue"}
          hideNextButton={false}
          hidePreviousButton={true}
          disableNext={isSubmitting}
        >
          <CourseCreationForm
            ref={formRef}
            onSuccess={setCourse}
            showSubmitButton={false}
          />
        </StepperContent>

        <StepperContent
          step={1}
          title="Course Content"
          description="Add lessons and content to your course"
          showNavigation
          nextButtonText="Continue to Review"
          previousButtonText="Back to Details"
          disableNext={!course}
        >
          {course ? (
            <div className="min-h-[300px]">
              {/* Assuming we have a LessonManagement component */}
              {/*<LessonManagement courseId={course.id} />*/}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <p className="text-gray-500 mb-4">
                Please complete the course details first
              </p>
            </div>
          )}
        </StepperContent>

        <StepperContent
          step={2}
          title="Review Course"
          description="Review your course before publishing"
          showNavigation
          nextButtonText="Publish Course"
          previousButtonText="Back to Content"
          disableNext={!course}
        >
          {course ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Course Information</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Name:</span> {course.name}</p>
                    <p><span className="font-medium">Description:</span> {course.description}</p>
                    <p><span className="font-medium">Duration:</span> {course.durationHours} hours</p>
                    <p><span className="font-medium">Difficulty:</span> {course.difficultyLevel}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Pricing</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Free Course:</span> {course.pricing?.free ? "Yes" : "No"}</p>
                    {!course.pricing?.free && (
                      <>
                        <p><span
                          className="font-medium">Original Price:</span> {course.pricing?.originalPrice} {course.pricing?.currency}
                        </p>
                        <p><span
                          className="font-medium">Sale Price:</span> {course.pricing?.salePrice} {course.pricing?.currency}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Learning Objectives</h3>
                <ul className="list-disc list-inside space-y-1">
                  {course.learningObjectives.map((obj, index) => (
                    <li key={index}>{obj.objective}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {course.categories.map((category, index) => (
                    <span key={index} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                      {category.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <p className="text-gray-500 mb-4">
                Please complete the course details first
              </p>
            </div>
          )}
        </StepperContent>
      </StepperRoot>
    </div>
  )
}