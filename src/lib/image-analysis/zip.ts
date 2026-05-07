import { Buffer } from "node:buffer";
import { PassThrough } from "node:stream";
import archiver from "archiver";

import { CATEGORY_ZIP_FOLDERS } from "@/lib/constants";
import type { ImageCategory } from "@/lib/image-analysis/types";

export type ZipImageFile = {
  category: ImageCategory;
  originalFilename: string;
  storagePath: string;
};

export type ZipReportRow = {
  arquivo: string;
  categoria: ImageCategory | "invalid";
  brilho_medio: number | null;
  proporcao_escuros: number | null;
  proporcao_claros: number | null;
  blur_score: number | null;
};

type BuildAnalysisZipOptions = {
  files: ZipImageFile[];
  reportRows: ZipReportRow[];
  loadFileBuffer: (file: ZipImageFile) => Promise<Buffer>;
};

export async function buildAnalysisZip({
  files,
  reportRows,
  loadFileBuffer,
}: BuildAnalysisZipOptions): Promise<Buffer> {
  const archive = archiver("zip", { zlib: { level: 9 } });
  const output = new PassThrough();
  const chunks: Buffer[] = [];

  const done = new Promise<Buffer>((resolve, reject) => {
    output.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
    output.on("end", () => resolve(Buffer.concat(chunks)));
    output.on("error", reject);
    archive.on("error", reject);
    archive.on("warning", (warning) => {
      if (warning.code !== "ENOENT") {
        reject(warning);
      }
    });
  });

  archive.pipe(output);

  for (const [index, file] of files.entries()) {
    const buffer = await loadFileBuffer(file);
    archive.append(buffer, {
      name: toZipPath(file.category, file.originalFilename, index),
    });
  }

  archive.append(buildReportCsv(reportRows), { name: "relatorio.csv" });
  await archive.finalize();

  return done;
}

function toZipPath(
  category: ImageCategory,
  originalFilename: string,
  index: number
): string {
  const folder = CATEGORY_ZIP_FOLDERS[category];
  const safeName = sanitizeZipFilename(originalFilename);
  return `${folder}/${String(index + 1).padStart(4, "0")}-${safeName}`;
}

function sanitizeZipFilename(filename: string): string {
  const normalized = filename
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return normalized || "imagem.jpg";
}

function buildReportCsv(rows: ZipReportRow[]): string {
  const header = [
    "arquivo",
    "categoria",
    "brilho_medio",
    "proporcao_escuros",
    "proporcao_claros",
    "blur_score",
  ];

  const body = rows.map((row) =>
    [
      row.arquivo,
      row.categoria,
      row.brilho_medio,
      row.proporcao_escuros,
      row.proporcao_claros,
      row.blur_score,
    ]
      .map(formatCsvValue)
      .join(",")
  );

  return `${[header.join(","), ...body].join("\n")}\n`;
}

function formatCsvValue(value: string | number | null): string {
  if (value === null) {
    return "";
  }

  const stringValue = escapeSpreadsheetFormula(String(value));

  if (!/[",\n\r]/.test(stringValue)) {
    return stringValue;
  }

  return `"${stringValue.replace(/"/g, '""')}"`;
}

function escapeSpreadsheetFormula(value: string) {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}
