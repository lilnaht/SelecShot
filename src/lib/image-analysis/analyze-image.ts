import { calculateBlurScore } from "@/lib/image-analysis/blur-score";
import { classifyEnvironment } from "@/lib/image-analysis/classify-environment";
import {
  LIMIAR_DESFOQUE_FORTE,
  LIMIAR_DESFOQUE_MODERADO,
  LIMIAR_PIXEL_CLARO,
  LIMIAR_PIXEL_ESCURO,
  LIMIAR_PIXEL_MUITO_CLARO,
  LIMIAR_RUIDO_ISO_ALTO,
  LIMIAR_SUBEXPOSTA_RATIO,
  LIMIAR_SUPEREXPOSTA_RATIO,
} from "@/lib/image-analysis/constants";
import { loadGrayscaleImage } from "@/lib/image-analysis/input";
import { estimateNoiseScore } from "@/lib/image-analysis/noise-score";
import {
  buildUint8Histogram,
  meanFromHistogram,
  medianFromHistogram,
  percentileFromHistogram,
  ratioAboveFromHistogram,
  ratioBelowFromHistogram,
  roundTo,
} from "@/lib/image-analysis/stats";
import type {
  ImageAnalysisDetailedResult,
  ImageAnalysisResult,
  ImageCategory,
  ImageInput,
} from "@/lib/image-analysis/types";

export async function analyzeImage(input: ImageInput): Promise<ImageAnalysisResult> {
  const { diagnostics, ...result } = await analyzeImageDetailed(input);
  void diagnostics;
  return result;
}

export async function analyzeImageDetailed(
  input: ImageInput
): Promise<ImageAnalysisDetailedResult> {
  const { pixels, width, height } = await loadGrayscaleImage(input);
  const histogram = buildUint8Histogram(pixels);

  const brightnessMean = meanFromHistogram(histogram);
  const brightnessMedian = medianFromHistogram(histogram);
  const p10 = percentileFromHistogram(histogram, 10);
  const p25 = percentileFromHistogram(histogram, 25);
  const p75 = percentileFromHistogram(histogram, 75);
  const p90 = percentileFromHistogram(histogram, 90);
  const p95 = percentileFromHistogram(histogram, 95);

  const darkRatio = ratioBelowFromHistogram(histogram, LIMIAR_PIXEL_ESCURO);
  const brightRatio = ratioAboveFromHistogram(histogram, LIMIAR_PIXEL_CLARO);
  const veryBrightRatio = ratioAboveFromHistogram(
    histogram,
    LIMIAR_PIXEL_MUITO_CLARO
  );

  const blurScore = calculateBlurScore(pixels, width, height);
  const noiseScore = estimateNoiseScore(pixels, width, height);

  const isStrongBlur = blurScore < LIMIAR_DESFOQUE_FORTE;
  const isModerateBlur =
    blurScore < LIMIAR_DESFOQUE_MODERADO &&
    brightnessMedian >= 75 &&
    darkRatio < 0.4;
  const isBlurred = isStrongBlur || isModerateBlur;

  const hasHighIsoNoise = noiseScore > LIMIAR_RUIDO_ISO_ALTO;
  const isOverexposed = veryBrightRatio > LIMIAR_SUPEREXPOSTA_RATIO;
  const isUnderexposed = darkRatio > LIMIAR_SUBEXPOSTA_RATIO;

  const environmentCategory = classifyEnvironment({
    p10,
    p25,
    p50: brightnessMedian,
    p75,
    p90,
    p95,
    darkRatio,
    brightRatio,
  });

  let category: ImageCategory;

  if (isBlurred) {
    category = "blurred";
  } else if (isOverexposed) {
    category = "bright";
  } else if (isUnderexposed) {
    category = "dark";
  } else if (hasHighIsoNoise && environmentCategory === "dark") {
    category = "dark";
  } else {
    category = environmentCategory;
  }

  return {
    category,
    brightnessMean: roundTo(brightnessMean, 4),
    darkRatio: roundTo(darkRatio, 6),
    brightRatio: roundTo(brightRatio, 6),
    blurScore: roundTo(blurScore, 4),
    diagnostics: {
      brightnessMedian: roundTo(brightnessMedian, 4),
      p10: roundTo(p10, 4),
      p25: roundTo(p25, 4),
      p75: roundTo(p75, 4),
      p90: roundTo(p90, 4),
      p95: roundTo(p95, 4),
      noiseScore: roundTo(noiseScore, 4),
      veryBrightRatio: roundTo(veryBrightRatio, 6),
    },
  };
}
