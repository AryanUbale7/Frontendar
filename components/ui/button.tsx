import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[16px] text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5FF] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[#00E5FF] text-[#080C14] shadow-sm hover:bg-[#00B8CC] hover:shadow-md font-bold",
        secondary:
          "bg-[#38BDF8] text-[#080C14] shadow-sm hover:bg-[#0284C7] hover:shadow-md font-bold",
        accent:
          "bg-[#FFD166] text-[#080C14] shadow-sm hover:bg-[#F59E0B] hover:shadow-md font-bold",
        gradient:
          "bg-gradient-to-r from-[#00E5FF] to-[#38BDF8] text-[#080C14] shadow-sm hover:opacity-95 hover:shadow-md font-bold",
        outline:
          "border border-[#1E293B] bg-[#0F172A]/80 text-[#F8FAFC] hover:bg-[#1E293B] hover:border-[#00E5FF]/50",
        ghost:
          "text-[#94A3B8] hover:bg-[#0F172A] hover:text-[#F8FAFC]",
        danger:
          "bg-[#EF4444] text-white shadow-sm hover:bg-[#DC2626]",
        link:
          "text-[#00E5FF] underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-[12px] px-3 text-xs",
        lg: "h-12 rounded-[16px] px-6 text-base",
        icon: "h-10 w-10 p-0 rounded-[12px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
