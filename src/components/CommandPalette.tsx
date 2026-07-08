import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Command } from "cmdk";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  LayoutDashboard,
  NotebookPen,
  Code2,
  GitPullRequest,
  Bug,
  Trophy,
  Settings,
  Home,
  GraduationCap,
  LogOut,
  Link2,
  Search,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession, useProfile } from "@/hooks/useSession";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session, userId } = useSession();
  const { data: profile } = useProfile(userId);
  const [snippets, setSnippets] = useState<{ id: string; title: string; language: string }[]>([]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (open && userId) {
      supabase
        .from("snippets")
        .select("id, title, language")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(20)
        .then(({ data }) => setSnippets(data ?? []));
    }
  }, [open, userId]);

  const go = (to: string) => {
    setOpen(false);
    navigate({ to });
  };

  const signOut = async () => {
    setOpen(false);
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const copyPortfolio = () => {
    if (!profile) return;
    navigator.clipboard.writeText(`${window.location.origin}/u/${profile.username}`);
    toast.success("Portfolio link copied");
    setOpen(false);
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command palette"
      className="fixed left-1/2 top-[18%] z-50 w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-2xl glass shadow-2xl"
      overlayClassName="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 border-b border-border px-4">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Command.Input
          placeholder="Type a command or search…"
          className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <kbd className="kbd-chip">esc</kbd>
      </div>
      <Command.List className="max-h-80 overflow-y-auto p-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-item]]:flex [&_[cmdk-item]]:cursor-pointer [&_[cmdk-item]]:items-center [&_[cmdk-item]]:gap-2.5 [&_[cmdk-item]]:rounded-lg [&_[cmdk-item]]:px-2.5 [&_[cmdk-item]]:py-2 [&_[cmdk-item]]:text-sm [&_[cmdk-item][data-selected=true]]:bg-secondary">
        <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
          No results found.
        </Command.Empty>

        <Command.Group heading="Navigate">
          <Command.Item onSelect={() => go("/")}>
            <Home className="h-4 w-4 text-muted-foreground" /> Home
          </Command.Item>
          <Command.Item onSelect={() => go("/learn")}>
            <GraduationCap className="h-4 w-4 text-muted-foreground" /> Learn Hub
          </Command.Item>
          {session && (
            <>
              <Command.Item onSelect={() => go("/dashboard")}>
                <LayoutDashboard className="h-4 w-4 text-muted-foreground" /> Dashboard
              </Command.Item>
              <Command.Item onSelect={() => go("/notes")}>
                <NotebookPen className="h-4 w-4 text-muted-foreground" /> DevNotes
              </Command.Item>
              <Command.Item onSelect={() => go("/snippets")}>
                <Code2 className="h-4 w-4 text-muted-foreground" /> Snippets
              </Command.Item>
              <Command.Item onSelect={() => go("/reviews")}>
                <GitPullRequest className="h-4 w-4 text-muted-foreground" /> Review Labs
              </Command.Item>
              <Command.Item onSelect={() => go("/challenges")}>
                <Bug className="h-4 w-4 text-muted-foreground" /> Daily Bug
              </Command.Item>
              <Command.Item onSelect={() => go("/leaderboard")}>
                <Trophy className="h-4 w-4 text-muted-foreground" /> Leaderboard
              </Command.Item>
              <Command.Item onSelect={() => go("/settings")}>
                <Settings className="h-4 w-4 text-muted-foreground" /> Settings
              </Command.Item>
            </>
          )}
        </Command.Group>

        {session && (
          <Command.Group heading="Actions">
            <Command.Item onSelect={copyPortfolio}>
              <Link2 className="h-4 w-4 text-muted-foreground" /> Copy portfolio link
            </Command.Item>
            <Command.Item onSelect={signOut}>
              <LogOut className="h-4 w-4 text-muted-foreground" /> Sign out
            </Command.Item>
          </Command.Group>
        )}

        {session && snippets.length > 0 && (
          <Command.Group heading="Your snippets">
            {snippets.map((s) => (
              <Command.Item key={s.id} onSelect={() => go("/snippets")}>
                <Code2 className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{s.title}</span>
                <span className="ml-auto font-mono text-xs text-muted-foreground">{s.language}</span>
              </Command.Item>
            ))}
          </Command.Group>
        )}
      </Command.List>
    </Command.Dialog>
  );
}
