import { NextResponse } from "next/server";

import { processSupabaseAnalysis } from "@/lib/image-analysis/process-supabase-analysis";
import { isUuid } from "@/lib/security";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_JSON_BODY_BYTES = 1024;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();
  const adminSupabase = createSupabaseAdminClient();

  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!user || !supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!adminSupabase) {
    console.error("SUPABASE_SERVICE_ROLE_KEY is missing for worker trigger");
    return NextResponse.json(
      { error: "Serviço de processamento indisponível." },
      { status: 500 }
    );
  }

  if (!isValidJsonRequest(request)) {
    return NextResponse.json(
      { error: "Conteúdo JSON inválido." },
      { status: 415 }
    );
  }

  if (isBodyTooLarge(request)) {
    return NextResponse.json(
      { error: "Corpo da requisição muito grande." },
      { status: 413 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const analysisId = getAnalysisId(body);

  if (!isUuid(analysisId)) {
    return NextResponse.json(
      { error: "analysis_id inválido" },
      { status: 400 }
    );
  }

  const { data: analysis, error } = await supabase
    .from("analyses")
    .select("id,user_id")
    .eq("id", analysisId)
    .eq("user_id", user.id)
    .single();

  if (error || !analysis) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await processSupabaseAnalysis({
      supabase: adminSupabase,
      analysisId,
      userId: user.id,
    });

    return NextResponse.json({ ok: true });
  } catch (processingError) {
    console.error("Image analysis failed", {
      analysisId,
      userId: user.id,
      error: processingError,
    });

    return NextResponse.json(
      { error: "Não foi possível processar a análise." },
      { status: 500 }
    );
  }
}

function getAnalysisId(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  const value = (body as { analysis_id?: unknown }).analysis_id;

  return typeof value === "string" ? value : null;
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
