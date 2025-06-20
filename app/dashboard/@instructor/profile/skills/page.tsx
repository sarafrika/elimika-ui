"use client"

import * as z from "zod"
import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { PlusCircle, Trash2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

const skillsSchema = z.object({
  skills: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().min(1, "Skill name is required."),
      level: z.string().min(1, "Proficiency level is required."),
    }),
  ),
})

type SkillsFormValues = z.infer<typeof skillsSchema>

const proficiencyLevels = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Expert",
  "Native",
]

export default function SkillsSettings() {
  const form = useForm<SkillsFormValues>({
    resolver: zodResolver(skillsSchema),
    defaultValues: {
      skills: [{ name: "JavaScript", level: "Expert" }],
    },
    mode: "onChange",
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "skills",
  })

  const onSubmit = (data: SkillsFormValues) => {
    console.log(data)
    // TODO: Implement submission logic. The Instructor schema currently does not have a field for skills.
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Skills</h1>
        <p className="text-muted-foreground text-sm">
          Showcase your professional skills and proficiency levels.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Your Skills</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-0">
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex items-end gap-4 rounded-md border p-4"
                  >
                    <FormField
                      control={form.control}
                      name={`skills.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Skill</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Graphic Design"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`skills.${index}.level`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Proficiency</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {proficiencyLevels.map((level) => (
                                <SelectItem key={level} value={level}>
                                  {level}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => remove(index)}
                      className="h-10 w-10 flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove skill</span>
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                className="flex w-full items-center justify-center gap-2"
                onClick={() => append({ name: "", level: "" })}
              >
                <PlusCircle className="h-4 w-4" />
                Add Another Skill
              </Button>

              <div className="flex justify-end pt-2">
                <Button type="submit" className="px-6">
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  )
}
