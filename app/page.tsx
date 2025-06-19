import LoginButton from "@/components/LoginButton"
import { BookOpen, Users, Award, } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="fixed top-0 z-50 w-full border-b bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="text-primary text-2xl font-bold">Elimika</div>
          <div className="flex items-center gap-4">
            <LoginButton />
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
            <LoginButton />
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
        </div>
      </section>
    </div>
  )
}
