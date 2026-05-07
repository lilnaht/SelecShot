"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type RetryAnalysisButtonProps = {
  analysisId: string;
};

export function RetryAnalysisButton({ analysisId }: RetryAnalysisButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function retryAnalysis() {
    setIsPending(true);

    const response = await fetch("/api/worker/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analysis_id: analysisId, retry: true }),
    });

    setIsPending(false);

    if (!response.ok) {
      toast.error("Nao foi possivel reprocessar esta analise.");
      return;
    }

    toast.success("Reprocessamento iniciado.");
    router.refresh();
  }

  return (
    <Button variant="outline" onClick={retryAnalysis} disabled={isPending}>
      <RotateCcw data-icon="inline-start" className={isPending ? "animate-spin" : ""} />
      Reprocessar lote
    </Button>
  );
}
