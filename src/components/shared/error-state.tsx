import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type ErrorStateProps = {
  title?: string;
  description?: string;
};

export function ErrorState({
  title = "Não foi possível concluir esta análise.",
  description = "Tente novamente em alguns instantes ou volte ao dashboard.",
}: ErrorStateProps) {
  return (
    <Alert variant="destructive">
      <AlertCircle data-icon="inline-start" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}

