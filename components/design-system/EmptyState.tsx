import React from "react";
import { FolderKanban, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  primaryActionText?: string;
  onPrimaryAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  primaryActionText,
  onPrimaryAction,
  secondaryActionText,
  onSecondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[16px] border border-dashed border-[#CBD5E1] bg-white p-8 md:p-12 text-center shadow-xs",
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#ACC00B]/10 text-[#ACC00B] mb-4 shadow-xs">
        {icon || <FolderKanban className="h-7 w-7" />}
      </div>

      <h3 className="font-heading text-lg font-bold text-[#0F172A] mb-1">
        {title}
      </h3>
      <p className="max-w-md text-sm text-[#475569] mb-6 leading-relaxed">
        {description}
      </p>

      {(primaryActionText || secondaryActionText) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {secondaryActionText && (
            <Button variant="outline" onClick={onSecondaryAction}>
              {secondaryActionText}
            </Button>
          )}
          {primaryActionText && (
            <Button
              variant="default"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={onPrimaryAction}
            >
              {primaryActionText}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
