import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#ACC00B] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-[#ACC00B]/10 text-[#ACC00B] border border-[#ACC00B]/20",
        primary:
          "bg-[#ACC00B]/10 text-[#ACC00B] border border-[#ACC00B]/20",
        secondary:
          "bg-[#FFD60A]/15 text-[#8A6500] border border-[#FFD60A]/30",
        accent:
          "bg-[#FFD60A]/15 text-[#8A6500] border border-[#FFD60A]/30",
        success:
          "bg-[#22C55E]/10 text-[#16A34A] border border-[#22C55E]/20",
        warning:
          "bg-[#FFD60A]/15 text-[#8A6500] border border-[#FFD60A]/30",
        error:
          "bg-[#EF4444]/10 text-[#DC2626] border border-[#EF4444]/20",
        outline:
          "border border-[#E2E8F0] text-[#0F172A] bg-white",
        ghost:
          "text-[#475569] bg-[#F8FAFC]",
        solid:
          "bg-[#0F172A] text-white",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, size, dot = false, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
