import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — DevPulse" },
      { name: "description", content: "How DevPulse collects, uses, and protects your data." },
      { property: "og:title", content: "Privacy Policy — DevPulse" },
      { property: "og:description", content: "How DevPulse handles your personal data and content." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
      <Link to="/" className="text-xs text-muted-foreground hover:text-primary">← Home</Link>
      <h1 className="mt-4 font-display text-4xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: July 10, 2026</p>

      <div className="prose prose-invert mt-8 max-w-none space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">Who we are</h2>
          <p>DevPulse is maintained by the DevPulse team. Contact: <a href="mailto:sangamkunwar48@gmail.com" className="text-primary hover:underline">sangamkunwar48@gmail.com</a>.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Data we collect</h2>
          <ul className="list-disc pl-6">
            <li><strong>Account:</strong> email, username, display name, avatar (from Google if you use Google Sign-In).</li>
            <li><strong>Content you create:</strong> notes, snippets, projects, review requests, comments, challenge attempts.</li>
            <li><strong>Usage:</strong> XP, streaks, timestamps, and basic device/browser info for security and analytics.</li>
            <li><strong>Cookies / local storage:</strong> used for sign-in sessions and offline mode (service worker cache).</li>
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">How we use it</h2>
          <ul className="list-disc pl-6">
            <li>Operate the Service (auth, sync, leaderboard, reviews).</li>
            <li>Improve reliability, detect abuse, and secure the platform.</li>
            <li>Show public content (portfolios, public projects, reviews) only when you opt in.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Sharing</h2>
          <p>We don't sell your data. We share it only with infrastructure providers (hosting, database, auth) strictly to run the Service, or when required by law.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Your rights</h2>
          <p>You can export or delete your data from Settings. You may request access, correction, or erasure by emailing us.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Security</h2>
          <p>Data is transmitted over HTTPS and stored with row-level security policies scoped to your user id. No system is 100% secure — report vulnerabilities to <a href="mailto:sangamkunwar48@gmail.com" className="text-primary hover:underline">sangamkunwar48@gmail.com</a>.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Children</h2>
          <p>DevPulse isn't intended for users under 13.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Changes</h2>
          <p>We'll post updates on this page and, for material changes, in-app.</p>
        </section>
      </div>
    </div>
  );
}
