import {
  LIMIAR_AMBIENTE_CLARO_P50,
  LIMIAR_AMBIENTE_CLARO_P75,
  LIMIAR_AMBIENTE_ESCURO_P50,
  LIMIAR_AMBIENTE_ESCURO_P75,
  LIMIAR_LUZ_FORTE_P90,
  LIMIAR_LUZ_FORTE_P95,
  LIMIAR_SOMBRA_PESADA_P25,
  LIMIAR_SOMBRA_PESADA_RATIO,
  LIMIAR_SUBEXPOSTA_RATIO,
} from "@/lib/image-analysis/constants";
import type { EnvironmentCategory } from "@/lib/image-analysis/types";

type ClassifyEnvironmentInput = {
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  darkRatio: number;
  brightRatio: number;
};

export function classifyEnvironment({
  p10,
  p25,
  p50,
  p75,
  p90,
  p95,
  darkRatio,
  brightRatio,
}: ClassifyEnvironmentInput): EnvironmentCategory {
  void p10;
  void brightRatio;

  const hasHeavyShadow =
    darkRatio >= LIMIAR_SOMBRA_PESADA_RATIO || p25 < LIMIAR_SOMBRA_PESADA_P25;

  const hasStrongLight = p90 >= LIMIAR_LUZ_FORTE_P90 || p95 >= LIMIAR_LUZ_FORTE_P95;

  const hasGoodOverallLight =
    p50 >= LIMIAR_AMBIENTE_CLARO_P50 && p75 >= LIMIAR_AMBIENTE_CLARO_P75;

  const hasLowOverallLight =
    p50 < LIMIAR_AMBIENTE_ESCURO_P50 && p75 < LIMIAR_AMBIENTE_ESCURO_P75;

  if (hasHeavyShadow && hasStrongLight) {
    return "bright";
  }

  if (hasGoodOverallLight && darkRatio < 0.35) {
    return "bright";
  }

  if (hasLowOverallLight && darkRatio >= 0.3) {
    return "dark";
  }

  if (darkRatio >= LIMIAR_SUBEXPOSTA_RATIO && p90 < LIMIAR_LUZ_FORTE_P90) {
    return "dark";
  }

  return "good";
}
