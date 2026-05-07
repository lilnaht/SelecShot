import { describe, expect, it } from "vitest";

import { MAX_FILE_SIZE_BYTES } from "@/lib/constants";
import {
  hasAcceptedImageExtension,
  sanitizeFileName,
  validateImageFile,
} from "@/lib/upload";

function imageFile(name: string, type = "image/jpeg", size = 1024) {
  return new File([new Uint8Array(size)], name, { type });
}

describe("upload validation", () => {
  it("accepts supported image files", () => {
    expect(validateImageFile(imageFile("foto.jpg"))).toBeNull();
    expect(validateImageFile(imageFile("foto.png", "image/png"))).toBeNull();
  });

  it("rejects unsupported extensions and mime types", () => {
    expect(validateImageFile(imageFile("foto.svg", "image/svg+xml"))).toContain(
      "tipo"
    );
    expect(validateImageFile(imageFile("foto.txt", "image/jpeg"))).toContain(
      "extens"
    );
  });

  it("rejects empty and oversized files", () => {
    expect(validateImageFile(imageFile("vazia.jpg", "image/jpeg", 0))).toContain(
      "vazio"
    );
    expect(
      validateImageFile(
        imageFile("grande.jpg", "image/jpeg", MAX_FILE_SIZE_BYTES + 1)
      )
    ).toContain("maior");
  });

  it("sanitizes file names and constrains extensions", () => {
    expect(sanitizeFileName("../Minha Foto.JPG")).toBe("minha-foto.jpg");
    expect(sanitizeFileName("arquivo.php")).toBe("arquivo.jpg");
    expect(hasAcceptedImageExtension("x.WEBP")).toBe(true);
  });
});
