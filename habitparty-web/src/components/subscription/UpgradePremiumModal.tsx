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
import { useLocale, useTranslations } from "next-intl";
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

/** Preços exibidos por idioma (BRL no Brasil, USD no exterior). */
const PLAN_PRICES: Record<"pt-BR" | "en", Record<PlanType, string>> = {
  "pt-BR": {
    FOUNDER_ANNUAL: "R$ 59,90",
    MONTHLY: "R$ 9,90",
    ANNUAL: "R$ 99,00",
  },
  en: {
    FOUNDER_ANNUAL: "$10.90",
    MONTHLY: "$1.99",
    ANNUAL: "$19.90",
  },
};

export function UpgradePremiumModal({
  isOpen,
  onClose,
}: UpgradePremiumModalProps) {
  const t = useTranslations("settings.upgradeModal");
  const locale = useLocale();
  const isEnglish = locale === "en";

  const user = useUserStore((s) => s.user);
  const isFounder = Boolean(user?.isFounder);
  const hasActiveRecurring = Boolean(user?.hasActiveRecurringSubscription);
  const isEmailUnverified = user?.emailVerified === false;

  const [quota, setQuota] = useState<FoundersQuotaDTO | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(
    isFounder ? "ANNUAL" : "FOUNDER_ANNUAL",
  );
  const [selectedMethod, setSelectedMethod] =
    useState<PaymentMethodType>("CREDIT_CARD");
  const [isPending, startTransition] = useTransition();

  // Pix é exclusivo do Brasil: no idioma inglês, apenas cartão é oferecido.
  const prices = PLAN_PRICES[isEnglish ? "en" : "pt-BR"];
  const effectiveMethod: PaymentMethodType = isEnglish
    ? "CREDIT_CARD"
    : selectedMethod;

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
          toast.success(t("portalRedirect"));
          window.location.href = res.data.portalUrl;
        } else {
          toast.error(res.error || t("portalError"));
        }
      } catch (err) {
        console.error(err);
        toast.error(t("portalError"));
      }
    });
  };

  const handleCheckout = () => {
    startTransition(async () => {
      try {
        const res = await createCheckoutSessionAction({
          plan: selectedPlan,
          paymentMethod: effectiveMethod,
        });

        if (res.success) {
          toast.success(t("redirectingStripe"));
          window.location.href = res.data.checkoutUrl;
        } else {
          toast.error(res.error || t("checkoutErrorToast"));
        }
      } catch (err) {
        console.error(err);
        toast.error(t("checkoutErrorToast"));
      }
    });
  };

  const isFounderAvailable = quota ? quota.isAvailable : true;
  const remainingSlots = quota ? quota.remainingSlots : 30;
  const perksList: string[] = t.raw("perks") as string[];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      containerClassName="z-[200]"
      maxWidth="max-w-xl"
      borderColor="border-gold/50"
      preventClose={isPending}
      headerExtra={<Crown className="w-6 h-6 text-gold fill-gold" />}
      title={t("modalTitle")}
      description={t("modalSubtitle")}
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
                  t("alreadyAcquired")
                ) : (
                  <>
                    <Flame className="w-2.5 h-2.5 fill-current" />
                    {t("remainingSlots", { count: remainingSlots })}
                  </>
                )}
              </span>
              <span className="text-xs font-semibold">
                {t("founderAnnual")}
              </span>
              <span className="text-base font-black font-mono">
                {prices.FOUNDER_ANNUAL}
              </span>
              <span className="text-[10px] opacity-80">
                {t("founderPeriod")}
              </span>
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
            <span className="text-xs font-semibold">{t("monthlyPlan")}</span>
            <span className="text-base font-black font-mono">
              {prices.MONTHLY}
            </span>
            <span className="text-[10px] opacity-80">{t("monthlyPeriod")}</span>
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
            <span className="text-xs font-semibold">{t("annualPlan")}</span>
            <span className="text-base font-black font-mono">
              {prices.ANNUAL}
            </span>
            <span className="text-[10px] opacity-80">{t("annualPeriod")}</span>
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
                {t("founderCalloutTitle")}
              </span>
              <p className="text-tiny text-neutral-200">
                {t("founderCalloutDesc")}
              </p>
            </div>
          </div>
        )}

        {/* FORMA DE PAGAMENTO: CARTÃO RECORRENTE OU PIX AVULSO */}
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            {t("paymentMethodTitle")}
          </span>
          <div
            className={cn(
              "grid grid-cols-1 gap-3",
              !isEnglish && "sm:grid-cols-2",
            )}
          >
            {/* CARTÃO */}
            <button
              type="button"
              onClick={() => setSelectedMethod("CREDIT_CARD")}
              className={cn(
                "flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer",
                effectiveMethod === "CREDIT_CARD"
                  ? "border-gold bg-gold/10 text-neutral-50 shadow-xs"
                  : "border-primary/20 bg-surface/30 text-neutral-300 hover:border-primary/40 hover:bg-surface/50",
              )}
            >
              <div
                className={cn(
                  "p-2 rounded-lg shrink-0 mt-0.5",
                  effectiveMethod === "CREDIT_CARD"
                    ? "bg-gold text-neutral-950"
                    : "bg-surface text-neutral-300",
                )}
              >
                <CreditCard size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 font-bold text-sm text-neutral-100">
                  {t("creditCardTitle")}
                </div>
                <p className="text-tiny text-neutral-400 mt-0.5 leading-snug">
                  {t("creditCardDesc")}
                </p>
              </div>
            </button>

            {/* PIX (exclusivo do Brasil — oculto no idioma inglês) */}
            {!isEnglish && (
              <button
                type="button"
                onClick={() => setSelectedMethod("PIX")}
                className={cn(
                  "flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer",
                  effectiveMethod === "PIX"
                    ? "border-gold bg-gold/10 text-neutral-50 shadow-xs"
                    : "border-primary/20 bg-surface/30 text-neutral-300 hover:border-primary/40 hover:bg-surface/50",
                )}
              >
                <div
                  className={cn(
                    "p-2 rounded-lg shrink-0 mt-0.5",
                    effectiveMethod === "PIX"
                      ? "bg-gold text-neutral-950"
                      : "bg-surface text-neutral-300",
                  )}
                >
                  <QrCode size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 font-bold text-sm text-neutral-100">
                    {t("pixTitle")}
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary-light">
                      {t("pixBadge")}
                    </span>
                  </div>
                  <p className="text-tiny text-neutral-400 mt-0.5 leading-snug">
                    {t("pixDesc", {
                      days: selectedPlan === "MONTHLY" ? "30" : "365",
                    })}
                  </p>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* BENEFÍCIOS */}
        <div className="p-4 rounded-xl bg-surface/30 border border-primary/20 space-y-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
            <Sparkles size={14} /> {t("whatYouGet")}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {perksList.map((perk) => (
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
          {isEmailUnverified && (
            <div className="p-3 rounded-xl bg-gold/10 border border-gold/30 text-xs text-neutral-200 leading-relaxed mb-1">
              <strong className="text-gold font-bold">
                {t("emailWarningTitle")}
              </strong>{" "}
              {t("emailWarningDesc", {
                email: user?.email ?? "",
              })}
            </div>
          )}
          {hasActiveRecurring ? (
            <div className="flex flex-col gap-3">
              <div className="p-3.5 rounded-xl bg-gold/10 border border-gold/30 text-xs text-neutral-200 flex items-start gap-2.5">
                <Sparkles size={16} className="text-gold shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold text-gold">
                    {t("activeSubscriptionNotice")}
                  </span>
                  <p className="text-neutral-300 mt-0.5 text-tiny">
                    {t("activeSubscriptionDesc")}
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
                  {isPending ? t("openingStripeBtn") : t("manageStripeBtn")}
                </span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={isPending || isEmailUnverified}
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
                  <span>{t("generatingSession")}</span>
                </>
              ) : (
                <>
                  <Zap size={18} className="fill-neutral-950" />
                  <span>
                    {effectiveMethod === "PIX"
                      ? t("payWithPix", { price: prices[selectedPlan] })
                      : t("subscribePlan", {
                          plan:
                            selectedPlan === "FOUNDER_ANNUAL"
                              ? t("planFounderAnnual")
                              : selectedPlan === "ANNUAL"
                                ? t("planAnnual")
                                : t("planMonthly"),
                          price: prices[selectedPlan],
                        })}
                  </span>
                </>
              )}
            </button>
          )}

          <p className="text-center text-[11px] text-neutral-400">
            {t("securityNote")}
          </p>
        </div>
      </div>
    </BaseModal>
  );
}
