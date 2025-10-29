'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, UserPlus, Wrench } from "lucide-react";
import { useState } from "react";
import ApprenticeshipsPage from "./apprenticeships/page";
import AttachementPage from "./attachment/page";
import JobsPage from "./jobs/page";

export default function OpportunitiesPage() {
    const [activeTab, setActiveTab] = useState('jobs');

    return (
        <div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8" >
                <TabsList className='grid w-full grid-cols-3'>
                    <TabsTrigger value='jobs'> <Briefcase />  Jobs</TabsTrigger>
                    <TabsTrigger value='Apprenticeships'><Wrench />  Apprenticeships</TabsTrigger>
                    <TabsTrigger value='attachment'><UserPlus />  Attachments</TabsTrigger>
                </TabsList>

                <TabsContent value='jobs' className='space-y-6'>
                    <JobsPage />
                </TabsContent>

                <TabsContent value='Apprenticeships' className='space-y-6'>
                    <ApprenticeshipsPage />
                </TabsContent>

                <TabsContent value='attachment' className='space-y-6'>
                    <AttachementPage />
                </TabsContent>
            </Tabs>
        </div>
    )
}
