"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Filter, Search, SlidersHorizontal } from "lucide-react";

import { AnalysisStatusBadge } from "@/components/dashboard/analysis-status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Analysis, AnalysisStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type AnalysisHistoryProps = {
  analyses: Analysis[];
  referenceTime: number;
};

type StatusFilter = "all" | AnalysisStatus;
type DateFilter = "all" | "7d" | "30d";
type CountFilter = "all" | "small" | "medium" | "large";

const pageSize = 6;

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "done", label: "Finalizadas" },
  { value: "processing", label: "Processando" },
  { value: "pending", label: "Pendentes" },
  { value: "failed", label: "Falhas" },
];

const dateOptions: { value: DateFilter; label: string }[] = [
  { value: "all", label: "Todo período" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
];

const countOptions: { value: CountFilter; label: string }[] = [
  { value: "all", label: "Qualquer volume" },
  { value: "small", label: "Até 100" },
  { value: "medium", label: "101-300" },
  { value: "large", label: "300+" },
];

export function AnalysisHistory({ analyses, referenceTime }: AnalysisHistoryProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [countFilter, setCountFilter] = useState<CountFilter>("all");
  const [visibleCount, setVisibleCount] = useState(pageSize);

  const filteredAnalyses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return analyses.filter((analysis) => {
      const matchesQuery =
        !normalizedQuery ||
        analysis.id.toLowerCase().includes(normalizedQuery) ||
        displayAnalysisName(analysis).toLowerCase().includes(normalizedQuery);
      const matchesStatus =
        statusFilter === "all" || analysis.status === statusFilter;
      const matchesDate =
        dateFilter === "all" ||
        referenceTime - new Date(analysis.created_at).getTime() <=
          (dateFilter === "7d" ? 7 : 30) * 24 * 60 * 60 * 1000;
      const matchesCount =
        countFilter === "all" ||
        (countFilter === "small" && analysis.total_files <= 100) ||
        (countFilter === "medium" &&
          analysis.total_files > 100 &&
          analysis.total_files <= 300) ||
        (countFilter === "large" && analysis.total_files > 300);

      return matchesQuery && matchesStatus && matchesDate && matchesCount;
    });
  }, [analyses, countFilter, dateFilter, query, referenceTime, statusFilter]);

  const visibleAnalyses = filteredAnalyses.slice(0, visibleCount);
  const hasActiveFilters =
    query || statusFilter !== "all" || dateFilter !== "all" || countFilter !== "all";

  function resetPagination() {
    setVisibleCount(pageSize);
  }

  function clearFilters() {
    setQuery("");
    setStatusFilter("all");
    setDateFilter("all");
    setCountFilter("all");
    setVisibleCount(pageSize);
  }

  if (!analyses.length) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="Nenhuma análise ainda"
        description="Envie suas fotos para criar o primeiro lote organizado."
        action={
          <Link href="/dashboard/new-analysis">
            <Button>Nova análise</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 xl:grid-cols-[minmax(220px,1fr)_auto]">
        <label className="relative block">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              resetPagination();
            }}
            className="h-9 pl-8"
            placeholder="Buscar por ID do lote"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <FilterButtonGroup
            icon={Filter}
            options={statusOptions}
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              resetPagination();
            }}
          />
          <FilterButtonGroup
            icon={CalendarDays}
            options={dateOptions}
            value={dateFilter}
            onChange={(value) => {
              setDateFilter(value);
              resetPagination();
            }}
          />
          <FilterButtonGroup
            icon={SlidersHorizontal}
            options={countOptions}
            value={countFilter}
            onChange={(value) => {
              setCountFilter(value);
              resetPagination();
            }}
          />
        </div>
      </div>

      {visibleAnalyses.length ? (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lote</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Escuras</TableHead>
                <TableHead>Claras</TableHead>
                <TableHead>Desfocadas</TableHead>
                <TableHead>Boas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleAnalyses.map((analysis) => (
                <TableRow key={analysis.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/analyses/${analysis.id}`}
                      className="font-medium text-foreground hover:text-sky-200"
                    >
                      {displayAnalysisName(analysis)}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {new Date(analysis.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </TableCell>
                  <TableCell>
                    <AnalysisStatusBadge status={analysis.status} />
                  </TableCell>
                  <TableCell>{analysis.total_files}</TableCell>
                  <TableCell>{analysis.dark_count}</TableCell>
                  <TableCell>{analysis.bright_count}</TableCell>
                  <TableCell>{analysis.blurred_count}</TableCell>
                  <TableCell>{analysis.good_count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex flex-col justify-between gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center">
            <p className="text-sm text-muted-foreground">
              Mostrando {visibleAnalyses.length} de {filteredAnalyses.length} lote(s)
            </p>
            <div className="flex gap-2">
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Limpar filtros
                </Button>
              )}
              {visibleCount < filteredAnalyses.length && (
                <Button
                  variant="outline"
                  onClick={() => setVisibleCount((current) => current + pageSize)}
                >
                  Carregar mais
                </Button>
              )}
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          icon={Search}
          title="Nenhum lote encontrado"
          description="Ajuste os filtros para ver outras análises do histórico."
          action={
            <Button variant="outline" onClick={clearFilters}>
              Limpar filtros
            </Button>
          }
        />
      )}
    </div>
  );
}

function FilterButtonGroup<TValue extends string>({
  icon: Icon,
  options,
  value,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  options: { value: TValue; label: string }[];
  value: TValue;
  onChange: (value: TValue) => void;
}) {
  return (
    <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-lg border border-white/10 bg-black/20 p-1">
      <Icon aria-hidden className="ml-1 size-3.5 shrink-0 text-muted-foreground" />
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "h-7 shrink-0 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground",
            value === option.value && "bg-white/[0.08] text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function displayAnalysisName(analysis: Analysis) {
  return analysis.id.startsWith("mock") ? "Evento esportivo" : analysis.id.slice(0, 8);
}
