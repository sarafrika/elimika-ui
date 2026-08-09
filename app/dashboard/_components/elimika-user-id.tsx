import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card"
import { Download, IdCard } from "lucide-react"
import { UserDomain, UserProfileType } from "../../../lib/types"
import { toAuthenticatedMediaUrl } from "../../../src/lib/media-url"
import { ProfileQrCode } from "./my-skills/_components/ProfileQrCode"

export interface ElimikaUserIdProps {
    profile: (Partial<UserProfileType> & {
        isLoading: boolean;
        invalidateQuery: () => void;
        clearProfile: () => void;
    }) | null,
    activeDomain: UserDomain | null,
    nationality?: string | null
    photoUrl?: string | null
    shareUrl?: string
    onDownload?: () => void
    className?: string
}

export function ElimikaUserId({
    profile,
    activeDomain,
    nationality,
    photoUrl,
    shareUrl,
    onDownload,
    className,
}: ElimikaUserIdProps) {
    const initials = profile?.full_name!
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
                            Elimika {activeDomain} ID
                        </span>
                    </div>

                    <Badge
                        variant="secondary"
                        className="border-0 bg-primary-foreground/15 text-primary-foreground"
                    >
                        {profile?.active ? 'Active' : "Inactive"}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20 ring-4 ring-primary-foreground/20">
                        {photoUrl && <AvatarImage src={toAuthenticatedMediaUrl(photoUrl)!} alt={profile?.full_name} />}
                        <AvatarFallback className="bg-background text-primary text-xl font-semibold">
                            {initials}
                        </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                        <h2 className="truncate text-xl font-semibold">
                            {profile?.full_name}
                        </h2>

                        <p className="text-xs opacity-90">
                            {nationality || "—"}
                        </p>

                        <p className="mt-1 font-mono text-xs opacity-90">
                            {profile?.user_no!}
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
                    {profile?.created_date
                        ? new Date(profile?.created_date).toLocaleDateString()
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
