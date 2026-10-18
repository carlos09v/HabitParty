"use client";

import { Loader2 } from "lucide-react";
import { type ButtonHTMLAttributes, useState } from "react";
import { cn } from "@/utils";

interface GoogleSignInButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  isPending?: boolean;
}

export function GoogleSignInButton({
  label = "Continuar com Google",
  isPending: externalPending,
  className,
  disabled,
  onClick,
  ...props
}: GoogleSignInButtonProps) {
  const [internalPending, setInternalPending] = useState(false);
  const isPending = externalPending ?? internalPending;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e);
      return;
    }

    setInternalPending(true);
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    if (clientId && typeof window !== "undefined") {
      const redirectUri = `${window.location.origin}/auth/callback`;
      const scope = encodeURIComponent("openid email profile");
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri,
      )}&response_type=code&scope=${scope}&prompt=select_account`;

      window.location.href = authUrl;
      return;
    }

    if (typeof window !== "undefined") {
      window.location.href = `${backendUrl}/oauth2/authorization/google`;
    }
  };

  return (
    <button
      type="button"
      disabled={isPending || disabled}
      onClick={handleClick}
      className={cn(
        "w-full py-3.5 px-4 rounded-lg text-base font-semibold",
        // Tema Claro: Botão com superfície limpa, borda sutil e texto escuro nítido
        "bg-card hover:bg-surface-hover text-neutral-100 border border-neutral-700 shadow-xs",
        // Tema Escuro: 100% fiel ao original
        "dark:bg-neutral-100 dark:hover:bg-neutral-200 dark:text-neutral-900 dark:border-transparent",
        "flex items-center justify-center gap-3 transition-colors cursor-pointer shadow-sm active:scale-[0.99]",
        "outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:opacity-50 disabled:cursor-not-allowed select-none",
        className,
      )}
      {...props}
    >
      {isPending ? (
        <Loader2 className="w-5 h-5 shrink-0 animate-spin text-neutral-600 dark:text-neutral-700" />
      ) : (
        <svg
          className="w-5 h-5 shrink-0"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
      )}
      <span>{isPending ? "Conectando ao Google..." : label}</span>
    </button>
  );
}
