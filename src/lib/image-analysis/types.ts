export type ImageCategory = "blurred" | "dark" | "bright" | "good";
export type EnvironmentCategory = Exclude<ImageCategory, "blurred">;

export type ImageInput = string | Buffer | ArrayBuffer | Uint8Array | Blob;

export type GrayscaleImageData = {
  pixels: Uint8Array;
  width: number;
  height: number;
};

export type ImageAnalysisResult = {
  category: ImageCategory;
  brightnessMean: number;
  darkRatio: number;
  brightRatio: number;
  blurScore: number;
};

export type ImageAnalysisDiagnostics = {
  brightnessMedian: number;
  p10: number;
  p25: number;
  p75: number;
  p90: number;
  p95: number;
  noiseScore: number;
  veryBrightRatio: number;
};

export type ImageAnalysisDetailedResult = ImageAnalysisResult & {
  diagnostics: ImageAnalysisDiagnostics;
};

export type AnalyzeImageOptions = {
  includeDiagnostics?: boolean;
};
