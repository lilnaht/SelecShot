import { LIMIAR_AREA_ESCURA_MINIMA_RUIDO } from "@/lib/image-analysis/constants";

const DARK_NOISE_PIXEL_THRESHOLD = 110;

export function estimateNoiseScore(
  pixels: Uint8Array,
  width: number,
  height: number
): number {
  if (!pixels.length || width <= 0 || height <= 0) {
    return 0;
  }

  let darkCount = 0;

  for (let index = 0; index < pixels.length; index += 1) {
    if ((pixels[index] ?? 0) < DARK_NOISE_PIXEL_THRESHOLD) {
      darkCount += 1;
    }
  }

  const darkAreaRatio = darkCount / pixels.length;

  if (darkAreaRatio < LIMIAR_AREA_ESCURA_MINIMA_RUIDO) {
    return 0;
  }

  let count = 0;
  let average = 0;
  let m2 = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixel = getPixel(pixels, width, height, x, y);

      if (pixel >= DARK_NOISE_PIXEL_THRESHOLD) {
        continue;
      }

      const smoothed = gaussian3x3(pixels, width, height, x, y);
      const residual = pixel - smoothed;

      count += 1;
      const delta = residual - average;
      average += delta / count;
      m2 += delta * (residual - average);
    }
  }

  return count ? Math.sqrt(m2 / count) : 0;
}

function gaussian3x3(
  pixels: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number
): number {
  const topLeft = getPixel(pixels, width, height, x - 1, y - 1);
  const top = getPixel(pixels, width, height, x, y - 1);
  const topRight = getPixel(pixels, width, height, x + 1, y - 1);
  const left = getPixel(pixels, width, height, x - 1, y);
  const center = getPixel(pixels, width, height, x, y);
  const right = getPixel(pixels, width, height, x + 1, y);
  const bottomLeft = getPixel(pixels, width, height, x - 1, y + 1);
  const bottom = getPixel(pixels, width, height, x, y + 1);
  const bottomRight = getPixel(pixels, width, height, x + 1, y + 1);

  return (
    topLeft +
    2 * top +
    topRight +
    2 * left +
    4 * center +
    2 * right +
    bottomLeft +
    2 * bottom +
    bottomRight
  ) / 16;
}

function getPixel(
  pixels: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number
): number {
  const reflectedX = reflect101(x, width);
  const reflectedY = reflect101(y, height);

  return pixels[reflectedY * width + reflectedX] ?? 0;
}

function reflect101(index: number, length: number): number {
  if (length <= 1) {
    return 0;
  }

  let reflected = index;

  while (reflected < 0 || reflected >= length) {
    if (reflected < 0) {
      reflected = -reflected;
    } else {
      reflected = 2 * length - reflected - 2;
    }
  }

  return reflected;
}
