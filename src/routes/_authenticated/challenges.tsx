import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bug, CheckCircle2, XCircle, Lightbulb, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CodeBlock } from "@/components/CodeBlock";
import { useSession } from "@/hooks/useSession";

export const Route = createFileRoute("/_authenticated/challenges")({
  component: ChallengesPage,
});

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function ChallengesPage() {
  const { userId } = useSession();
  const queryClient = useQueryClient();
  const [answer, setAnswer] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [result, setResult] = useState<{ correct: boolean; explanation?: string; xp: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["challenges", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [todayRes, archiveRes, attemptsRes] = await Promise.all([
        supabase.from("challenges").select("*").eq("challenge_date", todayISO()).maybeSingle(),
        supabase.from("challenges").select("id, challenge_date, title, language, difficulty, xp_reward").lt("challenge_date", todayISO()).order("challenge_date", { ascending: false }).limit(14),
        supabase.from("challenge_attempts").select("challenge_id, is_correct").eq("user_id", userId!),
      ]);
      const solved = new Set((attemptsRes.data ?? []).filter((a) => a.is_correct).map((a) => a.challenge_id));
      return { today: todayRes.data, archive: archiveRes.data ?? [], solved, attempts: attemptsRes.data ?? [] };
    },
  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const active = activeId
    ? undefined // archive selection triggers a fetch below
    : data?.today;

  const { data: archiveChallenge } = useQuery({
    queryKey: ["challenge", activeId],
    enabled: !!activeId,
    queryFn: async () => {
      const { data: c } = await supabase.from("challenges").select("*").eq("id", activeId!).maybeSingle();
      return c;
    },
  });

  const challenge = activeId ? archiveChallenge : active;
  const isSolved = challenge ? data?.solved.has(challenge.id) : false;

  const submit = async () => {
    if (!challenge || !answer.trim()) {
      toast.error("Type the fixed line first.");
      return;
    }
    setBusy(true);
    const { data: res, error } = await supabase.rpc("submit_challenge_answer", {
      _challenge_id: challenge.id,
      _answer: answer.trim(),
    });
    setBusy(false);
    if (error) { toast.error("Submission failed."); return; }
    const r = res as { correct: boolean; explanation: string | null; xp_awarded: number };
    setResult({ correct: r.correct, explanation: r.explanation ?? undefined, xp: r.xp_awarded });
    if (r.correct) {
      toast.success(r.xp_awarded > 0 ? `Bug squashed! +${r.xp_awarded} XP 🎉` : "Correct again — already solved.");
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["challenges", userId] });
    } else {
      toast.error("Not quite — look closer.");
    }
  };

  const pick = (id: string | null) => {
    setActiveId(id);
    setAnswer("");
    setResult(null);
    setShowHint(false);
  };

  return (
    <AppShell title="Daily Bug">
      <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-[1fr_280px]">
        <div>
          {isLoading && <Skeleton className="h-72 w-full" />}
          {!isLoading && !challenge && (
            <div className="bento-card p-10 text-center text-muted-foreground">
              No challenge published for today yet — try one from the archive.
            </div>
          )}
          {challenge && (
            <div className="bento-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Bug className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-xl font-bold">{challenge.title}</h2>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary">{challenge.language}</Badge>
                  <Badge variant="accent" className="capitalize">{challenge.difficulty}</Badge>
                  <Badge>+{challenge.xp_reward} XP</Badge>
                  {isSolved && <Badge variant="outline">✓ solved</Badge>}
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{challenge.prompt}</p>
              <div className="mt-4">
                <CodeBlock code={challenge.broken_code.replace(/\\n/g, "\n")} language={challenge.language} />
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex gap-2">
                  <Input
                    className="flex-1 font-mono text-xs"
                    placeholder="Type the corrected line, e.g. for (let i = 0; i < arr.length; i++)"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submit()}
                    maxLength={500}
                  />
                  <Button onClick={submit} disabled={busy}>Patch it</Button>
                </div>
                {challenge.hint && (
                  <button onClick={() => setShowHint((h) => !h)} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent">
                    <Lightbulb className="h-3.5 w-3.5" /> {showHint ? challenge.hint : "Need a hint?"}
                  </button>
                )}
                {result && (
                  <div className={`rounded-xl border p-4 text-sm ${result.correct ? "border-primary/40 bg-primary/5" : "border-destructive/40 bg-destructive/5"}`}>
                    <p className="flex items-center gap-2 font-medium">
                      {result.correct ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <XCircle className="h-4 w-4 text-destructive" />}
                      {result.correct ? (result.xp > 0 ? `Correct! +${result.xp} XP` : "Correct (already solved)") : "Not quite right"}
                    </p>
                    {result.explanation && <p className="mt-2 text-muted-foreground">{result.explanation}</p>}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Archive */}
        <div className="bento-card h-fit p-4">
          <h3 className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <History className="h-4 w-4" /> Archive
          </h3>
          <div className="mt-3 space-y-1.5">
            {data?.today && (
              <button onClick={() => pick(null)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${!activeId ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
                <span className="font-medium">Today</span>
                <span className="ml-2 text-xs text-muted-foreground">{data.today.title}</span>
              </button>
            )}
            {data?.archive.map((c) => (
              <button key={c.id} onClick={() => pick(c.id)}
                className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors ${activeId === c.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
                <span className="min-w-0">
                  <span className="block truncate">{c.title}</span>
                  <span className="text-xs text-muted-foreground">{c.challenge_date} · {c.language}</span>
                </span>
                {data.solved.has(c.id) && <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
