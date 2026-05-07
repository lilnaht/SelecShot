import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type FeatureCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <Card className="border-white/10 bg-white/[0.035]">
      <CardHeader>
        <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-sky-300/10 text-sky-200">
          <Icon aria-hidden="true" />
        </div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="leading-6 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

