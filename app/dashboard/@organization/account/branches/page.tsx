"use client"

import * as z from "zod"
import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { PlusCircle, Trash2 } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

const ageGroups = [
  "Kindergarten",
  "Lower Primary",
  "Upper Primary",
  "JSS",
  "Secondary",
  "Adults",
] as const

const branchesSchema = z.object({
  branches: z.array(
    z.object({
      id: z.string().optional(),
      branchName: z.string().min(1, "Branch name is required."),
      country: z.string().min(1, "Country is required."),
      address: z.string().min(1, "Address is required."),
      pocName: z.string().min(1, "Point of contact name is required."),
      pocPhone: z.string().min(1, "Point of contact phone is required."),
      pocEmail: z.string().email("Invalid email for point of contact."),
      coursesOffered: z.string().optional(),
      classrooms: z.number().min(0, "Must be a positive number").optional(),
      ageGroups: z.array(z.string()).optional(),
    }),
  ),
})

type BranchesFormValues = z.infer<typeof branchesSchema>

export default function BranchesPage() {
  const form = useForm<BranchesFormValues>({
    resolver: zodResolver(branchesSchema),
    defaultValues: {
      branches: [
        {
          branchName: "Main Campus",
          country: "Kenya",
          address: "123 Elimika St, Nairobi",
          pocName: "Jane Doe",
          pocPhone: "+254712345678",
          pocEmail: "jane.doe@elimika.org",
          coursesOffered: "Music, Dance, Arts",
          classrooms: 10,
          ageGroups: ["Lower Primary", "Upper Primary"],
        },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "branches",
  })

  const onSubmit = (data: BranchesFormValues) => {
    // TODO: Implement submission logic
    console.log(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Manage Training Locations & Branches</CardTitle>
            <CardDescription>
              Add, edit, or remove your organisation&apos;s branches.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="bg-background/50 space-y-6 rounded-lg border p-6"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">
                      {form.getValues(`branches.${index}.branchName`) ||
                        `Branch ${index + 1}`}
                    </h3>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove Branch
                    </Button>
                  </div>

                  <Separator />

                  <FormField
                    control={form.control}
                    name={`branches.${index}.branchName`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Branch Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Westlands Campus"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name={`branches.${index}.country`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Kenya" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`branches.${index}.address`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Address</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., 123 Waiyaki Way"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div>
                    <h4 className="text-md mb-4 font-medium">
                      Point of Contact
                    </h4>
                    <div className="space-y-4 rounded-md border p-4">
                      <FormField
                        control={form.control}
                        name={`branches.${index}.pocName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid gap-6 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name={`branches.${index}.pocPhone`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input placeholder="+254 7..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`branches.${index}.pocEmail`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="johndoe@example.com"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md mb-4 font-medium">Branch Details</h4>
                    <div className="space-y-4 rounded-md border p-4">
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name={`branches.${index}.classrooms`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Number of Classrooms</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="e.g., 15"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value
                                        ? parseInt(e.target.value, 10)
                                        : "",
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`branches.${index}.coursesOffered`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Courses Offered</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="List courses separated by commas (e.g., Piano, Guitar, Vocals)"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name={`branches.${index}.ageGroups`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Age Groups Served</FormLabel>
                            <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 sm:grid-cols-3">
                              {ageGroups.map((item) => (
                                <FormField
                                  key={item}
                                  control={form.control}
                                  name={`branches.${index}.ageGroups`}
                                  render={({ field }) => {
                                    return (
                                      <FormItem
                                        key={item}
                                        className="flex flex-row items-start space-y-0 space-x-3"
                                      >
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(
                                              item,
                                            )}
                                            onCheckedChange={(checked) => {
                                              return checked
                                                ? field.onChange([
                                                    ...(field.value ?? []),
                                                    item,
                                                  ])
                                                : field.onChange(
                                                    field.value?.filter(
                                                      (value) => value !== item,
                                                    ),
                                                  )
                                            }}
                                          />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                          {item}
                                        </FormLabel>
                                      </FormItem>
                                    )
                                  }}
                                />
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() =>
                  append({
                    branchName: "",
                    country: "",
                    address: "",
                    pocName: "",
                    pocPhone: "",
                    pocEmail: "",
                    coursesOffered: "",
                    classrooms: 0,
                    ageGroups: [],
                  })
                }
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Another Branch
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit">Save Branches</Button>
        </div>
      </form>
    </Form>
  )
}
