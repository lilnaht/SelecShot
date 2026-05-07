import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PricingCardProps = {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
};

export function PricingCard({
  name,
  price,
  description,
  features,
  highlighted,
}: PricingCardProps) {
  return (
    <Card
      className={cn(
        "relative border-white/10 bg-white/[0.035]",
        highlighted && "border-sky-300/40 bg-sky-300/[0.045] shadow-xl shadow-sky-950/20"
      )}
    >
      {highlighted && (
        <div className="absolute right-4 top-4">
          <Badge className="brand-gradient">Mais escolhido</Badge>
        </div>
      )}
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <div className="flex flex-col gap-2 pt-4">
          <p className="text-3xl font-semibold">{price}</p>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-5">
        <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
          {features.map((feature) => (
            <li key={feature} className="flex gap-2">
              <Check aria-hidden="true" className="mt-0.5 text-emerald-300" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <Button className={highlighted ? "brand-gradient" : ""} variant={highlighted ? "default" : "outline"}>
          Começar agora
        </Button>
      </CardContent>
    </Card>
  );
}

