import { Shield, Sparkles } from "lucide-react";
import { cn } from "@/utils";

interface FounderBadgeProps {
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

export function FounderBadge({
  size = "md",
  showLabel = true,
  className,
}: FounderBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-black uppercase tracking-wider transition-all select-none",
        "bg-gradient-to-r from-gold/25 via-amber-400/20 to-gold/25 text-gold border border-gold/50 shadow-glow-gold-xs hover:shadow-glow-gold",
        size === "sm" ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[11px]",
        className,
      )}
      title="Membro Fundador — Insígnia Vitalícia Exclusiva dos Primeiros 30 Apoiadores"
    >
      <div className="relative flex items-center justify-center shrink-0">
        <Shield
          className={cn(
            "fill-gold text-neutral-950",
            size === "sm" ? "w-2.5 h-2.5" : "w-3.5 h-3.5",
          )}
        />
        <Sparkles
          className={cn(
            "absolute -top-1 -right-1 text-white animate-pulse",
            size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2",
          )}
        />
      </div>
      {showLabel && <span>Fundador</span>}
    </div>
  );
}
