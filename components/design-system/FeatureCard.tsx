import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Code2, Scale, Trophy, ShieldCheck, ArrowRight } from "lucide-react";
import { FeatureCardData } from "@/types/design-system";

const ICON_MAP: Record<string, React.ElementType> = {
  Code2,
  Scale,
  Trophy,
  ShieldCheck,
};

export interface FeatureCardProps {
  data: FeatureCardData;
}

export function FeatureCard({ data }: FeatureCardProps) {
  const IconComponent = ICON_MAP[data.iconName] || Code2;

  return (
    <Card className="flex flex-col justify-between group hover:border-[#2563EB]/40 hover:shadow-md transition-all duration-300">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#2563EB] to-[#06B6D4] text-white shadow-sm group-hover:scale-105 transition-transform">
            <IconComponent className="h-5 w-5" />
          </div>
          {data.tag && (
            <Badge variant="accent" size="sm">
              {data.tag}
            </Badge>
          )}
        </div>
        <CardTitle className="group-hover:text-[#2563EB] transition-colors">
          {data.title}
        </CardTitle>
        <CardDescription className="line-clamp-3 leading-relaxed">
          {data.description}
        </CardDescription>
      </CardHeader>

      <CardFooter className="pt-2">
        <Button
          variant="outline"
          className="w-full justify-between group-hover:bg-[#2563EB] group-hover:text-white group-hover:border-[#2563EB] transition-all"
          onClick={data.onAction}
          rightIcon={<ArrowRight className="h-4 w-4" />}
        >
          <span>{data.actionText || "Explore Module"}</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
