import { NextResponse } from "next/server";

import { processSupabaseAnalysis } from "@/lib/image-analysis/process-supabase-analysis";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();
  const adminSupabase = createSupabaseAdminClient();

  if (!user || !supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!adminSupabase) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is required for server-side analysis" },
      { status: 500 }
    );
  }

  let body: { analysis_id?: string };

  try {
    body = (await request.json()) as { analysis_id?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.analysis_id) {
    return NextResponse.json(
      { error: "analysis_id is required" },
      { status: 400 }
    );
  }

  const { data: analysis, error } = await supabase
    .from("analyses")
    .select("id,user_id")
    .eq("id", body.analysis_id)
    .eq("user_id", user.id)
    .single();

  if (error || !analysis) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const result = await processSupabaseAnalysis({
      supabase: adminSupabase,
      analysisId: body.analysis_id,
      userId: user.id,
    });

    return NextResponse.json({ ok: true, result });
  } catch (processingError) {
    return NextResponse.json(
      {
        error:
          processingError instanceof Error
            ? processingError.message
            : "Image analysis failed",
      },
      { status: 500 }
    );
  }
}
