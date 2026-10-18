"use client";

import { Cookie, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";

const COOKIE_CONSENT_KEY = "habitparty_cookie_consent";

/**
 * Banner informativo de cookies estritamente essenciais e conformidade com a LGPD.
 * Como o HabitParty utiliza apenas cookies necessários para autenticação e preferências,
 * este componente foca na transparência sem bloquear o fluxo do usuário.
 */
export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const hasConsented = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!hasConsented) {
        setIsVisible(true);
      }
    } catch {
      // Caso localStorage esteja desativado ou bloqueado no navegador
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    } catch {
      // Falha silenciosa em navegadores com restrições estritas de storage
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Aviso de cookies e privacidade"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 pointer-events-auto animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="relative p-4 sm:p-5 rounded-2xl bg-surface/95 border border-primary/40 shadow-2xl backdrop-blur-md flex flex-col gap-3.5 text-neutral-100">
        <button
          type="button"
          onClick={handleAccept}
          className="absolute top-3.5 right-3.5 text-neutral-400 hover:text-neutral-200 transition-colors p-1 rounded-md hover:bg-white/5 cursor-pointer"
          aria-label="Fechar aviso de cookies"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-3.5 pr-6">
          <div className="p-2.5 rounded-xl bg-gold/15 text-gold shrink-0 border border-gold/30 shadow-glow-gold-xs">
            <Cookie size={22} className="text-gold" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <h4 className="text-body-s font-bold text-neutral-50">
                Privacidade & Cookies
              </h4>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                <ShieldCheck size={11} />
                Essenciais
              </span>
            </div>
            <p className="text-neutral-300 text-caption leading-relaxed">
              Utilizamos apenas cookies essenciais para manter sua sessão
              segura, autenticar sua conta e preservar preferências como tema e
              workspace. Não coletamos dados para anúncios ou rastreamento de
              terceiros.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={handleAccept}
            className="px-4 py-2 rounded-lg bg-gold hover:bg-gold-hover text-neutral-900 font-bold text-caption transition-all focus:outline-none focus:ring-2 focus:ring-gold/50 shadow-sm cursor-pointer hover:shadow-glow-gold-xs"
          >
            Entendi e Concordo
          </button>
        </div>
      </div>
    </aside>
  );
}
