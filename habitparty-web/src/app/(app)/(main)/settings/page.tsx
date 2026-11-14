import {
  Calendar,
  Clock,
  Crown,
  Eye,
  Globe,
  KeyRound,
  Languages,
  Palette,
  Swords,
  User as UserIcon,
  Volume2,
} from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { ChangePasswordCard } from "@/components/settings/ChangePasswordCard";
import { DangerZoneCard } from "@/components/settings/DangerZoneCard";
import { DateFormatSettings } from "@/components/settings/DateFormatSettings";
import { ExperienceModeSettings } from "@/components/settings/ExperienceModeSettings";
import { LanguageSettings } from "@/components/settings/LanguageSettings";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { ProfileHeaderCard } from "@/components/settings/ProfileHeaderCard";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { SettingsNavTabs } from "@/components/settings/SettingsNavTabs";
import { SoundNotificationSettings } from "@/components/settings/SoundNotificationSettings";
import { SubscriptionSettingsCard } from "@/components/settings/SubscriptionSettingsCard";
import { ThemeSettings } from "@/components/settings/ThemeSettings";
import { TimeFormatSettings } from "@/components/settings/TimeFormatSettings";
import { TimezoneSettings } from "@/components/settings/TimezoneSettings";
import { WelcomeCardsSettings } from "@/components/settings/WelcomeCardsSettings";
import { resolveSettingsTab } from "@/constants/settings";
import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";
import { getCurrentUser } from "@/services/userService";

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
  const [t, resolvedParams, user] = await Promise.all([
    getTranslations("settings"),
    searchParams,
    getCurrentUser(),
  ]);

  const activeTab = resolveSettingsTab(resolvedParams.tab);

  return (
    <ScopedIntlProvider scope="settings">
      <PageWrapper>
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

          {/* NAVEGAÇÃO DE ABAS E CONTEÚDO COM TROCA INSTANTÂNEA NO CLIENTE */}
          <SettingsNavTabs
            activeTab={activeTab}
            panels={{
              profile: (
                <>
                  {/* Cartão de Identidade & Foto */}
                  <ProfileHeaderCard initialUser={user || null} />

                  {/* Status de Plano & Assinatura (Gerenciar/Cancelar Cartão ou Evoluir) */}
                  <SettingsCard
                    title={t("cards.subscription")}
                    description={t("cards.subscriptionDesc")}
                    icon={<Crown size={18} className="text-gold fill-gold" />}
                  >
                    <SubscriptionSettingsCard />
                  </SettingsCard>

                  {/* Formulário de Dados Pessoais */}
                  <SettingsCard
                    title={t("cards.profile")}
                    description={t("cards.profileDesc")}
                    icon={<UserIcon size={18} className="text-gold" />}
                  >
                    <ProfileForm initialUser={user || null} />
                  </SettingsCard>
                </>
              ),
              appearance: (
                <>
                  {/* TEMA DA INTERFACE */}
                  <SettingsCard
                    title={t("cards.appearanceTheme")}
                    description={t("cards.appearanceThemeDesc")}
                    icon={<Palette size={18} className="text-gold" />}
                  >
                    <ThemeSettings />
                  </SettingsCard>

                  {/* MODO DE EXPERIÊNCIA: GAMIFICADO VS PRODUTIVIDADE */}
                  <SettingsCard
                    title={t("cards.experienceMode")}
                    description={t("cards.experienceModeDesc")}
                    icon={<Swords size={18} className="text-gold" />}
                  >
                    <ExperienceModeSettings
                      initialMode={user?.experienceMode}
                    />
                  </SettingsCard>

                  {/* IDIOMA DA INTERFACE */}
                  <SettingsCard
                    title={t("cards.language")}
                    description={t("cards.languageDesc")}
                    icon={<Languages size={18} className="text-gold" />}
                  >
                    <LanguageSettings />
                  </SettingsCard>

                  {/* FORMATO DE DATA */}
                  <SettingsCard
                    title={t("cards.dateFormat")}
                    description={t("cards.dateFormatDesc")}
                    icon={<Calendar size={18} className="text-gold" />}
                  >
                    <DateFormatSettings />
                  </SettingsCard>

                  {/* FORMATO DE HORA */}
                  <SettingsCard
                    title={t("cards.timeFormat")}
                    description={t("cards.timeFormatDesc")}
                    icon={<Clock size={18} className="text-gold" />}
                  >
                    <TimeFormatSettings />
                  </SettingsCard>

                  {/* FUSO HORÁRIO */}
                  <SettingsCard
                    title={t("cards.timezone")}
                    description={t("cards.timezoneDesc")}
                    icon={<Globe size={18} className="text-gold" />}
                  >
                    <TimezoneSettings
                      initialTimezone={user?.timezone}
                      initialTimezoneUpdatedAt={user?.timezoneUpdatedAt}
                    />
                  </SettingsCard>

                  {/* CARDS DE BOAS-VINDAS */}
                  <SettingsCard
                    title={t("cards.welcomeCards")}
                    description={t("cards.welcomeCardsDesc")}
                    icon={<Eye size={18} className="text-gold" />}
                  >
                    <WelcomeCardsSettings />
                  </SettingsCard>
                </>
              ),
              audio: (
                <SettingsCard
                  title={t("cards.audioTitle")}
                  description={t("cards.audioDesc")}
                  icon={<Volume2 className="text-gold" size={20} />}
                >
                  <SoundNotificationSettings />
                </SettingsCard>
              ),
              security: (
                <>
                  {/* Formulário de Alteração de Senha */}
                  <SettingsCard
                    title={t("cards.changePassword")}
                    description={t("cards.changePasswordDesc")}
                    icon={<KeyRound size={18} className="text-gold" />}
                  >
                    <ChangePasswordCard />
                  </SettingsCard>

                  {/* Zona de Perigo / Exclusão de Conta */}
                  <DangerZoneCard />
                </>
              ),
            }}
          />
        </div>
      </PageWrapper>
    </ScopedIntlProvider>
  );
}
