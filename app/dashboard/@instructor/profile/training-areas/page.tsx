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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

const trainingAreasSchema = z.object({
  areas: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().min(1, "Training area name is required."),
    }),
  ),
})

type TrainingAreasFormValues = z.infer<typeof trainingAreasSchema>

export default function TrainingAreasSettings() {
  const form = useForm<TrainingAreasFormValues>({
    resolver: zodResolver(trainingAreasSchema),
    defaultValues: {
      areas: [{ name: "Web Development" }, { name: "Data Science" }],
    },
    mode: "onChange",
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "areas",
  })

  const onSubmit = (data: TrainingAreasFormValues) => {
    console.log(data)
    // TODO: Implement submission logic. The Instructor schema currently does not have a field for training areas.
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Interested Training Areas</h1>
        <p className="text-muted-foreground text-sm">
          List the subjects or courses you are interested in teaching.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Your Training Interests</CardTitle>
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
                      name={`areas.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Area/Subject/Course</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Graphic Design, Yoga, Public Speaking"
                              {...field}
                            />
                          </FormControl>
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
                      <span className="sr-only">Remove area</span>
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                className="flex w-full items-center justify-center gap-2"
                onClick={() => append({ name: "" })}
              >
                <PlusCircle className="h-4 w-4" />
                Add Another Area
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
