import { Buffer } from "node:buffer";
import sharp from "sharp";

import type { GrayscaleImageData, ImageInput } from "@/lib/image-analysis/types";

export async function normalizeImageInput(input: ImageInput): Promise<string | Buffer> {
  if (typeof input === "string") {
    return input;
  }

  if (Buffer.isBuffer(input)) {
    return input;
  }

  if (input instanceof ArrayBuffer) {
    return Buffer.from(input);
  }

  if (ArrayBuffer.isView(input)) {
    return Buffer.from(input.buffer, input.byteOffset, input.byteLength);
  }

  if (input && typeof input === "object" && "arrayBuffer" in input) {
    const arrayBuffer = await input.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  throw new TypeError("Unsupported image input.");
}

export async function loadGrayscaleImage(input: ImageInput): Promise<GrayscaleImageData> {
  const normalized = await normalizeImageInput(input);
  const { data, info } = await sharp(normalized)
    .rotate()
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  if (!width || !height || data.length === 0) {
    throw new Error("Image has no readable pixel data.");
  }

  if (channels === 1) {
    return { pixels: data, width, height };
  }

  const pixels = new Uint8Array(width * height);

  for (let index = 0; index < pixels.length; index += 1) {
    pixels[index] = data[index * channels] ?? 0;
  }

  return { pixels, width, height };
}
