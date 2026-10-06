"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Pode ser integrado com Sentry, Datadog ou console log
    console.error("Erro capturado pelo Error Boundary da aplicação:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 w-full">
      <div className="bg-card border border-surface-hover p-8 rounded-xl shadow-lg max-w-md w-full text-center flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-300">
        {/* Ícone Contextual de Erro (Vermelho Danger) */}
        <div className="w-16 h-16 rounded-full bg-danger-500/20 flex items-center justify-center mb-2">
          <svg
            className="w-8 h-8 text-danger-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-neutral-50 mb-2">
            Ops! Algo deu errado.
          </h2>
          <p className="text-neutral-300 text-sm">
            Não conseguimos processar essa tela no momento. Tente novamente ou
            volte para o início.
          </p>
        </div>

        <div className="flex flex-col w-full gap-3 mt-4">
          <button
            onClick={() => reset()}
            className="w-full py-3.5 rounded-lg bg-primary hover:bg-primary-dark text-neutral-50 font-bold transition-all shadow-[0_0_15px_rgba(124,58,237,0.2)] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          >
            Tentar Novamente
          </button>

          <Link
            href="/dashboard"
            className="w-full py-3.5 rounded-lg border border-surface hover:border-surface-hover bg-surface hover:bg-surface-hover text-neutral-100 font-semibold transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-surface focus:ring-offset-2 focus:ring-offset-background"
          >
            Voltar ao Início
          </Link>
        </div>
      </div>
    </div>
  );
}
