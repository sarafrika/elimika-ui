'use client';

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableRow,
} from "@/components/ui/table";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { ClassDetails } from "./page";

export const ClassInformationSection = ({
    data,
    onChange
}: {
    data: ClassDetails;
    onChange: (updates: Partial<ClassDetails>) => void;
}) => {

    const inviteUrl =
        typeof window !== "undefined"
            ? `${window.location.origin}/class-invite?id=${data?.uuid}`
            : "";

    return (
        <Card className="overflow-hidden shadow-sm border">
            <div className="bg-muted/50 px-6 py-4 border-b">
                <h3 className="font-semibold text-foreground text-lg">Class Information</h3>
            </div>

            <Table>
                <TableBody>
                    <TableRow className="border-b hover:bg-transparent">
                        <TableCell className="bg-muted/30 font-semibold w-1/3 py-4">
                            Meeting Link
                        </TableCell>
                        <TableCell className="bg-card py-4">
                            <Input placeholder="Enter meeting link" />
                        </TableCell>
                    </TableRow>

                    <TableRow className="border-b hover:bg-transparent">
                        <TableCell className="bg-muted/30 font-semibold py-4">
                            Location
                        </TableCell>
                        <TableCell className="bg-card py-4">
                            <Input placeholder="Enter location" />
                        </TableCell>
                    </TableRow>

                    <TableRow className="border-b hover:bg-transparent">
                        <TableCell className="bg-muted/30 font-semibold py-4">
                            Classroom
                        </TableCell>
                        <TableCell className="bg-card py-4">
                            <Input
                                value={data.location_name}
                                onChange={(e) => onChange({ location_name: e.target.value })}
                                placeholder="Enter classroom/meeting link"
                            />
                        </TableCell>
                    </TableRow>

                    <TableRow className="border-b hover:bg-transparent">
                        <TableCell className="bg-muted/30 font-semibold py-4">
                            Instructor
                        </TableCell>
                        <TableCell className="bg-card py-4">
                            <Input value={data?.instructorName} placeholder="Auto-filled from profile" disabled />
                        </TableCell>
                    </TableRow>

                    <TableRow className="border-b hover:bg-transparent">
                        <TableCell className="bg-muted/30 font-semibold py-4">
                            Equipment
                        </TableCell>
                        <TableCell className="bg-card py-4">
                            <Input placeholder="List any required equipment" />
                        </TableCell>
                    </TableRow>

                    <TableRow className="hover:bg-transparent">
                        <TableCell className="bg-muted/30 font-semibold py-4">
                            Class Invite/Registration Link
                        </TableCell>
                        <TableCell className="bg-card py-4 flex items-center gap-2">
                            <Input
                                value={inviteUrl}
                                readOnly
                                className="flex-1"
                            />
                            <CopyInviteButton url={inviteUrl} />
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </Card>
    );
};


const CopyInviteButton = ({ url }: { url?: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (!url) return;

        await navigator.clipboard.writeText(url);
        setCopied(true);

        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <button
            onClick={handleCopy}
            disabled={!url}
        >
            {copied ? (
                <Check className="w-4 h-4 text-success" />
            ) : (
                <Copy className="w-4 h-4" />
            )}
        </button>
    );
};
