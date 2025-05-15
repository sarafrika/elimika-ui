"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { PlusCircle, Trash2, CalendarDays } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

const affiliateCourses = [
  {
    category: "Music",
    items: [
      "Voice",
      "Piano",
      "Guitar",
      "Drums",
      "Violin",
      "Cello",
      "Viola",
      "Bass",
      "Saxophone",
      "Trumpet",
      "Clarinet",
      "Flute",
      "Trombone",
      "Drumline",
      "Marching Band",
      "Pop Band",
      "String Orchestra",
      "Choir",
    ],
  },
  {
    category: "Sports",
    items: [
      "Football",
      "Swimming",
      "Tennis",
      "Rugby",
      "Athletics",
      "Aerobics",
      "Table tennis",
      "Basketball",
      "Volleyball",
      "Netball",
      "Scatting",
    ],
  },
  { category: "Dance", items: ["Ballet", "Contemporary Dance"] },
  { category: "Theatre", items: ["Musical theatre", "Technical theatre"] },
  { category: "Arts", items: ["Painting", "Sculpture", "Drawing"] },
]

const ageGroups = [
  "Kindergarten",
  "Lower Primary",
  "Upper Primary",
  "JSS",
  "Secondary",
  "Adults",
]
const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const timeSlots = [
  "8:00 AM",
  "8:30 AM",
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "1:00 PM",
  "1:30 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
  "4:30 PM",
  "5:00 PM",
  "5:30 PM",
  "6:00 PM",
  "6:30 PM",
]
const academicPeriods = [
  "Term",
  "Semester",
  "Trimester",
  "Quarters",
  "Non Term",
]

