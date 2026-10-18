"use client";

import {
  Check,
  CreditCard,
  Crown,
  ExternalLink,
  Flame,
  QrCode,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createCheckoutSessionAction,
  createCustomerPortalSessionAction,
  getFoundersQuotaAction,
} from "@/actions/paymentActions";
import { BaseModal } from "@/components/ui/BaseModal";
import { useUserStore } from "@/store/userStore";
import type {
  FoundersQuotaDTO,
  PaymentMethodType,
  PlanType,
} from "@/types/payment";
import { cn } from "@/utils";

interface UpgradePremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradePremiumModal({
  isOpen,
  onClose,
}: UpgradePremiumModalProps) {
  const user = useUserStore((s) => s.user);
  const isFounder = Boolean(user?.isFounder);
  const hasActiveRecurring = Boolean(user?.hasActiveRecurringSubscription);

  const [quota, setQuota] = useState<FoundersQuotaDTO | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(
    isFounder ? "ANNUAL" : "FOUNDER_ANNUAL",
  );
  const [selectedMethod, setSelectedMethod] =
    useState<PaymentMethodType>("CREDIT_CARD");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (isOpen) {
      getFoundersQuotaAction().then((res) => {
        if (res.success && res.data) {
          setQuota(res.data);
          if (!res.data.isAvailable || isFounder) {
            setSelectedPlan("ANNUAL");
          }
        }
      });
    }
  }, [isOpen, isFounder]);

  const handleOpenPortal = () => {
    startTransition(async () => {
      try {
        const res = await createCustomerPortalSessionAction();
        if (res.success) {
          toast.success(
            "Redirecionando para o Portal de Assinatura do Stripe...",
          );
          window.location.href = res.data.portalUrl;
        } else {
          toast.error(res.error || "Erro ao abrir o portal de assinaturas.");
        }
      } catch (err) {
        console.error(err);
        toast.error("Erro inesperado ao conectar ao portal Stripe.");
      }
    });
  };

  const handleCheckout = () => {
    startTransition(async () => {
      try {
        const res = await createCheckoutSessionAction({
          plan: selectedPlan,
          paymentMethod: selectedMethod,
        });

        if (res.success) {
          toast.success("Redirecionando para o ambiente seguro do Stripe...");
          window.location.href = res.data.checkoutUrl;
        } else {
          toast.error(res.error || "Erro ao gerar sessão de pagamento.");
        }
      } catch (err) {
        console.error(err);
        toast.error("Erro inesperado ao conectar ao Stripe.");
      }
    });
  };

  const isFounderAvailable = quota ? quota.isAvailable : true;
  const remainingSlots = quota ? quota.remainingSlots : 30;

  const perks = [
    "Molduras animadas exclusivas para seu perfil e avatar",
    "Sons ambiente no Pomodoro (Chuva, Cafeteria, Fogueira, Lofi)",
    "Pacote exclusivo de ícones VIP para atividades e colunas",
    "Até 4 Ambientes (Workspaces) independentes — o dobro do free",
    "Até 6 Listas/Colunas por quadro para fluxos completos",
    "Até 6 Atividades personalizadas no Modo Foco",
    "Mochila de Inventário expandida para 100 itens",
    "Emblema VIP de Guardião Cósmico no perfil e anel dourado",
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-xl"
      borderColor="border-gold/50"
      preventClose={isPending}
      headerExtra={<Crown className="w-6 h-6 text-gold fill-gold" />}
      title="Evoluir para Guardião Cósmico"
      description="Desbloqueie todo o poder da produtividade gamificada sem barreiras."
    >
      <div className="flex flex-col gap-6">
        {/* SELEÇÃO DO PLANO: MEMBRO FUNDADOR (SE DISPONÍVEL), ANUAL OU MENSAL */}
        <div
          className={cn(
            "grid gap-2.5 p-1.5 bg-surface/50 border border-primary/20 rounded-2xl",
            isFounderAvailable ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2",
          )}
        >
          {isFounderAvailable && (
            <button
              type="button"
              disabled={isFounder}
              onClick={() => setSelectedPlan("FOUNDER_ANNUAL")}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-xl transition-all relative",
                isFounder
                  ? "opacity-60 cursor-not-allowed bg-white/5 border border-gold/30"
                  : selectedPlan === "FOUNDER_ANNUAL"
                    ? "bg-gold text-neutral-950 font-bold shadow-glow-gold cursor-pointer"
                    : "text-neutral-300 hover:text-neutral-50 hover:bg-white/5 cursor-pointer",
              )}
            >
              <span className="absolute -top-2.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gold text-neutral-950 border border-neutral-950/20 shadow-xs flex items-center gap-1">
                {isFounder ? (
                  "Já Adquirido 👑"
                ) : (
                  <>
                    <Flame className="w-2.5 h-2.5 fill-current" />
                    {remainingSlots} vagas
                  </>
                )}
              </span>
              <span className="text-xs font-semibold">Fundador</span>
              <span className="text-base font-black font-mono">R$ 59,90</span>
              <span className="text-[10px] opacity-80">/ano + Insígnia</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setSelectedPlan("MONTHLY")}
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-xl transition-all cursor-pointer",
              selectedPlan === "MONTHLY"
                ? "bg-gold text-neutral-950 font-bold shadow-glow-gold"
                : "text-neutral-300 hover:text-neutral-50 hover:bg-white/5",
            )}
          >
            <span className="text-xs font-semibold">Mensal</span>
            <span className="text-base font-black font-mono">R$ 9,90</span>
            <span className="text-[10px] opacity-80">ou 30 dias Pix</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPlan("ANNUAL")}
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-xl transition-all relative cursor-pointer",
              selectedPlan === "ANNUAL"
                ? "bg-gold text-neutral-950 font-bold shadow-glow-gold"
                : "text-neutral-300 hover:text-neutral-50 hover:bg-white/5",
            )}
          >
            <span className="text-xs font-semibold">Anual</span>
            <span className="text-base font-black font-mono">R$ 99,00</span>
            <span className="text-[10px] opacity-80">ou 365 dias Pix</span>
          </button>
        </div>

        {/* CALLOUT PARA MEMBROS FUNDADORES */}
        {selectedPlan === "FOUNDER_ANNUAL" && (
          <div className="p-3.5 rounded-2xl bg-gold/10 border border-gold/40 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/20 border border-gold/40 flex items-center justify-center shrink-0 text-gold shadow-glow-gold-xs">
              <Shield className="w-5 h-5 fill-gold/40" />
            </div>
            <div>
              <span className="text-xs font-black text-gold uppercase tracking-wider block">
                Insígnia Vitalícia de Membro Fundador
              </span>
              <p className="text-tiny text-neutral-200">
                Você receberá o selo permanente gravado no perfil e 1 ano
                completo de Guardião Cósmico com 40% de desconto.
              </p>
            </div>
          </div>
        )}

        {/* FORMA DE PAGAMENTO: CARTÃO RECORRENTE OU PIX AVULSO */}
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Forma de Pagamento
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* CARTÃO */}
            <button
              type="button"
              onClick={() => setSelectedMethod("CREDIT_CARD")}
              className={cn(
                "flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer",
                selectedMethod === "CREDIT_CARD"
                  ? "border-gold bg-gold/10 text-neutral-50 shadow-xs"
                  : "border-primary/20 bg-surface/30 text-neutral-300 hover:border-primary/40 hover:bg-surface/50",
              )}
            >
              <div
                className={cn(
                  "p-2 rounded-lg shrink-0 mt-0.5",
                  selectedMethod === "CREDIT_CARD"
                    ? "bg-gold text-neutral-950"
                    : "bg-surface text-neutral-300",
                )}
              >
                <CreditCard size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 font-bold text-sm text-neutral-100">
                  Cartão de Crédito
                </div>
                <p className="text-tiny text-neutral-400 mt-0.5 leading-snug">
                  Assinatura recorrente com renovação automática. Cancele quando
                  quiser.
                </p>
              </div>
            </button>

            {/* PIX */}
            <button
              type="button"
              onClick={() => setSelectedMethod("PIX")}
              className={cn(
                "flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer",
                selectedMethod === "PIX"
                  ? "border-gold bg-gold/10 text-neutral-50 shadow-xs"
                  : "border-primary/20 bg-surface/30 text-neutral-300 hover:border-primary/40 hover:bg-surface/50",
              )}
            >
              <div
                className={cn(
                  "p-2 rounded-lg shrink-0 mt-0.5",
                  selectedMethod === "PIX"
                    ? "bg-gold text-neutral-950"
                    : "bg-surface text-neutral-300",
                )}
              >
                <QrCode size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 font-bold text-sm text-neutral-100">
                  Pix Avulso
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-primary/20 text-primary-light">
                    Sem recorrência
                  </span>
                </div>
                <p className="text-tiny text-neutral-400 mt-0.5 leading-snug">
                  Pagamento único via QR Code. Libera{" "}
                  {selectedPlan === "MONTHLY" ? "30" : "365"} dias de Premium
                  imediatamente.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* BENEFÍCIOS */}
        <div className="p-4 rounded-xl bg-surface/30 border border-primary/20 space-y-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
            <Sparkles size={14} /> O que você recebe:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {perks.map((perk) => (
              <div
                key={perk}
                className="flex items-start gap-2 text-tiny text-neutral-200"
              >
                <Check size={14} className="text-gold shrink-0 mt-0.5" />
                <span className="leading-tight">{perk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* BOTÃO DE CONFIRMAÇÃO & REDIRECIONAMENTO */}
        <div className="flex flex-col gap-2 pt-2">
          {hasActiveRecurring ? (
            <div className="flex flex-col gap-3">
              <div className="p-3.5 rounded-xl bg-gold/10 border border-gold/30 text-xs text-neutral-200 flex items-start gap-2.5">
                <Sparkles size={16} className="text-gold shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold text-gold">
                    Você já possui uma assinatura ativa no Cartão!
                  </span>
                  <p className="text-neutral-300 mt-0.5 text-tiny">
                    Para trocar de plano com desconto proporcional automático,
                    atualizar seu cartão ou cancelar sem gerar cobranças
                    duplicadas, acesse o Portal Oficial do Stripe.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isPending}
                onClick={handleOpenPortal}
                className={cn(
                  "w-full py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer",
                  "bg-gold hover:bg-gold-hover text-neutral-950 shadow-glow-gold hover:shadow-[0_0_30px_rgba(237,229,57,0.5)]",
                  "disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]",
                )}
              >
                <ExternalLink size={16} />
                <span>
                  {isPending
                    ? "Abrindo Stripe..."
                    : "Gerenciar Assinatura ou Trocar de Plano no Stripe"}
                </span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={isPending}
              onClick={handleCheckout}
              className={cn(
                "w-full py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer",
                "bg-gold hover:bg-gold-hover text-neutral-950 shadow-glow-gold hover:shadow-[0_0_30px_rgba(237,229,57,0.5)]",
                "disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]",
              )}
            >
              {isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                  <span>Gerando sessão segura no Stripe...</span>
                </>
              ) : (
                <>
                  <Zap size={18} className="fill-neutral-950" />
                  <span>
                    {selectedMethod === "PIX"
                      ? `Pagar com Pix ${selectedPlan === "FOUNDER_ANNUAL" ? "R$ 59,90" : selectedPlan === "ANNUAL" ? "R$ 99,00" : "R$ 9,90"}`
                      : `Assinar ${selectedPlan === "FOUNDER_ANNUAL" ? "Membro Fundador (R$ 59,90)" : selectedPlan === "ANNUAL" ? "Plano Anual (R$ 99,00)" : "Plano Mensal (R$ 9,90)"}`}
                  </span>
                </>
              )}
            </button>
          )}

          <p className="text-center text-[11px] text-neutral-400">
            Pagamento processado com segurança de ponta a ponta pela Stripe.
          </p>
        </div>
      </div>
    </BaseModal>
  );
}
