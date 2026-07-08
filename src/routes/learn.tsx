import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Zap,
  ArrowRight,
  BookOpen,
  Server,
  Layers,
  Terminal,
  Users,
  MessageSquareCode,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "Learn Hub — DevPulse" },
      {
        name: "description",
        content:
          "Curated learning roadmaps for frontend, backend, full-stack and DevOps — plus how to teach and mentor peers on DevPulse.",
      },
      { property: "og:title", content: "Learn Hub — DevPulse" },
      {
        property: "og:description",
        content: "Curated roadmaps and resources for developers and ICT students.",
      },
    ],
  }),
  component: LearnPage,
});

const ROADMAPS = [
  {
    icon: BookOpen,
    title: "Frontend",
    color: "text-primary",
    steps: [
      { s: "HTML & CSS fundamentals", r: "MDN Web Docs", u: "https://developer.mozilla.org/en-US/docs/Learn" },
      { s: "JavaScript deep-dive", r: "javascript.info", u: "https://javascript.info" },
      { s: "React & component thinking", r: "react.dev", u: "https://react.dev/learn" },
      { s: "TypeScript", r: "TS Handbook", u: "https://www.typescriptlang.org/docs/handbook/intro.html" },
      { s: "Styling systems (Tailwind)", r: "tailwindcss.com", u: "https://tailwindcss.com/docs" },
    ],
  },
  {
    icon: Server,
    title: "Backend",
    color: "text-accent",
    steps: [
      { s: "How the internet works", r: "roadmap.sh", u: "https://roadmap.sh/backend" },
      { s: "Python or Node.js basics", r: "freeCodeCamp", u: "https://www.freecodecamp.org/learn" },
      { s: "SQL & relational databases", r: "SQLBolt", u: "https://sqlbolt.com" },
      { s: "REST APIs & auth", r: "MDN HTTP", u: "https://developer.mozilla.org/en-US/docs/Web/HTTP" },
      { s: "Postgres in production", r: "postgresql.org", u: "https://www.postgresql.org/docs/current/tutorial.html" },
    ],
  },
  {
    icon: Layers,
    title: "Full-Stack",
    color: "text-info",
    steps: [
      { s: "Pick a stack & build a CRUD app", r: "The Odin Project", u: "https://www.theodinproject.com" },
      { s: "Auth, sessions & security", r: "OWASP Top 10", u: "https://owasp.org/www-project-top-ten/" },
      { s: "Realtime features (websockets)", r: "MDN WebSockets", u: "https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API" },
      { s: "Testing & CI", r: "vitest.dev", u: "https://vitest.dev/guide/" },
      { s: "Deploy & monitor", r: "12factor.net", u: "https://12factor.net" },
    ],
  },
  {
    icon: Terminal,
    title: "DevOps & Tools",
    color: "text-warning",
    steps: [
      { s: "Command line mastery", r: "MIT Missing Semester", u: "https://missing.csail.mit.edu" },
      { s: "Git & GitHub workflow", r: "git-scm book", u: "https://git-scm.com/book/en/v2" },
      { s: "Docker fundamentals", r: "docker docs", u: "https://docs.docker.com/get-started/" },
      { s: "Linux essentials", r: "linuxjourney.com", u: "https://linuxjourney.com" },
      { s: "CI/CD pipelines", r: "GitHub Actions", u: "https://docs.github.com/en/actions" },
    ],
  },
];

function LearnPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="h-4 w-4" />
            </div>
            <span className="font-display text-lg font-semibold">DevPulse</span>
          </Link>
          <Link to="/auth">
            <Button size="sm">Join DevPulse <ArrowRight className="h-3.5 w-3.5" /></Button>
          </Link>
        </div>
      </header>

      <section className="hero-bg px-4 pb-12 pt-16 text-center">
        <Badge variant="outline" className="mx-auto w-fit">Learn Hub</Badge>
        <h1 className="mx-auto mt-4 max-w-2xl font-display text-4xl font-bold md:text-5xl">
          Roadmaps that <span className="text-gradient">actually get you hired</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Four curated paths built from the best free resources on the internet. Pair them with
          DevNotes, Daily Bugs and peer reviews inside your workspace.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-4 md:grid-cols-2">
          {ROADMAPS.map((r, i) => (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="bento-card p-6"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                  <r.icon className={`h-5 w-5 ${r.color}`} />
                </div>
                <h2 className="font-display text-xl font-semibold">{r.title}</h2>
              </div>
              <ol className="mt-5 space-y-3">
                {r.steps.map((step, idx) => (
                  <li key={step.s} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border font-mono text-[10px] text-muted-foreground">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{step.s}</p>
                      <a
                        href={step.u}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        {step.r} <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </li>
                ))}
              </ol>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Teach section */}
      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <Badge variant="accent" className="w-fit">Teach & mentor</Badge>
              <h2 className="mt-4 font-display text-3xl font-bold">
                The fastest way to learn is to teach
              </h2>
              <p className="mt-3 text-muted-foreground">
                DevPulse turns teaching into a first-class activity. Every review comment you
                leave earns XP, builds your reputation and lands on your public portfolio.
              </p>
              <ul className="mt-6 space-y-4">
                <li className="flex gap-3">
                  <MessageSquareCode className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium">Review peers' code line by line</p>
                    <p className="text-sm text-muted-foreground">
                      Highlight exact lines, suggest fixes, praise elegant solutions.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <Users className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium">Help beginners in Review Labs</p>
                    <p className="text-sm text-muted-foreground">
                      ICT students post real code from real assignments — your feedback matters.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <Zap className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium">Earn XP for every contribution</p>
                    <p className="text-sm text-muted-foreground">
                      +5 XP per review comment, up to 75 XP per daily bug solved.
                    </p>
                  </div>
                </li>
              </ul>
              <Link to="/auth" className="mt-8 inline-block">
                <Button variant="hero">Start teaching today <ArrowRight className="h-4 w-4" /></Button>
              </Link>
            </div>
            <div className="bento-card p-6 font-mono text-sm">
              <p className="text-muted-foreground">// review-labs/submission-42.js</p>
              <p className="mt-2"><span className="text-info">const</span> result = users.<span className="text-accent">filter</span>(u =&gt; u.active)</p>
              <div className="my-2 rounded-lg border border-primary/30 bg-primary/5 p-3 font-sans">
                <p className="text-xs font-semibold text-primary">L2 · suggestion · +3 upvotes</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Nice! You could chain <code className="text-foreground">.map(u =&gt; u.name)</code> here
                  instead of the loop below — one pass, more readable.
                </p>
              </div>
              <p>  .<span className="text-accent">map</span>(u =&gt; u.name);</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <Link to="/" className="text-primary hover:underline">← Back to DevPulse</Link>
      </footer>
    </div>
  );
}
