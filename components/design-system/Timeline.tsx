import React from "react";
import { CheckCircle2, Clock, AlertCircle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { TimelineEvent } from "@/types/design-system";

export interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export function Timeline({ events, className }: TimelineProps) {
  return (
    <div className={cn("relative space-y-6 pl-4", className)}>
      {/* Vertical Connecting Line */}
      <div className="absolute left-[22px] top-3 bottom-3 border-l-2 border-dashed border-[#CBD5E1]" />

      {events.map((event) => {
        const isCompleted = event.status === "completed";
        const isCurrent = event.status === "current";
        const isError = event.status === "error";

        return (
          <div key={event.id} className="relative flex items-start gap-4 group">
            {/* Status Indicator Icon */}
            <div
              className={cn(
                "relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 bg-white transition-all duration-200 shadow-xs",
                isCompleted && "border-[#22C55E] text-[#22C55E]",
                isCurrent &&
                  "border-[#00E5FF] text-[#00E5FF] ring-4 ring-[#00E5FF]/15 scale-105",
                isError && "border-[#EF4444] text-[#EF4444]",
                !isCompleted &&
                  !isCurrent &&
                  !isError &&
                  "border-[#CBD5E1] text-[#475569]"
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-4 w-4 fill-[#22C55E] text-white" />
              ) : isError ? (
                <AlertCircle className="h-4 w-4" />
              ) : isCurrent ? (
                <Clock className="h-4 w-4 animate-pulse" />
              ) : (
                <Circle className="h-3 w-3 fill-current" />
              )}
            </div>

            {/* Content box */}
            <div className="flex-1 rounded-[14px] border border-[#E2E8F0] bg-white p-4 shadow-xs transition-all hover:border-[#CBD5E1]">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <h4 className="font-heading text-sm font-semibold text-[#0F172A]">
                  {event.title}
                </h4>
                <span className="text-xs text-[#475569] font-code">
                  {event.timestamp}
                </span>
              </div>

              {event.description && (
                <p className="text-xs text-[#475569] leading-relaxed mb-2">
                  {event.description}
                </p>
              )}

              {event.user && (
                <div className="flex items-center gap-2 pt-2 border-t border-[#E2E8F0]/60">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#00E5FF] text-white text-[9px] font-bold">
                    {event.user.name.charAt(0)}
                  </div>
                  <span className="text-[11px] font-medium text-[#0F172A]">
                    {event.user.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
