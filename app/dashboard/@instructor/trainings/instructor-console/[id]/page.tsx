'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useCourseLessonsWithContent } from '@/hooks/use-courselessonwithcontent';
import { useInstructorInfo } from '@/hooks/use-instructor-info';
import {
  getClassDefinitionOptions,
  getCourseAssessmentsOptions,
  getCourseByUuidOptions,
  getInstructorScheduleOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle,
  Clock,
  Copy,
  Facebook,
  FileText,
  Link,
  Linkedin,
  Mail,
  MessageCircle,
  Twitter
} from 'lucide-react';

import { SidebarMenuButton } from '@/components/ui/sidebar';
import { BarChart2, Camera, Search, Upload, UserCheck } from "lucide-react";
import moment from 'moment';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

export default function ClassPreviewPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params?.id as string;
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    if (!classId) return;

    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      {
        id: 'trainings',
        title: 'Training Classes',
        url: '/dashboard/trainings',
      },
      {
        id: 'instructor-console',
        title: 'Training Dashboard',
        url: `/dashboard/trainings/instructor-console/${classId}`,
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs, classId]);

  const { data, isLoading: classIsLoading } = useQuery({
    ...getClassDefinitionOptions({ path: { uuid: classId as string } }),
    enabled: !!classId,
  });
  const classData = data?.data;

  const {
    data: courseDetail,
    isLoading,
    isFetched,
  } = useQuery({
    ...getCourseByUuidOptions({ path: { uuid: classData?.course_uuid as string } }),
    enabled: !!classData?.course_uuid,
  });
  const course = courseDetail?.data;

  const { data: cAssesssment } = useQuery({
    ...getCourseAssessmentsOptions({
      path: { courseUuid: classData?.course_uuid as string },
      query: { pageable: {} },
    }),
    enabled: !!classData?.course_uuid,
  });
  const { instructorInfo } = useInstructorInfo({
    instructorUuid: classData?.default_instructor_uuid as string,
  });
  // @ts-ignore
  const instructor = instructorInfo?.data;

  const {
    isLoading: isAllLessonsDataLoading,
    lessons: lessonsWithContent,
    contentTypeMap,
  } = useCourseLessonsWithContent({ courseUuid: classData?.course_uuid as string });

  const [registrationLink] = useState(
    `https://elimika.sarafrika.com/trainings/${classData?.uuid}/register`
  );
  const [copied, setCopied] = useState(false);

  // const totalLessons = classData.schedule.skills.reduce((acc, skill) => acc + skill.lessons.length, 0);
  // const totalHours = classData.schedule.skills.reduce((total, skill) => {
  //     return total + skill.lessons.reduce((skillTotal, lesson) => {
  //         return skillTotal + (parseInt(lesson.duration) || 0);
  //     }, 0);
  // }, 0) / 60;

  // const totalFee = classData?.visibility.isFree ? 0 : classData.visibility.price * totalLessons;
  const totalFee = 499.99;
  const totalAssignments = cAssesssment?.data?.content?.length || 0;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) { }
  };

  const shareToSocial = (platform: string) => {
    const url = encodeURIComponent(registrationLink);
    const text = encodeURIComponent(`Check out this class: ${classData?.title}`);

    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      email: `mailto:?subject=${encodeURIComponent(classData?.title as string)}&body=${text}%20${url}`,
    };

    if (urls[platform as keyof typeof urls]) {
      window.open(urls[platform as keyof typeof urls], '_blank', 'width=600,height=400');
    }
  };

  const { data: timetable } = useQuery({
    ...getInstructorScheduleOptions({
      path: { instructorUuid: classData?.default_instructor_uuid as string },
      query: {
        start: '2026-11-02' as any,
        end: '2026-12-19' as any,
      },
    }),
  });

  const [activeTab, setActiveTab] = useState("roster");
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [showQR, setShowQR] = useState(false);

  const students = [
    "Dianne Russel",
    "Eleanor Pena",
    "Jacob Jones",
    "Brooklyn Simmons",
    "Leslie Alexander",
    "Floyd Miles",
    "Theresa Webb",
    "Wade Warren",
  ];

  const activityLog = [
    { name: "Dianne Russel", action: "Checked in via QR", time: "8:35 AM" },
    { name: "Jacob Jones", action: "Submitted Assignment 2", time: "9:15 AM" },
    { name: "Leslie Alexander", action: "Downloaded Lecture Slides", time: "10:02 AM" },
  ];

  const rubric = [
    { criteria: "Attendance", weight: "20%", description: "Consistency and punctuality" },
    { criteria: "Participation", weight: "25%", description: "Engagement during sessions" },
    { criteria: "Assignments", weight: "35%", description: "Completion and quality" },
    { criteria: "Exam", weight: "20%", description: "Final test performance" },
  ];

  const performance = [
    { name: "Dianne Russel", participation: 95, score: 88, progress: 92 },
    { name: "Jacob Jones", participation: 78, score: 70, progress: 75 },
    { name: "Leslie Alexander", participation: 85, score: 90, progress: 88 },
  ];

  const toggleAttendance = (student: string) => {
    setAttendance((prev) => ({ ...prev, [student]: !prev[student] }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const names = Array.from(e.target.files).map((f) => f.name);
      setUploadedFiles((prev) => [...prev, ...names]);
    }
  };

  if (isLoading || isAllLessonsDataLoading || classIsLoading) {
    return (
      <div className='flex flex-col gap-6 space-y-2'>
        <Skeleton className='h-[150px] w-full' />

        <div className='flex flex-row items-center justify-between gap-4'>
          <Skeleton className='h-[250px] w-2/3' />
          <Skeleton className='h-[250px] w-1/3' />
        </div>

        <Skeleton className='h-[100px] w-full' />
      </div>
    );
  }

  return (
    <div className='mb-20 space-y-6'>
      <Card className="flex flex-row h-auto pb-20">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border/100 p-4 flex flex-col">
          <h2 className="text-lg font-semibold mb-4">Class Menu</h2>
          <div className="space-y-2">
            {[
              { id: "roster", label: "Class Roster", icon: UserCheck },
              { id: "attendance", label: "Attendance", icon: Clock },
              { id: "resources", label: "Resources", icon: Upload },
              { id: "activity", label: "Activity Log", icon: FileText },
              { id: "rubric", label: "Assessment Rubric", icon: BarChart2 },
              { id: "performance", label: "Performance", icon: CheckCircle },
            ].map(({ id, label, icon: Icon }) => (
              <SidebarMenuButton
                key={id}
                size="lg"
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-3 w-full justify-start text-sm rounded-lg transition-colors ${activeTab === id
                  ? "font-medium bg-card text-foreground"
                  : "hover:bg-muted/70 text-muted-foreground"
                  }`}
              >
                <div className="flex items-center justify-center rounded-lg">
                  <Icon className="size-4" />
                </div>
                <span className="truncate">{label}</span>
              </SidebarMenuButton>
            ))}
          </div>
        </aside>


        {/* Main Section */}
        <main className="flex-1 p-6 overflow-y-auto">
          <h1 className="text-xl font-bold mb-4">
            {activeTab === "roster" && "📋 Class Roster"}
            {activeTab === "attendance" && "🕒 Attendance Tracking"}
            {activeTab === "resources" && "📁 Resource Distribution"}
            {activeTab === "activity" && "📜 Activity Log"}
            {activeTab === "rubric" && "📊 Class Attendance Assessment Rubric"}
            {activeTab === "performance" && "📈 Performance Tracking"}
          </h1>

          {/* CLASS ROSTER */}
          {activeTab === "roster" && (
            <Card className="p-5 rounded-xl shadow-sm border border-border/100">
              <div className="relative flex flex-row items-center mb-3">
                <Search size={18} className="absolute left-3 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search learner"
                  className="pl-10 pr-3 py-2 border rounded-lg w-full text-sm"
                />
              </div>
              <ul className="divide-y">
                {students.map((student) => (
                  <li key={student} className="py-2 flex items-center justify-between">
                    <span>{student}</span>
                    <span className="text-xs text-gray-500">Active</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* ATTENDANCE TRACKING */}
          {activeTab === "attendance" && (
            <Card className="p-5 rounded-xl shadow-sm border border-border/100 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Manual Attendance</h2>
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="flex items-center gap-2 bg-primary text-white px-3 py-2 rounded-lg text-sm"
                >
                  <Camera /> {showQR ? "Hide QR" : "Show QR Scanner"}
                </button>
              </div>

              {showQR && (
                <div className="flex justify-center py-10 bg-gray-100 rounded-lg text-gray-500 text-sm">
                  [Mock QR Scanner Placeholder]
                </div>
              )}

              <div className="divide-y">
                {students.map((student) => (
                  <div key={student} className="py-2 flex items-center justify-between">
                    <span>{student}</span>
                    <button
                      onClick={() => toggleAttendance(student)}
                      className={`px-3 py-1 text-xs rounded-lg ${attendance[student]
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500 hover:bg-purple-50"
                        }`}
                    >
                      {attendance[student] ? "Present" : "Mark Present"}
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* RESOURCE DISTRIBUTION */}
          {activeTab === "resources" && (
            <Card className="p-5 rounded-xl shadow-sm border border-border/100">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Upload Class Resources</label>
              <input type="file" multiple onChange={handleFileUpload} className="mb-4 text-sm" />
              <ul className="list-disc pl-5 text-sm space-y-1">
                {uploadedFiles.length === 0 && <li className="text-gray-400">No files uploaded yet</li>}
                {uploadedFiles.map((file, i) => (
                  <li key={i} className="text-muted-foreground hover:underline cursor-pointer">
                    {file}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* ACTIVITY LOG */}
          {activeTab === "activity" && (
            <Card className="p-5 rounded-xl shadow-sm border border-border/100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="py-2">Learner</th>
                    <th className="py-2">Activity</th>
                    <th className="py-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {activityLog.map((log, i) => (
                    <tr key={i} className="border-b border-border/100 hover:bg-background">
                      <td className="py-2">{log.name}</td>
                      <td className="py-2">{log.action}</td>
                      <td className="py-2 text-muted-foreground">{log.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          {/* ASSESSMENT RUBRIC */}
          {activeTab === "rubric" && (
            <Card className="p-5 rounded-xl shadow-sm border border-border/100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2">Criteria</th>
                    <th className="py-2">Weight</th>
                    <th className="py-2">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {rubric.map((r, i) => (
                    <tr key={i} className="border-b hover:bg-background">
                      <td className="py-2 font-medium">{r.criteria}</td>
                      <td className="py-2 text-muted-foreground">{r.weight}</td>
                      <td className="py-2">{r.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          {/* PERFORMANCE TRACKING */}
          {activeTab === "performance" && (
            <Card className="p-5 rounded-xl shadow-sm border border-border/100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2">Learner</th>
                    <th className="py-2">Participation</th>
                    <th className="py-2">Score</th>
                    <th className="py-2">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {performance.map((p, i) => (
                    <tr key={i} className="border-b hover:bg-background">
                      <td className="py-2 font-medium">{p.name}</td>
                      <td className="py-2">{p.participation}%</td>
                      <td className="py-2">{p.score}%</td>
                      <td className="py-2">{p.progress}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </main>
      </Card>

      {/* Registration Link and Sharing */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Link className='h-5 w-5' />
            Registration Link
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex gap-2'>
            <Input value={registrationLink} readOnly className='font-mono text-sm' />
            <Button
              onClick={() => copyToClipboard(registrationLink)}
              variant='outline'
              className='gap-2'
            >
              <Copy className='h-4 w-4' />
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>

          <div className='space-y-3'>
            <h4 className='font-medium'>Share Your Class</h4>
            <div className='flex flex-wrap gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => copyToClipboard(registrationLink)}
                className='gap-2'
              >
                <Copy className='h-4 w-4' />
                Copy Link
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => shareToSocial('facebook')}
                className='gap-2'
              >
                <Facebook className='h-4 w-4' />
                Facebook
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => shareToSocial('twitter')}
                className='gap-2'
              >
                <Twitter className='h-4 w-4' />
                Twitter
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => shareToSocial('linkedin')}
                className='gap-2'
              >
                <Linkedin className='h-4 w-4' />
                LinkedIn
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => shareToSocial('whatsapp')}
                className='gap-2'
              >
                <MessageCircle className='h-4 w-4' />
                WhatsApp
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => shareToSocial('email')}
                className='gap-2'
              >
                <Mail className='h-4 w-4' />
                Email
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
