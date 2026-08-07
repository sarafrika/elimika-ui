import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card"
import { Download, IdCard } from "lucide-react"
import { toAuthenticatedMediaUrl } from "../../../src/lib/media-url"
import { ProfileQrCode } from "./my-skills/_components/ProfileQrCode"

export interface ElimikaUserIdProps {
    fullName: string
    studentNumber: string
    nationality?: string | null
    photoUrl?: string | null
    shareUrl?: string
    issuedAt?: Date | string
    status?: boolean
    onDownload?: () => void
    className?: string
}

export function ElimikaUserId({
    fullName,
    studentNumber,
    nationality,
    photoUrl,
    shareUrl,
    issuedAt,
    status,
    onDownload,
    className,
}: ElimikaUserIdProps) {
    const initials = fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()

    return (
        <Card
            className={`overflow-hidden border-0 rounded-md bg-primary ${className ?? ""}`}
        >
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <IdCard className="h-5 w-5" />
                        <span className="text-xs uppercase tracking-wider">
                            Elimika Student ID
                        </span>
                    </div>

                    <Badge
                        variant="secondary"
                        className="border-0 bg-primary-foreground/15 text-primary-foreground"
                    >
                        {status ? 'Active' : "Inactive"}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20 ring-4 ring-primary-foreground/20">
                        {photoUrl && <AvatarImage src={toAuthenticatedMediaUrl(photoUrl)!} alt={fullName} />}
                        <AvatarFallback className="bg-background text-primary text-xl font-semibold">
                            {initials}
                        </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                        <h2 className="truncate text-xl font-semibold">
                            {fullName}
                        </h2>

                        <p className="text-xs opacity-90">
                            {nationality || "—"}
                        </p>

                        <p className="mt-1 font-mono text-xs opacity-90">
                            {studentNumber}
                        </p>
                    </div>
                </div>

                <div className="flex justify-center rounded-lg bg-background p-3">
                    {shareUrl ? (
                        <ProfileQrCode targetUrl={shareUrl} />

                    ) : (
                        <div className="flex h-[140px] w-[140px] items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
                            No QR Code
                        </div>
                    )}
                </div>

                <p className="text-center text-[10px] opacity-80">
                    Issued{" "}
                    {issuedAt
                        ? new Date(issuedAt).toLocaleDateString()
                        : "—"}
                </p>

                {onDownload && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={onDownload}
                        className="w-full border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Download card
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}
