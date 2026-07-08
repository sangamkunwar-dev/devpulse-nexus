import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Zap, Github, Globe, Code2, FolderGit2, Trophy, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CodeBlock } from "@/components/CodeBlock";
import { levelFromXp, levelTitle } from "@/lib/levels";

export const Route = createFileRoute("/u/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.username} — DevPulse Portfolio` },
      {
        name: "description",
        content: `Bento portfolio of ${params.username} on DevPulse: code snippets, projects, XP and stats.`,
      },
    ],
  }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const { username } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["portfolio", username],
    queryFn: async () => {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .eq("is_public", true)
        .maybeSingle();
      if (error) throw error;
      if (!profile) return null;

      const [snippetsRes, projectsRes] = await Promise.all([
        supabase
          .from("snippets")
          .select("id, title, language, code, description, tags")
          .eq("user_id", profile.user_id)
          .eq("is_public", true)
          .order("updated_at", { ascending: false })
          .limit(4),
        supabase
          .from("projects")
          .select("id, title, description, url, repo_url, tags")
          .eq("user_id", profile.user_id)
          .eq("is_public", true)
          .order("created_at", { ascending: false })
          .limit(6),
      ]);
      return {
        profile,
        snippets: snippetsRes.data ?? [],
        projects: projectsRes.data ?? [],
      };
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-16">
        <Skeleton className="h-40 w-full" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="font-display text-2xl font-semibold">This portfolio isn't public</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          The user either doesn't exist or hasn't switched their portfolio on yet.
        </p>
        <Link to="/" className="text-sm text-primary hover:underline">← Back to DevPulse</Link>
      </div>
    );
  }

  const { profile, snippets, projects } = data;
  const { level } = levelFromXp(profile.xp);

  return (
    <div className="hero-bg min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-12">
        {/* Identity + stats row */}
        <div className="grid gap-4 md:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bento-card p-6 md:col-span-2"
          >
            <div className="flex items-start gap-4">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name ?? profile.username}
                  className="h-16 w-16 rounded-2xl border border-border object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 font-display text-2xl font-bold text-primary">
                  {(profile.display_name ?? profile.username).slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h1 className="font-display text-2xl font-bold">
                  {profile.display_name ?? profile.username}
                </h1>
                <p className="font-mono text-sm text-muted-foreground">@{profile.username}</p>
                {profile.tagline && <p className="mt-2 text-sm">{profile.tagline}</p>}
              </div>
            </div>
            {profile.bio && (
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="secondary" className="capitalize">{profile.role}</Badge>
              <Badge variant="secondary" className="capitalize">{profile.skill_level}</Badge>
              {profile.github_username && (
                <a
                  href={`https://github.com/${profile.github_username}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Badge variant="outline" className="hover:border-primary/50">
                    <Github className="h-3 w-3" /> {profile.github_username}
                  </Badge>
                </a>
              )}
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noreferrer">
                  <Badge variant="outline" className="hover:border-primary/50">
                    <Globe className="h-3 w-3" /> website
                  </Badge>
                </a>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bento-card flex flex-col justify-center p-6 text-center"
          >
            <Trophy className="mx-auto h-6 w-6 text-accent" />
            <p className="mt-2 font-display text-4xl font-bold text-primary">Lv {level}</p>
            <p className="text-sm text-muted-foreground">{levelTitle(level)}</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{profile.xp} XP earned</p>
          </motion.div>
        </div>

        {/* Tech stack */}
        {profile.tech_stack.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bento-card mt-4 p-6"
          >
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Tech stack
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.tech_stack.map((t) => (
                <Badge key={t}>{t}</Badge>
              ))}
            </div>
          </motion.div>
        )}

        {/* GitHub stats */}
        {profile.github_username && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bento-card mt-4 overflow-hidden p-6"
          >
            <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              GitHub activity
            </h2>
            <img
              src={`https://github-readme-stats.vercel.app/api?username=${encodeURIComponent(profile.github_username)}&theme=dark&hide_border=true&bg_color=00000000&title_color=7ee0b0&text_color=9aa4b2&icon_color=7ee0b0`}
              alt={`GitHub stats for ${profile.github_username}`}
              className="w-full max-w-md"
              loading="lazy"
            />
          </motion.div>
        )}

        {/* Snippets */}
        {snippets.length > 0 && (
          <div className="mt-4">
            <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
              <Code2 className="h-5 w-5 text-primary" /> Code snippets
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {snippets.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className="bento-card overflow-hidden p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="truncate font-medium">{s.title}</p>
                    <Badge variant="secondary">{s.language}</Badge>
                  </div>
                  <CodeBlock code={s.code.split("\n").slice(0, 8).join("\n")} />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
              <FolderGit2 className="h-5 w-5 text-primary" /> Projects
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {projects.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.05 }}
                  className="bento-card p-4"
                >
                  <p className="font-medium">{p.title}</p>
                  {p.description && (
                    <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{p.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.tags.map((t) => (
                      <Badge key={t} variant="outline">{t}</Badge>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-3 text-xs">
                    {p.url && (
                      <a href={p.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                        Live <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {p.repo_url && (
                      <a href={p.repo_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                        Code <Github className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <footer className="mt-12 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Zap className="h-4 w-4 text-primary" />
          Built with <Link to="/" className="text-primary hover:underline">DevPulse</Link>
        </footer>
      </div>
    </div>
  );
}
