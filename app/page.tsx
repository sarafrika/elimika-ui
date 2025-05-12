"use client"

import { Button } from "@/components/ui/button"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { BookOpen, Users, Award, ArrowRight } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="fixed top-0 z-50 w-full border-b bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="text-primary text-2xl font-bold">Elimika</div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => signIn("keycloak")}
              variant="ghost"
              className="hover:bg-primary/10"
            >
              Sign In
            </Button>
            <Link href="/auth/create-account">
              <Button className="bg-primary hover:bg-primary/90">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-4 pt-32 pb-20">
        <div className="container mx-auto text-center">
          <h1 className="from-primary to-primary/60 mb-6 bg-gradient-to-r bg-clip-text text-5xl font-bold text-transparent">
            Transform Your Learning Journey
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-600">
            Join Elimika, your gateway to world-class education. Learn from
            expert instructors, connect with fellow students, and advance your
            career with our comprehensive courses.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/auth/create-account">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              onClick={() => signIn("keycloak")}
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <BookOpen className="text-primary mb-4 h-12 w-12" />
              <h3 className="mb-2 text-xl font-semibold">Diverse Courses</h3>
              <p className="text-gray-600">
                Access a wide range of courses taught by industry experts and
                experienced educators.
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <Users className="text-primary mb-4 h-12 w-12" />
              <h3 className="mb-2 text-xl font-semibold">Expert Instructors</h3>
              <p className="text-gray-600">
                Learn from qualified instructors who bring real-world experience
                to the classroom.
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <Award className="text-primary mb-4 h-12 w-12" />
              <h3 className="mb-2 text-xl font-semibold">Certified Learning</h3>
              <p className="text-gray-600">
                Earn certificates and credentials that are recognized by
                employers worldwide.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">Ready to Start Learning?</h2>
          <p className="mb-8 text-gray-600">
            Join thousands of students already learning on Elimika
          </p>
          <Link href="/auth/create-account">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
