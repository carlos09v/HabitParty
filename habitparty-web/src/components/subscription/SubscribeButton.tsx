"use client";

import { Crown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/utils";
import { UpgradePremiumModal } from "./UpgradePremiumModal";

interface SubscribeButtonProps {
  className?: string;
  variant?: "primary" | "outline" | "compact";
  children?: React.ReactNode;
}

export function SubscribeButton({
  className,
  variant = "primary",
  children,
}: SubscribeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all cursor-pointer active:scale-95",
          variant === "primary" &&
            "bg-gold hover:bg-gold-hover text-neutral-950 px-4 py-2 text-sm shadow-glow-gold hover:shadow-[0_0_25px_rgba(237,229,57,0.4)]",
          variant === "outline" &&
            "border border-gold/40 text-gold hover:bg-gold/10 px-3 py-1.5 text-xs shadow-xs",
          variant === "compact" &&
            "bg-gold/20 hover:bg-gold/30 text-gold border border-gold/40 px-2.5 py-1 text-tiny rounded-lg",
          className,
        )}
      >
        <Crown
          size={14}
          className="stroke-2 shrink-0 fill-gold text-neutral-950"
        />
        <span>{children || "Seja Premium"}</span>
      </button>

      <UpgradePremiumModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
