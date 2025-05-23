"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import {
  CalendarDays,
  User,
  BookOpen,
  Users,
  Lightbulb,
  CheckSquare,
} from "lucide-react" // Added Lightbulb, CheckSquare, removed unused
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

// Constants from other onboarding files (can be moved to a shared location later)
const genders = ["Male", "Female", "Other", "Prefer not to say"]

// Sample skills - this list can be expanded or fetched from an API
const availableSkills = [
  "Calculus",
  "Web Development",
  "Music Theory",
  "Piano",
  "Guitar",
  "Graphic Design",
  "Painting",
  "French Language",
  "Spanish Language",
  "Creative Writing",
  "Photography",
  "Data Science",
]

const StudentOnboardingPage = () => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("contact-details")

  const tabOrder = ["contact-details", "skills-availability"]

  // 1. Contact Details
  const [studentDetails, setStudentDetails] = useState({
    fullName: "",
    dateOfBirth: "",
    mobileNumber: "",
    emailAddress: "",
    gender: "",
  })

  const [guardian1Details, setGuardian1Details] = useState({
    name: "",
    mobileNumber: "",
  })

  const [guardian2Details, setGuardian2Details] = useState({
    name: "",
    mobileNumber: "",
  })

  // 2. Skills to Develop
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])

  // 3. Your Availability
  const [availability, setAvailability] = useState({
    calComLink: "",
  })

  // Handlers
  const handleStudentDetailsChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setStudentDetails({ ...studentDetails, [e.target.name]: e.target.value })
  }

  const handleGuardian1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGuardian1Details({
      ...guardian1Details,
      [e.target.name]: e.target.value,
    })
  }

  const handleGuardian2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGuardian2Details({
      ...guardian2Details,
      [e.target.name]: e.target.value,
    })
  }

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills((prevSkills) =>
      prevSkills.includes(skill)
        ? prevSkills.filter((s) => s !== skill)
        : [...prevSkills, skill],
    )
  }

  const handleAvailabilityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvailability({ ...availability, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = {
      name: studentDetails.fullName,
      email: studentDetails.emailAddress,
      phone: studentDetails.mobileNumber,
      address: "",
    }
    console.log("Student Onboarding Data:", formData)
    // Redirect to the student dashboard or a relevant page
    router.push("/dashboard/student?onboarding=success")
  }

  const handleNext = () => {
    const currentIndex = tabOrder.indexOf(activeTab)
    if (currentIndex < tabOrder.length - 1) {
      setActiveTab(tabOrder[currentIndex + 1])
    }
  }

  const handlePrevious = () => {
    const currentIndex = tabOrder.indexOf(activeTab)
    if (currentIndex > 0) {
      setActiveTab(tabOrder[currentIndex - 1])
    }
  }

  // Common styling classes (copied from instructor/institution onboarding)
  const inputClasses =
    "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2 bg-white text-gray-900"
  const labelClasses = "block text-sm font-medium text-gray-700"
  const buttonPrimaryClasses =
    "inline-flex items-center justify-center rounded-md border border-transparent bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
  const buttonSecondaryClasses =
    "inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1"
  const sectionTitleClasses = "text-2xl font-semibold text-gray-800 mb-6"
  const cardContentClasses = "p-6 sm:p-8"
  const skillPillClassesBase =
    "cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-within:ring-2 focus-within:ring-sky-500 focus-within:ring-offset-1 hover:bg-gray-100"
  const skillPillSelectedClasses =
    "border-sky-600 bg-sky-600 text-white hover:bg-sky-700"
  const skillPillUnselectedClasses = "border-gray-300 bg-white text-gray-700"

  return (
    <div className="bg-background flex min-h-screen flex-col px-4 py-8 sm:px-8 lg:px-16">
      <Card className="bg-card mx-auto flex w-full max-w-3xl flex-1 flex-col border-none shadow-none">
        {" "}
        {/* Adjusted max-w */}
        <CardHeader>
          <CardTitle className="text-center text-3xl font-bold text-sky-700">
            Student Onboarding
          </CardTitle>
        </CardHeader>
        <CardContent className={`${cardContentClasses} flex flex-1 flex-col`}>
          <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              defaultValue="contact-details"
              className="flex w-full flex-1 flex-col"
            >
              <TabsList className="mb-6 grid w-full grid-cols-2">
                <TabsTrigger value="contact-details">
                  Contact Details
                </TabsTrigger>
                <TabsTrigger value="skills-availability">
                  Skills & Availability
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="contact-details"
                className="flex-1 overflow-y-auto"
              >
                <div className="space-y-8 px-1 py-6">
                  {/* Contact Details Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className={sectionTitleClasses}>
                        <User className="mr-2 inline-block h-6 w-6 align-text-bottom" />
                        Student&apos;s Contact Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                        <div>
                          <label htmlFor="fullName" className={labelClasses}>
                            Full Name
                          </label>
                          <input
                            type="text"
                            name="fullName"
                            id="fullName"
                            value={studentDetails.fullName}
                            onChange={handleStudentDetailsChange}
                            className={inputClasses}
                            placeholder="Student's full name"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="dateOfBirth" className={labelClasses}>
                            Date of Birth / Age
                          </label>
                          <input
                            type="date" // Or text for age
                            name="dateOfBirth"
                            id="dateOfBirth"
                            value={studentDetails.dateOfBirth}
                            onChange={handleStudentDetailsChange}
                            className={inputClasses}
                            required
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="mobileNumber"
                            className={labelClasses}
                          >
                            Mobile Number
                          </label>
                          <input
                            type="tel"
                            name="mobileNumber"
                            id="mobileNumber"
                            value={studentDetails.mobileNumber}
                            onChange={handleStudentDetailsChange}
                            className={inputClasses}
                            placeholder="e.g., +1 234 567 8900"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="emailAddress"
                            className={labelClasses}
                          >
                            Email Address
                          </label>
                          <input
                            type="email"
                            name="emailAddress"
                            id="emailAddress"
                            value={studentDetails.emailAddress}
                            onChange={handleStudentDetailsChange}
                            className={inputClasses}
                            placeholder="you@example.com"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label htmlFor="gender" className={labelClasses}>
                            Gender
                          </label>
                          <select
                            id="gender"
                            name="gender"
                            value={studentDetails.gender}
                            onChange={handleStudentDetailsChange}
                            className={inputClasses}
                          >
                            <option value="">Select Gender</option>
                            {genders.map((g) => (
                              <option key={g} value={g}>
                                {g}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Guardian Details Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className={sectionTitleClasses}>
                        <Users className="mr-2 inline-block h-6 w-6 align-text-bottom" />
                        Guardian Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <h3 className="mb-2 text-lg font-medium text-gray-700">
                            Guardian 1
                          </h3>
                          <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                            <div>
                              <label
                                htmlFor="guardian1Name"
                                className={labelClasses}
                              >
                                Name
                              </label>
                              <input
                                type="text"
                                name="name"
                                id="guardian1Name"
                                value={guardian1Details.name}
                                onChange={handleGuardian1Change}
                                className={inputClasses}
                                placeholder="Guardian 1 full name"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="guardian1Mobile"
                                className={labelClasses}
                              >
                                Mobile Number
                              </label>
                              <input
                                type="tel"
                                name="mobileNumber"
                                id="guardian1Mobile"
                                value={guardian1Details.mobileNumber}
                                onChange={handleGuardian1Change}
                                className={inputClasses}
                                placeholder="Guardian 1 mobile"
                              />
                            </div>
                          </div>
                        </div>
                        <div>
                          <h3 className="mb-2 text-lg font-medium text-gray-700">
                            Guardian 2 (Optional)
                          </h3>
                          <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                            <div>
                              <label
                                htmlFor="guardian2Name"
                                className={labelClasses}
                              >
                                Name
                              </label>
                              <input
                                type="text"
                                name="name"
                                id="guardian2Name"
                                value={guardian2Details.name}
                                onChange={handleGuardian2Change}
                                className={inputClasses}
                                placeholder="Guardian 2 full name"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="guardian2Mobile"
                                className={labelClasses}
                              >
                                Mobile Number
                              </label>
                              <input
                                type="tel"
                                name="mobileNumber"
                                id="guardian2Mobile"
                                value={guardian2Details.mobileNumber}
                                onChange={handleGuardian2Change}
                                className={inputClasses}
                                placeholder="Guardian 2 mobile"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent
                value="skills-availability"
                className="flex-1 overflow-y-auto"
              >
                <div className="space-y-8 px-1 py-6">
                  {/* Skills to Develop Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className={sectionTitleClasses}>
                        <Lightbulb className="mr-2 inline-block h-6 w-6 align-text-bottom" />
                        Skills You&apos;d Like to Develop
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4 text-sm text-gray-600">
                        Select one or more skills you are interested in learning
                        or improving.
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {availableSkills.map((skill) => (
                          <button
                            type="button"
                            key={skill}
                            onClick={() => handleSkillToggle(skill)}
                            className={`${skillPillClassesBase} ${selectedSkills.includes(skill) ? skillPillSelectedClasses : skillPillUnselectedClasses}`}
                          >
                            {selectedSkills.includes(skill) && (
                              <CheckSquare className="mr-2 inline-block h-4 w-4" />
                            )}
                            {skill}
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Availability Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className={sectionTitleClasses}>
                        <CalendarDays className="mr-2 inline-block h-6 w-6 align-text-bottom" />
                        Your Availability
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4 text-gray-600">
                        To help us match you with suitable class schedules,
                        please connect with Cal.com or provide your availability
                        details.
                      </p>
                      <a
                        href="https://cal.com/signup"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${buttonPrimaryClasses} mb-6 w-full sm:w-auto`}
                      >
                        <CalendarDays className="mr-2 h-5 w-5" />
                        Set Up Your Availability on Cal.com
                      </a>
                      <p className="mb-2 text-sm text-gray-600">
                        Once configured, you can embed your Cal.com scheduling
                        page link here (optional):
                      </p>
                      <input
                        type="url"
                        id="calComLink"
                        name="calComLink"
                        placeholder="https://cal.com/your-username"
                        value={availability.calComLink}
                        onChange={handleAvailabilityChange}
                        className={`${inputClasses} mb-4`}
                      />
                      <div className="text-sm text-gray-500">
                        (Example: Embedding your Cal.com page for easy
                        scheduling)
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            {/* Navigation Buttons */}
            <div className="mt-auto flex justify-between border-t border-gray-200 pt-6">
              {tabOrder.indexOf(activeTab) > 0 ? (
                <Button
                  type="button"
                  onClick={handlePrevious}
                  className={buttonSecondaryClasses}
                >
                  Previous
                </Button>
              ) : (
                <div /> // Placeholder to keep "Next" button to the right
              )}
              {tabOrder.indexOf(activeTab) < tabOrder.length - 1 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className={`${buttonPrimaryClasses} ml-auto`}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  className={`${buttonPrimaryClasses} ml-auto`}
                >
                  Submit Student Registration
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default StudentOnboardingPage
