import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Plus, Copy, Trash2, Globe, Lock, X, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CodeBlock } from "@/components/CodeBlock";
import { useSession } from "@/hooks/useSession";

export const Route = createFileRoute("/_authenticated/snippets")({
  component: SnippetsPage,
});

const LANGUAGES = ["javascript", "typescript", "python", "sql", "bash", "html", "css", "java", "csharp", "go", "rust", "other"];

function SnippetsPage() {
  const { userId } = useSession();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ title: "", description: "", language: "javascript", code: "", tags: "", is_public: false });
  const [saving, setSaving] = useState(false);

  const { data: snippets, isLoading } = useQuery({
    queryKey: ["snippets", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("snippets")
        .select("*")
        .eq("user_id", userId!)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["snippets", userId] });

  const save = async () => {
    if (!form.title.trim() || !form.code.trim()) {
      toast.error("Title and code are required.");
      return;
    }
    if (form.code.length > 20000) {
      toast.error("Snippet too long (max 20,000 chars).");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("snippets").insert({
      user_id: userId!,
      title: form.title.trim().slice(0, 200),
      description: form.description.trim() || null,
      language: form.language,
      code: form.code,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 10),
      is_public: form.is_public,
    });
    setSaving(false);
    if (error) {
      toast.error("Could not save snippet.");
      return;
    }
    toast.success("Snippet saved");
    setForm({ title: "", description: "", language: "javascript", code: "", tags: "", is_public: false });
    setShowForm(false);
    refresh();
  };

  const togglePublic = async (id: string, current: boolean) => {
    const { error } = await supabase.from("snippets").update({ is_public: !current }).eq("id", id);
    if (!error) {
      toast.success(!current ? "Snippet is now on your portfolio" : "Snippet is private again");
      refresh();
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("snippets").delete().eq("id", id);
    if (!error) {
      toast.success("Snippet deleted");
      refresh();
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied");
  };

  const filtered = (snippets ?? []).filter(
    (s) =>
      !search.trim() ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.language.includes(search.toLowerCase()) ||
      s.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <AppShell title="Snippets">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search title, language, tag…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button onClick={() => setShowForm((s) => !s)}>
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Cancel" : "New snippet"}
          </Button>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bento-card mt-4 space-y-3 p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Title</Label>
                    <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Debounce helper" maxLength={200} />
                  </div>
                  <div>
                    <Label>Language</Label>
                    <select
                      className="flex h-9 w-full rounded-lg border border-input bg-muted/50 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      value={form.language}
                      onChange={(e) => setForm({ ...form, language: e.target.value })}
                    >
                      {LANGUAGES.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <Label>Code</Label>
                  <Textarea
                    className="min-h-40 font-mono text-xs"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="// paste your code"
                    spellCheck={false}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Description (optional)</Label>
                    <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={500} />
                  </div>
                  <div>
                    <Label>Tags (comma separated)</Label>
                    <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="react, hooks" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => setForm({ ...form, is_public: !form.is_public })}
                    type="button"
                  >
                    {form.is_public ? <Globe className="h-4 w-4 text-primary" /> : <Lock className="h-4 w-4" />}
                    {form.is_public ? "Public — shows on portfolio" : "Private"}
                  </button>
                  <Button onClick={save} disabled={saving}>Save snippet</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {isLoading && (
            <>
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </>
          )}
          {!isLoading && filtered.length === 0 && (
            <div className="bento-card col-span-full p-10 text-center text-sm text-muted-foreground">
              {snippets?.length === 0
                ? "Your snippet vault is empty. Save your first reusable piece of code!"
                : "No snippets match your search."}
            </div>
          )}
          {filtered.map((s) => (
            <motion.div key={s.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bento-card p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">{s.title}</p>
                  {s.description && <p className="truncate text-xs text-muted-foreground">{s.description}</p>}
                </div>
                <Badge variant="secondary">{s.language}</Badge>
              </div>
              <CodeBlock code={s.code.split("\n").slice(0, 10).join("\n")} />
              <div className="mt-3 flex items-center justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {s.tags.map((t) => (
                    <Badge key={t} variant="outline">{t}</Badge>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" title="Copy code" onClick={() => copyCode(s.code)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    title={s.is_public ? "Make private" : "Publish to portfolio"}
                    onClick={() => togglePublic(s.id, s.is_public)}
                  >
                    {s.is_public ? <Globe className="h-4 w-4 text-primary" /> : <Lock className="h-4 w-4" />}
                  </Button>
                  <Button size="icon" variant="ghost" title="Delete" onClick={() => remove(s.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
