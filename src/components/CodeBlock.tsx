import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
  /** highlight these 1-based line numbers */
  highlight?: Set<number>;
  /** currently selected range while composing a comment */
  selection?: { start: number; end: number } | null;
  onLineClick?: (line: number) => void;
}

export function CodeBlock({
  code,
  language,
  className,
  highlight,
  selection,
  onLineClick,
}: CodeBlockProps) {
  const lines = code.replace(/\n$/, "").split("\n");
  const interactive = !!onLineClick;

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-background/60", className)}>
      {language && (
        <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
          <span className="font-mono text-xs text-muted-foreground">{language}</span>
          {interactive && (
            <span className="text-[10px] text-muted-foreground">
              click a line number to comment
            </span>
          )}
        </div>
      )}
      <pre className="overflow-x-auto py-2 text-[13px] leading-6">
        <code>
          {lines.map((line, i) => {
            const n = i + 1;
            const inSelection = selection && n >= selection.start && n <= selection.end;
            const isHighlighted = highlight?.has(n);
            return (
              <div
                key={n}
                className={cn(
                  "flex px-0",
                  inSelection && "bg-primary/10",
                  isHighlighted && !inSelection && "bg-accent/10",
                )}
              >
                <button
                  type="button"
                  disabled={!interactive}
                  onClick={() => onLineClick?.(n)}
                  className={cn(
                    "w-11 shrink-0 select-none pr-3 text-right font-mono text-xs leading-6 text-muted-foreground/60",
                    interactive && "cursor-pointer hover:text-primary",
                    inSelection && "text-primary",
                  )}
                >
                  {n}
                </button>
                <span className="whitespace-pre pr-4 font-mono">{line || " "}</span>
              </div>
            );
          })}
        </code>
      </pre>
    </div>
  );
}
