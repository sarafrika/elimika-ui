'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import Spinner from '@/components/ui/spinner';
import { useState } from 'react';

interface InviteStudentModalProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    title?: string;
    description?: string;
    onInvite: (emails: string[]) => void;
    isLoading?: boolean;
    saveText?: string;
    cancelText?: string;
    saveButtonProps?: React.ComponentProps<typeof Button>;
    cancelButtonProps?: React.ComponentProps<typeof Button>;
}

export default function InviteStudentModal({
    open,
    setOpen,
    title = "Invite Students",
    description = "Enter email addresses of students you want to invite.",
    onInvite,
    isLoading = false,
    saveText = "Send Invites",
    cancelText = "Cancel",
    saveButtonProps,
    cancelButtonProps,
}: InviteStudentModalProps) {

    const [emails, setEmails] = useState<string[]>([""]);

    const updateEmail = (index: number, value: string) => {
        const updated = [...emails];
        updated[index] = value;
        setEmails(updated);
    };

    const addEmailField = () => {
        setEmails([...emails, ""]);
    };

    const removeEmailField = (index: number) => {
        setEmails(emails.filter((_, i) => i !== index));
    };

    const handleInvite = () => {
        const filtered = emails.map(e => e.trim()).filter(e => e !== "");
        onInvite(filtered);
        setEmails([""]);
    };

    const handleClose = () => {
        setOpen(false);
        setEmails([""]);
    };

    const hasValidEmails =
        emails.some(e => e.trim() !== "") &&
        emails.every(e => e.trim() === "" || /\S+@\S+\.\S+/.test(e));

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-md space-y-4">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                {/* EMAIL INPUTS */}
                <div className="space-y-3">
                    {emails.map((email, index) => (
                        <div key={index} className="flex gap-2 items-center">
                            <Input
                                value={email}
                                onChange={(e) => updateEmail(index, e.target.value)}
                                placeholder="student@example.com"
                                type="email"
                                className="flex-1"
                            />
                            {emails.length > 1 && (
                                <Button
                                    variant="destructive"
                                    onClick={() => removeEmailField(index)}
                                    size="sm"
                                >
                                    Remove
                                </Button>
                            )}
                        </div>
                    ))}

                    <Button variant="secondary" onClick={addEmailField}>
                        + Add another email
                    </Button>
                </div>

                {/* FOOTER BUTTONS */}
                <div className="flex justify-end gap-2 pt-2">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isLoading}
                        {...cancelButtonProps}
                    >
                        {cancelText}
                    </Button>

                    <Button
                        onClick={handleInvite}
                        className="min-w-[120px]"
                        disabled={!hasValidEmails || isLoading}
                        {...saveButtonProps}
                    >
                        {isLoading ? <Spinner /> : saveText}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
