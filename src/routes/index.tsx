import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Zap,
  NotebookPen,
  GitPullRequest,
  Bug,
  Trophy,
  Command,
  LayoutGrid,
  ArrowRight,
  GraduationCap,
  WifiOff,
  Github,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InstallButton } from "@/components/InstallButton";
import { useSession } from "@/hooks/useSession";

export const Route = createFileRoute("/")({
  component: Index,
});

const FEATURES = [
  {
    icon: LayoutGrid,
    title: "Bento Portfolio Generator",
    desc: "Flip one switch and your profile becomes a shareable bento-grid portfolio — snippets, projects, XP and GitHub stats pulled in automatically.",
    span: "md:col-span-2",
  },
  {
    icon: GitPullRequest,
    title: "Peer Code Review Labs",
    desc: "Submit code, get line-by-line inline comments, suggestions and upvotes from peers — in real time.",
    span: "",
  },
  {
    icon: WifiOff,
    title: "Offline-First DevNotes",
    desc: "A Markdown editor that works with zero internet. Notes live in your browser and sync to the cloud the moment you reconnect.",
    span: "",
  },
  {
    icon: Bug,
    title: "Daily Bug Challenges",
    desc: "One broken snippet per day — JavaScript, Python or SQL. Find the bug, patch it, earn XP, climb the global leaderboard.",
    span: "md:col-span-2",
  },
  {
    icon: Command,
    title: "Command Palette",
    desc: "⌘K from anywhere. Navigate, search snippets, copy your portfolio link, sign out — without touching the mouse.",
    span: "",
  },
  {
    icon: Trophy,
    title: "XP & Leaderboard",
    desc: "Every review comment and solved bug earns XP. Levels, titles and a global ranking keep learning competitive.",
    span: "",
  },
];

function Index() {
  const { session } = useSession();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="h-4 w-4" />
            </div>
            <span className="font-display text-lg font-semibold">DevPulse</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <Link to="/learn" className="transition-colors hover:text-foreground">Learn Hub</Link>
            <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
          </nav>
          <div className="flex items-center gap-2">
            <InstallButton />
            {session ? (
              <Link to="/dashboard">
                <Button size="sm">
                  Dashboard <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm">Sign in</Button>
                </Link>
                <Link to="/auth">
                  <Button size="sm">Get started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hero-bg relative overflow-hidden">
        <div className="grid-pattern absolute inset-0 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-20 text-center md:pt-28">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="outline" className="mx-auto mb-6 w-fit">
              <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
              Built for developers & ICT students
            </Badge>
            <h1 className="mx-auto max-w-3xl font-display text-4xl font-bold leading-tight md:text-6xl">
              Your entire dev life, <span className="text-gradient">one pulse.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
              Offline-first notes, peer code reviews, daily bug hunts, a snippet vault and a
              shareable bento portfolio — everything you need to learn, teach and ship.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to={session ? "/dashboard" : "/auth"}>
                <Button variant="hero" size="lg">
                  {session ? "Open your workspace" : "Start free"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/learn">
                <Button variant="outline" size="lg">
                  <GraduationCap className="h-4 w-4" /> Explore Learn Hub
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Terminal mock */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mx-auto mt-14 max-w-2xl overflow-hidden rounded-2xl border border-border bg-card text-left shadow-2xl"
          >
            <div className="flex items-center gap-1.5 border-b border-border px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-accent/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-primary/60" />
              <span className="ml-3 font-mono text-xs text-muted-foreground">devpulse — zsh</span>
            </div>
            <div className="space-y-1.5 p-5 font-mono text-[13px] leading-6">
              <p><span className="text-primary">➜</span> <span className="text-muted-foreground">~</span> devpulse sync</p>
              <p className="text-muted-foreground">✓ 3 notes synced from offline storage</p>
              <p className="text-muted-foreground">✓ Daily Bug loaded — "Constant Trouble" (JS · 50 XP)</p>
              <p className="text-muted-foreground">✓ 2 new review comments on your submission</p>
              <p><span className="text-primary">➜</span> <span className="text-muted-foreground">~</span> <span className="animate-pulse">▊</span></p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features bento */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-center font-display text-3xl font-bold md:text-4xl">
          Everything works. <span className="text-gradient">Together.</span>
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-muted-foreground">
          Six connected modules that share one XP system, one profile and one command palette.
        </p>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className={`bento-card p-6 ${f.span}`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-center font-display text-3xl font-bold">How it works</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                n: "01",
                t: "Sign up & tell us who you are",
                d: "Student or developer? Pick your stack and skill level — your dashboard adapts instantly.",
              },
              {
                n: "02",
                t: "Learn, note, review, hunt bugs",
                d: "Take offline notes in lectures, save snippets, review peers' code and patch the daily bug.",
              },
              {
                n: "03",
                t: "Ship your bento portfolio",
                d: "Toggle your profile public and share a live portfolio built from everything you actually did.",
              },
            ].map((s) => (
              <div key={s.n} className="relative">
                <span className="font-mono text-4xl font-bold text-primary/25">{s.n}</span>
                <h3 className="mt-3 font-display text-lg font-semibold">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="bento-card hero-bg relative overflow-hidden p-10 text-center md:p-16">
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            Ready to feel the <span className="text-gradient">pulse</span>?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Free for students and developers. Your notes work offline from day one.
          </p>
          <Link to={session ? "/dashboard" : "/auth"} className="mt-8 inline-block">
            <Button variant="hero" size="lg">
              {session ? "Open workspace" : "Create your account"} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="font-display font-semibold text-foreground">DevPulse</span>
            <span>— learn, teach, ship.</span>
          </div>
          <div className="flex items-center gap-5">
            <Link to="/learn" className="hover:text-foreground">Learn Hub</Link>
            <Link to="/auth" className="hover:text-foreground">Sign in</Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground"
            >
              <Github className="h-4 w-4" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
