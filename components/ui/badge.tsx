import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        // Stage badges - matching Figma design
        pending: "border-transparent bg-yellow-100 text-yellow-700",
        pendingValidation: "border-transparent bg-orange-100 text-orange-700",
        validated: "border-green-500 bg-green-50 text-green-700",
        processed: "border-transparent bg-green-100 text-green-700",
        // Status badges - matching Figma design
        paid: "border-green-500 bg-white text-green-700",
        denied: "border-transparent bg-red-100 text-red-700",
        partiallyPaid: "border-transparent bg-yellow-100 text-yellow-700",
        inProcess: "border-transparent bg-blue-100 text-blue-700",
        notOnFile: "border-transparent bg-gray-100 text-gray-700",
        patientNotFound: "border-transparent bg-yellow-100 text-yellow-700",
        noPortalAccess: "border-transparent bg-gray-100 text-gray-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
