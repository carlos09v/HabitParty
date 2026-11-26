import {
  AlertTriangle,
  Calendar,
  Clock,
  Compass,
  Crown,
  Eye,
  Globe,
  KeyRound,
  Languages,
  Palette,
  RotateCcw,
  ShieldCheck,
  Swords,
  User as UserIcon,
  Volume2,
} from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { AccountResetCard } from "@/components/settings/AccountResetCard";
import { ChangePasswordCard } from "@/components/settings/ChangePasswordCard";
import { DangerZoneCard } from "@/components/settings/DangerZoneCard";
import { ExperienceModeSettings } from "@/components/settings/ExperienceModeSettings";
import { FormatPreferenceSettings } from "@/components/settings/FormatPreferenceSettings";
import { LanguageSettings } from "@/components/settings/LanguageSettings";
import { PrivacySettingsCard } from "@/components/settings/PrivacySettingsCard";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { ProfileHeaderCard } from "@/components/settings/ProfileHeaderCard";
import { RoutinePreferencesCard } from "@/components/settings/RoutinePreferencesCard";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { SettingsDirtyProvider } from "@/components/settings/SettingsDirtyContext";
import { SettingsNavTabs } from "@/components/settings/SettingsNavTabs";
import { SoundNotificationSettings } from "@/components/settings/SoundNotificationSettings";
import { SubscriptionSettingsCard } from "@/components/settings/SubscriptionSettingsCard";
import { ThemeSettings } from "@/components/settings/ThemeSettings";
import { TimezoneSettings } from "@/components/settings/TimezoneSettings";
import { WelcomeCardsSettings } from "@/components/settings/WelcomeCardsSettings";
import { resolveSettingsTab } from "@/constants/settings";
import { ExperienceModeFallbackProvider } from "@/hooks/useExperienceMode";
import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";
import { getCurrentUser } from "@/services/userService";
import type { SettingsTabId } from "@/types/settings";
import type { DateFormat, ThemeId, TimeFormat } from "@/types/ui";
import type { UserResponseDTO } from "@/types/user";
import {
  getDateFormat,
  getOptionalThemeCookie,
  getTimeFormat,
} from "@/utils/cookies";
import { resolveExperienceMode } from "@/utils/experienceMode";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings.metadata");
  return {
    title: t("title"),
    description: t("description"),
  };
}

