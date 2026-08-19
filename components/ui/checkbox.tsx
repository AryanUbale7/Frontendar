"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  description?: string;
  error?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, id, checked, onChange, disabled, ...props }, ref) => {
    const checkboxId = id || (typeof label === "string" ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="flex flex-col space-y-1">
        <label
          htmlFor={checkboxId}
          className={cn(
            "inline-flex items-start gap-2.5 cursor-pointer select-none text-xs text-[#475569]",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <div className="relative flex items-center mt-0.5">
            <input
              type="checkbox"
              id={checkboxId}
              ref={ref}
              checked={checked}
              onChange={onChange}
              disabled={disabled}
              className="peer sr-only"
              {...props}
            />
            <div className="h-4 w-4 rounded-[6px] border border-[#CBD5E1] bg-white transition-all peer-checked:bg-[#00E5FF] peer-checked:border-[#00E5FF] peer-focus-visible:ring-2 peer-focus-visible:ring-[#00E5FF] peer-focus-visible:ring-offset-1" />
            <Check className="absolute h-3 w-3 text-white stroke-[3] pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity left-0.5" />
          </div>
          {label && <span className="font-medium text-[#0F172A]">{label}</span>}
        </label>
        {description && <p className="text-[11px] text-[#475569] pl-6.5">{description}</p>}
        {error && <p className="text-xs text-[#EF4444] pl-6.5 font-medium">{error}</p>}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
