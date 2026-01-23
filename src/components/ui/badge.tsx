import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
                secondary:
                    "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
                destructive:
                    "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
                outline: "text-foreground",
                success:
                    "border-transparent bg-success text-success-foreground hover:bg-success/80",
                warning:
                    "border-transparent bg-warning text-warning-foreground hover:bg-warning/80",
                info:
                    "border-transparent bg-info text-info-foreground hover:bg-info/80",
                // Custom variants for agent roles
                analyst:
                    "border-blue-500/30 bg-blue-500/10 text-blue-400",
                compliance:
                    "border-green-500/30 bg-green-500/10 text-green-400",
                executor:
                    "border-purple-500/30 bg-purple-500/10 text-purple-400",
                system:
                    "border-red-500/30 bg-red-500/10 text-red-400",
                project:
                    "border-blue-500/30 bg-blue-500/10 text-blue-400",
                run:
                    "border-green-500/30 bg-green-500/10 text-green-400",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    );
}

export { Badge, badgeVariants };
