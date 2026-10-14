import { MonitorSmartphone, UserCircle } from "lucide-react";
import { serverApi } from "@/api/server";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { ChangePasswordCard } from "@/components/settings/ChangePasswordCard";
import { CompactModeSettings } from "@/components/settings/CompactModeSettings";
import { DangerZoneCard } from "@/components/settings/DangerZoneCard";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { ProfileHeaderCard } from "@/components/settings/ProfileHeaderCard";
import { cn } from "@/utils";
import { getCompactMode } from "@/utils/cookies";

export default async function SettingsPage() {
  const isCompact = await getCompactMode();

  const { data: user } = await serverApi.GET("/users/me", {
    next: { tags: ["user"] },
  });

  return (
    <PageWrapper isCompact={isCompact}>
      <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto pb-16">
        {/* HEADER */}
        <header className="flex items-end justify-between border-b border-primary/20 pb-4">
          <div>
            <h1 className="text-headline-s font-bold text-neutral-50 drop-shadow-md">
              Configurações
            </h1>
            <p className="text-body-m text-neutral-300 mt-1">
              Gerencie seus dados de perfil, preferências da conta e interface
              no HabitParty.
            </p>
          </div>
        </header>

        {/* ==================================================== */}
        {/* SEÇÃO 1: PERFIL DO USUÁRIO (NO TOPO)                  */}
        {/* ==================================================== */}
        <section className="flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <UserCircle className="text-gold" size={24} />
            <h2 className="text-headline-m font-bold text-neutral-100">
              Perfil do Usuário
            </h2>
          </div>

          {/* Cartão de Identidade & Foto */}
          <ProfileHeaderCard initialUser={user || null} isCompact={isCompact} />

          {/* Formulário de Dados Pessoais */}
          <ProfileForm initialUser={user || null} isCompact={isCompact} />

          {/* Formulário de Alteração de Senha */}
          <ChangePasswordCard isCompact={isCompact} />
        </section>

        {/* ==================================================== */}
        {/* SEÇÃO 2: USABILIDADE & INTERFACE                     */}
        {/* ==================================================== */}
        <section className="flex flex-col gap-4 pt-4 border-t border-primary/20">
          <div className="flex items-center gap-2">
            <MonitorSmartphone className="text-gold" size={24} />
            <h2 className="text-headline-m font-bold text-neutral-100">
              Usabilidade & Interface
            </h2>
          </div>

          <div
            className={cn(
              "bg-surface/30 border border-primary/20 rounded-2xl flex flex-col gap-5 backdrop-blur-md",
              isCompact ? "p-4 sm:p-5" : "p-6",
            )}
          >
            <div className="flex flex-col gap-1.5">
              <h3 className="text-body-l font-bold text-neutral-50">
                Densidade da Interface
              </h3>
              <p className="text-body-s text-neutral-400">
                Personalize o espaçamento e o tamanho visual dos cartões, listas
                e calendários.
              </p>
            </div>

            <CompactModeSettings />
          </div>
        </section>

        {/* ==================================================== */}
        {/* SEÇÃO 3: ZONA DE PERIGO (DEPOIS DE USABILIDADE)      */}
        {/* ==================================================== */}
        <section className="flex flex-col gap-4 pt-4 border-t border-red-500/20">
          <DangerZoneCard isCompact={isCompact} />
        </section>
      </div>
    </PageWrapper>
  );
}
