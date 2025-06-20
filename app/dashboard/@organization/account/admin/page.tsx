"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldCheck } from "lucide-react"
import { Label } from "@/components/ui/label"

export default function AdminProfile() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Administrator Profile
        </h1>
        <p className="text-muted-foreground">
          Manage your personal information and access credentials
        </p>
      </div>

      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Administrator Account</AlertTitle>
        <AlertDescription>
          As the administrator of this training center, you have full access to
          manage courses, instructors, and students.
        </AlertDescription>
      </Alert>

      <form className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Your personal details as the center administrator
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src="" alt="Admin Avatar" />
                <AvatarFallback className="text-2xl">AD</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="text-muted-foreground text-sm">
                  Upload your profile picture.
                  <br />
                  Square images work best. Max size: 5MB
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" type="button">
                    Change
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    className="text-red-500 hover:text-red-600"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input placeholder="John" />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input placeholder="Doe" />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input placeholder="admin@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input placeholder="+1 (555) 000-0000" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Your login credentials and security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Admin Username</Label>
              <Input placeholder="admin_username" />
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="mb-2 font-medium">Password Management</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                For security reasons, password changes are handled separately
              </p>
              <Button variant="outline" type="button">
                Change Password
              </Button>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="mb-2 font-medium">Two-Factor Authentication</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Add an extra layer of security to your account
              </p>
              <Button variant="outline" type="button">
                Enable 2FA
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </div>
  )
}
