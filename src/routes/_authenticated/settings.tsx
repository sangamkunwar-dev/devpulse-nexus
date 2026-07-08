import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Globe, Lock, Copy, Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { useSession, useProfile } from "@/hooks/useSession";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { userId } = useSession();
  const { data: profile } = useProfile(userId);
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    display_name: "", username: "", tagline: "", bio: "",
    github_username: "", website: "", tech_stack: "",
    role: "student", skill_level: "beginner",
  });
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name ?? "",
        username: profile.username,
        tagline: profile.tagline ?? "",
        bio: profile.bio ?? "",
        github_username: profile.github_username ?? "",
        website: profile.website ?? "",
        tech_stack: profile.tech_stack.join(", "),
        role: profile.role,
        skill_level: profile.skill_level,
      });
    }
  }, [profile]);

  const save = async () => {
    const username = form.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (username.length < 3) { toast.error("Username must be at least 3 characters (a–z, 0–9, _)."); return; }
    if (form.website && !/^https?:\/\//.test(form.website.trim())) { toast.error("Website must start with http(s)://"); return; }
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      display_name: form.display_name.trim().slice(0, 100) || null,
      username,
      tagline: form.tagline.trim().slice(0, 150) || null,
      bio: form.bio.trim().slice(0, 1000) || null,
      github_username: form.github_username.trim().slice(0, 100) || null,
      website: form.website.trim().slice(0, 300) || null,
      tech_stack: form.tech_stack.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 20),
      role: form.role,
      skill_level: form.skill_level,
    }).eq("user_id", userId!);
    setSaving(false);
    if (error) {
      toast.error(error.message.includes("duplicate") ? "That username is taken." : "Could not save profile.");
      return;
    }
    toast.success("Profile saved");
    queryClient.invalidateQueries({ queryKey: ["profile", userId] });
  };

  const togglePublic = async () => {
    if (!profile) return;
    setToggling(true);
    const { error } = await supabase.from("profiles").update({ is_public: !profile.is_public }).eq("user_id", userId!);
    setToggling(false);
    if (error) { toast.error("Could not update portfolio visibility."); return; }
    toast.success(!profile.is_public ? "🚀 Your bento portfolio is LIVE" : "Portfolio is private again");
    queryClient.invalidateQueries({ queryKey: ["profile", userId] });
  };

  const portfolioUrl = profile ? `${typeof window !== "undefined" ? window.location.origin : ""}/u/${profile.username}` : "";

  return (
    <AppShell title="Settings">
      <div className="mx-auto max-w-2xl space-y-5">
        {/* Portfolio toggle */}
        <div className="bento-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
                {profile?.is_public ? <Globe className="h-5 w-5 text-primary" /> : <Lock className="h-5 w-5 text-muted-foreground" />}
                Bento Portfolio
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                One switch turns your profile into a public bento-grid portfolio with your snippets, projects, XP and GitHub stats.
              </p>
            </div>
            <button
              onClick={togglePublic}
              disabled={toggling || !profile}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${profile?.is_public ? "bg-primary" : "bg-muted"}`}
              aria-label="Toggle public portfolio"
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-foreground transition-all ${profile?.is_public ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </div>
          {profile?.is_public && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
              <code className="min-w-0 flex-1 truncate font-mono text-xs text-primary">{portfolioUrl}</code>
              <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(portfolioUrl); toast.success("Portfolio link copied"); }}>
                <Copy className="h-4 w-4" />
              </Button>
              <a href={portfolioUrl} target="_blank" rel="noreferrer">
                <Button size="icon" variant="ghost"><ExternalLink className="h-4 w-4" /></Button>
              </a>
            </div>
          )}
        </div>

        {/* Profile form */}
        <div className="bento-card space-y-4 p-6">
          <h3 className="font-display text-lg font-semibold">Profile</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Display name</Label><Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} maxLength={100} /></div>
            <div><Label>Username (portfolio URL)</Label><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} maxLength={40} /></div>
          </div>
          <div><Label>Tagline</Label><Input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="Full-stack tinkerer · coffee-driven" maxLength={150} /></div>
          <div><Label>Bio</Label><Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} maxLength={1000} /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>GitHub username</Label><Input value={form.github_username} onChange={(e) => setForm({ ...form, github_username: e.target.value })} maxLength={100} /></div>
            <div><Label>Website</Label><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://…" maxLength={300} /></div>
          </div>
          <div><Label>Tech stack (comma separated)</Label><Input value={form.tech_stack} onChange={(e) => setForm({ ...form, tech_stack: e.target.value })} placeholder="TypeScript, React, Python" /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Role</Label>
              <select className="flex h-9 w-full rounded-lg border border-input bg-muted/50 px-3 text-sm outline-none" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="student">ICT Student</option>
                <option value="developer">Developer</option>
              </select>
            </div>
            <div>
              <Label>Skill level</Label>
              <select className="flex h-9 w-full rounded-lg border border-input bg-muted/50 px-3 text-sm outline-none" value={form.skill_level} onChange={(e) => setForm({ ...form, skill_level: e.target.value })}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save profile
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
