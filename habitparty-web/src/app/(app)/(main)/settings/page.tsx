import {
  Eye,
  Languages,
  MonitorSmartphone,
  Palette,
  Sparkles,
  Swords,
} from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { AvatarFrameSettings } from "@/components/settings/AvatarFrameSettings";
import { ChangePasswordCard } from "@/components/settings/ChangePasswordCard";
import { CompactModeSettings } from "@/components/settings/CompactModeSettings";
import { DangerZoneCard } from "@/components/settings/DangerZoneCard";
import { ExperienceModeSettings } from "@/components/settings/ExperienceModeSettings";
import { LanguageSettings } from "@/components/settings/LanguageSettings";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { ProfileHeaderCard } from "@/components/settings/ProfileHeaderCard";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { SettingsNavTabs } from "@/components/settings/SettingsNavTabs";
import { SoundNotificationSettings } from "@/components/settings/SoundNotificationSettings";
import { SubscriptionSettingsCard } from "@/components/settings/SubscriptionSettingsCard";
import { ThemeSettings } from "@/components/settings/ThemeSettings";
import { WelcomeCardsSettings } from "@/components/settings/WelcomeCardsSettings";
import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";
import { getCurrentUser } from "@/services/userService";
import type { SettingsTabId } from "@/types/settings";
import { getCompactMode } from "@/utils/cookies";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings.metadata");
  return {
    title: t("title"),
    description: t("description"),
  };
}

type SettingsPageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function SettingsPage({
  searchParams,
}: SettingsPageProps) {
  const [isCompact, t, resolvedParams] = await Promise.all([
    getCompactMode(),
    getTranslations("settings"),
    searchParams,
  ]);

  const validTabs: SettingsTabId[] = [
    "profile",
    "appearance",
    "audio",
    "security",
  ];
  const activeTab: SettingsTabId = validTabs.includes(
    resolvedParams.tab as SettingsTabId,
  )
    ? (resolvedParams.tab as SettingsTabId)
    : "profile";

  const user =
    activeTab === "profile" || activeTab === "appearance"
      ? await getCurrentUser()
      : null;

  return (
    <ScopedIntlProvider scope="settings">
      <PageWrapper isCompact={isCompact}>
        <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pb-16">
          {/* HEADER */}
          <header className="flex flex-col gap-1 border-b border-primary/20 pb-4">
            <h1 className="text-headline-s font-bold text-neutral-50 dark:drop-shadow-md">
              {t("headerTitle")}
            </h1>
            <p className="text-body-m text-neutral-300">
              {t("headerSubtitle")}
            </p>
          </header>

          {/* NAVEGAÇÃO DE ABAS */}
          <SettingsNavTabs activeTab={activeTab} isCompact={isCompact} />

          {/* CONTEÚDO DA ABA ATIVA */}
          <div className="flex flex-col gap-6 mt-1">
            {/* ABA 1: PERFIL */}
            {activeTab === "profile" && (
              <>
                {/* Cartão de Identidade & Foto */}
                <ProfileHeaderCard
                  initialUser={user || null}
                  isCompact={isCompact}
                />

                {/* Status de Plano & Assinatura (Gerenciar/Cancelar Cartão ou Evoluir) */}
                <SubscriptionSettingsCard isCompact={isCompact} />

                {/* Molduras Animadas de Avatar */}
                <SettingsCard
                  title={t("cards.avatarFrames")}
                  description={t("cards.avatarFramesDesc")}
                  icon={<Sparkles size={18} className="text-gold" />}
                  isCompact={isCompact}
                >
                  <AvatarFrameSettings isCompact={isCompact} />
                </SettingsCard>

                {/* Formulário de Dados Pessoais (com SettingsCard integrado) */}
                <ProfileForm initialUser={user || null} isCompact={isCompact} />
              </>
            )}

            {/* ABA 2: APARÊNCIA */}
            {activeTab === "appearance" && (
              <>
                {/* TEMA DA INTERFACE */}
                <SettingsCard
                  title={t("cards.appearanceTheme")}
                  description={t("cards.appearanceThemeDesc")}
                  icon={<Palette size={18} className="text-gold" />}
                  isCompact={isCompact}
                  className="hidden"
                >
                  <ThemeSettings isCompact={isCompact} className="hidden" />
                </SettingsCard>

                {/* MODO DE EXPERIÊNCIA: GAMIFICADO VS PRODUTIVIDADE */}
                <SettingsCard
                  title={t("cards.experienceMode")}
                  description={t("cards.experienceModeDesc")}
                  icon={<Swords size={18} className="text-gold" />}
                  isCompact={isCompact}
                >
                  <ExperienceModeSettings
                    isCompact={isCompact}
                    initialMode={user?.experienceMode}
                  />
                </SettingsCard>

                {/* IDIOMA DA INTERFACE */}
                <SettingsCard
                  title={t("cards.language")}
                  description={t("cards.languageDesc")}
                  icon={<Languages size={18} className="text-gold" />}
                  isCompact={isCompact}
                >
                  <LanguageSettings isCompact={isCompact} />
                </SettingsCard>

                {/* DENSIDADE DA INTERFACE */}
                <SettingsCard
                  title={t("cards.compact")}
                  description={t("cards.compactDesc")}
                  icon={<MonitorSmartphone size={18} className="text-gold" />}
                  isCompact={isCompact}
                >
                  <CompactModeSettings isCompact={isCompact} />
                </SettingsCard>

                {/* CARDS DE BOAS-VINDAS */}
                <SettingsCard
                  title={t("cards.welcomeCards")}
                  description={t("cards.welcomeCardsDesc")}
                  icon={<Eye size={18} className="text-gold" />}
                  isCompact={isCompact}
                >
                  <WelcomeCardsSettings isCompact={isCompact} />
                </SettingsCard>
              </>
            )}

            {/* ABA 3: ÁUDIO & NOTIFICAÇÕES */}
            {activeTab === "audio" && (
              <SoundNotificationSettings isCompact={isCompact} />
            )}

            {/* ABA 4: SEGURANÇA */}
            {activeTab === "security" && (
              <>
                {/* Formulário de Alteração de Senha */}
                <ChangePasswordCard isCompact={isCompact} />

                {/* Zona de Perigo / Exclusão de Conta */}
                <DangerZoneCard isCompact={isCompact} />
              </>
            )}
          </div>
        </div>
      </PageWrapper>
    </ScopedIntlProvider>
  );
}
