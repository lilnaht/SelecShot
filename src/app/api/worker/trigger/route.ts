import { type NextRequest, NextResponse } from "next/server";

import { logAuditEvent } from "@/lib/audit";
import { processSupabaseAnalysis } from "@/lib/image-analysis/process-supabase-analysis";
import { checkRateLimit, rateLimitHeaders, type RateLimitResult } from "@/lib/rate-limit";
import { isUuid } from "@/lib/security";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_JSON_BODY_BYTES = 1024;
const USER_RATE_LIMIT = { limit: 5, windowMs: 60_000 };
const IP_RATE_LIMIT = { limit: 20, windowMs: 60_000 };

type TriggerPayload = {
  analysisId: string | null;
  retry: boolean;
};

type TriggerRateLimitDecision = {
  allowed: boolean;
  result: RateLimitResult;
  scope: "ip" | "user";
};

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isValidJsonRequest(request)) {
    return NextResponse.json(
      { error: "Conteudo JSON invalido." },
      { status: 415 }
    );
  }

  if (isBodyTooLarge(request)) {
    return NextResponse.json(
      { error: "Corpo da requisicao muito grande." },
      { status: 413 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const payload = getTriggerPayload(body);

  if (!payload || !isUuid(payload.analysisId)) {
    return NextResponse.json(
      { error: "analysis_id invalido" },
      { status: 400 }
    );
  }

  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();

  if (!user || !supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = checkWorkerTriggerRateLimit(request, user.id);
  const responseHeaders = rateLimitHeaders(rateLimit.result);

  if (!rateLimit.allowed) {
    await logAuditEvent(createSupabaseAdminClient(), {
      userId: user.id,
      analysisId: payload.analysisId,
      eventType: "worker_trigger.rate_limited",
      eventData: {
        scope: rateLimit.scope,
        retry: payload.retry,
        retry_after_seconds: rateLimit.result.retryAfterSeconds,
      },
    });

    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde alguns segundos e tente novamente." },
      { status: 429, headers: responseHeaders }
    );
  }

  const adminSupabase = createSupabaseAdminClient();

  if (!adminSupabase) {
    console.error("SUPABASE_SERVICE_ROLE_KEY is missing for worker trigger");
    return NextResponse.json(
      { error: "Servico de processamento indisponivel." },
      { status: 500, headers: responseHeaders }
    );
  }

  const { data: analysis, error } = await supabase
    .from("analyses")
    .select("id,user_id,status")
    .eq("id", payload.analysisId)
    .eq("user_id", user.id)
    .single();

  if (error || !analysis) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404, headers: responseHeaders }
    );
  }

  if (payload.retry && analysis.status !== "failed") {
    return NextResponse.json(
      { error: "Apenas analises com falha podem ser reprocessadas." },
      { status: 409, headers: responseHeaders }
    );
  }

  if (!payload.retry && analysis.status === "failed") {
    return NextResponse.json(
      { error: "Esta analise falhou. Envie retry=true para reprocessar." },
      { status: 409, headers: responseHeaders }
    );
  }

  try {
    await logAuditEvent(adminSupabase, {
      userId: user.id,
      analysisId: payload.analysisId,
      eventType: payload.retry
        ? "analysis.processing_retry_requested"
        : "analysis.processing_requested",
      eventData: {
        retry: payload.retry,
        status_before_request: analysis.status,
      },
    });

    const result = await processSupabaseAnalysis({
      supabase: adminSupabase,
      analysisId: payload.analysisId,
      userId: user.id,
      retry: payload.retry,
    });

    return NextResponse.json({ ok: true, result }, { headers: responseHeaders });
  } catch (processingError) {
    console.error("Image analysis failed", {
      analysisId: payload.analysisId,
      userId: user.id,
      error: processingError,
    });

    return NextResponse.json(
      { error: "Nao foi possivel processar a analise." },
      { status: 500, headers: responseHeaders }
    );
  }
}

function getTriggerPayload(body: unknown): TriggerPayload | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  const value = (body as { analysis_id?: unknown }).analysis_id;
  const retry = (body as { retry?: unknown }).retry;

  if (retry !== undefined && typeof retry !== "boolean") {
    return null;
  }

  return {
    analysisId: typeof value === "string" ? value : null,
    retry: retry === true,
  };
}

function isValidJsonRequest(request: Request) {
  const contentType = request.headers.get("content-type");

  return Boolean(contentType?.toLowerCase().startsWith("application/json"));
}

function isBodyTooLarge(request: Request) {
  const contentLength = request.headers.get("content-length");

  if (!contentLength) {
    return false;
  }

  const parsed = Number(contentLength);

  return !Number.isFinite(parsed) || parsed > MAX_JSON_BODY_BYTES;
}

function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return true;
  }

  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

function checkWorkerTriggerRateLimit(
  request: NextRequest,
  userId: string
): TriggerRateLimitDecision {
  const ipResult = checkRateLimit({
    namespace: "worker-trigger:ip",
    key: getClientIp(request),
    ...IP_RATE_LIMIT,
  });

  if (!ipResult.allowed) {
    return { allowed: false, result: ipResult, scope: "ip" };
  }

  const userResult = checkRateLimit({
    namespace: "worker-trigger:user",
    key: userId,
    ...USER_RATE_LIMIT,
  });

  if (!userResult.allowed) {
    return { allowed: false, result: userResult, scope: "user" };
  }

  return { allowed: true, result: userResult, scope: "user" };
}

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const firstForwardedIp = forwardedFor?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();

  return normalizeRateLimitKey(firstForwardedIp || realIp || "unknown");
}

function normalizeRateLimitKey(value: string): string {
  return value.replace(/[^a-zA-Z0-9:._-]/g, "").slice(0, 128) || "unknown";
}
