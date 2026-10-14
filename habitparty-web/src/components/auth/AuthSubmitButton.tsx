import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils";

interface AuthSubmitButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  isPending?: boolean;
  loadingText?: string;
  children: ReactNode;
}

export function AuthSubmitButton({
  isPending = false,
  loadingText,
  children,
  className,
  disabled,
  ...props
}: AuthSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isPending || disabled}
      className={cn(
        "w-full py-3.5 px-4 rounded-lg border-2 border-gold/50 text-base text-neutral-50 font-bold",
        "bg-neutral-900/60 hover:bg-neutral-900/80 hover:border-gold hover:shadow-glow-gold-md",
        "transition-all cursor-pointer flex items-center justify-center gap-2 select-none",
        "outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    >
      {isPending && <Loader2 size={18} className="animate-spin text-gold" />}
      <span>{isPending && loadingText ? loadingText : children}</span>
    </button>
  );
}
