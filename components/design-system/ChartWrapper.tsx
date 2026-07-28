"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Info } from "lucide-react";

export interface ChartWrapperProps {
  title: string;
  description?: string;
  mainMetric?: string;
  metricLabel?: string;
  trendText?: string;
  children?: React.ReactNode;
}

export function ChartWrapper({
  title,
  description,
  mainMetric = "1,420 Submissions",
  metricLabel = "Total Volume",
  trendText = "+18.4% vs last event",
  children,
}: ChartWrapperProps) {
  const [period, setPeriod] = useState("7d");

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E2E8F0]/60">
        <div>
          <CardTitle className="flex items-center gap-2">
            {title}
            <Info className="h-4 w-4 text-[#475569] cursor-pointer hover:text-[#0F172A]" />
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>

        <Tabs value={period} onValueChange={setPeriod}>
          <TabsList className="h-9 p-0.5">
            <TabsTrigger value="24h" className="text-xs px-2.5 h-7">24h</TabsTrigger>
            <TabsTrigger value="7d" className="text-xs px-2.5 h-7">7d</TabsTrigger>
            <TabsTrigger value="30d" className="text-xs px-2.5 h-7">30d</TabsTrigger>
            <TabsTrigger value="all" className="text-xs px-2.5 h-7">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="pt-6 space-y-4">
        {/* Metric summary top bar */}
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <span className="text-2xl font-bold font-heading text-[#0F172A]">
              {mainMetric}
            </span>
            <span className="ml-2 text-xs font-medium text-[#475569]">
              ({metricLabel})
            </span>
          </div>
          <Badge variant="success" size="sm" className="gap-1">
            <TrendingUp className="h-3 w-3" />
            <span>{trendText}</span>
          </Badge>
        </div>

        {/* Chart View container or custom SVG mock */}
        <div className="relative h-64 w-full rounded-[14px] bg-[#F8FAFC] border border-[#E2E8F0] p-4 flex items-end justify-between gap-2 overflow-hidden">
          {children ? (
            children
          ) : (
            <>
              {/* Default Mock SVG Bars / Chart Visualization */}
              {[40, 65, 45, 80, 55, 90, 70, 95, 60, 85, 100, 75].map((height, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div
                    style={{ height: `${height}%` }}
                    className="w-full rounded-t-[6px] bg-gradient-to-t from-[#2563EB] to-[#06B6D4] opacity-85 group-hover:opacity-100 transition-all duration-200"
                  />
                  <span className="text-[10px] font-medium text-[#475569]">
                    d{i + 1}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
