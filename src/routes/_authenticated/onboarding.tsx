import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { GraduationCap, Braces, ArrowRight, ArrowLeft, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession, useProfile } from "@/hooks/useSession";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: OnboardingPage,
});

const STACKS = [
  "JavaScript", "TypeScript", "Python", "Java", "C#", "C++", "Go", "Rust",
  "React", "Vue", "Angular", "Node.js", "Django", "Spring", "SQL", "PHP",
  "Kotlin", "Swift", "Flutter", "Docker",
];

const LEVELS = [
  { id: "beginner", label: "Beginner", desc: "I'm just starting out — first year ICT or self-taught basics." },
  { id: "intermediate", label: "Intermediate", desc: "I've built a few projects and know my way around a stack." },
  { id: "advanced", label: "Advanced", desc: "I ship production code and can mentor others." },
] as const;

function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userId } = useSession();
  const { data: profile } = useProfile(userId);
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<"student" | "developer" | null>(null);
  const [stack, setStack] = useState<string[]>([]);
  const [level, setLevel] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleStack = (s: string) =>
    setStack((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const finish = async () => {
    if (!userId || !role || !level) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ role, tech_stack: stack, skill_level: level, onboarded: true })
      .eq("user_id", userId);
    setSaving(false);
    if (error) {
      toast.error("Could not save your profile. Try again.");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    toast.success(`Welcome to DevPulse, ${profile?.display_name ?? "dev"}! 🎉`);
    navigate({ to: "/dashboard", replace: true });
  };

  const canNext = step === 0 ? !!role : step === 1 ? stack.length > 0 : !!level;

  return (
    <div className="hero-bg flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl">
        {/* Progress */}
        <div className="mb-8 flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors duration-300",
                i <= step ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>

        <div className="bento-card p-8">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="role"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h1 className="font-display text-2xl font-bold">Who are you?</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  This customizes your dashboard layout and challenge difficulty.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {[
                    { id: "student" as const, icon: GraduationCap, t: "ICT Student", d: "I'm learning — lectures, assignments, exams." },
                    { id: "developer" as const, icon: Braces, t: "Developer", d: "I build software — professionally or seriously." },
                  ].map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setRole(r.id)}
                      className={cn(
                        "rounded-xl border p-5 text-left transition-all",
                        role === r.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/40",
                      )}
                    >
                      <r.icon className={cn("h-6 w-6", role === r.id ? "text-primary" : "text-muted-foreground")} />
                      <p className="mt-3 font-medium">{r.t}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{r.d}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="stack"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h1 className="font-display text-2xl font-bold">Your tech stack</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pick everything you use or are learning right now.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {STACKS.map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleStack(s)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 font-mono text-xs transition-all",
                        stack.includes(s)
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40",
                      )}
                    >
                      {stack.includes(s) && <Check className="mr-1 inline h-3 w-3" />}
                      {s}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="level"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h1 className="font-display text-2xl font-bold">Skill level</h1>
                <p className="mt-1 text-sm text-muted-foreground">Be honest — you can change it later.</p>
                <div className="mt-6 space-y-3">
                  {LEVELS.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setLevel(l.id)}
                      className={cn(
                        "w-full rounded-xl border p-4 text-left transition-all",
                        level === l.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/40",
                      )}
                    >
                      <p className={cn("font-medium", level === l.id && "text-primary")}>{l.label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{l.desc}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 flex justify-between">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            {step < 2 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="hero" onClick={finish} disabled={!canNext || saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Enter DevPulse <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
