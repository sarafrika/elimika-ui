import { localIcons } from "@/lib/local-icons"
import Image from "next/image"

interface CustomIconProps {
    size?: number
    type: keyof typeof localIcons
    className?: string
}

export function CustomIcon({ size = 24, type, className }: CustomIconProps) {
    const src = localIcons[type]
    return (
        <div style={{ width: size, height: size }} className={className}>
            <Image
                src={src}
                alt="Icon"
                width={size}
                height={size}
                className="object-contain"
            />
        </div>
    )
}
