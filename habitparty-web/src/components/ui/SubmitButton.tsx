import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils";

interface SubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isPending?: boolean;
  loadingText?: string;
  children: ReactNode;
}

export function SubmitButton({
  isPending = false,
  loadingText,
  children,
  className,
  disabled,
  ...props
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isPending || disabled}
      className={cn(
        "w-full py-3.5 px-4 rounded-lg text-base font-bold transition-all cursor-pointer flex items-center justify-center gap-2 select-none",
        // Tema Claro: Botão Roxo Primário vibrante com texto branco de alto contraste e sombra suave
        "bg-primary hover:bg-primary-dark text-white border border-primary-dark/30 shadow-sm active:scale-[0.99]",
        // Tema Escuro: Preenchimento primário de alto impacto visual com brilho sutil
        "dark:bg-primary dark:hover:bg-primary-light dark:border dark:border-primary-light/40 dark:hover:border-gold/60 dark:shadow-[0_0_20px_rgba(124,58,237,0.35)] dark:hover:shadow-glow-gold-md dark:text-white",
        "outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    >
      {isPending && (
        <Loader2 size={18} className="animate-spin text-white dark:text-gold" />
      )}
      <span>{isPending && loadingText ? loadingText : children}</span>
    </button>
  );
}
