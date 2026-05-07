import { AlertCircle, CheckCircle2, FileImage } from "lucide-react";

import { AnalysisStatusBadge } from "@/components/dashboard/analysis-status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CATEGORY_LABELS } from "@/lib/constants";
import type { AnalysisFileWithUrl } from "@/lib/types";

type AnalysisFilesTableProps = {
  files: AnalysisFileWithUrl[];
};

export function AnalysisFilesTable({ files }: AnalysisFilesTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Arquivo</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Brilho</TableHead>
            <TableHead>Nitidez</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => (
            <TableRow key={file.id}>
              <TableCell>
                <div className="flex min-w-0 items-center gap-2">
                  <FileImage aria-hidden="true" className="size-4 shrink-0 text-sky-200" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{file.original_filename}</p>
                    {file.processing_error && (
                      <p className="truncate text-xs text-muted-foreground">
                        {file.processing_error}
                      </p>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {file.category ? (
                  CATEGORY_LABELS[file.category]
                ) : (
                  <span className="text-muted-foreground">Sem categoria</span>
                )}
              </TableCell>
              <TableCell>
                {formatMetric(file.brightness_score)}
              </TableCell>
              <TableCell>{formatMetric(file.blur_score)}</TableCell>
              <TableCell>
                {file.processing_error ? (
                  <Badge variant="destructive">
                    <AlertCircle data-icon="inline-start" />
                    Invalido
                  </Badge>
                ) : file.category ? (
                  <Badge variant="secondary">
                    <CheckCircle2 data-icon="inline-start" />
                    Processado
                  </Badge>
                ) : (
                  <AnalysisStatusBadge status="processing" />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function formatMetric(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return <span className="text-muted-foreground">-</span>;
  }

  return Number(value).toFixed(1);
}
