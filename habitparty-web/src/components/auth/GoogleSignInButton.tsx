"use client";

import { Loader2 } from "lucide-react";
import { type ButtonHTMLAttributes, useState } from "react";
import { GoogleLogoIcon } from "@/components/ui/GoogleLogoIcon";
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
        <GoogleLogoIcon className="w-5 h-5" />
      )}
      <span>{isPending ? "Conectando ao Google..." : label}</span>
    </button>
  );
}
