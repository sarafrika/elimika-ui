'use client';

import { Award, BookOpen, CalendarIcon, ChevronLeft, ChevronRight, ClipboardList, FileCheck2, LayoutDashboard, Mail, PlayCircle, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import LessonHubAssessmentsTab from './LessonHubAssessmentsTab';
import LessonHubAssignmentsTab from './LessonHubAssignmentsTab';
import LessonHubCertificatesTab from './LessonHubCertificatesTab';
import { LessonHubClassInvitesTab } from './LessonHubClassInvitesTab';
import { LessonHubDashboardTab } from './LessonHubDashboardTab';
import { LessonHubLessonsTab } from './LessonHubLessonsTab';
import { LessonHubMyClassesTab } from './LessonHubMyClassesTab';
import { LessonHubMyCoursesTab } from './LessonHubMyCoursesTab';
import LessonHubQuizzesTab from './LessonHubQuizzesTab';
import { useStudentLearningHubData } from './useStudentLearningHubData';

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "my-courses", label: "My Courses", icon: BookOpen },
  { id: "my-classes", label: "My Classes", icon: Users },
  { id: "class-invites", label: "Class Invites", icon: Mail },
  { id: "lessons", label: "Lessons", icon: PlayCircle },
  { id: "assignments", label: "Assignments", icon: ClipboardList },
  { id: "quizzes", label: "Quizzes", icon: ClipboardList },
  { id: "assessments", label: "Assessments", icon: FileCheck2 },
  { id: "certificates", label: "Certificates", icon: Award },
  { id: "calendar", label: "Learning Calendar", icon: CalendarIcon },
] as const;

export function StudentLearningHubPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("dashboard");
  const tabRowRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef(new Map<(typeof TABS)[number]["id"], HTMLButtonElement>());

  const scrollTabs = (direction: "left" | "right") => {
    tabRowRef.current?.scrollBy({
      left: direction === "left" ? -280 : 280,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    tabRefs.current.get(tab)?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [tab]);

  const data = useStudentLearningHubData();

  return (
    <main className='w-full py-3 sm:py-4'>
      <div className="px-4 pb-5">
        <h1 className="text-foreground text-2xl font-bold">Learning Hub</h1>
        <p className="text-muted-foreground text-sm">
          Discover, enrol, and complete learning programmes — all in one place.
        </p>


        <div className="mt-4 flex items-center gap-1">
          <button
            type="button"
            aria-label="Scroll tabs left"
            onClick={() => scrollTabs("left")}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div
            ref={tabRowRef}
            className="flex flex-1 flex-nowrap gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [touch-action:pan-x] [&::-webkit-scrollbar]:hidden"
          >
            {TABS.map((t) => {
              const active = t.id === tab;
              const Icon = t.icon;

              return (
                <button
                  key={t.id}
                  ref={(el) => {
                    if (el) {
                      tabRefs.current.set(t.id, el);
                    } else {
                      tabRefs.current.delete(t.id);
                    }
                  }}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm transition-colors ${active
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-border bg-card text-muted-foreground hover:border-primary hover:text-foreground'
                    }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            aria-label="Scroll tabs right"
            onClick={() => scrollTabs("right")}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="px-4 py-6">
        {tab === "dashboard" && <LessonHubDashboardTab learningHubData={data} />}
        {tab === "my-courses" && <LessonHubMyCoursesTab learningHubData={data} />}
        {tab === "my-classes" && <LessonHubMyClassesTab learningHubData={data} />}
        {tab === "class-invites" && <LessonHubClassInvitesTab />}
        {tab === "lessons" && <LessonHubLessonsTab learningHubData={data} />}
        {tab === "assignments" && <LessonHubAssignmentsTab />}
        {tab === "quizzes" && <LessonHubQuizzesTab />}
        {tab === "assessments" && <LessonHubAssessmentsTab />}
        {tab === "certificates" && <LessonHubCertificatesTab learningHubData={data} />}

        {/* {tab === "calendar" && <PlaceholderTab title="Learning Calendar" description="Classes, deadlines, and events unified in one calendar." />} */}
      </div>

      <div className='space-y-4'>
        {/* <LearningHubContinueLearning classes={data.continueLearning} loading={data.loading} /> */}
        {/* <LearningHubAssignments assignments={data.assignments} loading={data.loading} /> */}
      </div>
    </main>
  );
}
