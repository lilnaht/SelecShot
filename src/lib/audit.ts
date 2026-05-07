import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

type AuditValue =
  | string
  | number
  | boolean
  | null
  | AuditValue[]
  | { [key: string]: AuditValue };

export type AuditEventType =
  | "analysis.processing_requested"
  | "analysis.processing_retry_requested"
  | "analysis.processing_retry_started"
  | "analysis.processing_started"
  | "analysis.processing_skipped"
  | "analysis.processing_completed"
  | "analysis.processing_failed"
  | "worker_trigger.rate_limited";

export type AuditEventInput = {
  userId: string | null;
  analysisId?: string | null;
  eventType: AuditEventType;
  eventData?: Record<string, AuditValue>;
};

export async function logAuditEvent(
  supabase: SupabaseClient | null,
  { userId, analysisId = null, eventType, eventData = {} }: AuditEventInput
): Promise<void> {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("audit_events").insert({
    user_id: userId,
    analysis_id: analysisId,
    event_type: eventType,
    event_data: eventData,
  });

  if (error) {
    console.warn("Failed to write audit event", {
      eventType,
      analysisId,
      error,
    });
  }
}
