import { ArrowLeft, MapPin } from "lucide-react";
import Link from "next/link";
import { Calendar } from "../../../../../components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { Separator } from "../../../../../components/ui/separator";
import UserBadge from "../../../../../components/user-badge";
import { getTrainingBranchByUuid, TrainingBranch } from "../../../../../services/client";
import Courses from "./_components/courses";
import { Action } from "./utils";

export default async function ViewBranch({
    params,
    ...slots
}: {
    params: Promise<{ slug: Action[] }>
}) {
    const { slug: [branch_uuid, tab] } = await params;

    if (branch_uuid == "new" || branch_uuid == "edit") {
        return null;
    }

    const branchResp = await getTrainingBranchByUuid({ path: { uuid: branch_uuid! } });
    if (branchResp.error || !branchResp.data) {
        return <>No Branch</>
    }

    const branch = branchResp.data.data as TrainingBranch;

    return (
        <>
            <div className="flex gap-5 items-start">
                <Link href={"/dashboard/branches"}><ArrowLeft /></Link>
                <div>
                    <h3 className="text-2xl font-bold">{branch.branch_name} Branch</h3>
                    <p>Information about {branch.branch_name} branch</p>
                </div>
            </div>
            <Separator />

            <div className="grid grid-cols-4 gap-5">
                <div className="col-span-3 flex flex-col gap-5">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contacts</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between">
                                <div className="flex flex-col gap-2">
                                    <h4 className="text-sm text-gray-400 flex gap-2">
                                        <MapPin size={16} />
                                        <span>Location</span>
                                    </h4>
                                    <h5 className="">{branch.address}</h5>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <h4 className="text-sm text-gray-400 flex gap-2">Point of contact</h4>
                                    {branch.poc_user_uuid &&
                                        <UserBadge user_uuid={branch.poc_user_uuid} showContacts />}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Courses</CardTitle>
                            <CardDescription>Courses offered in this branch</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-4">
                                <Courses user_uuid={branch.organisation_uuid} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div>
                    <Card>
                        <CardContent>
                            <Calendar className="w-full" />
                        </CardContent>
                    </Card>
                </div>
            </div>

        </>
    );
}