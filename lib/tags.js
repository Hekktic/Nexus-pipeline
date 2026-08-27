import "server-only";

/** Tags on one brand or creator, shaped for TagsEditor. */
export async function fetchTagsFor(supabase, subjectType, subjectId) {
  const { data, error } = await supabase
    .from("contact_tags")
    .select("id, tag:tags ( id, name )")
    .eq("subject_type", subjectType)
    .eq("subject_id", subjectId);

  if (error) return { tags: [], error };

  const tags = (data || []).map((row) => ({
    contactTagId: row.id,
    id: row.tag.id,
    name: row.tag.name,
  }));
  return { tags, error: null };
}

/** Every contact_tags row, grouped by "subjectType:subjectId" — for list/pipeline pages showing many records at once. */
export function groupTagsBySubject(contactTagRows) {
  const map = new Map();
  for (const row of contactTagRows || []) {
    const key = `${row.subject_type}:${row.subject_id}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push({ contactTagId: row.id, id: row.tag.id, name: row.tag.name });
  }
  return map;
}
