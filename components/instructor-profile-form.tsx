"use client"

import React, { useState } from "react"
import { PlusCircle, Trash2 } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

interface Education {
  qualification: string
  school: string
  university: string
  year: string
  certNo: string
}

interface Skill {
  skill: string
  level: string
}

interface Experience {
  organisation_name: string
  job_title: string
  work_description: string
  start_date: string
  end_date: string
  user_uuid: string
}

interface Membership {
  body_name: string
  membership_no: string
  member_since: string
  user_uuid: string
}

interface Training {
  course: string
}

interface Contact {
  schoolName: string
  contact: string
  email: string
  country: string
  gender: string
}

interface InstructorProfileFormData {
  contact: Contact
  education: Education[]
  skills: Skill[]
  experience: Experience[]
  membership: Membership[]
  training: Training[]
}

interface InstructorProfileFormProps {
  initialData?: Partial<InstructorProfileFormData>
  onSubmit: (data: InstructorProfileFormData) => void
  isSubmitting?: boolean
}

const genders = ["Male", "Female", "Other", "Prefer not to say"]
const proficiencyLevels = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Expert",
  "Native",
]

export function InstructorProfileForm({
  initialData,
  onSubmit,
  isSubmitting = false,
}: InstructorProfileFormProps) {
  const [activeTab, setActiveTab] = useState("contact-education")

  const tabOrder = [
    "contact-education",
    "skills-experience",
    "memberships-training",
  ]

  // Contact
  const [contact, setContact] = useState<Contact>(
    initialData?.contact || {
      schoolName: "",
      contact: "",
      email: "",
      country: "",
      gender: "",
    },
  )

  // Dynamic sections
  const [education, setEducation] = useState<Education[]>(
    initialData?.education || [
      { qualification: "", school: "", university: "", year: "", certNo: "" },
    ],
  )

  const [skills, setSkills] = useState<Skill[]>(
    initialData?.skills || [{ skill: "", level: "" }],
  )

  const [experience, setExperience] = useState<Experience[]>(
    initialData?.experience || [
      {
        organisation_name: "",
        job_title: "",
        work_description: "",
        start_date: "",
        end_date: "",
        user_uuid: "",
      },
    ],
  )

  const [membership, setMembership] = useState<Membership[]>(
    initialData?.membership || [
      {
        body_name: "",
        membership_no: "",
        member_since: "",
        user_uuid: "",
      },
    ],
  )

  const [training, setTraining] = useState<Training[]>(
    initialData?.training || [{ course: "" }],
  )

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = {
      contact,
      education,
      skills,
      experience,
      membership,
      training,
    }
    onSubmit(formData)
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

  // CSS Classes
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
        <CardContent className={`${cardContentClasses} flex flex-1 flex-col`}>
          <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              defaultValue="contact-education"
              className="flex w-full flex-1 flex-col"
            >
              <TabsList className="mb-6 grid w-full grid-cols-3">
                <TabsTrigger value="contact-education">
                  Contact & Education
                </TabsTrigger>
                <TabsTrigger value="skills-experience">
                  Skills & Experience
                </TabsTrigger>
                <TabsTrigger value="memberships-training">
                  Memberships & Training
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
                              organisation_name: "",
                              job_title: "",
                              work_description: "",
                              start_date: "",
                              end_date: "",
                              user_uuid: "",
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
                                  Job Title
                                </label>
                                <input
                                  id={`exp_position_${i}`}
                                  type="text"
                                  placeholder="e.g., Senior Developer"
                                  value={exp.job_title}
                                  onChange={(e) =>
                                    handleDynamicChange(
                                      setExperience,
                                      i,
                                      "job_title",
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
                                  value={exp.organisation_name}
                                  onChange={(e) =>
                                    handleDynamicChange(
                                      setExperience,
                                      i,
                                      "organisation_name",
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
                                  Work Description
                                </label>
                                <textarea
                                  id={`exp_responsibilities_${i}`}
                                  value={exp.work_description}
                                  onChange={(e) =>
                                    handleDynamicChange(
                                      setExperience,
                                      i,
                                      "work_description",
                                      e.target.value,
                                    )
                                  }
                                  className={`${inputClasses} min-h-[80px]`}
                                  placeholder="Briefly describe your role and responsibilities..."
                                />
                              </div>
                              <div>
                                <label
                                  htmlFor={`exp_start_date_${i}`}
                                  className={labelClasses}
                                >
                                  Start Date
                                </label>
                                <input
                                  id={`exp_start_date_${i}`}
                                  type="date"
                                  value={exp.start_date}
                                  onChange={(e) =>
                                    handleDynamicChange(
                                      setExperience,
                                      i,
                                      "start_date",
                                      e.target.value,
                                    )
                                  }
                                  className={inputClasses}
                                />
                              </div>
                              <div>
                                <label
                                  htmlFor={`exp_end_date_${i}`}
                                  className={labelClasses}
                                >
                                  End Date
                                </label>
                                <input
                                  id={`exp_end_date_${i}`}
                                  type="date"
                                  value={exp.end_date}
                                  onChange={(e) =>
                                    handleDynamicChange(
                                      setExperience,
                                      i,
                                      "end_date",
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
                              body_name: "",
                              membership_no: "",
                              member_since: "",
                              user_uuid: "",
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
                                  Professional Body Name
                                </label>
                                <input
                                  id={`mem_organisation_${i}`}
                                  type="text"
                                  placeholder="e.g., IEEE"
                                  value={mem.body_name}
                                  onChange={(e) =>
                                    handleDynamicChange(
                                      setMembership,
                                      i,
                                      "body_name",
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
                                  Membership Number
                                </label>
                                <input
                                  id={`mem_membershipNo_${i}`}
                                  type="text"
                                  placeholder="e.g., MSHIP123"
                                  value={mem.membership_no}
                                  onChange={(e) =>
                                    handleDynamicChange(
                                      setMembership,
                                      i,
                                      "membership_no",
                                      e.target.value,
                                    )
                                  }
                                  className={inputClasses}
                                />
                              </div>
                              <div>
                                <label
                                  htmlFor={`mem_since_${i}`}
                                  className={labelClasses}
                                >
                                  Member Since
                                </label>
                                <input
                                  id={`mem_since_${i}`}
                                  type="date"
                                  value={mem.member_since}
                                  onChange={(e) =>
                                    handleDynamicChange(
                                      setMembership,
                                      i,
                                      "member_since",
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
                  disabled={isSubmitting}
                  className={`${buttonPrimaryClasses} ml-auto`}
                >
                  {isSubmitting ? "Updating..." : "Update Profile"}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
