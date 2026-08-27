import "server-only";

/** Call notes + activity log entries for one subject, merged and sorted newest-first. */
export async function fetchTimelineFor(supabase, subjectType, subjectId) {
  const [{ data: callLogs, error: callLogsError }, { data: activities, error: activitiesError }] =
    await Promise.all([
      supabase
        .from("call_logs")
        .select("*")
        .eq("subject_type", subjectType)
        .eq("subject_id", subjectId)
        .order("created_at", { ascending: false }),
      supabase
        .from("activities")
        .select("*")
        .eq("subject_type", subjectType)
        .eq("subject_id", subjectId)
        .order("created_at", { ascending: false }),
    ]);

  const error = callLogsError || activitiesError;
  if (error) return { timeline: [], callLogs: [], error };

  const timeline = [
    ...(callLogs ?? []).map((c) => ({ id: c.id, kind: "note", label: c.text, created_at: c.created_at })),
    ...(activities ?? []).map((a) => ({
      id: a.id,
      kind: "activity",
      type: a.type,
      label: a.description,
      created_at: a.created_at,
    })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return { timeline, callLogs: callLogs ?? [], error: null };
}
