import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ThumbsUp, Trash2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CodeBlock } from "@/components/CodeBlock";
import { useSession } from "@/hooks/useSession";

export const Route = createFileRoute("/_authenticated/reviews/$id")({
  component: ReviewDetailPage,
});

function ReviewDetailPage() {
  const { id } = Route.useParams();
  const { userId } = useSession();
  const queryClient = useQueryClient();
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const [comment, setComment] = useState("");
  const [kind, setKind] = useState<"comment" | "suggestion" | "praise">("comment");

  const { data, isLoading } = useQuery({
    queryKey: ["review", id],
    queryFn: async () => {
      const { data: review, error } = await supabase
        .from("review_requests").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!review) return null;
      const [commentsRes, votesRes] = await Promise.all([
        supabase.from("review_comments").select("*").eq("review_id", id).order("created_at"),
        supabase.from("comment_votes").select("id, comment_id, user_id"),
      ]);
      const comments = commentsRes.data ?? [];
      const votes = votesRes.data ?? [];
      const authorIds = [...new Set([review.user_id, ...comments.map((c) => c.user_id)])];
      const { data: profiles } = await supabase
        .from("profiles").select("user_id, username, display_name").in("user_id", authorIds);
      const pmap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
      return { review, comments, votes, pmap };
    },
  });

  // Realtime: live comments & votes
  useEffect(() => {
    const channel = supabase
      .channel(`review-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "review_comments", filter: `review_id=eq.${id}` },
        () => queryClient.invalidateQueries({ queryKey: ["review", id] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "comment_votes" },
        () => queryClient.invalidateQueries({ queryKey: ["review", id] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, queryClient]);

  const onLineClick = (line: number) => {
    setSelection((sel) =>
      !sel || line < sel.start ? { start: line, end: line } : sel.start === sel.end && line > sel.start ? { start: sel.start, end: line } : { start: line, end: line },
    );
  };

  const postComment = async () => {
    if (!selection || !comment.trim()) {
      toast.error("Select lines and write a comment.");
      return;
    }
    const { error } = await supabase.from("review_comments").insert({
      review_id: id, user_id: userId!, line_start: selection.start, line_end: selection.end,
      content: comment.trim().slice(0, 2000), kind,
    });
    if (error) { toast.error("Could not post comment."); return; }
    toast.success("Comment posted (+5 XP)");
    setComment(""); setSelection(null);
    queryClient.invalidateQueries({ queryKey: ["review", id] });
    queryClient.invalidateQueries({ queryKey: ["profile", userId] });
  };

  const toggleVote = async (commentId: string) => {
    const mine = data?.votes.find((v) => v.comment_id === commentId && v.user_id === userId);
    if (mine) await supabase.from("comment_votes").delete().eq("id", mine.id);
    else await supabase.from("comment_votes").insert({ comment_id: commentId, user_id: userId! });
    queryClient.invalidateQueries({ queryKey: ["review", id] });
  };

  const deleteComment = async (commentId: string) => {
    await supabase.from("review_comments").delete().eq("id", commentId);
    queryClient.invalidateQueries({ queryKey: ["review", id] });
  };

  const resolve = async () => {
    await supabase.from("review_requests").update({ status: "resolved" }).eq("id", id);
    toast.success("Marked as resolved");
    queryClient.invalidateQueries({ queryKey: ["review", id] });
  };

  if (isLoading) {
    return (
      <AppShell title="Review Labs">
        <div className="mx-auto max-w-5xl space-y-4"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-64 w-full" /></div>
      </AppShell>
    );
  }
  if (!data) {
    return (
      <AppShell title="Review Labs">
        <div className="mx-auto max-w-5xl py-16 text-center text-muted-foreground">
          Submission not found. <Link to="/reviews" className="text-primary hover:underline">Back to Review Labs</Link>
        </div>
      </AppShell>
    );
  }

  const { review, comments, votes, pmap } = data;
  const highlighted = new Set<number>();
  comments.forEach((c) => { for (let l = c.line_start; l <= c.line_end; l++) highlighted.add(l); });

  return (
    <AppShell title="Review Labs">
      <div className="mx-auto max-w-5xl">
        <Link to="/reviews" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All submissions
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold">{review.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              by {pmap.get(review.user_id)?.display_name ?? pmap.get(review.user_id)?.username ?? "unknown"} · {new Date(review.created_at).toLocaleString()}
            </p>
            {review.description && <p className="mt-2 text-sm">{review.description}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{review.language}</Badge>
            <Badge variant={review.status === "open" ? "default" : "outline"}>{review.status}</Badge>
            {review.user_id === userId && review.status === "open" && (
              <Button size="sm" variant="outline" onClick={resolve}>
                <CheckCircle2 className="h-4 w-4" /> Resolve
              </Button>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_340px]">
          <div>
            <CodeBlock code={review.code} language={review.language} onLineClick={onLineClick} selection={selection} highlight={highlighted} />
            {selection && (
              <div className="bento-card mt-3 space-y-3 p-4">
                <p className="text-xs text-muted-foreground">
                  Commenting on line{selection.start !== selection.end ? `s ${selection.start}–${selection.end}` : ` ${selection.start}`} — click another line to extend, or a lower one to restart.
                </p>
                <div className="flex gap-2">
                  {(["comment", "suggestion", "praise"] as const).map((k) => (
                    <button key={k} onClick={() => setKind(k)}
                      className={`rounded-lg border px-2.5 py-1 text-xs capitalize transition-colors ${kind === k ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
                      {k}
                    </button>
                  ))}
                </div>
                <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Explain what could be better (or celebrate what's great)…" maxLength={2000} />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setSelection(null)}>Cancel</Button>
                  <Button size="sm" onClick={postComment}>Post comment</Button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {comments.length} comment{comments.length === 1 ? "" : "s"} · live
            </h3>
            {comments.length === 0 && (
              <p className="text-sm text-muted-foreground">No feedback yet. Click a line number to leave the first comment.</p>
            )}
            {comments.map((c) => {
              const count = votes.filter((v) => v.comment_id === c.id).length;
              const mine = votes.some((v) => v.comment_id === c.id && v.user_id === userId);
              return (
                <div key={c.id} className="bento-card p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-medium">
                      {pmap.get(c.user_id)?.display_name ?? pmap.get(c.user_id)?.username ?? "peer"}
                    </span>
                    <Badge variant={c.kind === "praise" ? "accent" : c.kind === "suggestion" ? "default" : "secondary"} className="capitalize">{c.kind}</Badge>
                  </div>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                    L{c.line_start}{c.line_end !== c.line_start ? `–${c.line_end}` : ""}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{c.content}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <button onClick={() => toggleVote(c.id)}
                      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs transition-colors ${mine ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                      <ThumbsUp className="h-3 w-3" /> {count}
                    </button>
                    {c.user_id === userId && (
                      <button onClick={() => deleteComment(c.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
