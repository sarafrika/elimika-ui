"use client"
import { DropdownMenuItem } from "@radix-ui/react-dropdown-menu";
import { useMutation, useQuery, UseQueryOptions } from "@tanstack/react-query";
import { BlocksIcon, Check, SendIcon } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "../../../../../components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "../../../../../components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../components/ui/table";
import VirticleDotsIcons from "../../../../../components/virticle-dots-icon";
import { useUserProfile } from "../../../../../context/profile-context";
import { queryClient } from "../../../../../lib/query-client";
import { ApiResponse, Invitation, resendInvitation } from "../../../../../services/client";
import { acceptInvitationMutation, cancelInvitationMutation, declineInvitationMutation } from "../../../../../services/client/@tanstack/react-query.gen";

export default function InviteList({
    queryOption
}: {
    queryOption: UseQueryOptions<ApiResponse>
}) {

    const user = useUserProfile();
    const { data, error } = useQuery({ ...queryOption });

    let invitations: Invitation[] = [];
    if (data && data.data && data.data.data && !error) {
        invitations = data!.data!.data as unknown as Invitation[];
    }

    const cancelMutation = useMutation(cancelInvitationMutation());
    function cancelInvite(inviter_uuid: string) {
        cancelMutation.mutate({
            path: {
                uuid: user!.uuid!, invitationUuid: inviter_uuid
            },
            query: {
                canceller_uuid: user!.uuid!
            }
        })
    }

    const declineMutation = useMutation(declineInvitationMutation());
    function declineInvitation(invitation_uuid: string, token: string) {
        declineMutation.mutate({
            path: {
                uuid: invitation_uuid
            },
            query: {
                token
            }
        })
    }

    const acceptMutation = useMutation(acceptInvitationMutation());
    function acceptInvitation(invitation_uuid: string, token: string) {
        acceptMutation.mutate({
            path: {
                uuid: invitation_uuid
            },
            query: {
                token
            }
        })
    }

    async function resend(invitation_uuid: string) {
        const resp = await resendInvitation({
            path: {
                uuid: user!.uuid!,
                invitationUuid: invitation_uuid
            },
            query: {
                resender_uuid: user!.uuid!
            }
        });

        if (resp.error) {
            const error = resp.error as any;
            toast.error(error.error)
        }
        else {
            toast.success("Invite resent")
        }
    }

    useEffect(() => {
        queryClient.invalidateQueries({ queryKey: queryOption.queryKey })
    }, [
        cancelMutation.isSuccess,
        acceptMutation.isSuccess,
        declineMutation.isSuccess
    ])

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Recipient Name</TableHead>
                    <TableHead>Recipient Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {invitations.map(invite => <TableRow key={invite.uuid}>
                    <TableCell>{invite.recipient_name}</TableCell>
                    <TableCell>{invite.recipient_email}</TableCell>
                    <TableCell>{invite.status}</TableCell>
                    <TableCell>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost"><VirticleDotsIcons /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56">
                                {invite.inviter_uuid === user!.uuid && <>
                                    <DropdownMenuCheckboxItem onClick={() => cancelInvite(invite.uuid!)}>
                                        <BlocksIcon /> <span>Cancel</span>
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem onClick={() => resend(invite.uuid!)}>
                                        <SendIcon /> <span>Resend</span>
                                    </DropdownMenuCheckboxItem>
                                </>}

                                {invite.inviter_uuid !== user!.uuid && <>
                                    <DropdownMenuItem onClick={() => acceptInvitation(invite.uuid!, invite.token!)}>
                                        <Button variant={"ghost"}><Check /> <span>Accept</span></Button>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => declineInvitation(invite.uuid!, invite.token!)}>
                                        <Button variant={"ghost"}><BlocksIcon /> <span>Decline</span></Button>
                                    </DropdownMenuItem>
                                </>}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>)}
            </TableBody>
        </Table>
    )
}
