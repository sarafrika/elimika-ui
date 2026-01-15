'use client'

import { Button } from '@/components/ui/button';
import { BookCheck, MoveLeft, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import CourseBuilderPage from './CourseBuilderPage';
import CoursePreviewPage from './CoursePreviewPage';

const CourseCreationPage = () => {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState("builder");

    return (
        <div className='mx-auto w-6xl space-y-5'>
            <div onClick={() => router.push('/dashboard/course-management/all')} className='w-fit py-2 pr-3 flex flex-row gap-2 items-center cursor-pointer' >
                <MoveLeft size={18} className="w-5 h-5 cursor-pointer" />
                <h1 className='text-sm' >Back</h1>
            </div>

            <div className="flex flex-row items-center justify-between mx-auto w-6xl">
                <div className='flex flex-row items-center gap-4' >
                    <Button
                        onClick={() => setActiveTab("builder")}
                        variant={activeTab === "builder" ? "default" : "outline"}
                    >
                        Course Builder
                    </Button>

                    <Button
                        onClick={() => setActiveTab("preview")}
                        variant={activeTab === "preview" ? "default" : "outline"}
                    >
                        Preview
                    </Button>
                </div>

                <div className='flex flex-row items-center gap-4' >
                    <Button variant={"ghost"} className='border border-muted-foreground/50 px-12' >
                        <Save /> Save
                    </Button>

                    <Button variant={"ghost"} className='border border-muted-foreground/50  px-12'  >
                        <BookCheck /> Publish
                    </Button>
                </div>
            </div>

            <div className="">
                {activeTab === "builder" && <CourseBuilderPage />}
                {activeTab === "preview" && <CoursePreviewPage />}
            </div>
        </div>
    )
}

export default CourseCreationPage