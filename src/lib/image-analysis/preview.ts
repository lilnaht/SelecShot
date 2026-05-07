import sharp from "sharp";

import {
  PREVIEW_JPEG_QUALITY,
  PREVIEW_MAX_WIDTH,
} from "@/lib/image-analysis/constants";
import { normalizeImageInput } from "@/lib/image-analysis/input";
import type { ImageInput } from "@/lib/image-analysis/types";

export async function generatePreview(input: ImageInput): Promise<Buffer> {
  const normalized = await normalizeImageInput(input);

  return sharp(normalized)
    .rotate()
    .resize({
      width: PREVIEW_MAX_WIDTH,
      height: PREVIEW_MAX_WIDTH * 2,
      fit: "inside",
      withoutEnlargement: true,
    })
    .toColorspace("srgb")
    .flatten({ background: "#ffffff" })
    .jpeg({
      quality: PREVIEW_JPEG_QUALITY,
      mozjpeg: true,
    })
    .toBuffer();
}
