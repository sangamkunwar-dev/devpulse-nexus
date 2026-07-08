import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Plus, X, GitPullRequest, MessageSquare, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/useSession";

export const Route = createFileRoute("/_authenticated/reviews/")({
  component: ReviewsPage,
});

const LANGUAGES = ["javascript", "typescript", "python", "sql", "java", "csharp", "c++", "php", "other"];

function ReviewsPage() {
  const { userId } = useSession();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", language: "javascript", code: "" });
  const [saving, setSaving] = useState(false);

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("review_requests")
        .select("id, title, description, language, status, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;

      const ids = data.map((r) => r.id);
      const userIds = [...new Set(data.map((r) => r.user_id))];
      const [countsRes, profilesRes] = await Promise.all([
        ids.length
          ? supabase.from("review_comments").select("review_id").in("review_id", ids)
          : Promise.resolve({ data: [] as { review_id: string }[] }),
        userIds.length
          ? supabase.from("profiles").select("user_id, username, display_name").in("user_id", userIds)
          : Promise.resolve({ data: [] as { user_id: string; username: string; display_name: string | null }[] }),
      ]);
      const counts = new Map<string, number>();
      for (const c of countsRes.data ?? []) counts.set(c.review_id, (counts.get(c.review_id) ?? 0) + 1);
      const profiles = new Map((profilesRes.data ?? []).map((p) => [p.user_id, p]));
      return data.map((r) => ({
        ...r,
        commentCount: counts.get(r.id) ?? 0,
        author: profiles.get(r.user_id),
      }));
    },
  });

  const submit = async () => {
    if (!form.title.trim() || !form.code.trim()) {
      toast.error("Title and code are required.");
      return;
    }
    if (form.code.length > 20000) {
      toast.error("Code too long (max 20,000 chars).");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("review_requests").insert({
      user_id: userId!,
      title: form.title.trim().slice(0, 200),
      description: form.description.trim() || null,
      language: form.language,
      code: form.code,
    });
    setSaving(false);
    if (error) {
      toast.error("Could not submit for review.");
      return;
    }
    toast.success("Submitted to Review Labs!");
    setForm({ title: "", description: "", language: "javascript", code: "" });
    setShowForm(false);
    queryClient.invalidateQueries({ queryKey: ["reviews"] });
  };

  return (
    <AppShell title="Review Labs">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold">Peer Code Review Labs</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Submit code, get line-by-line feedback. Every comment you leave earns +5 XP.
            </p>
          </div>
          <Button onClick={() => setShowForm((s) => !s)}>
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Cancel" : "Submit code"}
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
                    <Input
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="Is this sorting function efficient?"
                      maxLength={200}
                    />
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
                  <Label>What should reviewers focus on? (optional)</Label>
                  <Input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Performance? Readability? Security?"
                    maxLength={500}
                  />
                </div>
                <div>
                  <Label>Code</Label>
                  <Textarea
                    className="min-h-48 font-mono text-xs"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="// paste the code you want reviewed"
                    spellCheck={false}
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={submit} disabled={saving}>Submit for review</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 space-y-3">
          {isLoading && (
            <>
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </>
          )}
          {!isLoading && (reviews?.length ?? 0) === 0 && (
            <div className="bento-card p-10 text-center">
              <GitPullRequest className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-3 font-display font-semibold">No submissions yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Be the first to submit code for peer review.
              </p>
            </div>
          )}
          {reviews?.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link
                to="/reviews/$id"
                params={{ id: r.id }}
                className="bento-card group flex items-center gap-4 p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <GitPullRequest className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium group-hover:text-primary">{r.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    by {r.author?.display_name ?? r.author?.username ?? "unknown"} ·{" "}
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{r.language}</Badge>
                  <Badge variant={r.status === "open" ? "default" : "outline"}>{r.status}</Badge>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageSquare className="h-3.5 w-3.5" /> {r.commentCount}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
