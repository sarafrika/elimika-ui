"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CalendarIcon, Grip, PlusCircle, Trash2 } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"

export default function StudentProfileGeneral() {
  const guardians = [
    {
      id: "1",
      first_name: "Jane",
      last_name: "Doe",
      phone_number: "123-456-7890",
      relationship: "Mother",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">General Info</h1>
        <p className="text-muted-foreground text-sm">
          Update your basic profile information
        </p>
      </div>

      <form className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Personal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" />
                </FormControl>
              </FormItem>
              <FormItem>
                <FormLabel>Middle Name</FormLabel>
                <FormControl>
                  <Input placeholder="Quincy" />
                </FormControl>
              </FormItem>
            </div>
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input placeholder="Adams" />
              </FormControl>
            </FormItem>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="name@example.com" />
                </FormControl>
              </FormItem>
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="+254712345678" />
                </FormControl>
              </FormItem>
            </div>
            <FormItem className="flex flex-col">
              <FormLabel>Date of Birth</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        "text-muted-foreground",
                      )}
                    >
                      <span>Pick a date</span>
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </FormItem>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Guardian Information</CardTitle>
            <CardDescription>
              Add guardian details for students under 18
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {guardians.map((guardian) => (
              <div
                key={guardian.id}
                className="group relative rounded-md border p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-2">
                    <Grip className="text-muted-foreground mt-1 h-5 w-5" />
                    <div>
                      <h3 className="text-base font-medium">
                        {guardian.first_name} {guardian.last_name}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {guardian.relationship}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <Trash2 className="text-destructive h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input defaultValue={guardian.first_name} />
                    </FormControl>
                  </FormItem>
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input defaultValue={guardian.last_name} />
                    </FormControl>
                  </FormItem>
                </div>
                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input defaultValue={guardian.phone_number} />
                    </FormControl>
                  </FormItem>
                  <FormItem>
                    <FormLabel>Relationship</FormLabel>
                    <FormControl>
                      <Input defaultValue={guardian.relationship} />
                    </FormControl>
                  </FormItem>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="flex w-full items-center justify-center gap-2"
            >
              <PlusCircle className="h-4 w-4" /> Add Guardian
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Terms and Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              name="accept_terms"
              render={() => (
                <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                  <FormControl>
                    <Checkbox />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Accept terms and conditions</FormLabel>
                    <FormDescription>
                      You agree to our Terms of Service and Privacy Policy.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        <div className="flex justify-end pt-2">
          <Button type="submit" className="px-6">
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
