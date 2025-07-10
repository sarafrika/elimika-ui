import { cn } from "@/lib/utils"
import { LoaderIcon, LucideProps } from "lucide-react"

const Spinner = ({ className, ...props }: LucideProps) => (
  <LoaderIcon className={cn("animate-spin", className)} {...props} />
)

export default Spinner
