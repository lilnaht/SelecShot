import { describe, expect, it } from "vitest";

import { buildReportCsv } from "@/lib/image-analysis/zip";

describe("analysis ZIP report", () => {
  it("escapes spreadsheet formulas in CSV cells", () => {
    const csv = buildReportCsv([
      {
        arquivo: "=cmd|' /C calc'!A0.jpg",
        categoria: "invalid",
        brilho_medio: null,
        proporcao_escuros: null,
        proporcao_claros: null,
        blur_score: null,
      },
    ]);

    expect(csv).toContain("'=cmd");
    expect(csv).not.toContain("\n=cmd");
  });
});
