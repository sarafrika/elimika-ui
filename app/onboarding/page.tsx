import Link from 'next/link';
import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';

const OnboardingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Welcome to Elimika!
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose your path and unlock your potential with personalized learning experiences
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid gap-8 md:gap-12 lg:grid-cols-3">
          {/* Student Card */}
          <Link href="/onboarding/student" className="group block">
            <Card className="h-full border-2 transition-all duration-300 hover:border-[#1976D2] hover:shadow-lg group-hover:-translate-y-1">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-[#1976D2]/10 rounded-full flex items-center justify-center group-hover:bg-[#1976D2]/20 transition-colors">
                    <div className="flex flex-col gap-0.5">
                      <div className="w-6 h-1 bg-[#1976D2] rounded-full"></div>
                      <div className="w-6 h-1 bg-[#1976D2] rounded-full"></div>
                      <div className="w-6 h-1 bg-[#1976D2] rounded-full"></div>
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="mb-2 self-center">Student</Badge>
                <CardTitle className="text-2xl mb-2">I'm Ready to Learn</CardTitle>
                <CardDescription className="text-base">
                  Embark on your learning journey with interactive courses, progress tracking, and personalized study plans.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="outline" className="w-full group-hover:bg-[#1976D2] group-hover:text-white group-hover:border-[#1976D2] transition-colors">
                  Start Learning
                  <ArrowRight className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* Instructor Card */}
          <Link href="/onboarding/instructor" className="group block">
            <Card className="h-full border-2 transition-all duration-300 hover:border-[#1976D2] hover:shadow-lg group-hover:-translate-y-1">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-[#1976D2]/10 rounded-full flex items-center justify-center group-hover:bg-[#1976D2]/20 transition-colors">
                    <div className="flex flex-col gap-0.5">
                      <div className="w-6 h-1 bg-[#1976D2] rounded-full"></div>
                      <div className="w-6 h-1 bg-[#1976D2] rounded-full"></div>
                      <div className="w-6 h-1 bg-[#1976D2] rounded-full"></div>
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="mb-2 self-center">Instructor</Badge>
                <CardTitle className="text-2xl mb-2">I Inspire Minds</CardTitle>
                <CardDescription className="text-base">
                  Share your expertise, create engaging content, and guide students toward their goals with powerful teaching tools.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="outline" className="w-full group-hover:bg-[#1976D2] group-hover:text-white group-hover:border-[#1976D2] transition-colors">
                  Start Teaching
                  <ArrowRight className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* Organization Card */}
          <Link href="/onboarding/organisation" className="group block">
            <Card className="h-full border-2 transition-all duration-300 hover:border-[#1976D2] hover:shadow-lg group-hover:-translate-y-1">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-[#1976D2]/10 rounded-full flex items-center justify-center group-hover:bg-[#1976D2]/20 transition-colors">
                    <div className="flex flex-col gap-0.5">
                      <div className="w-6 h-1 bg-[#1976D2] rounded-full"></div>
                      <div className="w-6 h-1 bg-[#1976D2] rounded-full"></div>
                      <div className="w-6 h-1 bg-[#1976D2] rounded-full"></div>
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="mb-2 self-center">Organization</Badge>
                <CardTitle className="text-2xl mb-2">I Lead & Scale</CardTitle>
                <CardDescription className="text-base">
                  Transform your organization's learning culture with comprehensive management tools and detailed analytics.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="outline" className="w-full group-hover:bg-[#1976D2] group-hover:text-white group-hover:border-[#1976D2] transition-colors">
                  Start Managing
                  <ArrowRight className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Footer Text */}
        <div className="text-center mt-12 space-y-4">
          {/* Powered by Sarafrika */}
          <div className="flex items-center justify-center gap-2 pt-8 border-t border-border/50">
            <span className="text-sm text-muted-foreground">Powered by</span>
            <div className="flex items-center gap-2">
              <Image
                src="/images/Sarafrika Logo.svg"
                alt="Sarafrika Logo"
                width={20}
                height={20}
                className="w-5 h-5"
              />
              <span className="text-sm font-semibold text-foreground">Sarafrika</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;