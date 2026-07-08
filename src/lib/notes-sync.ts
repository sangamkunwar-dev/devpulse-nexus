import { supabase } from "@/integrations/supabase/client";
import { db } from "./devnotes-db";

export interface SyncResult {
  pushed: number;
  pulled: number;
}

/**
 * Offline-first sync: push locally dirty notes up (last-write-wins by
 * client timestamp), then pull anything newer from the cloud.
 */
export async function syncNotes(userId: string): Promise<SyncResult> {
  let pushed = 0;
  let pulled = 0;

  // 1. Push dirty local notes
  const dirty = await db.notes.where("dirty").equals(1).toArray();
  if (dirty.length > 0) {
    const rows = dirty.map((n) => ({
      user_id: userId,
      local_id: n.localId,
      title: n.title || "Untitled",
      content: n.content,
      tags: n.tags,
      is_deleted: n.deleted === 1,
      client_updated_at: new Date(n.updatedAt).toISOString(),
    }));
    const { error } = await supabase
      .from("notes")
      .upsert(rows, { onConflict: "user_id,local_id" });
    if (error) throw error;
    pushed = dirty.length;
    await db.notes.bulkPut(dirty.map((n) => ({ ...n, dirty: 0 as const })));
  }

  // 2. Pull remote notes newer than local copies
  const { data: remote, error: pullError } = await supabase
    .from("notes")
    .select("local_id, title, content, tags, is_deleted, client_updated_at, created_at")
    .eq("user_id", userId);
  if (pullError) throw pullError;

  for (const r of remote ?? []) {
    const remoteTs = new Date(r.client_updated_at).getTime();
    const local = await db.notes.get(r.local_id);
    if (!local || (local.dirty === 0 && remoteTs > local.updatedAt)) {
      await db.notes.put({
        localId: r.local_id,
        title: r.title,
        content: r.content,
        tags: r.tags ?? [],
        updatedAt: remoteTs,
        createdAt: local?.createdAt ?? new Date(r.created_at).getTime(),
        deleted: r.is_deleted ? 1 : 0,
        dirty: 0,
      });
      pulled += 1;
    }
  }

  return { pushed, pulled };
}
