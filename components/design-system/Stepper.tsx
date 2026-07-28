"use client";

import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { StepItem } from "@/types/design-system";

export interface StepperProps {
  steps: StepItem[];
  currentStepIndex: number;
  onStepClick?: (index: number) => void;
  className?: string;
}

export function Stepper({
  steps,
  currentStepIndex,
  onStepClick,
  className,
}: StepperProps) {
  return (
    <div className={cn("w-full py-4", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isUpcoming = index > currentStepIndex;

          return (
            <React.Fragment key={step.id}>
              {/* Step item */}
              <div
                onClick={() => onStepClick && onStepClick(index)}
                className={cn(
                  "flex items-center gap-3 group cursor-pointer select-none",
                  !onStepClick && "cursor-default"
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold font-heading transition-all duration-200 shadow-xs",
                    isCompleted && "bg-[#22C55E] text-white",
                    isCurrent &&
                      "bg-[#2563EB] text-white ring-4 ring-[#2563EB]/20 scale-105",
                    isUpcoming &&
                      "border-2 border-[#E2E8F0] bg-white text-[#475569] group-hover:border-[#CBD5E1]"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 stroke-[3]" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                <div className="hidden md:flex flex-col text-left">
                  <span
                    className={cn(
                      "text-xs font-semibold transition-colors",
                      isCurrent && "text-[#2563EB]",
                      isCompleted && "text-[#0F172A]",
                      isUpcoming && "text-[#475569]"
                    )}
                  >
                    {step.title}
                  </span>
                  {step.description && (
                    <span className="text-[10px] text-[#475569]">
                      {step.description}
                    </span>
                  )}
                </div>
              </div>

              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-3 rounded-full transition-all duration-300",
                    index < currentStepIndex ? "bg-[#22C55E]" : "bg-[#E2E8F0]"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
