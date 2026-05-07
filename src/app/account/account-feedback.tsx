"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Circle, MessageSquare, ThumbsDown, ThumbsUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const ONBOARDING_STORAGE_KEY = "selectshot:onboarding";
const FEEDBACK_STORAGE_KEY = "selectshot:classification-feedback";

const onboardingItems = [
  "Enviar lote",
  "Acompanhar análise",
  "Baixar ZIP",
] as const;

type OnboardingItem = (typeof onboardingItems)[number];
type FeedbackRating = "helpful" | "partial" | "not-helpful";

const feedbackOptions: Array<{
  value: FeedbackRating;
  label: string;
  icon: typeof ThumbsUp;
}> = [
  { value: "helpful", label: "Ajudou", icon: ThumbsUp },
  { value: "partial", label: "Parcial", icon: MessageSquare },
  { value: "not-helpful", label: "Não ajudou", icon: ThumbsDown },
];

export function AccountFeedback() {
  const [completedItems, setCompletedItems] = useState<OnboardingItem[]>([]);
  const [rating, setRating] = useState<FeedbackRating | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const savedOnboarding = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
      const savedFeedback = window.localStorage.getItem(FEEDBACK_STORAGE_KEY);

      if (savedOnboarding) {
        setCompletedItems(parseOnboarding(savedOnboarding));
      }

      if (savedFeedback) {
        const parsed = parseFeedback(savedFeedback);
        setRating(parsed.rating);
        setNote(parsed.note);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      ONBOARDING_STORAGE_KEY,
      JSON.stringify(completedItems)
    );
  }, [completedItems]);

  useEffect(() => {
    window.localStorage.setItem(
      FEEDBACK_STORAGE_KEY,
      JSON.stringify({ rating, note })
    );
  }, [rating, note]);

  const completedCount = completedItems.length;
  const completionLabel = useMemo(
    () => `${completedCount}/${onboardingItems.length}`,
    [completedCount]
  );

  function toggleOnboardingItem(item: OnboardingItem) {
    setCompletedItems((current) =>
      current.includes(item)
        ? current.filter((currentItem) => currentItem !== item)
        : [...current, item]
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="border-white/10 bg-white/[0.035]">
        <CardHeader>
          <CardTitle>Primeiro acesso</CardTitle>
          <CardDescription>{completionLabel} etapas concluídas</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {onboardingItems.map((item) => {
            const completed = completedItems.includes(item);
            const Icon = completed ? CheckCircle2 : Circle;

            return (
              <button
                key={item}
                type="button"
                aria-pressed={completed}
                onClick={() => toggleOnboardingItem(item)}
                className={cn(
                  "flex items-center gap-3 rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-left text-sm transition-colors hover:border-sky-300/35",
                  completed && "border-emerald-300/35 text-emerald-100"
                )}
              >
                <Icon aria-hidden="true" className="shrink-0" />
                <span>{item}</span>
              </button>
            );
          })}
        </CardContent>
      </Card>
      <Card className="border-white/10 bg-white/[0.035]">
        <CardHeader>
          <CardTitle>Feedback da classificação</CardTitle>
          <CardDescription>Preferência salva neste navegador</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid gap-2 sm:grid-cols-3">
            {feedbackOptions.map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                type="button"
                variant={rating === value ? "secondary" : "outline"}
                aria-pressed={rating === value}
                onClick={() => setRating(value)}
              >
                <Icon data-icon="inline-start" />
                {label}
              </Button>
            ))}
          </div>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={240}
            rows={4}
            placeholder="O que ajustaria?"
            className="min-h-24 resize-none rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-sky-300/60 focus-visible:ring-3 focus-visible:ring-sky-300/20"
          />
        </CardContent>
      </Card>
    </div>
  );
}

function parseOnboarding(value: string): OnboardingItem[] {
  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is OnboardingItem =>
      onboardingItems.includes(item)
    );
  } catch {
    return [];
  }
}

function parseFeedback(value: string): {
  rating: FeedbackRating | null;
  note: string;
} {
  try {
    const parsed = JSON.parse(value) as {
      rating?: FeedbackRating;
      note?: string;
    };

    return {
      rating: feedbackOptions.some((option) => option.value === parsed.rating)
        ? parsed.rating ?? null
        : null,
      note: typeof parsed.note === "string" ? parsed.note.slice(0, 240) : "",
    };
  } catch {
    return { rating: null, note: "" };
  }
}
