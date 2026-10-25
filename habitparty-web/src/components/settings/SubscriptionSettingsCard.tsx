"use client";

import {
  Calendar,
  CheckCircle2,
  Crown,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createCustomerPortalSessionAction } from "@/actions/paymentActions";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { FounderBadge } from "@/components/ui/FounderBadge";
import { useUserStore } from "@/store/userStore";
import { cn } from "@/utils";

const UpgradePremiumModal = dynamic(
  () =>
    import("@/components/subscription/UpgradePremiumModal").then(
      (mod) => mod.UpgradePremiumModal,
    ),
  { ssr: false },
);

interface SubscriptionSettingsCardProps {
  isCompact?: boolean;
}

export function SubscriptionSettingsCard({
  isCompact = false,
}: SubscriptionSettingsCardProps) {
  const user = useUserStore((s) => s.user);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isPendingPortal, startTransition] = useTransition();

  const handleOpenPortal = () => {
    startTransition(async () => {
      try {
        const res = await createCustomerPortalSessionAction();
        if (res.success) {
          if (res.data?.portalUrl) {
            toast.success(
              "Redirecionando para o Portal de Assinatura do Stripe...",
            );
            window.location.href = res.data.portalUrl;
          } else {
            toast.error("URL do portal não encontrada.");
          }
        } else {
          toast.error(
            res.error ||
              "Não foi possível abrir o portal de assinaturas. Verifique se possui uma assinatura ativa.",
          );
        }
      } catch (err) {
        console.error(err);
        toast.error("Erro inesperado ao conectar ao Stripe.");
      }
    });
  };

  const isPremium = Boolean(user?.isPremium);
  const isFounder = Boolean(user?.isFounder);

  // Formata data de expiração se disponível
  const endsAtFormatted = user?.subscriptionEndsAt
    ? new Date(user.subscriptionEndsAt).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <>
      <SettingsCard
        title="Plano & Assinatura"
        description="Gerencie seu status VIP, renovação, faturas e cancelamento seguro pelo Stripe."
        icon={<Crown size={18} className="text-gold fill-gold" />}
        isCompact={isCompact}
      >
        <div className="flex flex-col gap-4">
          {/* BLOCO DE STATUS DO PLANO */}
          <div
            className={cn(
              "rounded-xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all",
              isPremium
                ? "bg-gradient-to-r from-gold/10 via-surface/60 to-gold/10 border-gold/40 shadow-glow-gold-xs"
                : "bg-surface/40 border-neutral-700/60",
            )}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border",
                  isPremium
                    ? "bg-gold/20 border-gold/40 text-gold shadow-glow-gold-xs"
                    : "bg-surface border-neutral-700 text-neutral-400",
                )}
              >
                {isPremium ? (
                  <Crown size={22} className="fill-gold" />
                ) : (
                  <Sparkles size={20} />
                )}
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-base sm:text-lg font-bold text-neutral-50">
                    {isFounder
                      ? isPremium
                        ? "Membro Fundador (Premium VIP)"
                        : "Membro Fundador (Acesso Gratuito)"
                      : isPremium
                        ? "Guardião Cósmico (Premium VIP)"
                        : "Aventureiro (Gratuito)"}
                  </h4>
                  {isFounder && <FounderBadge size="sm" />}
                  {isPremium && !isFounder && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gold text-neutral-950">
                      VIP Ativo
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-neutral-300 mt-1">
                  {isPremium
                    ? "Você possui acesso irrestrito a 4 ambientes, 6 colunas, sons ambientes e molduras exclusivas."
                    : isFounder
                      ? "Seu período anual de lançamento expirou. Você mantém sua insígnia vitalícia de Fundador, com os recursos do plano gratuito."
                      : "Você está usando a versão gratuita com até 2 ambientes e 4 colunas por quadro."}
                </p>

                {endsAtFormatted && (
                  <div className="flex items-center gap-1.5 text-xs text-neutral-300 mt-2 font-medium">
                    <Calendar size={13} className="text-gold" />
                    <span>Acesso válido até: {endsAtFormatted}</span>
                  </div>
                )}
              </div>
            </div>

            {/* BOTÕES DE AÇÃO */}
            <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {isPremium ? (
                <>
                  <button
                    type="button"
                    disabled={isPendingPortal}
                    onClick={handleOpenPortal}
                    className={cn(
                      "px-4 py-2.5 rounded-xl border border-gold/40 bg-gold/15 text-xs sm:text-sm font-bold text-gold hover:bg-gold/25 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs",
                      "disabled:opacity-60 disabled:cursor-not-allowed",
                    )}
                    title="Acesse o portal da Stripe para atualizar cartão, ver faturas ou cancelar"
                  >
                    <ExternalLink size={14} />
                    <span>
                      {isPendingPortal
                        ? "Abrindo Stripe..."
                        : "Gerenciar ou Cancelar Assinatura"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsUpgradeModalOpen(true)}
                    className="px-3.5 py-2.5 rounded-xl border border-white/10 bg-surface hover:bg-surface-hover text-xs font-semibold text-neutral-200 transition-colors text-center cursor-pointer"
                  >
                    Ver Benefícios
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-hover text-neutral-950 text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all shadow-glow-gold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Crown size={15} className="fill-neutral-950" />
                  <span>
                    {isFounder
                      ? "Renovar Plano Premium 👑"
                      : "Evoluir para Premium 👑"}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* NOTA TRANSPARENTE SOBRE PAGAMENTOS */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-tiny text-neutral-300 leading-relaxed flex items-start gap-2.5">
            <CheckCircle2 size={15} className="text-gold shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-neutral-200">
                Cancelamento e Renovação Descomplicados:
              </span>{" "}
              Se você assinou no cartão recorrente, pode cancelar a qualquer
              momento pelo portal com 1 clique (o acesso continuará liberado até
              o fim do ciclo pago). Se pagou via Pix, não há cobrança automática
              e o acesso simplesmente expira ao final dos dias contratados.
            </div>
          </div>
        </div>
      </SettingsCard>

      {isUpgradeModalOpen && (
        <UpgradePremiumModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
        />
      )}
    </>
  );
}
