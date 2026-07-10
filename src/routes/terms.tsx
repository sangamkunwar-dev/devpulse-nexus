import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — DevPulse" },
      { name: "description", content: "Terms of Service for DevPulse — the developer workspace and learning hub." },
      { property: "og:title", content: "Terms of Service — DevPulse" },
      { property: "og:description", content: "Read the terms that govern your use of DevPulse." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
      <Link to="/" className="text-xs text-muted-foreground hover:text-primary">← Home</Link>
      <h1 className="mt-4 font-display text-4xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: July 10, 2026</p>

      <div className="prose prose-invert mt-8 max-w-none space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Acceptance</h2>
          <p>By creating an account or using DevPulse ("the Service"), you agree to these Terms of Service and our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>. If you don't agree, don't use the Service.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">2. Your Account</h2>
          <p>You must be at least 13 years old. You are responsible for the security of your credentials and for all activity under your account. Notify us immediately of any unauthorised use.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Acceptable Use</h2>
          <ul className="list-disc pl-6">
            <li>No malware, phishing, spam, or attempts to disrupt the Service.</li>
            <li>No content that is illegal, hateful, harassing, or infringes others' rights.</li>
            <li>No scraping, reverse-engineering, or circumventing rate limits.</li>
            <li>Respect other users in reviews, comments, and shared workspaces.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Your Content</h2>
          <p>You retain ownership of notes, snippets, projects, and comments you create ("Your Content"). You grant DevPulse a worldwide, non-exclusive licence to host, display, and back up Your Content solely to operate the Service. Public content (public profiles, portfolios, review threads) is visible to everyone.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Daily Bug Challenges</h2>
          <p>Challenges, XP, and leaderboard rankings are provided as-is for learning and fun. Rankings can be reset or adjusted for fairness or to correct exploits.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">6. Termination</h2>
          <p>We may suspend or terminate accounts that violate these terms. You may delete your account at any time from Settings; deletion is permanent.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">7. Disclaimer</h2>
          <p>The Service is provided "AS IS" without warranties of any kind. DevPulse is not liable for lost data, downtime, or indirect damages, to the maximum extent permitted by law.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">8. Changes</h2>
          <p>We may update these terms. Material changes will be announced in-app. Continued use after changes means you accept them.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">9. Contact</h2>
          <p>Questions? Email <a href="mailto:sangamkunwar48@gmail.com" className="text-primary hover:underline">sangamkunwar48@gmail.com</a>.</p>
        </section>
      </div>
    </div>
  );
}
