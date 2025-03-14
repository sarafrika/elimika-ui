import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Library } from "lucide-react"
import React from "react"

export function FlashScreen({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex min-h-screen items-center justify-center", className)}
    >
      <Card className="border-none shadow-none">
        <CardContent className="flex flex-col items-center space-y-4 p-8">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-lg bg-sidebar-primary opacity-75"></div>
            <div
              className="flex aspect-square size-12 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Library className="size-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
