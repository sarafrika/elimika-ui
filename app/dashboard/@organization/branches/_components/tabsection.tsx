"use client"
import { Grid, List } from "lucide-react"
import { useState } from "react"
import { Button } from "../../../../../components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../../components/ui/tabs"
import { useTrainingCenter } from "../../../../../context/training-center-provide"
import { getBranchInvitations, TrainingBranch } from "../../../../../services/client"
import { InviteForm } from "../../invites/_components/InviteForm"
import InviteList from "../../invites/_components/InviteList"
import Classroms from "./classrooms"
import Courses from "./courses"

export default function TabSection({ branch }: { branch: TrainingBranch }) {
    const trainingCenter = useTrainingCenter();
    const [courseViewType, setCourseViewType] = useState<"list" | "grid">("list");
    return (
        <Tabs defaultValue="courses">
            <TabsList>
                <TabsTrigger value="courses">Courses</TabsTrigger>
                <TabsTrigger value="invites">Invites</TabsTrigger>
                <TabsTrigger value="classrooms">Classrooms</TabsTrigger>
            </TabsList>
            <TabsContent value="courses">

                <Card>
                    <CardHeader>
                        <CardTitle>Courses</CardTitle>
                        <CardDescription>Courses offered in this branch</CardDescription>
                        <CardAction>
                            {
                                courseViewType === "grid" ?
                                    <Button variant={"ghost"} onClick={() => setCourseViewType("list")}><List /></Button> :
                                    <Button variant={"ghost"} onClick={() => setCourseViewType("grid")}><Grid /></Button>
                            }
                        </CardAction>
                    </CardHeader>
                    <CardContent>
                        <Courses viewType={courseViewType} user_uuid={branch.organisation_uuid} />
                    </CardContent>
                </Card>

            </TabsContent>

            <TabsContent value="invites">
                <Card>
                    <CardHeader>
                        <CardTitle>Invites</CardTitle>
                        <CardDescription>All invites sent to instructors / users</CardDescription>
                        <CardAction>
                            <InviteForm branch_uuid={branch.uuid}>
                                <Button>Invite</Button>
                            </InviteForm>
                        </CardAction>
                    </CardHeader>
                    <CardContent>
                        <InviteList queryOption={{
                            queryKey: ["branch", branch.uuid, "invites"],
                            queryFn: () => getBranchInvitations({
                                path: {
                                    branchUuid: branch.uuid!,
                                    uuid: trainingCenter!.uuid!
                                }
                            })
                        }} />
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="classrooms">
                <Card>
                    <CardHeader>
                        <CardTitle>Classrooms</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Classroms />
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
}
