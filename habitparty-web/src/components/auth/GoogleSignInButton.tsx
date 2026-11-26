"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ButtonHTMLAttributes, useEffect, useState } from "react";
import { GoogleLogoIcon } from "@/components/ui/GoogleLogoIcon";
import { cn } from "@/utils";
import {
  OAUTH_RETURN_TO_COOKIE,
  OAUTH_STATE_COOKIE,
  resolveSafeReturnTo,
} from "@/utils/authRedirect";
import { BROWSER_TIMEZONE_COOKIE, detectBrowserTimeZone } from "@/utils/date";

interface GoogleSignInButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  isPending?: boolean;
  returnTo?: string;
}

function generateOAuthState(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function GoogleSignInButton({
  label,
  isPending: externalPending,
  returnTo,
  className,
  disabled,
  onClick,
  ...props
}: GoogleSignInButtonProps) {
  const t = useTranslations("auth.oauth");
  const [internalPending, setInternalPending] = useState(false);
  const isPending = externalPending ?? internalPending;
  const resolvedLabel = label ?? t("googleButton");

  useEffect(() => {
    if (!internalPending) return;

    const resetPending = () => {
      if (document.visibilityState === "visible") {
        setInternalPending(false);
      }
    };

    const handlePageShow = () => {
      setInternalPending(false);
    };

    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("focus", resetPending);
    document.addEventListener("visibilitychange", resetPending);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("focus", resetPending);
      document.removeEventListener("visibilitychange", resetPending);
    };
  }, [internalPending]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e);
      return;
    }

    setInternalPending(true);
    const secureSuffix =
      typeof window !== "undefined" && window.location.protocol === "https:"
        ? "; secure"
        : "";

    if (typeof document !== "undefined") {
      const detectedTz = detectBrowserTimeZone();
      // biome-ignore lint/suspicious/noDocumentCookie: Armazena fuso detectado brevemente antes do redirecionamento OAuth para leitura no callback
      document.cookie = `${BROWSER_TIMEZONE_COOKIE}=${encodeURIComponent(detectedTz)}; path=/; max-age=600; samesite=lax${secureSuffix}`;

      const safePath = returnTo ? resolveSafeReturnTo(returnTo, "") : "";
      if (safePath) {
        // biome-ignore lint/suspicious/noDocumentCookie: Preserva o destino pós-login durante o redirecionamento OAuth
        document.cookie = `${OAUTH_RETURN_TO_COOKIE}=${encodeURIComponent(safePath)}; path=/; max-age=600; samesite=lax${secureSuffix}`;
      } else {
        // biome-ignore lint/suspicious/noDocumentCookie: Limpa destino anterior para evitar redirecionamento pós-login obsoleto
        document.cookie = `${OAUTH_RETURN_TO_COOKIE}=; path=/; max-age=0; samesite=lax${secureSuffix}`;
      }
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    if (typeof window !== "undefined") {
      const state = generateOAuthState();
      // biome-ignore lint/suspicious/noDocumentCookie: Token CSRF de curta duração validado em /auth/callback
      document.cookie = `${OAUTH_STATE_COOKIE}=${state}; path=/; max-age=600; samesite=lax${secureSuffix}`;

      if (clientId) {
        const redirectUri = `${window.location.origin}/auth/callback`;
        const scope = encodeURIComponent("openid email profile");
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
          redirectUri,
        )}&response_type=code&scope=${scope}&state=${encodeURIComponent(state)}&prompt=select_account`;

        window.location.href = authUrl;
        return;
      }

      window.location.href = `${backendUrl}/oauth2/authorization/google?state=${encodeURIComponent(state)}`;
    }
  };

  return (
    <button
      type="button"
      disabled={isPending || disabled}
      onClick={handleClick}
      className={cn(
        "w-full py-3.5 px-4 rounded-lg text-base font-semibold",
        "bg-card hover:bg-surface-hover text-neutral-100 border border-neutral-700",
        "dark:bg-neutral-100 dark:hover:bg-neutral-200 dark:text-neutral-900 dark:border-transparent",
        "flex items-center justify-center gap-3 transition-colors cursor-pointer shadow-sm active:scale-[0.99]",
        "outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:opacity-50 disabled:cursor-not-allowed select-none",
        className,
      )}
      {...props}
    >
      {isPending ? (
        <Loader2
          className="w-5 h-5 shrink-0 animate-spin text-neutral-300 dark:text-neutral-700"
          aria-hidden="true"
        />
      ) : (
        <GoogleLogoIcon className="w-5 h-5" aria-hidden="true" />
      )}
      <span>{isPending ? t("googleConnecting") : resolvedLabel}</span>
    </button>
  );
}