const InstitutionOnboardingPage = () => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("contact-locations")

  // 1. Contact Details
  const [contact, setContact] = useState({
    schoolName: "",
    contact: "",
    email: "",
  })

  // 2. Training Locations
  const [locations, setLocations] = useState([
    {
      location: "",
      country: "",
      branchName: "",
      address: "",
      pocName: "",
      pocPhone: "",
      pocEmail: "",
    },
  ])

  // 3. Age Groups Served
  const [ageGroupRows, setAgeGroupRows] = useState([
    {
      branchName: "",
      Kindergarten: false,
      "Lower Primary": false,
      "Upper Primary": false,
      JSS: false,
      Secondary: false,
      Adults: false,
    },
  ])

  // 4. Training Centre/Branch Information
  const [branchInfo, setBranchInfo] = useState([
    { branchName: "", courses: "", classType: "", method: "", classrooms: "" },
  ])

  // 5. Affiliate Courses
  const [selectedCourses, setSelectedCourses] = useState<
    Record<string, boolean>
  >({})

  // 6. Class Types
  // No state needed, just static info

  // 7. Availability & Schedule
  const [availability, setAvailability] = useState<Record<string, boolean>>({})
  const [calComLink, setCalComLink] = useState("")

  // 8. Academic Period
  const [academic, setAcademic] = useState({ period: "", duration: "" })

  // 9. Rate Card
  const [rateCard, setRateCard] = useState([
    { course: "", classType: "", method: "", rate: "" },
  ])

  // 10. Split Ratio & Preferences
  const [split, setSplit] = useState({ instructor: "", organisation: "" })
  const [instructorPrefs, setInstructorPrefs] = useState([
    {
      course: "",
      type: "",
      gender: "",
      classType: "",
      method: "",
      edu: "",
      experience: "",
      skills: "",
      proBody: "",
      day: "",
      time: "",
      fee: "",
    },
  ])

  // 11. Training Schedule & Fees
  const [schedule, setSchedule] = useState([
    {
      course: "",
      instructor: "",
      lessons: "",
      hours: "",
      hourlyFee: "",
      totalFee: "",
      materialFee: "",
      academicPeriods: "",
      feePerPeriod: "",
    },
  ])

  // 12. Registration Confirmation
  const [confirmation, setConfirmation] = useState({
    providedBy: "",
    date: "",
    position: "",
    seal: "",
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = {
      contact,
      locations,
      ageGroupRows,
      branchInfo,
      selectedCourses,
      availability, // Or calComLink depending on final data structure
      calComLink,
      academic,
      rateCard,
      split,
      instructorPrefs,
      schedule,
      confirmation,
    }
    console.log("Institution Onboarding Data:", formData)
    router.push("/dashboard/institution?onboarding=success")
  }

  const inputClasses =
    "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2 bg-white text-gray-900"
  const labelClasses = "block text-sm font-medium text-gray-700"
  const buttonPrimaryClasses =
    "inline-flex items-center justify-center rounded-md border border-transparent bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
  const buttonSecondaryClasses =
    "inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1"
  const buttonDangerClasses =
    "inline-flex items-center justify-center rounded-md border border-red-500 bg-transparent px-3 py-1.5 text-sm font-medium text-red-500 shadow-sm hover:bg-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
  const cardBaseClasses = "bg-white shadow-xl rounded-xl overflow-hidden" // Renamed from cardClasses to avoid conflict with ShadCN Card
  const cardContentClasses = "p-6 sm:p-8"
  const sectionTitleClasses = "text-2xl font-semibold text-gray-800 mb-6"
  const addMoreButtonClasses =
    "inline-flex items-center text-sky-600 hover:text-sky-800 text-sm font-medium"

  const tabOrder = [
    "contact-locations",
    "age-branch",
    "courses-types",
    "availability-academic",
    "rates-split",
    "schedule-confirmation",
  ]
  const currentTabIndex = tabOrder.indexOf(activeTab)
  const isLastTab = currentTabIndex === tabOrder.length - 1

  const handleNext = () => {
    if (!isLastTab) {
      setActiveTab(tabOrder[currentTabIndex + 1])
    }
  }

  const handlePrevious = () => {
    if (currentTabIndex > 0) {
      setActiveTab(tabOrder[currentTabIndex - 1])
    }
  }

  return (
    <div className="bg-background flex min-h-screen flex-col px-4 py-8 sm:px-8 lg:px-16">
      <Card className="bg-card mx-auto flex w-full max-w-7xl flex-1 flex-col border-none shadow-none">
        <CardHeader>
          <CardTitle className="text-center text-3xl font-bold text-sky-700">
            Institution Registration
          </CardTitle>
        </CardHeader>
        <CardContent className={`${cardContentClasses} flex flex-1 flex-col`}>
          <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
            <Tabs
              defaultValue="contact-locations"
              value={activeTab}
              className="flex w-full flex-1 flex-col"
              onValueChange={setActiveTab}
            >
              <TabsList className="mb-4 flex w-full space-x-1 overflow-x-auto">
                <TabsTrigger value="contact-locations">
                  Contact & Locations
                </TabsTrigger>
                <TabsTrigger value="age-branch">
                  Age Groups & Branch Info
                </TabsTrigger>
                <TabsTrigger value="courses-types">
                  Courses & Class Types
                </TabsTrigger>
                <TabsTrigger value="availability-academic">
                  Availability & Academic
                </TabsTrigger>
                <TabsTrigger value="rates-split">
                  Rates & Split Ratio
                </TabsTrigger>
                <TabsTrigger value="schedule-confirmation">
                  Schedule & Confirmation
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="contact-locations"
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
                            School Name
                          </label>
                          <input
                            type="text"
                            id="schoolName"
                            value={contact.schoolName}
                            onChange={(e) =>
                              setContact({
                                ...contact,
                                schoolName: e.target.value,
                              })
                            }
                            className={inputClasses}
                            placeholder="Your institution's name"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="contactNumber"
                            className={labelClasses}
                          >
                            Contact Number
                          </label>
                          <input
                            type="text"
                            id="contactNumber"
                            value={contact.contact}
                            onChange={(e) =>
                              setContact({
                                ...contact,
                                contact: e.target.value,
                              })
                            }
                            className={inputClasses}
                            placeholder="e.g., +1 234 567 8900"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label
                            htmlFor="emailAddress"
                            className={labelClasses}
                          >
                            Email Address
                          </label>
                          <input
                            type="email"
                            id="emailAddress"
                            value={contact.email}
                            onChange={(e) =>
                              setContact({ ...contact, email: e.target.value })
                            }
                            className={inputClasses}
                            placeholder="contact@institution.com"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className={sectionTitleClasses}>
                        Training Locations
                      </CardTitle>
                      <button
                        type="button"
                        onClick={() =>
                          setLocations([
                            ...locations,
                            {
                              location: "",
                              country: "",
                              branchName: "",
                              address: "",
                              pocName: "",
                              pocPhone: "",
                              pocEmail: "",
                            },
                          ])
                        }
                        className={addMoreButtonClasses}
                      >
                        <PlusCircle className="mr-1 h-5 w-5" /> Add Location
                      </button>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {locations.map((loc, i) => (
                          <div
                            key={i}
                            className="relative rounded-lg border border-gray-200 bg-slate-50 p-4 shadow-sm"
                          >
                            {locations.length > 1 && (
                              <button
                                type="button"
                                className={`${buttonDangerClasses} absolute top-2 right-2 h-7 w-7 p-1`}
                                onClick={() =>
                                  setLocations(
                                    locations.filter((_, idx) => idx !== i),
                                  )
                                }
                                title="Remove Location"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              <input
                                placeholder="Location Nickname (e.g., Main Campus)"
                                value={loc.location}
                                onChange={(e) =>
                                  setLocations((locs) =>
                                    locs.map((l, idx) =>
                                      idx === i
                                        ? { ...l, location: e.target.value }
                                        : l,
                                    ),
                                  )
                                }
                                className={inputClasses}
                              />
                              <input
                                placeholder="Country"
                                value={loc.country}
                                onChange={(e) =>
                                  setLocations((locs) =>
                                    locs.map((l, idx) =>
                                      idx === i
                                        ? { ...l, country: e.target.value }
                                        : l,
                                    ),
                                  )
                                }
                                className={inputClasses}
                              />
                              <input
                                placeholder="Training Centre/Branch Name"
                                value={loc.branchName}
                                onChange={(e) =>
                                  setLocations((locs) =>
                                    locs.map((l, idx) =>
                                      idx === i
                                        ? { ...l, branchName: e.target.value }
                                        : l,
                                    ),
                                  )
                                }
                                className={inputClasses}
                              />
                              <input
                                placeholder="Full Address"
                                value={loc.address}
                                onChange={(e) =>
                                  setLocations((locs) =>
                                    locs.map((l, idx) =>
                                      idx === i
                                        ? { ...l, address: e.target.value }
                                        : l,
                                    ),
                                  )
                                }
                                className={inputClasses}
                              />
                              <input
                                placeholder="POC Name"
                                value={loc.pocName}
                                onChange={(e) =>
                                  setLocations((locs) =>
                                    locs.map((l, idx) =>
                                      idx === i
                                        ? { ...l, pocName: e.target.value }
                                        : l,
                                    ),
                                  )
                                }
                                className={inputClasses}
                              />
                              <input
                                placeholder="POC Phone"
                                value={loc.pocPhone}
                                onChange={(e) =>
                                  setLocations((locs) =>
                                    locs.map((l, idx) =>
                                      idx === i
                                        ? { ...l, pocPhone: e.target.value }
                                        : l,
                                    ),
                                  )
                                }
                                className={inputClasses}
                              />
                              <input
                                placeholder="POC E-mail"
                                value={loc.pocEmail}
                                onChange={(e) =>
                                  setLocations((locs) =>
                                    locs.map((l, idx) =>
                                      idx === i
                                        ? { ...l, pocEmail: e.target.value }
                                        : l,
                                    ),
                                  )
                                }
                                className={inputClasses}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent
                value="age-branch"
                className="flex-1 overflow-y-auto"
              >
                <div className="space-y-8 px-1 py-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className={sectionTitleClasses}>
                        Age Groups Served
                      </CardTitle>
                      <button
                        type="button"
                        onClick={() =>
                          setAgeGroupRows([
                            ...ageGroupRows,
                            {
                              branchName: "",
                              Kindergarten: false,
                              "Lower Primary": false,
                              "Upper Primary": false,
                              JSS: false,
                              Secondary: false,
                              Adults: false,
                            },
                          ])
                        }
                        className={addMoreButtonClasses}
                      >
                        <PlusCircle className="mr-1 h-5 w-5" /> Add Row
                      </button>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="min-w-full border text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="border px-3 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                Branch Name
                              </th>
                              {ageGroups.map((g) => (
                                <th
                                  key={g}
                                  className="border px-3 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                                >
                                  {g}
                                </th>
                              ))}
                              <th className="border px-3 py-2"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {ageGroupRows.map((row, i) => (
                              <tr key={i}>
                                <td className="border px-3 py-2 whitespace-nowrap">
                                  <input
                                    placeholder="Branch Name"
                                    value={row.branchName}
                                    onChange={(e) =>
                                      setAgeGroupRows((rows) =>
                                        rows.map((r, idx) =>
                                          idx === i
                                            ? {
                                                ...r,
                                                branchName: e.target.value,
                                              }
                                            : r,
                                        ),
                                      )
                                    }
                                    className={inputClasses}
                                  />
                                </td>
                                {ageGroups.map((g) => (
                                  <td
                                    key={g}
                                    className="border px-3 py-2 text-center whitespace-nowrap"
                                  >
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                                      checked={!!row[g as keyof typeof row]}
                                      onChange={(e) =>
                                        setAgeGroupRows((rows) =>
                                          rows.map((r, idx) =>
                                            idx === i
                                              ? { ...r, [g]: e.target.checked }
                                              : r,
                                          ),
                                        )
                                      }
                                    />
                                  </td>
                                ))}
                                <td className="border px-3 py-2 text-center whitespace-nowrap">
                                  {ageGroupRows.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setAgeGroupRows((rows) =>
                                          rows.filter((_, idx) => idx !== i),
                                        )
                                      }
                                      className={`${buttonDangerClasses} h-7 w-7 p-1`}
                                      title="Remove Row"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className={sectionTitleClasses}>
                        Training Centre/Branch Information
                      </CardTitle>
                      <button
                        type="button"
                        onClick={() =>
                          setBranchInfo([
                            ...branchInfo,
                            {
                              branchName: "",
                              courses: "",
                              classType: "",
                              method: "",
                              classrooms: "",
                            },
                          ])
                        }
                        className={addMoreButtonClasses}
                      >
                        <PlusCircle className="mr-1 h-5 w-5" /> Add Branch
                      </button>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {branchInfo.map((info, i) => (
                          <div
                            key={i}
                            className="relative rounded-lg border border-gray-200 bg-slate-50 p-4 shadow-sm"
                          >
                            {branchInfo.length > 1 && (
                              <button
                                type="button"
                                className={`${buttonDangerClasses} absolute top-2 right-2 h-7 w-7 p-1`}
                                onClick={() =>
                                  setBranchInfo(
                                    branchInfo.filter((_, idx) => idx !== i),
                                  )
                                }
                                title="Remove Branch"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              <input
                                placeholder="Training Centre/Branch Name"
                                value={info.branchName}
                                onChange={(e) =>
                                  setBranchInfo((infos) =>
                                    infos.map((b, idx) =>
                                      idx === i
                                        ? { ...b, branchName: e.target.value }
                                        : b,
                                    ),
                                  )
                                }
                                className={inputClasses}
                              />
                              <input
                                placeholder="Courses Offered (comma-separated)"
                                value={info.courses}
                                onChange={(e) =>
                                  setBranchInfo((infos) =>
                                    infos.map((b, idx) =>
                                      idx === i
                                        ? { ...b, courses: e.target.value }
                                        : b,
                                    ),
                                  )
                                }
                                className={inputClasses}
                              />
                              <input
                                placeholder="Class Type (e.g., Group, Private)"
                                value={info.classType}
                                onChange={(e) =>
                                  setBranchInfo((infos) =>
                                    infos.map((b, idx) =>
                                      idx === i
                                        ? { ...b, classType: e.target.value }
                                        : b,
                                    ),
                                  )
                                }
                                className={inputClasses}
                              />
                              <input
                                placeholder="Training Method (e.g., In-Person)"
                                value={info.method}
                                onChange={(e) =>
                                  setBranchInfo((infos) =>
                                    infos.map((b, idx) =>
                                      idx === i
                                        ? { ...b, method: e.target.value }
                                        : b,
                                    ),
                                  )
                                }
                                className={inputClasses}
                              />
                              <input
                                placeholder="Number of Classrooms (1-20)"
                                type="number"
                                min="1"
                                max="20"
                                value={info.classrooms}
                                onChange={(e) =>
                                  setBranchInfo((infos) =>
                                    infos.map((b, idx) =>
                                      idx === i
                                        ? { ...b, classrooms: e.target.value }
                                        : b,
                                    ),
                                  )
                                }
                                className={inputClasses}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent
                value="courses-types"
                className="flex-1 overflow-y-auto"
              >
                <div className="space-y-8 px-1 py-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className={sectionTitleClasses}>
                        Affiliate Courses Offered
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {affiliateCourses.map((cat) => (
                          <div
                            key={cat.category}
                            className="rounded-lg border border-gray-200 bg-slate-50 p-4 shadow-sm"
                          >
                            <h3 className="mb-3 text-lg font-semibold text-sky-700">
                              {cat.category}
                            </h3>
                            <div className="flex flex-wrap gap-3">
                              {cat.items.map((item) => (
                                <label
                                  key={item}
                                  className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-within:ring-2 focus-within:ring-sky-500 focus-within:ring-offset-1 hover:bg-gray-100 ${selectedCourses[item] ? "border-sky-600 bg-sky-600 text-white hover:bg-sky-700" : "border-gray-300 bg-white text-gray-700"}`}
                                >
                                  <input
                                    type="checkbox"
                                    className="sr-only" // Visually hide the checkbox
                                    checked={!!selectedCourses[item]}
                                    onChange={(e) =>
                                      setSelectedCourses((sc) => ({
                                        ...sc,
                                        [item]: e.target.checked,
                                      }))
                                    }
                                  />
                                  {item}
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className={sectionTitleClasses}>
                        Class Types Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="rounded-lg border border-gray-200 bg-slate-50 p-4 shadow-sm">
                        <h3 className="mb-1 text-lg font-semibold text-sky-700">
                          Private Classes
                        </h3>
                        <p className="text-sm text-gray-600">
                          Private classes offered on demand at home, schools or
                          organisations. In Person or Virtual Classes.
                        </p>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-slate-50 p-4 shadow-sm">
                        <h3 className="mb-1 text-lg font-semibold text-sky-700">
                          Group Classes
                        </h3>
                        <p className="text-sm text-gray-600">
                          Ideal for vocational classes, Workshops, master
                          classes, Camps, and project training groups classes.
                          In Person or Virtual Classes.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent
                value="availability-academic"
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
                        To manage your institution's teaching schedule and
                        availability, please connect with Cal.com. You can set
                        up your calendar by clicking the button below.
                      </p>
                      <a
                        href="https://cal.com/signup"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${buttonPrimaryClasses} mb-6 w-full sm:w-auto`}
                      >
                        <CalendarDays className="mr-2 h-5 w-5" />
                        Set Up Availability on Cal.com
                      </a>
                      <p className="mb-2 text-sm text-gray-600">
                        Once configured, you can embed your Cal.com scheduling
                        page link here for your institution or main branch
                        (optional):
                      </p>
                      <input
                        type="url"
                        id="calComLink"
                        placeholder="https://cal.com/your-institution"
                        className={inputClasses}
                        value={calComLink}
                        onChange={(e) => setCalComLink(e.target.value)}
                      />
                      <div className="mt-1 text-xs text-gray-500">
                        (Example: Embedding your Cal.com page for general
                        bookings or main branch availability)
                      </div>
                      <p className="mt-6 text-gray-600">
                        For specific branch availability, you might need to
                        manage multiple Cal.com accounts or use Cal.com's team
                        features.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className={sectionTitleClasses}>
                        School Academic Period
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-6">
                        <label className={`${labelClasses} mb-2`}>
                          Select Academic Period Structure
                        </label>
                        <div className="flex flex-wrap gap-3">
                          {academicPeriods.map((period) => (
                            <button
                              key={period}
                              type="button"
                              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors focus:ring-2 focus:ring-sky-500 focus:ring-offset-1 focus:outline-none ${academic.period === period ? "border-sky-600 bg-sky-600 text-white" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}
                              onClick={() =>
                                setAcademic((a) => ({ ...a, period }))
                              }
                            >
                              {period}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label htmlFor="avgDuration" className={labelClasses}>
                          Average Period Duration (weeks)
                        </label>
                        <input
                          id="avgDuration"
                          type="number"
                          min="0"
                          value={academic.duration}
                          onChange={(e) =>
                            setAcademic((a) => ({
                              ...a,
                              duration: e.target.value,
                            }))
                          }
                          className={inputClasses}
                          placeholder="e.g., 12"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent
                value="rates-split"
                className="flex-1 overflow-y-auto"
              >
                <div className="space-y-8 px-1 py-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className={sectionTitleClasses}>
                        Rate Card
                      </CardTitle>
                      <button
                        type="button"
                        onClick={() =>
                          setRateCard([
                            ...rateCard,
                            {
                              course: "",
                              classType: "",
                              method: "",
                              rate: "",
                            },
                          ])
                        }
                        className={addMoreButtonClasses}
                      >
                        <PlusCircle className="mr-1 h-5 w-5" /> Add Rate
                      </button>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {rateCard.map((row, i) => (
                          <div
                            key={i}
                            className="relative rounded-lg border border-gray-200 bg-slate-50 p-4 shadow-sm"
                          >
                            {rateCard.length > 1 && (
                              <button
                                type="button"
                                className={`${buttonDangerClasses} absolute top-2 right-2 h-7 w-7 p-1`}
                                onClick={() =>
                                  setRateCard(
                                    rateCard.filter((_, idx) => idx !== i),
                                  )
                                }
                                title="Remove Rate"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                              <input
                                placeholder="Course Name"
                                value={row.course}
                                onChange={(e) =>
                                  setRateCard((rows) =>
                                    rows.map((r, idx) =>
                                      idx === i
                                        ? { ...r, course: e.target.value }
                                        : r,
                                    ),
                                  )
                                }
                                className={inputClasses}
                              />
                              <input
                                placeholder="Class Type (e.g., Group)"
                                value={row.classType}
                                onChange={(e) =>
                                  setRateCard((rows) =>
                                    rows.map((r, idx) =>
                                      idx === i
                                        ? { ...r, classType: e.target.value }
                                        : r,
                                    ),
                                  )
                                }
                                className={inputClasses}
                              />
                              <input
                                placeholder="Training Method (e.g., In-Person)"
                                value={row.method}
                                onChange={(e) =>
                                  setRateCard((rows) =>
                                    rows.map((r, idx) =>
                                      idx === i
                                        ? { ...r, method: e.target.value }
                                        : r,
                                    ),
                                  )
                                }
                                className={inputClasses}
                              />
                              <input
                                placeholder="Rate Card Per Hr (USD)"
                                type="number"
                                min="0"
                                step="0.01"
                                value={row.rate}
                                onChange={(e) =>
                                  setRateCard((rows) =>
                                    rows.map((r, idx) =>
                                      idx === i
                                        ? { ...r, rate: e.target.value }
                                        : r,
                                    ),
                                  )
                                }
                                className={inputClasses}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className={sectionTitleClasses}>
                        Revenue Split Ratio & Instructor Preferences
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-8 rounded-lg border border-gray-200 bg-slate-50 p-4 shadow-sm">
                        <h3 className="mb-3 text-lg font-semibold text-sky-700">
                          Revenue Split Ratio
                        </h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label
                              htmlFor="instructorSplit"
                              className={labelClasses}
                            >
                              Instructor %
                            </label>
                            <input
                              id="instructorSplit"
                              type="number"
                              min="0"
                              max="100"
                              value={split.instructor}
                              onChange={(e) =>
                                setSplit((s) => ({
                                  ...s,
                                  instructor: e.target.value,
                                }))
                              }
                              className={inputClasses}
                              placeholder="e.g., 70"
                            />
                          </div>
                          <div>
                            <label htmlFor="orgSplit" className={labelClasses}>
                              Organisation %
                            </label>
                            <input
                              id="orgSplit"
                              type="number"
                              min="0"
                              max="100"
                              value={split.organisation}
                              onChange={(e) =>
                                setSplit((s) => ({
                                  ...s,
                                  organisation: e.target.value,
                                }))
                              }
                              className={inputClasses}
                              placeholder="e.g., 30"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="mb-4 flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-sky-700">
                            Instructor Search Preferences/Filters
                          </h3>
                          <button
                            type="button"
                            onClick={() =>
                              setInstructorPrefs([
                                ...instructorPrefs,
                                {
                                  course: "",
                                  type: "",
                                  gender: "",
                                  classType: "",
                                  method: "",
                                  edu: "",
                                  experience: "",
                                  skills: "",
                                  proBody: "",
                                  day: "",
                                  time: "",
                                  fee: "",
                                },
                              ])
                            }
                            className={addMoreButtonClasses}
                          >
                            <PlusCircle className="mr-1 h-5 w-5" /> Add
                            Preference
                          </button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full border text-xs">
                            <thead className="bg-gray-50">
                              <tr>
                                {[
                                  "Course",
                                  "Type",
                                  "Gender",
                                  "Class Type",
                                  "Method",
                                  "Edu.",
                                  "Exp.",
                                  "Skills",
                                  "Pro. Body",
                                  "Day",
                                  "Time",
                                  "Fee",
                                ].map((header) => (
                                  <th
                                    key={header}
                                    className="border px-2 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                                  >
                                    {header}
                                  </th>
                                ))}
                                <th className="border px-2 py-1"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                              {instructorPrefs.map((row, i) => (
                                <tr key={i}>
                                  {Object.entries(row).map(([key, value]) => (
                                    <td
                                      key={key}
                                      className="border px-2 py-1 whitespace-nowrap"
                                    >
                                      <input
                                        placeholder={
                                          key.charAt(0).toUpperCase() +
                                          key.slice(1)
                                        }
                                        value={value}
                                        onChange={(e) =>
                                          setInstructorPrefs((rows) =>
                                            rows.map((r, ridx) =>
                                              ridx === i
                                                ? {
                                                    ...r,
                                                    [key]: e.target.value,
                                                  }
                                                : r,
                                            ),
                                          )
                                        }
                                        className={`${inputClasses} p-1 text-xs`}
                                      />
                                    </td>
                                  ))}
                                  <td className="border px-2 py-1 text-center whitespace-nowrap">
                                    {instructorPrefs.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setInstructorPrefs((rows) =>
                                            rows.filter((_, idx) => idx !== i),
                                          )
                                        }
                                        className={`${buttonDangerClasses} h-6 w-6 p-0.5`}
                                        title="Remove Preference"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent
                value="schedule-confirmation"
                className="flex-1 overflow-y-auto"
              >
                <div className="space-y-8 px-1 py-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className={sectionTitleClasses}>
                        Training Schedule & Fees Structure
                      </CardTitle>
                      <button
                        type="button"
                        onClick={() =>
                          setSchedule([
                            ...schedule,
                            {
                              course: "",
                              instructor: "",
                              lessons: "",
                              hours: "",
                              hourlyFee: "",
                              totalFee: "",
                              materialFee: "",
                              academicPeriods: "",
                              feePerPeriod: "",
                            },
                          ])
                        }
                        className={addMoreButtonClasses}
                      >
                        <PlusCircle className="mr-1 h-5 w-5" /> Add Schedule Row
                      </button>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="min-w-full border text-xs">
                          <thead className="bg-gray-50">
                            <tr>
                              {[
                                "Course/Program",
                                "Instructor",
                                "No. Lessons",
                                "# Hrs",
                                "Hourly Fee",
                                "Total Fee",
                                "Material Fee",
                                "Acad. Periods",
                                "Fee/Period",
                              ].map((header) => (
                                <th
                                  key={header}
                                  className="border px-2 py-2 text-left text-xs font-medium tracking-wider whitespace-nowrap text-gray-500 uppercase"
                                >
                                  {header}
                                </th>
                              ))}
                              <th className="border px-2 py-1"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {schedule.map((row, i) => (
                              <tr key={i}>
                                <td className="border px-2 py-1 whitespace-nowrap">
                                  <input
                                    value={row.course}
                                    onChange={(e) =>
                                      setSchedule((prev) =>
                                        prev.map((r, idx) =>
                                          idx === i
                                            ? { ...r, course: e.target.value }
                                            : r,
                                        ),
                                      )
                                    }
                                    className={`${inputClasses} p-1 text-xs`}
                                    placeholder="Course Name"
                                  />
                                </td>
                                <td className="border px-2 py-1 whitespace-nowrap">
                                  <input
                                    value={row.instructor}
                                    onChange={(e) =>
                                      setSchedule((prev) =>
                                        prev.map((r, idx) =>
                                          idx === i
                                            ? {
                                                ...r,
                                                instructor: e.target.value,
                                              }
                                            : r,
                                        ),
                                      )
                                    }
                                    className={`${inputClasses} p-1 text-xs`}
                                    placeholder="Instructor"
                                  />
                                </td>
                                <td className="border px-2 py-1 whitespace-nowrap">
                                  <input
                                    type="number"
                                    value={row.lessons}
                                    onChange={(e) =>
                                      setSchedule((prev) =>
                                        prev.map((r, idx) =>
                                          idx === i
                                            ? { ...r, lessons: e.target.value }
                                            : r,
                                        ),
                                      )
                                    }
                                    className={`${inputClasses} w-16 p-1 text-xs`}
                                    placeholder="e.g. 10"
                                  />
                                </td>
                                <td className="border px-2 py-1 whitespace-nowrap">
                                  <input
                                    type="number"
                                    value={row.hours}
                                    onChange={(e) =>
                                      setSchedule((prev) =>
                                        prev.map((r, idx) =>
                                          idx === i
                                            ? { ...r, hours: e.target.value }
                                            : r,
                                        ),
                                      )
                                    }
                                    className={`${inputClasses} w-16 p-1 text-xs`}
                                    placeholder="e.g. 1"
                                  />
                                </td>
                                <td className="border px-2 py-1 whitespace-nowrap">
                                  <input
                                    type="number"
                                    value={row.hourlyFee}
                                    onChange={(e) =>
                                      setSchedule((prev) =>
                                        prev.map((r, idx) =>
                                          idx === i
                                            ? {
                                                ...r,
                                                hourlyFee: e.target.value,
                                              }
                                            : r,
                                        ),
                                      )
                                    }
                                    className={`${inputClasses} w-20 p-1 text-xs`}
                                    placeholder="USD"
                                  />
                                </td>
                                <td className="border px-2 py-1 whitespace-nowrap">
                                  <input
                                    type="number"
                                    value={row.totalFee}
                                    onChange={(e) =>
                                      setSchedule((prev) =>
                                        prev.map((r, idx) =>
                                          idx === i
                                            ? { ...r, totalFee: e.target.value }
                                            : r,
                                        ),
                                      )
                                    }
                                    className={`${inputClasses} w-20 p-1 text-xs`}
                                    placeholder="USD"
                                  />
                                </td>
                                <td className="border px-2 py-1 whitespace-nowrap">
                                  <input
                                    type="number"
                                    value={row.materialFee}
                                    onChange={(e) =>
                                      setSchedule((prev) =>
                                        prev.map((r, idx) =>
                                          idx === i
                                            ? {
                                                ...r,
                                                materialFee: e.target.value,
                                              }
                                            : r,
                                        ),
                                      )
                                    }
                                    className={`${inputClasses} w-20 p-1 text-xs`}
                                    placeholder="USD"
                                  />
                                </td>
                                <td className="border px-2 py-1 whitespace-nowrap">
                                  <input
                                    value={row.academicPeriods}
                                    onChange={(e) =>
                                      setSchedule((prev) =>
                                        prev.map((r, idx) =>
                                          idx === i
                                            ? {
                                                ...r,
                                                academicPeriods: e.target.value,
                                              }
                                            : r,
                                        ),
                                      )
                                    }
                                    className={`${inputClasses} p-1 text-xs`}
                                    placeholder="e.g. Term 1"
                                  />
                                </td>
                                <td className="border px-2 py-1 whitespace-nowrap">
                                  <input
                                    type="number"
                                    value={row.feePerPeriod}
                                    onChange={(e) =>
                                      setSchedule((prev) =>
                                        prev.map((r, idx) =>
                                          idx === i
                                            ? {
                                                ...r,
                                                feePerPeriod: e.target.value,
                                              }
                                            : r,
                                        ),
                                      )
                                    }
                                    className={`${inputClasses} w-20 p-1 text-xs`}
                                    placeholder="USD"
                                  />
                                </td>
                                <td className="border px-2 py-1 text-center whitespace-nowrap">
                                  {schedule.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setSchedule((rows) =>
                                          rows.filter((_, idx) => idx !== i),
                                        )
                                      }
                                      className={`${buttonDangerClasses} h-6 w-6 p-0.5`}
                                      title="Remove Schedule Row"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className={sectionTitleClasses}>
                        Registration Confirmation
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                        <div>
                          <label htmlFor="providedBy" className={labelClasses}>
                            Provided by (Full Name)
                          </label>
                          <input
                            id="providedBy"
                            type="text"
                            value={confirmation.providedBy}
                            onChange={(e) =>
                              setConfirmation((c) => ({
                                ...c,
                                providedBy: e.target.value,
                              }))
                            }
                            className={inputClasses}
                            placeholder="Full name of authorising person"
                          />
                        </div>
                        <div>
                          <label htmlFor="confirmDate" className={labelClasses}>
                            Date of Confirmation
                          </label>
                          <input
                            id="confirmDate"
                            type="date"
                            value={confirmation.date}
                            onChange={(e) =>
                              setConfirmation((c) => ({
                                ...c,
                                date: e.target.value,
                              }))
                            }
                            className={inputClasses}
                          />
                        </div>
                        <div>
                          <label htmlFor="position" className={labelClasses}>
                            Position/Title
                          </label>
                          <input
                            id="position"
                            type="text"
                            value={confirmation.position}
                            onChange={(e) =>
                              setConfirmation((c) => ({
                                ...c,
                                position: e.target.value,
                              }))
                            }
                            className={inputClasses}
                            placeholder="e.g., Director, Principal"
                          />
                        </div>
                        <div>
                          <label htmlFor="schoolSeal" className={labelClasses}>
                            School Seal/Stamp Reference (Optional)
                          </label>
                          <input
                            id="schoolSeal"
                            type="text"
                            value={confirmation.seal}
                            onChange={(e) =>
                              setConfirmation((c) => ({
                                ...c,
                                seal: e.target.value,
                              }))
                            }
                            className={inputClasses}
                            placeholder="Reference or description if applicable"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
            <div className="mt-auto flex items-center justify-between pt-8">
              <div>
                {currentTabIndex > 0 && (
                  <Button
                    type="button"
                    onClick={handlePrevious}
                    className={`${buttonSecondaryClasses} px-8 py-3 text-base`}
                  >
                    Previous
                  </Button>
                )}
              </div>
              <Button
                type={isLastTab ? "submit" : "button"}
                onClick={isLastTab ? undefined : handleNext}
                className={`${buttonPrimaryClasses} w-full px-8 py-3 text-base sm:w-auto`}
              >
                {isLastTab ? "Submit Institution Registration" : "Next"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default InstitutionOnboardingPage
