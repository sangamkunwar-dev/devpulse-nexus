import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}
function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // @ts-expect-error iOS-specific
    window.navigator.standalone === true
  );
}

export function InstallButton({
  variant = "outline",
  size = "sm",
  className,
}: {
  variant?: "outline" | "hero" | "default" | "ghost";
  size?: "sm" | "lg" | "default";
  className?: string;
}) {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  const handleClick = async () => {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") toast.success("DevPulse is installing");
      setDeferred(null);
      return;
    }
    if (isIos()) {
      toast.info("On iPhone: tap Share → Add to Home Screen to install DevPulse.");
      return;
    }
    toast.info(
      "Your browser will show an install icon in the address bar. On desktop Chrome / Edge, look for the ⤓ icon.",
    );
  };

  return (
    <Button variant={variant} size={size} className={className} onClick={handleClick}>
      <Download className="h-3.5 w-3.5" />
      Install app
    </Button>
  );
}
