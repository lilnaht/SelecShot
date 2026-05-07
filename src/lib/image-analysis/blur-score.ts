export function calculateBlurScore(
  pixels: Uint8Array,
  width: number,
  height: number
): number {
  if (!pixels.length || width <= 0 || height <= 0) {
    return 0;
  }

  let x1 = Math.trunc(width * 0.15);
  let x2 = Math.trunc(width * 0.85);
  let y1 = Math.trunc(height * 0.15);
  let y2 = Math.trunc(height * 0.85);

  if (x2 <= x1 || y2 <= y1) {
    x1 = 0;
    y1 = 0;
    x2 = width;
    y2 = height;
  }

  const cropWidth = x2 - x1;
  const cropHeight = y2 - y1;

  if (cropWidth <= 0 || cropHeight <= 0) {
    return 0;
  }

  let count = 0;
  let average = 0;
  let m2 = 0;

  for (let y = 0; y < cropHeight; y += 1) {
    for (let x = 0; x < cropWidth; x += 1) {
      const center = getCropPixel(pixels, width, x1, y1, cropWidth, cropHeight, x, y);
      const top = getCropPixel(pixels, width, x1, y1, cropWidth, cropHeight, x, y - 1);
      const bottom = getCropPixel(pixels, width, x1, y1, cropWidth, cropHeight, x, y + 1);
      const left = getCropPixel(pixels, width, x1, y1, cropWidth, cropHeight, x - 1, y);
      const right = getCropPixel(pixels, width, x1, y1, cropWidth, cropHeight, x + 1, y);
      const laplacian = top + bottom + left + right - 4 * center;

      count += 1;
      const delta = laplacian - average;
      average += delta / count;
      m2 += delta * (laplacian - average);
    }
  }

  return count ? m2 / count : 0;
}

function getCropPixel(
  pixels: Uint8Array,
  imageWidth: number,
  cropX: number,
  cropY: number,
  cropWidth: number,
  cropHeight: number,
  x: number,
  y: number
): number {
  const reflectedX = reflect101(x, cropWidth);
  const reflectedY = reflect101(y, cropHeight);
  const imageX = cropX + reflectedX;
  const imageY = cropY + reflectedY;

  return pixels[imageY * imageWidth + imageX] ?? 0;
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
