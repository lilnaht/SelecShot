import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AnalysisSummaryCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
};

export function AnalysisSummaryCard({
  title,
  value,
  description,
  icon: Icon,
}: AnalysisSummaryCardProps) {
  return (
    <Card className="border-white/10 bg-white/[0.035]">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
        <Icon aria-hidden="true" className="text-sky-200" />
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold">{value}</p>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

