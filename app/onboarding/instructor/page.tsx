"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { PlusCircle, Trash2, CalendarDays } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

const genders = ["Male", "Female", "Other", "Prefer not to say"]
const proficiencyLevels = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Expert",
  "Native",
]

const classTypes = [
  {
    type: "Private Classes",
    description:
      "Personalized one-on-one instruction tailored to individual needs, available at home, schools, or organizations.",
    methods: ["In-Person", "Virtual"],
  },
  {
    type: "Group Classes",
    description:
      "Engaging sessions for vocational training, workshops, masterclasses, camps, and collaborative project groups.",
    methods: ["In-Person", "Virtual"],
  },
]

const InstructorOnboardingPage = () => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("contact-education")

  const tabOrder = [
    "contact-education",
    "skills-experience",
    "memberships-training",
    "availability-rates",
  ]

  // Contact
  const [contact, setContact] = useState({
    schoolName: "",
    contact: "",
    email: "",
    country: "",
    gender: "",
  })
  // Dynamic sections
  const [education, setEducation] = useState([
    { qualification: "", school: "", university: "", year: "", certNo: "" },
  ])
  const [skills, setSkills] = useState([{ skill: "", level: "" }])
  const [experience, setExperience] = useState([
    { position: "", organisation: "", responsibilities: "", years: "" },
  ])
  const [membership, setMembership] = useState([
    { organisation: "", membershipNo: "" },
  ])
  const [training, setTraining] = useState([{ course: "" }])
  const [rateCard, setRateCard] = useState([
    {
      classType: "Private Classes",
      method: "In-Person",
      rate: "",
    },
    {
      classType: "Private Classes",
      method: "Virtual",
      rate: "",
    },
    {
      classType: "Group Classes",
      method: "In-Person",
      rate: "",
    },
    {
      classType: "Group Classes",
      method: "Virtual",
      rate: "",
    },
  ])

  // Handlers
  const handleContactChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setContact({ ...contact, [e.target.name]: e.target.value })
  }

  const handleDynamicChange = <T extends Record<string, any>>(
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    idx: number,
    field: keyof T,
    value: string,
  ) => {
    setter((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row)),
    )
  }

  const handleAddRow = <T,>(
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    emptyRow: T,
  ) => {
    setter((prev) => [...prev, emptyRow])
  }

  const handleRemoveRow = <T,>(
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    idx: number,
  ) => {
    setter((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev,
    )
  }

  const handleRateCardChange = (
    classType: string,
    method: string,
    value: string,
  ) => {
    setRateCard((prev) =>
      prev.map((r) =>
        r.classType === classType && r.method === method
          ? { ...r, rate: value }
          : r,
      ),
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = {
      contact,
      education,
      skills,
      experience,
      membership,
      training,
      rateCard,
    }
    console.log("Form Data:", formData)
    router.push("/dashboard/instructor?onboarding=success")
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

  const inputClasses =
    "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2 bg-white text-gray-900"
  const labelClasses = "block text-sm font-medium text-gray-700"
  const buttonPrimaryClasses =
    "inline-flex items-center justify-center rounded-md border border-transparent bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
  const buttonSecondaryClasses =
    "inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1"
  const buttonDangerClasses =
    "inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
  const cardClasses = "bg-white shadow-xl rounded-xl overflow-hidden"
  const cardContentClasses = "p-6 sm:p-8"
  const sectionTitleClasses = "text-2xl font-semibold text-gray-800 mb-6"
  const addMoreButtonClasses =
    "mt-2 inline-flex items-center text-sky-600 hover:text-sky-800 text-sm font-medium"

  return (
    <div className="bg-background flex min-h-screen flex-col px-4 py-8 sm:px-8 lg:px-16">
      <Card className="bg-card mx-auto flex w-full max-w-5xl flex-1 flex-col border-none shadow-none">
        <CardHeader>
          <CardTitle className="text-center text-3xl font-bold text-sky-700">
            Instructor Onboarding
          </CardTitle>
        </CardHeader>
        <CardContent className={`${cardContentClasses} flex flex-1 flex-col`}>
          <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              defaultValue="contact-education"
              className="flex w-full flex-1 flex-col"
            >
              <TabsList className="mb-6 grid w-full grid-cols-2 md:grid-cols-4">
                <TabsTrigger value="contact-education">
                  Contact & Education
                </TabsTrigger>
                <TabsTrigger value="skills-experience">
                  Skills & Experience
                </TabsTrigger>
                <TabsTrigger value="memberships-training">
                  Memberships & Training
                </TabsTrigger>
                <TabsTrigger value="availability-rates">
                  Availability & Rates
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="contact-education"
                className="flex-1 overflow-y-auto"
              >
                <div className="space-y-8 px-1 py-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className={sectionTitleClasses}>
                        Contact Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                        <div>
                          <label htmlFor="schoolName" className={labelClasses}>
                            School/Company Name (Optional)
                          </label>
                          <input
                            type="text"
                            name="schoolName"
                            id="schoolName"
                            value={contact.schoolName}
                            onChange={handleContactChange}
                            className={inputClasses}
                            placeholder="e.g., Your School or Company"
                          />
                        </div>
                        <div>
                          <label htmlFor="contact" className={labelClasses}>
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            name="contact"
                            id="contact"
                            value={contact.contact}
                            onChange={handleContactChange}
                            className={inputClasses}
                            placeholder="e.g., +1 234 567 8900"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="email" className={labelClasses}>
                            Email Address
                          </label>
                          <input
                            type="email"
                            name="email"
                            id="email"
                            value={contact.email}
                            onChange={handleContactChange}
                            className={inputClasses}
                            placeholder="you@example.com"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="country" className={labelClasses}>
                            Country
                          </label>
                          <input
                            type="text"
                            name="country"
                            id="country"
                            value={contact.country}
                            onChange={handleContactChange}
                            className={inputClasses}
                            placeholder="e.g., United States"
                            required
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label htmlFor="gender" className={labelClasses}>
                            Gender
                          </label>
                          <select
                            id="gender"
                            name="gender"
                            value={contact.gender}
                            onChange={handleContactChange}
                            className={inputClasses}
                            required
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

                  <Card>
                    <CardHeader>
                      <CardTitle className={sectionTitleClasses}>
                        Education
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-700">
                          Your Educational Qualifications
                        </h3>
                        <button
                          type="button"
                          onClick={() =>
                            handleAddRow(setEducation, {
                              qualification: "",
                              school: "",
                              university: "",
                              year: "",
                              certNo: "",
                            })
                          }
                          className={addMoreButtonClasses}
                        >
                          <PlusCircle className="mr-1 h-5 w-5" /> Add Education
                        </button>
                      </div>
                      <div className="space-y-6">
                        {education.map((edu, i) => (
                          <div
                            key={i}
                            className="relative rounded-lg border border-gray-200 bg-slate-50 p-4 shadow-sm"
                          >
                            {education.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveRow(setEducation, i)}
                                className={`${buttonDangerClasses} absolute top-2 right-2 h-7 w-7 p-1`}
                                title="Remove Education"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                            <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                              <div>
                                <label
                                  htmlFor={`edu_qualification_${i}`}
                                  className={labelClasses}
                                >
                                  Qualification
                                </label>
                                <input
                                  id={`edu_qualification_${i}`}
                                  type="text"
                                  placeholder="e.g., BSc Computer Science"
                                  value={edu.qualification}
                                  onChange={(e) =>
                                    handleDynamicChange(
                                      setEducation,
                                      i,
                                      "qualification",
                                      e.target.value,
                                    )
                                  }
                                  className={inputClasses}
                                />
                              </div>
                              <div>
                                <label
                                  htmlFor={`edu_school_${i}`}
                                  className={labelClasses}
                                >
                                  School/College
                                </label>
                                <input
                                  id={`edu_school_${i}`}
                                  type="text"
                                  placeholder="e.g., City College"
                                  value={edu.school}
                                  onChange={(e) =>
                                    handleDynamicChange(
                                      setEducation,
                                      i,
                                      "school",
                                      e.target.value,
                                    )
                                  }
                                  className={inputClasses}
                                />
                              </div>
                              <div>
                                <label
                                  htmlFor={`edu_university_${i}`}
                                  className={labelClasses}
                                >
                                  University/Board
                                </label>
                                <input
                                  id={`edu_university_${i}`}
                                  type="text"
                                  placeholder="e.g., State University"
                                  value={edu.university}
                                  onChange={(e) =>
                                    handleDynamicChange(
                                      setEducation,
                                      i,
                                      "university",
                                      e.target.value,
                                    )
                                  }
                                  className={inputClasses}
                                />
                              </div>
                              <div>
                                <label
                                  htmlFor={`edu_year_${i}`}
                                  className={labelClasses}
                                >
                                  Year of Completion
                                </label>
                                <input
                                  id={`edu_year_${i}`}
                                  type="text"
                                  placeholder="e.g., 2020"
                                  value={edu.year}
                                  onChange={(e) =>
                                    handleDynamicChange(
                                      setEducation,
                                      i,
                                      "year",
                                      e.target.value,
                                    )
                                  }
                                  className={inputClasses}
                                />
                              </div>
                              <div className="sm:col-span-2 lg:col-span-1">
                                <label
                                  htmlFor={`edu_certNo_${i}`}
                                  className={labelClasses}
                                >
                                  Certificate No. (Optional)
                                </label>
                                <input
                                  id={`edu_certNo_${i}`}
                                  type="text"
                                  placeholder="e.g., CERT12345"
                                  value={edu.certNo}
                                  onChange={(e) =>
                                    handleDynamicChange(
                                      setEducation,
                                      i,
                                      "certNo",
                                      e.target.value,
                                    )
                                  }
                                  className={inputClasses}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent
                value="skills-experience"
                className="flex-1 overflow-y-auto"
              >
                <div className="space-y-8 px-1 py-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className={sectionTitleClasses}>
                        Skills
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-700">
                          Your Skills
                        </h3>
                        <button
                          type="button"
                          onClick={() =>
                            handleAddRow(setSkills, { skill: "", level: "" })
                          }
                          className={addMoreButtonClasses}
                        >
                          <PlusCircle className="mr-1 h-5 w-5" /> Add Skill
                        </button>
                      </div>
                      <div className="space-y-6">
                        {skills.map((skillItem, i) => (
                          <div
                            key={i}
                            className="relative rounded-lg border border-gray-200 bg-slate-50 p-4 shadow-sm"
                          >
                            {skills.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveRow(setSkills, i)}
                                className={`${buttonDangerClasses} absolute top-2 right-2 h-7 w-7 p-1`}
                                title="Remove Skill"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                            <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                              <div>
                                <label
                                  htmlFor={`skill_name_${i}`}
                                  className={labelClasses}
                                >
                                  Skill
                                </label>
                                <input
                                  id={`skill_name_${i}`}
                                  type="text"
                                  placeholder="e.g., Python, Graphic Design"
                                  value={skillItem.skill}
                                  onChange={(e) =>
                                    handleDynamicChange(
                                      setSkills,
                                      i,
                                      "skill",
                                      e.target.value,
                                    )
                                  }
                                  className={inputClasses}
                                />
                              </div>
                              <div>
                                <label
                                  htmlFor={`skill_level_${i}`}
                                  className={labelClasses}
                                >
                                  Proficiency Level
                                </label>
                                <select
                                  id={`skill_level_${i}`}
                                  value={skillItem.level}
                                  onChange={(e) =>
                                    handleDynamicChange(
                                      setSkills,
                                      i,
                                      "level",
                                      e.target.value,
                                    )
                                  }
                                  className={inputClasses}
                                >
                                  <option value="">Select Level</option>
                                  {proficiencyLevels.map((l) => (
                                    <option key={l} value={l}>
                                      {l}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className={sectionTitleClasses}>
                        Work Experience
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-700">
                          Your Work History
                        </h3>
                        <button
                          type="button"
                          onClick={() =>
                            handleAddRow(setExperience, {
                              position: "",
                              organisation: "",
                              responsibilities: "",
                              years: "",
                            })
                          }
                          className={addMoreButtonClasses}
                        >
                          <PlusCircle className="mr-1 h-5 w-5" /> Add Experience
                        </button>
                      </div>
                      <div className="space-y-6">
                        {experience.map((exp, i) => (
                          <div
                            key={i}
                            className="relative rounded-lg border border-gray-200 bg-slate-50 p-4 shadow-sm"
                          >
                            {experience.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveRow(setExperience, i)
                                }
                                className={`${buttonDangerClasses} absolute top-2 right-2 h-7 w-7 p-1`}
                                title="Remove Experience"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                            <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                              <div>
                                <label
                                  htmlFor={`exp_position_${i}`}
                                  className={labelClasses}
                                >
                                  Position/Title
                                </label>
                                <input
                                  id={`exp_position_${i}`}
                                  type="text"
                                  placeholder="e.g., Senior Developer"
                                  value={exp.position}
                                  onChange={(e) =>
                                    handleDynamicChange(
                                      setExperience,
                                      i,
                                      "position",
                                      e.target.value,
                                    )
                                  }
                                  className={inputClasses}
                                />
                              </div>
                              <div>
                                <label
                                  htmlFor={`exp_organisation_${i}`}
                                  className={labelClasses}
                                >
                                  Organisation Name
                                </label>
                                <input
                                  id={`exp_organisation_${i}`}
                                  type="text"
                                  placeholder="e.g., Tech Solutions Inc."
                                  value={exp.organisation}
                                  onChange={(e) =>
                                    handleDynamicChange(
                                      setExperience,
                                      i,
                                      "organisation",
                                      e.target.value,
                                    )
                                  }
                                  className={inputClasses}
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <label
                                  htmlFor={`exp_responsibilities_${i}`}
                                  className={labelClasses}
                                >
                                  Key Responsibilities
                                </label>
                                <textarea
                                  id={`exp_responsibilities_${i}`}
                                  value={exp.responsibilities}
                                  onChange={(e) =>
                                    handleDynamicChange(
                                      setExperience,
                                      i,
                                      "responsibilities",
                                      e.target.value,
                                    )
                                  }
                                  className={`${inputClasses} min-h-[80px]`}
                                  placeholder="Briefly describe your role and responsibilities..."
                                />
                              </div>
                              <div>
                                <label
                                  htmlFor={`exp_years_${i}`}
                                  className={labelClasses}
                                >
                                  Years of Experience
                                </label>
                                <input
                                  id={`exp_years_${i}`}
                                  type="number"
                                  min="0"
                                  placeholder="e.g., 5"
                                  value={exp.years}
                                  onChange={(e) =>
                                    handleDynamicChange(
                                      setExperience,
                                      i,
                                      "years",
                                      e.target.value,
                                    )
                                  }
                                  className={inputClasses}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent
                value="memberships-training"
                className="flex-1 overflow-y-auto"
              >
                <div className="space-y-8 px-1 py-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className={sectionTitleClasses}>
                        Professional Memberships
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-700">
                          Your Memberships
                        </h3>
                        <button
                          type="button"
                          onClick={() =>
                            handleAddRow(setMembership, {
                              organisation: "",
                              membershipNo: "",
                            })
                          }
                          className={addMoreButtonClasses}
                        >
                          <PlusCircle className="mr-1 h-5 w-5" /> Add Membership
                        </button>
                      </div>
                      <div className="space-y-6">
                        {membership.map((mem, i) => (
                          <div
                            key={i}
                            className="relative rounded-lg border border-gray-200 bg-slate-50 p-4 shadow-sm"
                          >
                            {membership.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveRow(setMembership, i)
                                }
                                className={`${buttonDangerClasses} absolute top-2 right-2 h-7 w-7 p-1`}
                                title="Remove Membership"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                            <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                              <div>
                                <label
                                  htmlFor={`mem_organisation_${i}`}
                                  className={labelClasses}
                                >
                                  Organisation
                                </label>
                                <input
                                  id={`mem_organisation_${i}`}
                                  type="text"
                                  placeholder="e.g., IEEE"
                                  value={mem.organisation}
                                  onChange={(e) =>
                                    handleDynamicChange(
                                      setMembership,
                                      i,
                                      "organisation",
                                      e.target.value,
                                    )
                                  }
                                  className={inputClasses}
                                />
                              </div>
                              <div>
                                <label
                                  htmlFor={`mem_membershipNo_${i}`}
                                  className={labelClasses}
                                >
                                  Membership No. (Optional)
                                </label>
                                <input
                                  id={`mem_membershipNo_${i}`}
                                  type="text"
                                  placeholder="e.g., MSHIP123"
                                  value={mem.membershipNo}
                                  onChange={(e) =>
                                    handleDynamicChange(
                                      setMembership,
                                      i,
                                      "membershipNo",
                                      e.target.value,
                                    )
                                  }
                                  className={inputClasses}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className={sectionTitleClasses}>
                        Interested Training Areas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-700">
                          Your Training Interests
                        </h3>
                        <button
                          type="button"
                          onClick={() =>
                            handleAddRow(setTraining, { course: "" })
                          }
                          className={addMoreButtonClasses}
                        >
                          <PlusCircle className="mr-1 h-5 w-5" /> Add Area
                        </button>
                      </div>
                      <p className="mb-4 text-sm text-gray-600">
                        List the subjects or courses you are interested in
                        teaching.
                      </p>
                      <div className="space-y-4">
                        {training.map((train, i) => (
                          <div
                            key={i}
                            className="relative flex items-center gap-x-3 rounded-lg border border-gray-200 bg-slate-50 p-4 shadow-sm"
                          >
                            <div className="flex-grow">
                              <label
                                htmlFor={`train_course_${i}`}
                                className={`${labelClasses} sr-only`}
                              >
                                Course Title
                              </label>
                              <input
                                id={`train_course_${i}`}
                                type="text"
                                placeholder="e.g., Web Development, Yoga Basics"
                                value={train.course}
                                onChange={(e) =>
                                  handleDynamicChange(
                                    setTraining,
                                    i,
                                    "course",
                                    e.target.value,
                                  )
                                }
                                className={inputClasses}
                              />
                            </div>
                            {training.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveRow(setTraining, i)}
                                className={`${buttonDangerClasses} h-9 w-9 p-0`}
                                title="Remove Training Area"
                              >
                                <Trash2 className="mx-auto h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent
                value="availability-rates"
                className="flex-1 overflow-y-auto"
              >
                <div className="space-y-8 px-1 py-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className={sectionTitleClasses}>
                        Availability & Scheduling
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4 text-gray-600">
                        To manage your teaching schedule and availability,
                        please connect with Cal.com. You can set up your
                        calendar by clicking the button below.
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
                        placeholder="https://cal.com/your-username"
                        className={`${inputClasses} mb-4`}
                      />
                      <div className="text-sm text-gray-500">
                        (Example: Embedding your Cal.com page directly for
                        students to book)
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className={sectionTitleClasses}>
                        Class Types & Hourly Rates
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-8">
                        {classTypes.map((ct) => (
                          <div
                            key={ct.type}
                            className="rounded-lg border border-gray-200 bg-slate-50 p-4 shadow-sm"
                          >
                            <h3 className="mb-1 text-xl font-semibold text-sky-700">
                              {ct.type}
                            </h3>
                            <p className="mb-4 text-sm text-gray-600">
                              {ct.description}
                            </p>
                            <div className="space-y-4">
                              {ct.methods.map((method) => {
                                const currentRateItem = rateCard.find(
                                  (r) =>
                                    r.classType === ct.type &&
                                    r.method === method,
                                )
                                const currentRate = currentRateItem
                                  ? currentRateItem.rate
                                  : ""
                                return (
                                  <div
                                    key={method}
                                    className="flex flex-col gap-2 rounded-md border bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                                  >
                                    <span className="font-medium text-gray-700">
                                      {method === "In-Person" ? "🏢" : "💻"}{" "}
                                      {method}
                                    </span>
                                    <div className="flex items-center gap-x-2">
                                      <label
                                        htmlFor={`${ct.type}-${method}-rate`}
                                        className="text-sm whitespace-nowrap text-gray-600"
                                      >
                                        Rate (per hr):
                                      </label>
                                      <input
                                        type="number"
                                        id={`${ct.type}-${method}-rate`}
                                        min="0"
                                        step="0.01"
                                        placeholder="e.g., 50.00"
                                        value={currentRate}
                                        onChange={(e) =>
                                          handleRateCardChange(
                                            ct.type,
                                            method,
                                            e.target.value,
                                          )
                                        }
                                        className={`${inputClasses} w-28 text-right sm:w-32`}
                                      />
                                      <span className="text-sm text-gray-500">
                                        USD
                                      </span>{" "}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
            <div className="mt-8 flex justify-between border-t border-gray-200 pt-4">
              {tabOrder.indexOf(activeTab) > 0 && (
                <Button
                  type="button"
                  onClick={handlePrevious}
                  className={buttonSecondaryClasses}
                >
                  Previous
                </Button>
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
                  Submit Instructor Registration
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default InstructorOnboardingPage
