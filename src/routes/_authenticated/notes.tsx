import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Eye,
  Pencil,
  CloudUpload,
  CloudOff,
  RefreshCw,
  Search,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MarkdownPreview } from "@/components/MarkdownPreview";
import { db, newLocalId, type LocalNote } from "@/lib/devnotes-db";
import { syncNotes } from "@/lib/notes-sync";
import { useSession } from "@/hooks/useSession";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notes")({
  component: NotesPage,
});

const TEMPLATE = `# New note

Write **Markdown** here — it works fully offline.

- Lecture notes
- \`command --cheatsheets\`
- Architecture ideas

\`\`\`bash
git commit -m "notes that never die"
\`\`\`
`;

function NotesPage() {
  const { userId } = useSession();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const { data: notes } = useQuery({
    queryKey: ["local-notes"],
    queryFn: async () => {
      const all = await db.notes.where("deleted").equals(0).toArray();
      return all.sort((a, b) => b.updatedAt - a.updatedAt);
    },
  });

  const selected = useMemo(
    () => notes?.find((n) => n.localId === selectedId) ?? null,
    [notes, selectedId],
  );

  const dirtyCount = useMemo(() => notes?.filter((n) => n.dirty === 1).length ?? 0, [notes]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["local-notes"] });

  const runSync = async (silent = false) => {
    if (!userId || !navigator.onLine) return;
    setSyncing(true);
    try {
      const res = await syncNotes(userId);
      refresh();
      if (!silent && (res.pushed > 0 || res.pulled > 0)) {
        toast.success(`Sync complete — ${res.pushed} pushed, ${res.pulled} pulled`);
      }
    } catch {
      if (!silent) toast.error("Sync failed — your notes are safe locally.");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => {
      setOnline(true);
      toast.info("Back online — syncing notes…");
      runSync();
    };
    const off = () => {
      setOnline(false);
      toast.warning("You're offline. Notes keep saving locally.");
    };
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Initial pull on mount
  useEffect(() => {
    if (userId) runSync(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const createNote = async () => {
    const note: LocalNote = {
      localId: newLocalId(),
      title: "Untitled",
      content: TEMPLATE,
      tags: [],
      updatedAt: Date.now(),
      createdAt: Date.now(),
      deleted: 0,
      dirty: 1,
    };
    await db.notes.put(note);
    refresh();
    setSelectedId(note.localId);
    setPreview(false);
  };

  const updateNote = (patch: Partial<Pick<LocalNote, "title" | "content">>) => {
    if (!selected) return;
    const updated = { ...selected, ...patch, updatedAt: Date.now(), dirty: 1 as const };
    db.notes.put(updated).then(refresh);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => runSync(true), 2500);
  };

  const deleteNote = async (n: LocalNote) => {
    await db.notes.put({ ...n, deleted: 1, dirty: 1, updatedAt: Date.now() });
    if (selectedId === n.localId) setSelectedId(null);
    refresh();
    toast.success("Note deleted");
    runSync(true);
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return notes ?? [];
    const q = search.toLowerCase();
    return (notes ?? []).filter(
      (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q),
    );
  }, [notes, search]);

  return (
    <AppShell title="DevNotes">
      <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[280px_1fr]">
        {/* List */}
        <div className="bento-card flex max-h-[calc(100vh-8rem)] flex-col overflow-hidden">
          <div className="space-y-2 border-b border-border p-3">
            <div className="flex items-center gap-2">
              <Button size="sm" className="flex-1" onClick={createNote}>
                <Plus className="h-4 w-4" /> New note
              </Button>
              <Button
                size="icon"
                variant="outline"
                title="Sync now"
                onClick={() => runSync()}
                disabled={syncing || !online}
              >
                <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                className="h-8 pl-8 text-xs"
                placeholder="Search notes…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              {online ? (
                <>
                  <CloudUpload className="h-3.5 w-3.5 text-primary" />
                  {dirtyCount > 0 ? `${dirtyCount} pending sync` : "All synced"}
                </>
              ) : (
                <>
                  <CloudOff className="h-3.5 w-3.5 text-warning" /> Offline — saving locally
                </>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {filtered.length === 0 && (
              <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                {notes?.length === 0 ? "No notes yet. Create your first!" : "No matches."}
              </p>
            )}
            {filtered.map((n) => (
              <button
                key={n.localId}
                onClick={() => setSelectedId(n.localId)}
                className={cn(
                  "group mb-1 flex w-full items-start justify-between gap-2 rounded-lg px-3 py-2 text-left transition-colors",
                  selectedId === n.localId ? "bg-secondary" : "hover:bg-secondary/50",
                )}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {n.title || "Untitled"}
                    {n.dirty === 1 && <span className="ml-1.5 text-primary">•</span>}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {new Date(n.updatedAt).toLocaleString()}
                  </p>
                </div>
                <Trash2
                  className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNote(n);
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="bento-card flex max-h-[calc(100vh-8rem)] flex-col overflow-hidden">
          {selected ? (
            <>
              <div className="flex items-center gap-2 border-b border-border p-3">
                <Input
                  className="h-8 border-none bg-transparent font-display text-base font-semibold focus-visible:ring-0"
                  value={selected.title}
                  onChange={(e) => updateNote({ title: e.target.value })}
                  placeholder="Note title"
                  maxLength={200}
                />
                <Button
                  size="sm"
                  variant={preview ? "default" : "outline"}
                  onClick={() => setPreview((p) => !p)}
                >
                  {preview ? <Pencil className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {preview ? "Edit" : "Preview"}
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {preview ? (
                  <div className="p-5">
                    <MarkdownPreview content={selected.content} />
                  </div>
                ) : (
                  <textarea
                    className="h-full min-h-[400px] w-full resize-none bg-transparent p-5 font-mono text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
                    value={selected.content}
                    onChange={(e) => updateNote({ content: e.target.value })}
                    placeholder="# Start typing Markdown…"
                    spellCheck={false}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
              <CloudOff className="h-8 w-8 text-muted-foreground/50" />
              <p className="font-display font-semibold">Offline-first Markdown notes</p>
              <p className="max-w-xs text-sm text-muted-foreground">
                Everything you type is saved instantly to your browser and synced to the cloud
                whenever you're online.
              </p>
              <Button onClick={createNote}>
                <Plus className="h-4 w-4" /> Create your first note
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
