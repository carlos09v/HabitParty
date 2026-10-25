import { Eye, MonitorSmartphone, Palette, Sparkles } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { AvatarFrameSettings } from "@/components/settings/AvatarFrameSettings";
import { ChangePasswordCard } from "@/components/settings/ChangePasswordCard";
import { CompactModeSettings } from "@/components/settings/CompactModeSettings";
import { DangerZoneCard } from "@/components/settings/DangerZoneCard";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { ProfileHeaderCard } from "@/components/settings/ProfileHeaderCard";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { SettingsNavTabs } from "@/components/settings/SettingsNavTabs";
import { SoundNotificationSettings } from "@/components/settings/SoundNotificationSettings";
import { SubscriptionSettingsCard } from "@/components/settings/SubscriptionSettingsCard";
import { ThemeSettings } from "@/components/settings/ThemeSettings";
import { WelcomeCardsSettings } from "@/components/settings/WelcomeCardsSettings";
import { getCurrentUser } from "@/services/userService";
import type { SettingsTabId } from "@/types/settings";
import { getCompactMode } from "@/utils/cookies";

export const metadata = {
  title: "Configurações | HabitParty",
  description:
    "Gerencie seus dados de perfil, preferências da conta e interface no HabitParty.",
};

type SettingsPageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function SettingsPage({
  searchParams,
}: SettingsPageProps) {
  const isCompact = await getCompactMode();
  const resolvedParams = await searchParams;

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

  const user = activeTab === "profile" ? await getCurrentUser() : null;

  return (
    <PageWrapper isCompact={isCompact}>
      <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pb-16">
        {/* HEADER */}
        <header className="flex flex-col gap-1 border-b border-primary/20 pb-4">
          <h1 className="text-headline-s font-bold text-neutral-50 drop-shadow-md">
            Configurações
          </h1>
          <p className="text-body-m text-neutral-300">
            Gerencie seus dados de perfil, preferências da conta e interface no
            HabitParty.
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
                title="Moldura do Avatar"
                description="Personalize o anel de energia e luz cósmica ao redor da sua foto de perfil."
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
                title="Aparência & Tema"
                description="Alterne entre o tema escuro cósmico tradicional e o novo tema claro iluminado."
                icon={<Palette size={18} className="text-gold" />}
                isCompact={isCompact}
                className="hidden"
              >
                <ThemeSettings isCompact={isCompact} />
              </SettingsCard>

              {/* DENSIDADE DA INTERFACE */}
              <SettingsCard
                title="Densidade da Interface"
                description="Personalize o espaçamento e o tamanho visual dos cartões, listas e calendários."
                icon={<MonitorSmartphone size={18} className="text-gold" />}
                isCompact={isCompact}
              >
                <CompactModeSettings isCompact={isCompact} />
              </SettingsCard>

              {/* CARDS DE BOAS-VINDAS */}
              <SettingsCard
                title="Cards de Boas-Vindas"
                description="Personalize a visibilidade dos cards informativos no topo de cada página. Reative os cards que foram ocultados para que voltem a aparecer."
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
  );
}
