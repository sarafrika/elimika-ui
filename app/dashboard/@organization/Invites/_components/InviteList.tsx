"use client"
import { useQuery } from "@tanstack/react-query";
import { useTrainingCenter } from "../../../../../context/training-center-provide";
import { getOrganizationInvitations } from "../../../../../services/client";

export default function InviteList() {
    const trainingCenter = useTrainingCenter();
    const { data, isLoading } = useQuery({
        queryKey: ["organization", "invites"],
        queryFn: () => getOrganizationInvitations({
            path: { uuid: trainingCenter!.uuid! }
        }),
        enabled: !!trainingCenter
    });

    const invitations = data?.data;
    console.log(invitations);

    return (
        <div>InviteList</div>
    )
}