function renderActiveSettingsPanel(
  activeTab: SettingsTabId,
  user: UserResponseDTO,
  t: Awaited<ReturnType<typeof getTranslations<"settings">>>,
  initialDateFormat: DateFormat,
  initialTimeFormat: TimeFormat,
  initialTheme: ThemeId | null,
  serverNowMs: number,
): ReactNode {
  switch (activeTab) {
    case "profile":
      return (
        <>
          <ProfileHeaderCard initialUser={user} />

          <SettingsCard
            title={t("cards.subscription")}
            description={t("cards.subscriptionDesc")}
            icon={<Crown size={18} className="text-gold fill-gold" />}
          >
            <SubscriptionSettingsCard initialUser={user} />
          </SettingsCard>

          <SettingsCard
            title={t("cards.profile")}
            description={t("cards.profileDesc")}
            icon={<UserIcon size={18} className="text-gold" />}
          >
            <ProfileForm initialUser={user} />
          </SettingsCard>
        </>
      );
    case "preferences":
      return (
        <>
          <SettingsCard
            title={t("cards.experienceMode")}
            description={t("cards.experienceModeDesc")}
            icon={<Swords size={18} className="text-gold" />}
          >
            <ExperienceModeSettings initialMode={user.experienceMode} />
          </SettingsCard>

          <SettingsCard
            title={t("cards.routine")}
            description={t("cards.routineDesc")}
            icon={<Compass size={18} className="text-gold" />}
          >
            <RoutinePreferencesCard initialUser={user} />
          </SettingsCard>

          <SettingsCard
            title={t("cards.language")}
            description={t("cards.languageDesc")}
            icon={<Languages size={18} className="text-gold" />}
          >
            <LanguageSettings />
          </SettingsCard>

          <SettingsCard
            title={t("cards.timezone")}
            description={t("cards.timezoneDesc")}
            icon={<Globe size={18} className="text-gold" />}
          >
            <TimezoneSettings
              initialTimezone={user.timezone}
              initialTimezoneUpdatedAt={user.timezoneUpdatedAt}
              serverNowMs={serverNowMs}
            />
          </SettingsCard>

          <SettingsCard
            title={t("cards.dateFormat")}
            description={t("cards.dateFormatDesc")}
            icon={<Calendar size={18} className="text-gold" />}
          >
            <FormatPreferenceSettings
              kind="date"
              initialDateFormat={initialDateFormat}
            />
          </SettingsCard>

          <SettingsCard
            title={t("cards.timeFormat")}
            description={t("cards.timeFormatDesc")}
            icon={<Clock size={18} className="text-gold" />}
          >
            <FormatPreferenceSettings
              kind="time"
              initialTimeFormat={initialTimeFormat}
            />
          </SettingsCard>
        </>
      );
    case "appearance":
      return (
        <>
          <SettingsCard
            title={t("cards.appearanceTheme")}
            description={t("cards.appearanceThemeDesc")}
            icon={<Palette size={18} className="text-gold" />}
          >
            <ThemeSettings
              initialTheme={initialTheme}
              initialIsPremium={Boolean(user.isPremium)}
            />
          </SettingsCard>

          <SettingsCard
            title={t("cards.welcomeCards")}
            description={t("cards.welcomeCardsDesc")}
            icon={<Eye size={18} className="text-gold" />}
          >
            <WelcomeCardsSettings />
          </SettingsCard>
        </>
      );
    case "audio":
      return (
        <SettingsCard
          title={t("cards.audioTitle")}
          description={t("cards.audioDesc")}
          icon={<Volume2 className="text-gold" size={20} />}
        >
          <SoundNotificationSettings
            initialIsPremium={Boolean(user.isPremium)}
          />
        </SettingsCard>
      );
    case "privacy":
      return (
        <SettingsCard
          title={t("cards.privacy")}
          description={t("cards.privacyDesc")}
          icon={<ShieldCheck size={18} className="text-gold" />}
        >
          <PrivacySettingsCard initialUser={user} />
        </SettingsCard>
      );
    case "security":
      return (
        <>
          <SettingsCard
            title={t("cards.changePassword")}
            description={t("cards.changePasswordDesc")}
            icon={<KeyRound size={18} className="text-gold" />}
          >
            <ChangePasswordCard initialUser={user} />
          </SettingsCard>

          <SettingsCard
            title={t("cards.accountReset")}
            description={t("cards.accountResetDesc")}
            icon={<RotateCcw size={18} className="text-amber-400" />}
          >
            <AccountResetCard />
          </SettingsCard>

          <SettingsCard
            title={t("cards.dangerZone")}
            description={t("cards.dangerZoneDesc")}
            icon={<AlertTriangle size={18} className="text-red-400" />}
            variant="danger"
          >
            <DangerZoneCard initialUser={user} />
          </SettingsCard>
        </>
      );
  }
}

type SettingsPageProps = {
  searchParams: Promise<{ tab?: string | string[] }>;
};

export default async function SettingsPage({
  searchParams,
}: SettingsPageProps) {
  const [
    t,
    resolvedParams,
    user,
    initialDateFormat,
    initialTimeFormat,
    initialTheme,
  ] = await Promise.all([
    getTranslations("settings"),
    searchParams,
    getCurrentUser(),
    getDateFormat(),
    getTimeFormat(),
    getOptionalThemeCookie(),
  ]);

  if (!user) {
    redirect("/signIn");
  }

  const activeTab = resolveSettingsTab(resolvedParams.tab);
  const serverNowMs = Date.now();

  return (
    <ScopedIntlProvider scope="settings">
      <ExperienceModeFallbackProvider
        mode={resolveExperienceMode(user.experienceMode)}
      >
        <PageWrapper>
          <SettingsDirtyProvider>
            <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pb-16">
              {/* HEADER */}
              <header className="flex flex-col gap-1 border-b border-primary/20 pb-4">
                <h1 className="text-2xl sm:text-headline-s font-bold text-neutral-50 dark:drop-shadow-md">
                  {t("headerTitle")}
                </h1>
                <p className="text-body-m text-neutral-300">
                  {t("headerSubtitle")}
                </p>
              </header>

              {/* NAVEGAÇÃO E PAINEL ÚNICO ATIVO */}
              <SettingsNavTabs activeTab={activeTab} />

              <div className="flex flex-col gap-6 mt-1">
                {renderActiveSettingsPanel(
                  activeTab,
                  user,
                  t,
                  initialDateFormat,
                  initialTimeFormat,
                  initialTheme,
                  serverNowMs,
                )}
              </div>
            </div>
          </SettingsDirtyProvider>
        </PageWrapper>
      </ExperienceModeFallbackProvider>
    </ScopedIntlProvider>
  );
}
