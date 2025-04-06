"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormDescription, FormLabel } from "@/components/ui/form"
import { Award, Grip, PlusCircle, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

const MembershipSchema = z.object({
  id: z.string(),
  organization: z.string().min(1, "Organization name is required"),
  role: z.string().optional(),
  memberSince: z.string().optional(),
  current: z.boolean().default(true),
  endYear: z.string().optional(),
  certificateUrl: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  description: z.string().optional(),
})

const MembershipFormSchema = z.object({
  memberships: z.array(MembershipSchema),
})

type Membership = z.infer<typeof MembershipSchema>
type MembershipFormValues = z.infer<typeof MembershipFormSchema>

export default function ProfessionalMembershipsSettings() {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const form = useForm<MembershipFormValues>({
    resolver: zodResolver(MembershipFormSchema),
    defaultValues: {
      memberships: [
        {
          organization: "IEEE",
          role: "Member",
          memberSince: "2000",
          current: true,
          endYear: "",
          certificateUrl: "",
          description: "",
        },
      ],
    },
  })

  const memberships = form.watch("memberships")

  function onSubmit(data: MembershipFormValues) {
    /** TODO: Save memberships to API */
    toast.success("Memberships updated successfully.")
    console.log(data)
  }

  const addMembership = () => {
    const newId = (
      memberships.length > 0
        ? Math.max(...memberships.map((m) => parseInt(m.id))) + 1
        : 1
    ).toString()

    const newMembership: Membership = {
      id: newId,
      organization: "",
      role: "",
      memberSince: "",
      current: true,
      endYear: "",
      certificateUrl: "",
      description: "",
    }

    form.setValue("memberships", [...memberships, newMembership])
  }

  const removeMembership = (id: string) => {
    /** TODO: Remove membership from API */
    const filteredMemberships = memberships.filter((mem) => mem.id !== id)
    form.setValue("memberships", filteredMemberships)
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    index: number,
  ) => {
    e.preventDefault()
    if (draggedIndex === null) return

    const newMemberships = [...memberships]
    const draggedMembership = newMemberships[draggedIndex]

    newMemberships.splice(draggedIndex, 1)
    newMemberships.splice(index, 0, draggedMembership)

    form.setValue("memberships", newMemberships)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const updateMembershipField = (
    id: string,
    field: keyof Membership,
    value: unknown,
  ) => {
    const updatedMemberships = memberships.map((mem) =>
      mem.id === id ? { ...mem, [field]: value } : mem,
    )

    form.setValue("memberships", updatedMemberships)

    if (field === "current" && value === true) {
      const updatedWithEndYear = updatedMemberships.map((mem) =>
        mem.id === id ? { ...mem, endYear: "" } : mem,
      )
      form.setValue("memberships", updatedWithEndYear)
    }
  }

  const getMembershipPeriod = (membership: Membership) => {
    if (!membership.memberSince) return ""

    if (membership.current) {
      return `${membership.memberSince} - Present`
    }

    if (membership.endYear) {
      return `${membership.memberSince} - ${membership.endYear}`
    }

    return membership.memberSince
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Professional Memberships</h1>
        <p className="text-muted-foreground text-sm">
          Add organizations, associations and professional bodies you belong to
        </p>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4">
              {memberships.length === 0 ? (
                <div className="rounded-md border border-dashed p-6 text-center">
                  <Award className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
                  <h3 className="mb-1 font-medium">No memberships added</h3>
                  <p className="text-muted-foreground mb-4 text-sm">
                    Add your professional memberships and associations
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addMembership}
                    className="inline-flex items-center justify-center gap-2"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Add Membership
                  </Button>
                </div>
              ) : (
                memberships.map((membership, index) => (
                  <div
                    key={membership.id || index}
                    className="bg-card group hover:bg-accent/5 relative rounded-md border transition-all"
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="space-y-5 p-5">
                      {/* Header with organization and role */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-2">
                          <Grip className="text-muted-foreground mt-1 h-5 w-5 cursor-grabbing opacity-0 transition-opacity group-hover:opacity-100" />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-medium">
                                {membership.organization || "New Membership"}
                              </h3>
                              {membership.current && (
                                <Badge
                                  variant="outline"
                                  className="border-green-200 bg-green-50 text-xs font-normal text-green-600"
                                >
                                  Active
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {membership.role && (
                                <p className="text-muted-foreground text-sm">
                                  {membership.role}
                                </p>
                              )}
                              {membership.memberSince && (
                                <span className="text-muted-foreground text-xs">
                                  • {getMembershipPeriod(membership)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="hover:bg-destructive-foreground h-8 w-8 cursor-pointer transition-colors"
                          onClick={() => removeMembership(membership.id)}
                        >
                          <Trash2 className="text-destructive h-4 w-4" />
                        </Button>
                      </div>

                      {/* Organization and Role */}
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="space-y-2">
                          <FormLabel className="text-sm font-medium">
                            Organization
                          </FormLabel>
                          <Input
                            placeholder="e.g. IEEE, ACM, Mathematical Society"
                            value={membership.organization}
                            onChange={(e) =>
                              updateMembershipField(
                                membership.id,
                                "organization",
                                e.target.value,
                              )
                            }
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <FormLabel className="text-sm font-medium">
                            Role/Membership Type
                          </FormLabel>
                          <Input
                            placeholder="e.g. Member, Board Member, Fellow"
                            value={membership.role || ""}
                            onChange={(e) =>
                              updateMembershipField(
                                membership.id,
                                "role",
                                e.target.value,
                              )
                            }
                            className="h-10"
                          />
                        </div>
                      </div>

                      {/* Year Range */}
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="space-y-2">
                          <FormLabel className="text-sm font-medium">
                            Member Since
                          </FormLabel>
                          <Input
                            type="number"
                            placeholder="YYYY"
                            min="1900"
                            max={new Date().getFullYear()}
                            value={membership.memberSince || ""}
                            onChange={(e) =>
                              updateMembershipField(
                                membership.id,
                                "memberSince",
                                e.target.value,
                              )
                            }
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <FormLabel className="text-sm font-medium">
                              End Year
                            </FormLabel>
                          </div>
                          <Input
                            type="number"
                            placeholder="YYYY"
                            min="1900"
                            max={new Date().getFullYear()}
                            value={membership.endYear || ""}
                            onChange={(e) =>
                              updateMembershipField(
                                membership.id,
                                "endYear",
                                e.target.value,
                              )
                            }
                            disabled={membership.current}
                            className="h-10"
                          />
                          <div className="mt-2 flex items-center space-x-2">
                            <Checkbox
                              id={`current-membership-${membership.id}`}
                              checked={membership.current}
                              onCheckedChange={(checked) =>
                                updateMembershipField(
                                  membership.id,
                                  "current",
                                  checked === true,
                                )
                              }
                            />
                            <label
                              htmlFor={`current-membership-${membership.id}`}
                              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Current member
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Certificate URL */}
                      <div className="space-y-2">
                        <FormLabel className="text-sm font-medium">
                          Certificate URL (Optional)
                        </FormLabel>
                        <Input
                          type="url"
                          placeholder="https://organization.com/my-certificate"
                          value={membership.certificateUrl || ""}
                          onChange={(e) =>
                            updateMembershipField(
                              membership.id,
                              "certificateUrl",
                              e.target.value,
                            )
                          }
                          className="h-10"
                        />
                        <FormDescription className="text-xs">
                          Link to any certificate, credential, or membership
                          profile
                        </FormDescription>
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <FormLabel className="text-sm font-medium">
                          Description (Optional)
                        </FormLabel>
                        <Input
                          placeholder="Briefly describe your involvement or achievements"
                          value={membership.description || ""}
                          onChange={(e) =>
                            updateMembershipField(
                              membership.id,
                              "description",
                              e.target.value,
                            )
                          }
                          className="h-10"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Membership Button */}
            {memberships.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={addMembership}
                className="flex w-full items-center justify-center gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                Add Another Membership
              </Button>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-2">
              <Button type="submit" className="px-6">
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
