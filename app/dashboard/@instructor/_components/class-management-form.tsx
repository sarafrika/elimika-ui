"use client"

import { z } from "zod"
import { ReactNode } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { Textarea } from "@/components/ui/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { ScrollArea } from "@radix-ui/react-scroll-area"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface FormSectionProps {
  title: string
  description: string
  children: ReactNode
}

function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <div className="space-y-2">
      <div>
        <h3 className="leading-none font-semibold tracking-tight">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

const classFormSchema = z.object({
  title: z.string().min(1, "Class title is required"),
  description: z.string().optional(),
})

export type ClassFormValues = z.infer<typeof classFormSchema>

interface ClassCreationFormProps {
  onCancel: () => void
  className?: string
  classId?: string | number
  initialValues?: Partial<ClassFormValues>
}

function ClassCreationForm({ onCancel, className }: ClassCreationFormProps) {
  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  })

  const onSubmit = (values: ClassFormValues) => {
    console.log("✅ Create a class form submission:", values)
    onCancel()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={`space-y-8 ${className}`}>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Class Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter class title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Enter description" className="resize-none" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-6 pb-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Create Class</Button>
        </div>
      </form>
    </Form>
  )
}

function ClassEditingForm({ onCancel, className, classId, initialValues }: ClassCreationFormProps) {
  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      title: "",
      description: "",
      ...initialValues,
    },
  })

  const onSubmit = (values: ClassFormValues) => {
    console.log("Editing class ID:", classId)
    console.log("✅ Create a class form submission:", values)
    onCancel()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={`space-y-8 ${className}`}>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Class Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter class title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Enter description" className="resize-none" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-6 pb-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Edit Class</Button>
        </div>
      </form>
    </Form>
  )
}

interface CreateClassDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  classId?: string | number
  initialValues?: Partial<ClassFormValues>
}

function CreateClassDialog({ isOpen, onOpenChange }: CreateClassDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-w-6xl flex-col p-0">
        <DialogHeader className="border-b px-6 pt-8 pb-4">
          <DialogTitle className="text-xl">Create New Class</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Fill in the class details below. You&apos;ll be able to make changes after you&apos;ve created the class.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="min-h-auto">
          <ClassCreationForm onCancel={() => onOpenChange(false)} className="px-6 pb-6" />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

function EditClassDialog({ isOpen, onOpenChange, classId, initialValues }: CreateClassDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-w-6xl flex-col p-0">
        <DialogHeader className="border-b px-6 pt-8 pb-4">
          <DialogTitle className="text-xl">Edit Class</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Modify the class details as needed. You can update them again later.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="min-h-auto">
          <ClassEditingForm
            classId={classId}
            className="px-6 pb-6"
            initialValues={initialValues}
            onCancel={() => onOpenChange(false)}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export { CreateClassDialog, EditClassDialog }
