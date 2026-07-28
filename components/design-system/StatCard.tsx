import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Users,
  CheckCircle2,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatMetric } from "@/types/design-system";

const ICON_COMPONENTS: Record<string, React.ElementType> = {
  Trophy,
  Users,
  CheckCircle2,
  Zap,
};

export interface StatCardProps {
  metric: StatMetric;
  className?: string;
}

export function StatCard({ metric, className }: StatCardProps) {
  const IconComponent = metric.iconName
    ? ICON_COMPONENTS[metric.iconName] || Zap
    : Zap;

  const isIncrease = metric.changeType === "increase";
  const isDecrease = metric.changeType === "decrease";

  return (
    <Card
      className={cn(
        "p-5 transition-all duration-200 hover:border-[#CBD5E1] hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#475569]">
            {metric.label}
          </p>
          <h3 className="font-heading text-2xl font-bold text-[#0F172A]">
            {metric.value}
          </h3>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#2563EB]/10 text-[#2563EB] shadow-xs">
          <IconComponent className="h-5 w-5" />
        </div>
      </div>

      {(metric.change || metric.description) && (
        <div className="mt-4 flex items-center gap-2 pt-3 border-t border-[#E2E8F0]/60">
          {metric.change && (
            <Badge
              variant={isIncrease ? "success" : isDecrease ? "error" : "outline"}
              size="sm"
              className="gap-1"
            >
              {isIncrease ? (
                <TrendingUp className="h-3 w-3" />
              ) : isDecrease ? (
                <TrendingDown className="h-3 w-3" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
              <span>{metric.change}</span>
            </Badge>
          )}

          {metric.description && (
            <span className="text-xs text-[#475569] truncate">
              {metric.description}
            </span>
          )}
        </div>
      )}
    </Card>
  );
}
