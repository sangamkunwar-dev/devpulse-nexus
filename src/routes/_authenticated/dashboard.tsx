import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  Bug,
  NotebookPen,
  Code2,
  GitPullRequest,
  Trophy,
  ArrowRight,
  LayoutGrid,
  Flame,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession, useProfile } from "@/hooks/useSession";
import { levelFromXp, levelTitle } from "@/lib/levels";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function DashboardPage() {
  const navigate = useNavigate();
  const { userId } = useSession();
  const { data: profile, isLoading: profileLoading } = useProfile(userId);

  useEffect(() => {
    if (profile && !profile.onboarded) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [profile, navigate]);

  const { data: stats } = useQuery({
    queryKey: ["dashboard", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [challenge, notes, snippets, reviews, leaders, myAttempt] = await Promise.all([
        supabase.from("challenges").select("id, title, language, difficulty, xp_reward").eq("challenge_date", todayISO()).maybeSingle(),
        supabase.from("notes").select("id", { count: "exact", head: true }).eq("user_id", userId!).eq("is_deleted", false),
        supabase.from("snippets").select("id", { count: "exact", head: true }).eq("user_id", userId!),
        supabase.from("review_requests").select("id, title, language, status, created_at").order("created_at", { ascending: false }).limit(4),
        supabase.from("profiles").select("username, display_name, xp").order("xp", { ascending: false }).limit(5),
        null,
      ]);
      let solvedToday = false;
      if (challenge.data) {
        const { data: attempts } = await supabase
          .from("challenge_attempts")
          .select("is_correct")
          .eq("challenge_id", challenge.data.id)
          .eq("user_id", userId!)
          .eq("is_correct", true)
          .limit(1);
        solvedToday = (attempts?.length ?? 0) > 0;
      }
      void myAttempt;
      return {
        challenge: challenge.data,
        solvedToday,
        notesCount: notes.count ?? 0,
        snippetsCount: snippets.count ?? 0,
        reviews: reviews.data ?? [],
        leaders: leaders.data ?? [],
      };
    },
  });

  const xp = profile?.xp ?? 0;
  const { level, progress, toNext } = levelFromXp(xp);
  const firstName = (profile?.display_name ?? profile?.username ?? "dev").split(" ")[0];

  return (
    <AppShell title="Dashboard">
      <div className="mx-auto max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="font-display text-2xl font-bold">
            {profileLoading ? "…" : `Hey ${firstName} 👋`}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {profile?.role === "student"
              ? "Ready to learn something new today?"
              : "Let's ship something great today."}
          </p>
        </motion.div>

        <div className="mt-6 grid gap-4 md:grid-cols-6">
          {/* XP card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bento-card p-6 md:col-span-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Progress</span>
              <Flame className="h-4 w-4 text-accent" />
            </div>
            <p className="mt-3 font-display text-4xl font-bold text-primary">Lv {level}</p>
            <p className="text-sm text-muted-foreground">{levelTitle(level)}</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(4, progress * 100)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              {xp} XP · {toNext} to next level
            </p>
          </motion.div>

          {/* Daily bug */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bento-card relative overflow-hidden p-6 md:col-span-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Today's Daily Bug</span>
              <Bug className="h-4 w-4 text-primary" />
            </div>
            {stats?.challenge ? (
              <>
                <h3 className="mt-3 font-display text-xl font-semibold">{stats.challenge.title}</h3>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="secondary">{stats.challenge.language}</Badge>
                  <Badge variant="accent" className="capitalize">{stats.challenge.difficulty}</Badge>
                  <Badge>+{stats.challenge.xp_reward} XP</Badge>
                  {stats.solvedToday && <Badge variant="outline">✓ solved</Badge>}
                </div>
                <Link
                  to="/challenges"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  {stats.solvedToday ? "Review your solve" : "Hunt the bug"} <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            ) : stats ? (
              <p className="mt-3 text-sm text-muted-foreground">No challenge published today — check the archive.</p>
            ) : (
              <Skeleton className="mt-3 h-16 w-2/3" />
            )}
          </motion.div>

          {/* Counts */}
          {[
            { icon: NotebookPen, label: "DevNotes", value: stats?.notesCount, to: "/notes" },
            { icon: Code2, label: "Snippets", value: stats?.snippetsCount, to: "/snippets" },
          ].map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="bento-card p-6 md:col-span-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{c.label}</span>
                <c.icon className="h-4 w-4 text-primary" />
              </div>
              {c.value === undefined ? (
                <Skeleton className="mt-3 h-9 w-14" />
              ) : (
                <p className="mt-3 font-display text-4xl font-bold">{c.value}</p>
              )}
              <Link to={c.to} className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline">
                Open <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
          ))}

          {/* Portfolio */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bento-card p-6 md:col-span-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Portfolio</span>
              <LayoutGrid className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-3 text-sm">
              {profile?.is_public ? (
                <span className="text-primary">● Live & public</span>
              ) : (
                <span className="text-muted-foreground">○ Private</span>
              )}
            </p>
            {profile?.is_public ? (
              <a
                href={`/u/${profile.username}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                View live <ArrowRight className="h-3.5 w-3.5" />
              </a>
            ) : (
              <Link to="/settings" className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline">
                Go public <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </motion.div>

          {/* Recent reviews */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bento-card p-6 md:col-span-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Review Labs</span>
              <GitPullRequest className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-3 space-y-2">
              {stats ? (
                stats.reviews.length > 0 ? (
                  stats.reviews.map((r) => (
                    <Link
                      key={r.id}
                      to="/reviews/$id"
                      params={{ id: r.id }}
                      className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm transition-colors hover:border-primary/40"
                    >
                      <span className="truncate">{r.title}</span>
                      <Badge variant={r.status === "open" ? "default" : "outline"}>{r.status}</Badge>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No submissions yet — <Link to="/reviews" className="text-primary hover:underline">be the first</Link>.
                  </p>
                )
              ) : (
                <>
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                </>
              )}
            </div>
          </motion.div>

          {/* Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bento-card p-6 md:col-span-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Top hackers</span>
              <Trophy className="h-4 w-4 text-accent" />
            </div>
            <div className="mt-3 space-y-2">
              {stats ? (
                stats.leaders.map((l, i) => (
                  <div key={l.username} className="flex items-center gap-3 text-sm">
                    <span className="w-5 font-mono text-xs text-muted-foreground">#{i + 1}</span>
                    <span className="flex-1 truncate">{l.display_name ?? l.username}</span>
                    <span className="font-mono text-xs text-primary">{l.xp} XP</span>
                  </div>
                ))
              ) : (
                <>
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </>
              )}
              <Link to="/leaderboard" className="inline-flex items-center gap-1 pt-1 text-sm text-primary hover:underline">
                Full leaderboard <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </AppShell>
  );
}
